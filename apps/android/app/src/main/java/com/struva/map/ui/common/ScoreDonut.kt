package com.struva.map.ui.common

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.struva.map.ui.theme.IBMPlexMono
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.bandColorForScore

// Web'deki RSI halkası (ResultPage.tsx donutSvg) — skor/100 oranında dolan
// bir yay, ortada mono fontla sayı. Aynı giriş easing'i (cubic-bezier
// 0.22,0.61,0.36,1) 900ms'de.
@Composable
fun ScoreDonut(
    value: Int,
    modifier: Modifier = Modifier,
    size: Dp = 148.dp,
    strokeWidth: Dp = 14.dp,
) {
    val animatedFraction by animateFloatAsState(
        targetValue = (value.coerceIn(0, 100)) / 100f,
        animationSpec = tween(900, easing = CubicBezierEasing(0.22f, 0.61f, 0.36f, 1f)),
        label = "scoreDonut",
    )
    val color = bandColorForScore(value)
    // Sayı halkanın boyuna göre ölçeklenir ve telefonun yazı boyutu ayarından
    // etkilenmez; büyük yazı ayarında halkanın dışına taşıyordu. 148 dp
    // halkada 40 sp sayı ve 11 sp birim, küçük halkalarda orantılı.
    val density = LocalDensity.current
    val numberStyle = with(density) {
        TextStyle(
            fontFamily = IBMPlexMono,
            fontWeight = FontWeight.Medium,
            fontSize = (size * 0.27f).toSp(),
            lineHeight = (size * 0.3f).toSp(),
            letterSpacing = (-0.5).sp,
            color = StruvaColors.Text,
        )
    }
    val unitStyle = with(density) {
        TextStyle(
            fontFamily = IBMPlexMono,
            fontWeight = FontWeight.Medium,
            fontSize = maxOf(size * 0.075f, 9.dp).toSp(),
            letterSpacing = 0.5.sp,
            color = StruvaColors.Muted,
        )
    }

    Box(modifier = modifier.size(size), contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.size(size)) {
            val stroke = Stroke(width = strokeWidth.toPx(), cap = StrokeCap.Round)
            drawArc(
                color = StruvaColors.Border,
                startAngle = -90f,
                sweepAngle = 360f,
                useCenter = false,
                style = stroke,
            )
            drawArc(
                color = color,
                startAngle = -90f,
                sweepAngle = 360f * animatedFraction,
                useCenter = false,
                style = stroke,
            )
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value.toString(), style = numberStyle)
            Text("/ 100", style = unitStyle)
        }
    }
}
