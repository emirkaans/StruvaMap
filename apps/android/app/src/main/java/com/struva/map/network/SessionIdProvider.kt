package com.struva.map.network

import android.content.Context
import androidx.core.content.edit
import dagger.hilt.android.qualifiers.ApplicationContext
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

// Web'deki lib/session.ts ile aynı mantık: cihazda kalıcı, tek seferlik
// üretilen bir id — sonuçları aynı oturuma (ör. partner karşılaştırması)
// bağlamak için kullanılıyor.
@Singleton
class SessionIdProvider @Inject constructor(@ApplicationContext context: Context) {
    private val prefs = context.getSharedPreferences("struva_prefs", Context.MODE_PRIVATE)

    val sessionId: String by lazy {
        prefs.getString(KEY, null) ?: UUID.randomUUID().toString().also {
            prefs.edit { putString(KEY, it) }
        }
    }

    private companion object {
        const val KEY = "struva_session_id"
    }
}
