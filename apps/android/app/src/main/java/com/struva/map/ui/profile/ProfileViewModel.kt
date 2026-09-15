package com.struva.map.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.status.SessionStatus
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.serialization.json.jsonPrimitive
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val supabase: SupabaseClient,
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

    fun logout() {
        viewModelScope.launch { supabase.auth.signOut() }
    }
}
