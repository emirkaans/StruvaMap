package com.struva.map.ui.auth

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.messaging.FirebaseMessaging
import com.struva.map.network.ApiService
import com.struva.map.network.apiErrorMessage
import com.struva.map.network.dto.RedeemClaimRequest
import com.struva.map.network.dto.RegisterRequest
import com.struva.map.network.dto.RegisterUserDeviceRequest
import com.struva.map.network.dto.ResetPasswordRequest
import com.struva.map.network.usernameToEmail
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.status.SessionStatus
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.serialization.json.Json
import retrofit2.HttpException
import javax.inject.Inject

// supabase-kt'de UserInfo.isAnonymous alanı yok (3.0.3 bytecode'unda
// doğrulandı) — standart tespit yöntemi "hiç bağlı identity'si yok" (anonim
// kullanıcıda identities boş, email/şifre eklenince — complete-profile —
// dolar). ProfileViewModel/CompleteProfileScreen/PulsePairingScreen üçünde
// de aynı mantık tekrarlanmasın diye tek yerde.
fun SessionStatus.isGuestSession(): Boolean =
    (this as? SessionStatus.Authenticated)?.session?.user?.identities.isNullOrEmpty()

sealed interface AuthFormState {
    data object Idle : AuthFormState
    data object Loading : AuthFormState
    data class Error(val message: String) : AuthFormState
}

