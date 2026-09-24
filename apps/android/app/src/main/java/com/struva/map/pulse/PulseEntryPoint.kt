package com.struva.map.pulse

import android.content.Context
import com.struva.map.network.PulseRepository
import dagger.hilt.EntryPoint
import dagger.hilt.InstallIn
import dagger.hilt.android.EntryPointAccessors
import dagger.hilt.components.SingletonComponent
import io.github.jan.supabase.SupabaseClient

// Hilt'in @AndroidEntryPoint'i Glance widget'ını ve ActionCallback'i
// kapsamıyor; BroadcastReceiver için de aynı yolu kullanıyoruz ki üç arka
// plan giriş noktası (bildirim düğmesi, widget, widget düğmesi) bağımlılıkları
// tek yerden alsın.
@EntryPoint
@InstallIn(SingletonComponent::class)
interface PulseEntryPoint {
    fun pulseRepository(): PulseRepository
    fun pulseAnswerSubmitter(): PulseAnswerSubmitter
    fun supabaseClient(): SupabaseClient
}

fun Context.pulseEntryPoint(): PulseEntryPoint =
    EntryPointAccessors.fromApplication(applicationContext, PulseEntryPoint::class.java)
