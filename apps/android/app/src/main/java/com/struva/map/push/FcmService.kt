package com.struva.map.push

import android.app.PendingIntent
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.struva.map.MainActivity

const val COMPARISON_CHANNEL_ID = "comparisons"
private const val NOTIFICATION_ID = 1001

// data-only mesaj kullanıyoruz (bkz. backend push.service.ts) — bildirimi
// burada kendimiz kuruyoruz, ön plan/arka plan farkı olmadan aynı davranış.
// Tıklayınca uygulamayı açıyor; belirli kıyaslama ekranına deep link yok
// (bkz. struvamap_android_phases memory — bilinçli olarak kapsam dışı).
class FcmService : FirebaseMessagingService() {

    override fun onMessageReceived(message: RemoteMessage) {
        val title = message.data["title"] ?: return
        val body = message.data["body"] ?: ""

        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )

        val notification = NotificationCompat.Builder(this, COMPARISON_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        NotificationManagerCompat.from(this).notify(NOTIFICATION_ID, notification)
    }

    // Token değişikliğinde yeniden kaydetmiyoruz — bir sonraki davet
    // gönderiminde (InviteViewModel.registerPushToken) zaten güncel token
    // alınıp yollanıyor, token rotasyonu nadir olduğundan bu yeterli.
    override fun onNewToken(token: String) = Unit
}
