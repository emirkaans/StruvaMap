package com.struva.map.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.ApiService
import com.struva.map.network.apiErrorMessage
import com.struva.map.network.dto.RegisterRequest
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
import kotlinx.serialization.json.Json
import retrofit2.HttpException
import javax.inject.Inject

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

    fun register(username: String, password: String, securityQuestion: String?, securityAnswer: String?) =
        runAuthAction {
            api.register(RegisterRequest(username, password, securityQuestion?.trim(), securityAnswer))
            signIn(username, password)
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
