package com.struva.map.network

import android.content.Context
import androidx.core.content.edit
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

// Web'deki invitedStorageKey(resultId) localStorage bayrağıyla aynı amaç:
// bu sonuç için davet linki paylaşıldı mı, bilgisini cihazda tutar.
@Singleton
class InvitedResultStore @Inject constructor(@ApplicationContext context: Context) {
    private val prefs = context.getSharedPreferences("struva_prefs", Context.MODE_PRIVATE)

    fun isInvited(resultId: String): Boolean = prefs.getBoolean(key(resultId), false)

    fun markInvited(resultId: String) {
        prefs.edit { putBoolean(key(resultId), true) }
    }

    // "Bugün" ekranındaki "Kıyaslaman hazır" kartı, kıyaslama bir kez
    // açılınca kaybolsun diye (bkz. ComparisonViewModel, HomeViewModel).
    fun isComparisonSeen(comparisonId: String): Boolean = prefs.getBoolean(seenKey(comparisonId), false)

    fun markComparisonSeen(comparisonId: String) {
        prefs.edit { putBoolean(seenKey(comparisonId), true) }
    }

    private fun key(resultId: String) = "invited_$resultId"

    private fun seenKey(comparisonId: String) = "comparison_seen_$comparisonId"
}
