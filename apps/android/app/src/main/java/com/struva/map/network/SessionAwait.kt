package com.struva.map.network

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.status.SessionStatus
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withTimeoutOrNull

// Süreç bir bildirim düğmesi ya da widget ile soğuk başladığında Supabase
// oturumu diskten henüz yüklenmemiş olabilir — AuthInterceptor o an token
// bulamaz, istek 401 alır. Activity dışı giriş noktaları (PulseAnswerReceiver,
// PulseWidget) API'ye gitmeden önce oturumun netleşmesini bekler.
suspend fun SupabaseClient.awaitSessionResolved(timeoutMs: Long = 10_000): Boolean =
    withTimeoutOrNull(timeoutMs) {
        auth.sessionStatus.first { it is SessionStatus.Authenticated || it is SessionStatus.NotAuthenticated }
    } is SessionStatus.Authenticated
