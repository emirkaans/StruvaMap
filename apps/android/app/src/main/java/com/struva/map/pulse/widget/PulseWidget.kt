package com.struva.map.pulse.widget

import android.content.Context
import android.util.Log
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.action.ActionParameters
import androidx.glance.action.actionParametersOf
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.action.ActionCallback
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.appwidget.updateAll
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.struva.map.MainActivity
import com.struva.map.network.awaitSessionResolved
import com.struva.map.pulse.PulseAnswerSource
import com.struva.map.pulse.pulseEntryPoint
import kotlinx.coroutines.CancellationException

// StruvaColors'un widget karşılığı — Glance kendi ColorProvider'ını istiyor,
// uygulama teması (tek koyu tema) ile aynı değerler.
private val Surface = ColorProvider(Color(0xFF181A21))
private val TextColor = ColorProvider(Color(0xFFECEDEF))
private val Muted = ColorProvider(Color(0xFF9092A0))
private val Accent = ColorProvider(Color(0xFF5470FF))
private val AccentSoft = ColorProvider(Color(0xFF171B30))

private val CheckinIdKey = ActionParameters.Key<String>("checkinId")
private val AnswerKey = ActionParameters.Key<Int>("answer")

// Ana ekran "bugünün nabzı": soru + 1-5 düğmeleri; cevaplandıysa iki cevap.
// Güncelleme tetikleri: cevap verildiğinde (PulseAnswerSubmitter), nabız push'u
// geldiğinde (FcmService) ve updatePeriodMillis (yeni güne geçiş için).
class PulseWidget : GlanceAppWidget() {

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        PulseWidgetStore.refresh(context, force = false)
        provideContent {
            val snapshot by PulseWidgetStore.snapshot.collectAsState()
            PulseWidgetContent(snapshot)
        }
    }

    companion object {
        // Hata fırlatmaz: widget güncellemesi hiçbir zaman asıl işlemi (ör.
        // bildirimden verilen cevabı) başarısız saymamalı.
        suspend fun refreshAll(context: Context) {
            try {
                val ids = GlanceAppWidgetManager(context).getGlanceIds(PulseWidget::class.java)
                if (ids.isEmpty()) return
                PulseWidgetStore.refresh(context)
                PulseWidget().updateAll(context)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Log.w("StruvaPulse", "widget güncellenemedi", e)
            }
        }
    }
}

class PulseWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = PulseWidget()
}

class PulseWidgetAnswerAction : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        val checkinId = parameters[CheckinIdKey] ?: return
        val answer = parameters[AnswerKey] ?: return
        val entryPoint = context.pulseEntryPoint()
        try {
            check(entryPoint.supabaseClient().awaitSessionResolved()) { "oturum yok" }
            // submit() başarıda widget'ı zaten yeniliyor (PulseWidget.refreshAll).
            entryPoint.pulseAnswerSubmitter().submit(checkinId, answer, PulseAnswerSource.WIDGET)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.w("StruvaPulse", "widget'tan nabız cevabı gönderilemedi", e)
            PulseWidget.refreshAll(context)
        }
    }
}

@Composable
private fun PulseWidgetContent(snapshot: PulseWidgetSnapshot) {
    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(Surface)
            .cornerRadius(16.dp)
            .padding(14.dp)
            .clickable(actionStartActivity<MainActivity>()),
    ) {
        Text(
            "GÜNLÜK NABIZ",
            style = TextStyle(color = Accent, fontSize = 11.sp, fontWeight = FontWeight.Bold),
        )
        Spacer(GlanceModifier.height(6.dp))
        when (snapshot) {
            PulseWidgetSnapshot.Loading -> Hint("Yükleniyor…")
            PulseWidgetSnapshot.SignedOut -> Hint("Başlamak için StruvaMap'i aç.")
            PulseWidgetSnapshot.NoPair -> Hint("Partnerinle eşleş: her gün tek soru, iki cevap.")
            PulseWidgetSnapshot.Error -> Hint("Nabız yüklenemedi. Dokun ve uygulamada aç.")
            is PulseWidgetSnapshot.Unanswered -> {
                Question(snapshot.questionText)
                Spacer(GlanceModifier.height(10.dp))
                AnswerButtons(snapshot.checkinId)
            }
            is PulseWidgetSnapshot.Answered -> {
                Question(snapshot.questionText, color = Muted)
                Spacer(GlanceModifier.height(8.dp))
                Text(
                    "Sen ${snapshot.myAnswer} · Partnerin ${snapshot.partnerAnswer ?: "bekleniyor"}",
                    style = TextStyle(color = TextColor, fontSize = 15.sp, fontWeight = FontWeight.Medium),
                )
            }
        }
    }
}

@Composable
private fun Question(text: String, color: ColorProvider = TextColor) {
    Text(text, maxLines = 2, style = TextStyle(color = color, fontSize = 15.sp, fontWeight = FontWeight.Bold))
}

@Composable
private fun Hint(text: String) {
    Text(text, maxLines = 3, style = TextStyle(color = Muted, fontSize = 13.sp))
}

@Composable
private fun AnswerButtons(checkinId: String) {
    Row(modifier = GlanceModifier.fillMaxWidth()) {
        for (value in 1..5) {
            Box(modifier = GlanceModifier.defaultWeight().padding(horizontal = 3.dp)) {
                Box(
                    modifier = GlanceModifier
                        .fillMaxWidth()
                        .height(36.dp)
                        .background(AccentSoft)
                        .cornerRadius(18.dp)
                        .clickable(
                            actionRunCallback<PulseWidgetAnswerAction>(
                                actionParametersOf(CheckinIdKey to checkinId, AnswerKey to value),
                            ),
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("$value", style = TextStyle(color = Accent, fontSize = 15.sp, fontWeight = FontWeight.Bold))
                }
            }
        }
    }
    Spacer(GlanceModifier.height(4.dp))
    Row(modifier = GlanceModifier.fillMaxWidth()) {
        Text("zayıf", modifier = GlanceModifier.defaultWeight(), style = TextStyle(color = Muted, fontSize = 11.sp))
        Text("güçlü", style = TextStyle(color = Muted, fontSize = 11.sp))
    }
}
