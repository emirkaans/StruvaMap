package com.struva.map.ui.common

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.struva.map.ui.theme.IBMPlexMono
import com.struva.map.ui.theme.StruvaColors
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.abs

// Grafikteki bir ölçüm: skor ve altında gösterilecek kısa tarih.
data class TrendPoint(val value: Int, val label: String)

private val ShortDate = DateTimeFormatter.ofPattern("d MMM", Locale.forLanguageTag("tr"))

// Sunucudan gelen ISO zaman damgasını "7 Eki" biçimine çevirir.
fun trendDateLabel(iso: String): String = try {
    OffsetDateTime.parse(iso).atZoneSameInstant(ZoneId.systemDefault()).format(ShortDate)
} catch (e: Exception) {
    ""
}

// Web'deki TrendChart (charts.tsx): geçmiş genel skorların çizgi grafiği,
// aynı 900ms giriş animasyonu. En az 2 nokta gerekir (çağıran taraf kontrol eder).
// Solda 0/50/100 ölçeği var; seçili noktanın değeri ve tarihi üstünde yazar.
// Başlangıçta son ölçüm seçili, bir noktaya dokununca o nokta seçilir.
@Composable
fun TrendChart(points: List<TrendPoint>, modifier: Modifier = Modifier) {
    val animatedFraction by animateFloatAsState(
        targetValue = 1f,
        animationSpec = tween(900, easing = CubicBezierEasing(0.22f, 0.61f, 0.36f, 1f)),
        label = "trend",
    )
    if (points.size < 2) return

    var selected by remember(points) { mutableIntStateOf(points.lastIndex) }
    val measurer = rememberTextMeasurer()
    val gridColor = StruvaColors.Muted.copy(alpha = 0.35f)
    val accent = StruvaColors.Accent
    val axisStyle = TextStyle(fontFamily = IBMPlexMono, fontSize = 10.sp, color = StruvaColors.Muted)
    val tipStyle = TextStyle(
        fontFamily = IBMPlexMono,
        fontSize = 12.sp,
        fontWeight = FontWeight.SemiBold,
        color = StruvaColors.OnAccent,
    )

    Column(modifier.fillMaxWidth()) {
        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp)
                .pointerInput(points) {
                    detectTapGestures { tap ->
                        val left = 32.dp.toPx()
                        val right = 12.dp.toPx()
                        val w = size.width - left - right
                        val step = w / (points.size - 1)
                        selected = points.indices.minBy { abs(left + step * it - tap.x) }
                    }
                },
        ) {
            val left = 32.dp.toPx()
            val right = 12.dp.toPx()
            val top = 34.dp.toPx()
            val bottom = 8.dp.toPx()
            val w = size.width - left - right
            val h = size.height - top - bottom
            val n = points.size
            fun xAt(i: Int) = left + w * i / (n - 1).toFloat()
            fun yAt(v: Int, f: Float = 1f) = top + h * (1f - (v.coerceIn(0, 100) / 100f) * f)

            // Ölçek: 0/50/100 çizgileri ve soldaki değerleri.
            listOf(0, 50, 100).forEach { v ->
                val y = yAt(v)
                drawLine(gridColor, Offset(left, y), Offset(left + w, y), strokeWidth = 1.dp.toPx())
                val label = measurer.measure(v.toString(), axisStyle)
                drawText(label, topLeft = Offset(left - 6.dp.toPx() - label.size.width, y - label.size.height / 2f))
            }

            // Seçili noktadan aşağı ince kılavuz çizgisi.
            val sx = xAt(selected)
            drawLine(gridColor, Offset(sx, top), Offset(sx, top + h), strokeWidth = 1.dp.toPx())

            val path = Path()
            points.forEachIndexed { i, p ->
                val y = yAt(p.value, animatedFraction)
                if (i == 0) path.moveTo(xAt(i), y) else path.lineTo(xAt(i), y)
            }
            drawPath(path, color = accent, style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))
            points.forEachIndexed { i, p ->
                val center = Offset(xAt(i), yAt(p.value, animatedFraction))
                if (i == selected) {
                    drawCircle(accent.copy(alpha = 0.25f), radius = 9.dp.toPx(), center = center)
                    drawCircle(accent, radius = 5.dp.toPx(), center = center)
                } else {
                    drawCircle(accent, radius = 3.5.dp.toPx(), center = center)
                }
            }

            // Seçili noktanın değeri ve tarihi, grafiğin üst bandında; kenarlara taşmaz.
            val p = points[selected]
            val text = if (p.label.isBlank()) p.value.toString() else "${p.value} · ${p.label}"
            val tip = measurer.measure(text, tipStyle)
            val padH = 8.dp.toPx()
            val padV = 4.dp.toPx()
            val boxW = tip.size.width + padH * 2
            val boxH = tip.size.height + padV * 2
            val boxX = (sx - boxW / 2f).coerceIn(left, left + w - boxW)
            val boxY = 2.dp.toPx()
            drawRoundRect(accent, topLeft = Offset(boxX, boxY), size = Size(boxW, boxH), cornerRadius = CornerRadius(6.dp.toPx()))
            drawText(tip, topLeft = Offset(boxX + padH, boxY + padV))
        }
        Spacer(Modifier.height(6.dp))
        Text(
            "Bir noktaya dokun, o ölçümün skoru ve tarihi görünsün.",
            style = MaterialTheme.typography.bodySmall,
            color = StruvaColors.Muted,
        )
    }
}
