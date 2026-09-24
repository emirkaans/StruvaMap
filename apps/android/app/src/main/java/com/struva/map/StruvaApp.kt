package com.struva.map

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import com.struva.map.pulse.PULSE_CHANNEL_ID
import com.struva.map.push.COMPARISON_CHANNEL_ID
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class StruvaApp : Application() {
    override fun onCreate() {
        super.onCreate()
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
