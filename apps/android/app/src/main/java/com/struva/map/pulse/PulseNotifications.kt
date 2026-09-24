package com.struva.map.pulse

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.struva.map.EXTRA_ROUTE
import com.struva.map.MainActivity
import com.struva.map.R

const val PULSE_CHANNEL_ID = "pulse"
const val PULSE_NOTIFICATION_ID = 1002

private const val ACCENT = 0xFF5470FF.toInt() // StruvaColors.Accent

private val ANSWER_BUTTON_IDS = intArrayOf(
    R.id.pulse_answer_1,
    R.id.pulse_answer_2,
    R.id.pulse_answer_3,
    R.id.pulse_answer_4,
    R.id.pulse_answer_5,
)

// Nabız bildirimleri tek bir id'yi paylaşıyor (PULSE_NOTIFICATION_ID): sabah
// sorusu, akşam hatırlatması ve cevap onayı aynı kartı yerinde günceller,
// bildirim çekmecesinde aynı gün için birden fazla kart birikmez.
//
// POST_NOTIFICATIONS izni reddedildiyse notify() sessizce hiçbir şey yapmaz
// (MainActivity izni ilk açılışta istiyor) — lint uyarısı bu yüzden bastırıldı.
@SuppressLint("MissingPermission")
object PulseNotifications {

    // checkinId varsa genişletilmiş görünümde 1-5 düğmeleri çıkar; Android
    // standart action'ları en fazla 3 düğme gösterdiği için özel görünüm.
    fun showQuestion(context: Context, title: String, body: String, checkinId: String?, route: String? = null) {
        val builder = baseBuilder(context, route)
            .setContentTitle(title)
            .setContentText(body)

        if (checkinId != null) {
            val expanded = RemoteViews(context.packageName, R.layout.notification_pulse_answer).apply {
                setTextViewText(R.id.pulse_question, body)
                ANSWER_BUTTON_IDS.forEachIndexed { index, viewId ->
                    setOnClickPendingIntent(viewId, answerIntent(context, checkinId, index + 1))
                }
            }
            builder
                .setStyle(NotificationCompat.DecoratedCustomViewStyle())
                .setCustomBigContentView(expanded)
                .setSubText("Aşağı çek, 1–5 ile yanıtla")
        } else {
            builder.setStyle(NotificationCompat.BigTextStyle().bigText(body))
        }

        NotificationManagerCompat.from(context).notify(PULSE_NOTIFICATION_ID, builder.build())
    }

    fun showAnswered(context: Context, myAnswer: Int, partnerAnswer: Int?) {
        val body = if (partnerAnswer != null) {
            "Sen $myAnswer · Partnerin $partnerAnswer. Bugünün nabzı tamam."
        } else {
            "Sen $myAnswer. Partnerin cevaplayınca haber vereceğiz."
        }
        val notification = baseBuilder(context, route = null)
            .setContentTitle("Cevabın kaydedildi")
            .setContentText(body)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .build()
        NotificationManagerCompat.from(context).notify(PULSE_NOTIFICATION_ID, notification)
    }

    fun showFailed(context: Context) {
        val notification = baseBuilder(context, route = null)
            .setContentTitle("Cevap gönderilemedi")
            .setContentText("Uygulamayı açıp nabız kartından tekrar dene.")
            .setOnlyAlertOnce(true)
            .build()
        NotificationManagerCompat.from(context).notify(PULSE_NOTIFICATION_ID, notification)
    }

    private fun baseBuilder(context: Context, route: String?): NotificationCompat.Builder {
        val openAppIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            route?.let { putExtra(EXTRA_ROUTE, it) }
        }
        val contentIntent = PendingIntent.getActivity(
            context,
            PULSE_NOTIFICATION_ID,
            openAppIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        return NotificationCompat.Builder(context, PULSE_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setColor(ACCENT)
            .setContentIntent(contentIntent)
            .setAutoCancel(true)
    }

    // requestCode her cevap için farklı olmalı: aynı requestCode + aynı
    // Intent filtresi FLAG_UPDATE_CURRENT ile tek PendingIntent'e çöker ve
    // beş düğmenin hepsi son eklenen cevabı gönderir.
    private fun answerIntent(context: Context, checkinId: String, answer: Int): PendingIntent {
        val intent = Intent(context, PulseAnswerReceiver::class.java).apply {
            action = ACTION_PULSE_ANSWER
            putExtra(EXTRA_CHECKIN_ID, checkinId)
            putExtra(EXTRA_ANSWER, answer)
        }
        return PendingIntent.getBroadcast(
            context,
            PULSE_NOTIFICATION_ID * 10 + answer,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
    }
}
