package com.struva.map.ui.profile

import com.struva.map.network.ApiService
import com.struva.map.network.apiErrorMessage
import com.struva.map.network.dto.ChangeUsernameRequest
import com.struva.map.network.usernameToEmail
import com.struva.map.ui.auth.isGuestSession
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.status.SessionStatus
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonPrimitive
import retrofit2.HttpException
import javax.inject.Inject

sealed interface ProfileActionState {
    data object Idle : ProfileActionState
    data object Loading : ProfileActionState
    data class Error(val message: String) : ProfileActionState
    data class Success(val message: String) : ProfileActionState
}

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val supabase: SupabaseClient,
    private val api: ApiService,
    private val json: Json,
) : ViewModel() {
    // Kayıtta user_metadata.username olarak yazılıyor (bkz. auth.controller.ts),
    // ayrı bir /auth/me çağrısına gerek yok — Supabase oturumunda zaten var.
    val username: StateFlow<String?> = supabase.auth.sessionStatus
        .map { status ->
            (status as? SessionStatus.Authenticated)
                ?.session?.user?.userMetadata
                ?.get("username")
                ?.jsonPrimitive
                ?.content
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    // Anonim kullanıcıda profiles satırı yok, username hep null gelir — bunu
    // ayrı bir sinyal olarak tutuyoruz (username==null yeterli olmazdı: normal
    // authlı kullanıcı için de ilk composition'da geçici olarak null olabilir).
    val isGuest: StateFlow<Boolean> = supabase.auth.sessionStatus
        .map { it.isGuestSession() }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)

    private val _actionState = MutableStateFlow<ProfileActionState>(ProfileActionState.Idle)
    val actionState: StateFlow<ProfileActionState> = _actionState.asStateFlow()

    fun logout() {
        viewModelScope.launch { supabase.auth.signOut() }
    }

    fun clearActionState() {
        _actionState.value = ProfileActionState.Idle
    }

    // Oturum zaten geçerliyken şifre değiştirmek Supabase'de current password
    // istemez; "yanında birinin telefonu ele geçirmesi" senaryosuna karşı önce
    // mevcut şifreyle yeniden giriş deneyip doğruluyoruz.
    fun changePassword(currentPassword: String, newPassword: String) {
        val currentUsername = username.value ?: return
        viewModelScope.launch {
            _actionState.value = ProfileActionState.Loading
            _actionState.value = try {
                supabase.auth.signInWith(Email) {
                    email = usernameToEmail(currentUsername)
                    password = currentPassword
                }
                supabase.auth.updateUser { password = newPassword }
                ProfileActionState.Success("Şifren güncellendi.")
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                ProfileActionState.Error("Mevcut şifre yanlış olabilir: ${e.message ?: "bir hata oluştu"}")
            }
        }
    }

    fun changeUsername(newUsername: String) {
        viewModelScope.launch {
            _actionState.value = ProfileActionState.Loading
            _actionState.value = try {
                api.changeUsername(ChangeUsernameRequest(newUsername))
                // Backend user_metadata/email'i admin API'yle değiştirdi; yerel
                // oturum bunu kendiliğinden bilmez, refresh ile çekiyoruz.
                supabase.auth.refreshCurrentSession()
                ProfileActionState.Success("Kullanıcı adın güncellendi.")
            } catch (e: CancellationException) {
                throw e
            } catch (e: HttpException) {
                ProfileActionState.Error(e.apiErrorMessage(json) ?: "Kullanıcı adı değiştirilemedi.")
            } catch (e: Exception) {
                ProfileActionState.Error(e.message ?: "Bir hata oluştu.")
            }
        }
    }

    // Başarılı silme sonrası signOut() gerekmiyor: kullanıcı sunucuda zaten
    // silindiği için mevcut oturum bir sonraki istekte/token yenilemede
    // geçersiz olur — yine de anında çıkış deneyimi için burada da sign out ediyoruz.
    fun deleteAccount() {
        viewModelScope.launch {
            _actionState.value = ProfileActionState.Loading
            _actionState.value = try {
                api.deleteAccount()
                supabase.auth.signOut()
                ProfileActionState.Success("Hesabın silindi.")
            } catch (e: CancellationException) {
                throw e
            } catch (e: HttpException) {
                ProfileActionState.Error(e.apiErrorMessage(json) ?: "Hesap silinemedi.")
            } catch (e: Exception) {
                ProfileActionState.Error(e.message ?: "Bir hata oluştu.")
            }
        }
    }
}
