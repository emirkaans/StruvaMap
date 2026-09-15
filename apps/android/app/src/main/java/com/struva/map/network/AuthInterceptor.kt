package com.struva.map.network

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

// StruvaMap API'sine giden her isteğe, varsa aktif Supabase oturumunun
// access token'ını ekler. Oturum yoksa istek header'sız gider — /tests,
// /results gibi anonim uçlar zaten authsız çalışmaya devam eder (backend'de
// Authorization opsiyonel, bkz. apps/api/src/auth/optional-user.ts).
class AuthInterceptor @Inject constructor(
    private val supabaseClient: SupabaseClient,
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking { supabaseClient.auth.currentSessionOrNull()?.accessToken }
        val original = chain.request()
        val request = if (token != null) {
            original.newBuilder().addHeader("Authorization", "Bearer $token").build()
        } else {
            original
        }
        return chain.proceed(request)
    }
}
