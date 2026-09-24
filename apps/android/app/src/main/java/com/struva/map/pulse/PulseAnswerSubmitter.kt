package com.struva.map.pulse

import android.content.Context
import androidx.core.app.NotificationManagerCompat
import com.struva.map.network.Analytics
import com.struva.map.network.PulseRepository
import com.struva.map.network.dto.PulseTodayDto
import com.struva.map.pulse.widget.PulseWidget
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

// Olay adı gibi değerler API'nin EVENT_NAMES listesine bağlı (bkz.
// apps/api/src/events/track-event.dto.ts 'pulse_answer').
enum class PulseAnswerSource(val value: String) {
    APP("app"),
    NOTIFICATION("notification"),
    WIDGET("widget"),
}

// Nabız cevabı üç yüzeyden gelebiliyor (uygulama kartı, bildirim, widget);
// hepsi buradan geçiyor ki diğer yüzeyler bayat kalmasın ve hangi yüzeyin
// kullanıldığı ölçülebilsin.
@Singleton
class PulseAnswerSubmitter @Inject constructor(
    @ApplicationContext private val context: Context,
    private val repository: PulseRepository,
    private val analytics: Analytics,
) {
    suspend fun submit(checkinId: String, answer: Int, source: PulseAnswerSource): PulseTodayDto {
        val today = repository.submitAnswer(checkinId, answer)
        analytics.track("pulse_answer", props = mapOf("source" to source.value))
        // Bildirimden verilen cevapta bildirim silinmiyor, onay metniyle
        // yenileniyor (bkz. PulseAnswerReceiver) — diğer yüzeylerde artık
        // cevaplanmış bir soruyu soran bildirim kalmasın.
        if (source != PulseAnswerSource.NOTIFICATION) {
            NotificationManagerCompat.from(context).cancel(PULSE_NOTIFICATION_ID)
        }
        PulseWidget.refreshAll(context)
        return today
    }
}
