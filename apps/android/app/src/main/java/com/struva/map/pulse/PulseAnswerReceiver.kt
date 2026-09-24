package com.struva.map.pulse

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.struva.map.network.awaitSessionResolved
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

const val ACTION_PULSE_ANSWER = "com.struva.map.action.PULSE_ANSWER"
const val EXTRA_CHECKIN_ID = "checkinId"
const val EXTRA_ANSWER = "answer"

// Bildirimdeki 1-5 düğmeleri: uygulamayı açmadan cevabı gönderir, bildirimi
// sonuçla (partnerin cevabı varsa o da) günceller. goAsync ile ~10 sn'lik
// receiver süresi içinde ağ çağrısı bitiyor; bitmezse sistem süreci
// sonlandırabilir, kullanıcı da kartı açık bir soru olarak görmeye devam eder.
class PulseAnswerReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_PULSE_ANSWER) return
        val checkinId = intent.getStringExtra(EXTRA_CHECKIN_ID) ?: return
        val answer = intent.getIntExtra(EXTRA_ANSWER, 0).takeIf { it in 1..5 } ?: return

        val appContext = context.applicationContext
        val entryPoint = appContext.pulseEntryPoint()
        val pending = goAsync()
        CoroutineScope(SupervisorJob() + Dispatchers.IO).launch {
            try {
                check(entryPoint.supabaseClient().awaitSessionResolved(timeoutMs = 5_000)) { "oturum yok" }
                val today = entryPoint.pulseAnswerSubmitter().submit(checkinId, answer, PulseAnswerSource.NOTIFICATION)
                PulseNotifications.showAnswered(appContext, answer, today.partnerAnswer)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Log.w("StruvaPulse", "bildirimden nabız cevabı gönderilemedi", e)
                PulseNotifications.showFailed(appContext)
            } finally {
                pending.finish()
            }
        }
    }
}
