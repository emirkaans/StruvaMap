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
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import com.struva.map.ui.theme.StruvaColors

// Web'deki TrendChart (charts.tsx) — geçmiş RSI değerlerinin çizgi grafiği,
// aynı 900ms giriş animasyonu. En az 2 nokta gerekir (çağıran taraf kontrol eder).
@Composable
fun TrendChart(rsiHistory: List<Int>, modifier: Modifier = Modifier) {
    val animatedFraction by animateFloatAsState(
        targetValue = 1f,
        animationSpec = tween(900, easing = CubicBezierEasing(0.22f, 0.61f, 0.36f, 1f)),
        label = "trend",
    )
    if (rsiHistory.size < 2) return

    val gridColor = StruvaColors.Border
    val accent = StruvaColors.Accent

    Canvas(modifier = modifier.fillMaxWidth().height(140.dp)) {
        val padX = 8f
        val padY = 12f
        val w = size.width - padX * 2
        val h = size.height - padY * 2
        val n = rsiHistory.size
        fun xAt(i: Int) = padX + (w * i / (n - 1).toFloat())
        fun yAt(v: Int) = padY + h * (1f - v.coerceIn(0, 100) / 100f)

        // Yatay ölçek çizgileri (0/50/100)
        listOf(0, 50, 100).forEach { v ->
            val y = yAt(v)
            drawLine(gridColor, Offset(padX, y), Offset(padX + w, y), strokeWidth = 1f)
        }

        val path = Path()
        rsiHistory.forEachIndexed { i, v ->
            val x = xAt(i)
            val y = padY + h * (1f - (v.coerceIn(0, 100) / 100f) * animatedFraction)
            if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
        }
        drawPath(
            path,
            color = accent,
            style = Stroke(width = 4f, cap = StrokeCap.Round, join = androidx.compose.ui.graphics.StrokeJoin.Round),
        )
        rsiHistory.forEachIndexed { i, v ->
            val x = xAt(i)
            val y = padY + h * (1f - (v.coerceIn(0, 100) / 100f) * animatedFraction)
            drawCircle(accent, radius = 5f, center = Offset(x, y))
        }
    }
}
