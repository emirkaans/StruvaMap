package com.struva.map.pulse.widget

import android.content.Context
import android.os.SystemClock
import android.util.Log
import com.struva.map.network.awaitSessionResolved
import com.struva.map.pulse.pulseEntryPoint
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

sealed interface PulseWidgetSnapshot {
    data object Loading : PulseWidgetSnapshot
    data object SignedOut : PulseWidgetSnapshot
    data object NoPair : PulseWidgetSnapshot
    data object Error : PulseWidgetSnapshot
    data class Unanswered(val checkinId: String, val questionText: String) : PulseWidgetSnapshot
    data class Answered(val questionText: String, val myAnswer: Int, val partnerAnswer: Int?) : PulseWidgetSnapshot
}

// Glance'ta update(), oturum (session) açıkken provideGlance'ı yeniden
// çalıştırmıyor, yalnızca yeniden çiziyor — bu yüzden veri composition'ın
// dinlediği bir StateFlow'da tutuluyor: yeni snapshot yazılınca açık oturum
// da, yeni başlayan oturum da aynı veriyi görür. Süreç ölünce kaybolması
// sorun değil; provideGlance ilk açılışta yeniden yükler.
object PulseWidgetStore {
    // Aynı anda gelen iki tetik (ör. cevap sonrası refreshAll + hemen ardından
    // provideGlance) için ikinci ağ turunu atlama penceresi.
    private const val FRESH_MS = 30_000L

    private val _snapshot = MutableStateFlow<PulseWidgetSnapshot>(PulseWidgetSnapshot.Loading)
    val snapshot: StateFlow<PulseWidgetSnapshot> = _snapshot.asStateFlow()

    @Volatile
    private var loadedAt = 0L

    suspend fun refresh(context: Context, force: Boolean = true) {
        val now = SystemClock.elapsedRealtime()
        if (!force && loadedAt != 0L && now - loadedAt < FRESH_MS) return
        _snapshot.value = load(context)
        loadedAt = SystemClock.elapsedRealtime()
    }

    private suspend fun load(context: Context): PulseWidgetSnapshot {
        val entryPoint = context.pulseEntryPoint()
        return try {
            if (!entryPoint.supabaseClient().awaitSessionResolved()) return PulseWidgetSnapshot.SignedOut
            val repository = entryPoint.pulseRepository()
            val pair = repository.getActivePair() ?: return PulseWidgetSnapshot.NoPair
            val today = repository.getToday(pair.id)
            if (today.myAnswer == null) {
                PulseWidgetSnapshot.Unanswered(today.id, today.questionText)
            } else {
                PulseWidgetSnapshot.Answered(today.questionText, today.myAnswer, today.partnerAnswer)
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.w("StruvaPulse", "widget nabzı yüklenemedi", e)
            PulseWidgetSnapshot.Error
        }
    }
}
