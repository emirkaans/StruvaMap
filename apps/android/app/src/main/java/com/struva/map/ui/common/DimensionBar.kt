package com.struva.map.ui.common

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.bandColorForScore

private val TrackShape = RoundedCornerShape(99.dp)

// Web'deki pill-şeklinde boyut barı (.bar / Bar component) — track her zaman
// --border renginde, dolgu banda göre renkli, aynı giriş easing'i.
@Composable
fun DimensionBar(label: String, value: Int, modifier: Modifier = Modifier) {
    val animatedFraction by animateFloatAsState(
        targetValue = (value.coerceIn(0, 100)) / 100f,
        animationSpec = tween(900, easing = CubicBezierEasing(0.22f, 0.61f, 0.36f, 1f)),
        label = "dimensionBar",
    )
    val color = bandColorForScore(value)

    Column(modifier = modifier.fillMaxWidth()) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, style = MaterialTheme.typography.bodyMedium)
            Text(value.toString(), style = MaterialTheme.typography.labelMedium, color = color)
        }
        Spacer(Modifier.height(8.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(TrackShape)
                .background(StruvaColors.Border),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(animatedFraction.coerceIn(0f, 1f))
                    .height(8.dp)
                    .clip(TrackShape)
                    .background(color),
            )
        }
    }
}
