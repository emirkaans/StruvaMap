package com.struva.map.push

import android.app.PendingIntent
import android.content.Intent
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.struva.map.EXTRA_ROUTE
import com.struva.map.MainActivity
import com.struva.map.network.ApiService
import com.struva.map.network.dto.RegisterUserDeviceRequest
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject

const val COMPARISON_CHANNEL_ID = "comparisons"
private const val NOTIFICATION_ID = 1001

// data-only mesaj kullanıyoruz (bkz. backend push.service.ts) — bildirimi
// burada kendimiz kuruyoruz, ön plan/arka plan farkı olmadan aynı davranış.
// Kıyaslama push'unda comparisonId geliyorsa MainActivity'yi doğrudan o
// ekrana (comparison/{id}) yönlendiriyoruz (bkz. EXTRA_ROUTE). Nabız
// push'larında ayrı bir ekrana gerek yok — kart zaten Home'da (start
// destination), oraya düşmek yeterli.
@AndroidEntryPoint
class FcmService : FirebaseMessagingService() {

    @Inject
    lateinit var api: ApiService

    override fun onMessageReceived(message: RemoteMessage) {
        val title = message.data["title"] ?: return
        val body = message.data["body"] ?: ""
        val route = message.data["comparisonId"]?.let { "comparison/$it" }

        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            route?.let { putExtra(EXTRA_ROUTE, it) }
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )

        val notification = NotificationCompat.Builder(this, COMPARISON_CHANNEL_ID)
            .setSmallIcon(com.struva.map.R.drawable.ic_notification)
            .setColor(android.graphics.Color.parseColor("#5470FF")) // StruvaColors.Accent
            .setContentTitle(title)
            .setContentText(body)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        NotificationManagerCompat.from(this).notify(NOTIFICATION_ID, notification)
    }

    // Kalıcı, kullanıcı bazlı token'a bağımlı nabız push'u eklendiğinden
    // (bkz. AuthViewModel.registerPushTokenIfNeeded) token rotasyonu artık
    // sessizce kırılmaya açık — bir sonraki app açılışını beklemeden burada
    // da en iyi çaba ile yeniden kaydediyoruz. Servis Activity değil, kendi
    // scope'unu açıp kapatıyor (goAsync gerekmiyor: Firebase SDK zaten bu
    // callback'i kısa ömürlü arka plan işi için tasarlamış).
    override fun onNewToken(token: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                api.registerUserDevice(RegisterUserDeviceRequest(token))
            } catch (e: Exception) {
                // Oturum açık değilse 401 beklenir (AuthInterceptor token eklemez) —
                // bir sonraki login'de registerPushTokenIfNeeded zaten dener.
                Log.w("StruvaFcm", "token rotasyonunda yeniden kayıt başarısız", e)
            }
        }
    }
}
