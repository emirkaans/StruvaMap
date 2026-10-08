package com.struva.map

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.util.Log
import com.struva.map.network.ErrorReporting
import com.struva.map.pulse.PULSE_CHANNEL_ID
import com.struva.map.push.COMPARISON_CHANNEL_ID
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class StruvaApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Kullanıcıya sade metin gösterilen her hatanın asıl istisnası Logcat'e
        // düşer: adb logcat -s StruvaError
        ErrorReporting.reporter = { e -> Log.w("StruvaError", e.message, e) }
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(
            NotificationChannel(COMPARISON_CHANNEL_ID, "Kıyaslamalar", NotificationManager.IMPORTANCE_DEFAULT),
        )
        // Nabız ayrı kanal: kullanıcı günlük soruları kıyaslama bildirimlerinden
        // bağımsız kapatabilsin/sessize alabilsin.
        manager.createNotificationChannel(
            NotificationChannel(PULSE_CHANNEL_ID, "Günlük nabız", NotificationManager.IMPORTANCE_DEFAULT),
        )
    }
}