// Şifremi unuttum: e-posta doğrulaması yok, bu yüzden kayıtta opsiyonel
// toplanan güvenlik sorusu/cevabı tek kurtarma mekanizması (bkz.
// auth.controller.ts security-question/reset-password).
sealed interface ForgotPasswordState {
    data object EnterUsername : ForgotPasswordState
    data object Loading : ForgotPasswordState
    data class AnswerQuestion(val username: String, val question: String) : ForgotPasswordState
    data object Done : ForgotPasswordState
    data class Error(val fallback: ForgotPasswordState, val message: String) : ForgotPasswordState
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val api: ApiService,
    private val supabase: SupabaseClient,
    private val json: Json,
) : ViewModel() {
    private val _formState = MutableStateFlow<AuthFormState>(AuthFormState.Idle)
    val formState: StateFlow<AuthFormState> = _formState.asStateFlow()

    private val _forgotPasswordState = MutableStateFlow<ForgotPasswordState>(ForgotPasswordState.EnterUsername)
    val forgotPasswordState: StateFlow<ForgotPasswordState> = _forgotPasswordState.asStateFlow()

    val sessionStatus: StateFlow<SessionStatus> = supabase.auth.sessionStatus

    private var pushTokenRegistered = false

    // MainActivity'nin Authenticated dalında çağrılır — hem taze login hem
    // "oturum açıkken app'i yeniden açma" senaryosunu kapsar. Süreç başına
    // bir kez yeterli (InviteViewModel.registerPushToken ile aynı en iyi
    // çaba stili: başarısız olsa da sabah/akşam cron'u bu kullanıcıyı
    // token'sız bulup sessizce atlar, kritik bir hata değil).
    fun registerPushTokenIfNeeded() {
        if (pushTokenRegistered) return
        pushTokenRegistered = true
        viewModelScope.launch {
            try {
                val token = FirebaseMessaging.getInstance().token.await()
                api.registerUserDevice(RegisterUserDeviceRequest(token))
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                pushTokenRegistered = false
                Log.w("StruvaFcm", "kullanıcı push token kaydı başarısız", e)
            }
        }
    }

    // MainActivity'nin NotAuthenticated dalında (kendi LaunchedEffect'inden)
    // çağrılır — açılışta form göstermeden sessiz bir cihaz kimliği kurar
    // (bkz. plan: düşük sürtünmeli mobil giriş). Bilerek suspend: çağıran
    // taraf tamamlanmasını bekleyip splash'i/yüklenme durumunu ona göre
    // yönetiyor (kendi viewModelScope'unda fire-and-forget çalışsaydı bu
    // senkronizasyon mümkün olmazdı). Başarısız olursa AuthScreen fallback
    // olarak kalır (sessionStatus NotAuthenticated'da takılı kalır, kullanıcı
    // elle giriş/kayıt yapabilir) — bu yüzden burada özel bir hata durumu
    // tutmuyoruz, yalnızca loglayıp yutuyoruz.
    suspend fun signInAnonymously() {
        try {
            supabase.auth.signInAnonymously()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.w("StruvaAuth", "anonim giriş başarısız", e)
        }
    }

    // MainActivity'nin panodan bulduğu claim token'ını en iyi çaba ile
    // sunucuya gönderir (bkz. AppCta.tsx claim akışı, ApiService.redeemClaim).
    // Süresi geçmiş/zaten kullanılmış token sessizce yutulur — kullanıcıya
    // görünür bir hata göstermeye değecek bir senaryo değil, ve pano metni
    // her app açılışında aynı kalabileceğinden bu çağrı tekrar tekrar
    // (zararsızca) denenebilir.
    suspend fun redeemClaim(token: String) {
        try {
            api.redeemClaim(RedeemClaimRequest(token))
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.w("StruvaAuth", "claim redeem başarısız", e)
        }
    }

    // Artık her zaman bir "yükseltme": MainActivity açılışta zaten sessizce
    // signInAnonymously() çağırdığı için buraya gelindiğinde oturum daima
    // authlı (anonim) — /auth/register (admin.createUser, YENİ kullanıcı)
    // yerine /auth/complete-profile (admin.updateUserById, AYNI kullanıcıyı
    // yerinde günceller) çağrılıyor. signIn() gerekmiyor: user_id hiç
    // değişmedi, yalnızca yerel oturumun e-posta/metadata'yı görmesi için
    // refreshCurrentSession yeterli (ProfileViewModel.changeUsername ile
    // aynı desen).
    fun register(username: String, password: String, securityQuestion: String?, securityAnswer: String?) =
        runAuthAction {
            api.completeProfile(RegisterRequest(username, password, securityQuestion?.trim(), securityAnswer))
            supabase.auth.refreshCurrentSession()
        }

    fun login(username: String, password: String) = runAuthAction {
        signIn(username, password)
    }

    fun logout() {
        viewModelScope.launch { supabase.auth.signOut() }
    }

    fun resetForgotPasswordFlow() {
        _forgotPasswordState.value = ForgotPasswordState.EnterUsername
    }

    fun clearForgotPasswordError(fallback: ForgotPasswordState) {
        _forgotPasswordState.value = fallback
    }

    fun fetchSecurityQuestion(username: String) {
        viewModelScope.launch {
            _forgotPasswordState.value = ForgotPasswordState.Loading
            _forgotPasswordState.value = try {
                val res = api.getSecurityQuestion(username)
                ForgotPasswordState.AnswerQuestion(username, res.question)
            } catch (e: CancellationException) {
                throw e
            } catch (e: HttpException) {
                ForgotPasswordState.Error(
                    ForgotPasswordState.EnterUsername,
                    e.apiErrorMessage(json) ?: "Kullanıcı bulunamadı.",
                )
            } catch (e: Exception) {
                ForgotPasswordState.Error(ForgotPasswordState.EnterUsername, e.message ?: "Bir hata oluştu.")
            }
        }
    }

    fun resetPassword(username: String, securityAnswer: String, newPassword: String, question: String) {
        viewModelScope.launch {
            _forgotPasswordState.value = ForgotPasswordState.Loading
            _forgotPasswordState.value = try {
                api.resetPassword(ResetPasswordRequest(username, securityAnswer, newPassword))
                ForgotPasswordState.Done
            } catch (e: CancellationException) {
                throw e
            } catch (e: HttpException) {
                ForgotPasswordState.Error(
                    ForgotPasswordState.AnswerQuestion(username, question),
                    e.apiErrorMessage(json) ?: "Sıfırlama başarısız.",
                )
            } catch (e: Exception) {
                ForgotPasswordState.Error(
                    ForgotPasswordState.AnswerQuestion(username, question),
                    e.message ?: "Bir hata oluştu.",
                )
            }
        }
    }

    private suspend fun signIn(username: String, password: String) {
        supabase.auth.signInWith(Email) {
            email = usernameToEmail(username)
            this.password = password
        }
    }

    private fun runAuthAction(block: suspend () -> Unit) {
        viewModelScope.launch {
            _formState.value = AuthFormState.Loading
            try {
                block()
                _formState.value = AuthFormState.Idle
            } catch (e: CancellationException) {
                throw e
            } catch (e: HttpException) {
                _formState.value = AuthFormState.Error(e.apiErrorMessage(json) ?: "Bir hata oluştu.")
            } catch (e: Exception) {
                _formState.value = AuthFormState.Error(e.message ?: "Bir hata oluştu.")
            }
        }
    }
}
