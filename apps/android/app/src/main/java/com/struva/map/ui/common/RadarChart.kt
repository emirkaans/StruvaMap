package com.struva.map.ui.common

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.unit.dp
import com.struva.map.ui.theme.StruvaColors
import kotlin.math.cos
import kotlin.math.sin

// Web'deki Radar (charts.tsx) — N boyutun her biri kendi ekseninde, merkezden
// dışa doğru dolgu poligonu. Aynı giriş easing'i (900ms cubic-bezier).
@Composable
fun RadarChart(values: List<Pair<String, Int>>, modifier: Modifier = Modifier) {
    val animatedFraction by animateFloatAsState(
        targetValue = 1f,
        animationSpec = tween(700, easing = CubicBezierEasing(0.22f, 0.61f, 0.36f, 1f)),
        label = "radar",
    )
    if (values.size < 3) return

    val gridColor = StruvaColors.Border
    val accent = StruvaColors.Accent
    val labelColor = StruvaColors.Muted
    val valueColor = StruvaColors.Text

    Canvas(modifier = modifier.fillMaxWidth().height(280.dp)) {
        val n = values.size
        val center = Offset(size.width / 2f, size.height / 2f)
        val labelPad = 46f
        val radius = (minOf(size.width, size.height) / 2f) - labelPad
        val angleStep = (2 * Math.PI / n).toFloat()
        fun pointAt(index: Int, r: Float): Offset {
            val angle = -Math.PI.toFloat() / 2 + index * angleStep
            return Offset(center.x + r * cos(angle), center.y + r * sin(angle))
        }

        // Grid: 4 iç halka + eksenler
        for (ring in 1..4) {
            val ringR = radius * ring / 4f
            val path = Path()
            for (i in 0 until n) {
                val p = pointAt(i, ringR)
                if (i == 0) path.moveTo(p.x, p.y) else path.lineTo(p.x, p.y)
            }
            path.close()
            drawPath(path, color = gridColor, style = Stroke(width = 1f))
        }
        for (i in 0 until n) {
            val p = pointAt(i, radius)
            drawLine(gridColor, center, p, strokeWidth = 1f)
        }

        // Değer poligonu
        val valuePath = Path()
        for (i in 0 until n) {
            val v = (values[i].second.coerceIn(0, 100) / 100f) * animatedFraction
            val p = pointAt(i, radius * v)
            if (i == 0) valuePath.moveTo(p.x, p.y) else valuePath.lineTo(p.x, p.y)
        }
        valuePath.close()
        drawPath(valuePath, color = accent.copy(alpha = 0.16f))
        drawPath(valuePath, color = accent, style = Stroke(width = 2f))
        for (i in 0 until n) {
            val v = (values[i].second.coerceIn(0, 100) / 100f) * animatedFraction
            val p = pointAt(i, radius * v)
            drawCircle(accent, radius = 4f, center = p)
        }

        // Etiketler + değerler (dış halka üstünde)
        drawIntoCanvas { canvas ->
            for (i in 0 until n) {
                val p = pointAt(i, radius + 26f)
                val name = values[i].first
                val value = values[i].second.toString()
                canvas.nativeCanvas.apply {
                    val labelPaint = android.graphics.Paint().apply {
                        isAntiAlias = true
                        color = labelColor.toArgbCompat()
                        textSize = 26f
                        textAlign = android.graphics.Paint.Align.CENTER
                    }
                    val valuePaint = android.graphics.Paint().apply {
                        isAntiAlias = true
                        color = valueColor.toArgbCompat()
                        textSize = 24f
                        typeface = android.graphics.Typeface.DEFAULT_BOLD
                        textAlign = android.graphics.Paint.Align.CENTER
                    }
                    drawText(name, p.x, p.y, labelPaint)
                    drawText(value, p.x, p.y + 26f, valuePaint)
                }
            }
        }
    }
}

private fun androidx.compose.ui.graphics.Color.toArgbCompat(): Int =
    android.graphics.Color.argb(
        (alpha * 255).toInt(),
        (red * 255).toInt(),
        (green * 255).toInt(),
        (blue * 255).toInt(),
    )
