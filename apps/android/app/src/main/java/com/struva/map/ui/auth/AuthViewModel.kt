package com.struva.map.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.ApiService
import com.struva.map.network.apiErrorMessage
import com.struva.map.network.dto.RegisterRequest
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

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val api: ApiService,
    private val supabase: SupabaseClient,
    private val json: Json,
) : ViewModel() {
    private val _formState = MutableStateFlow<AuthFormState>(AuthFormState.Idle)
    val formState: StateFlow<AuthFormState> = _formState.asStateFlow()

    val sessionStatus: StateFlow<SessionStatus> = supabase.auth.sessionStatus

    fun register(username: String, password: String) = runAuthAction {
        api.register(RegisterRequest(username, password))
        signIn(username, password)
    }

    fun login(username: String, password: String) = runAuthAction {
        signIn(username, password)
    }

    fun logout() {
        viewModelScope.launch { supabase.auth.signOut() }
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
