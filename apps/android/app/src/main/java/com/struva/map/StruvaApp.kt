package com.struva.map

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import com.struva.map.push.COMPARISON_CHANNEL_ID
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class StruvaApp : Application() {
    override fun onCreate() {
        super.onCreate()
        val channel = NotificationChannel(
            COMPARISON_CHANNEL_ID,
            "Kıyaslamalar",
            NotificationManager.IMPORTANCE_DEFAULT,
        )
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
}
