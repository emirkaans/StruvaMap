package com.struva.map.ui.common

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.struva.map.ui.theme.StruvaColors

private val CardShape = RoundedCornerShape(12.dp)

// Web'deki .card: surface arka plan + 1px border + 12px radius, ağır gölge
// yok (bkz. struva.css). App genelinde tek kart stili burada.
@Composable
fun StruvaCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    content: @Composable () -> Unit,
) {
    Column(
        modifier = modifier
            .clip(CardShape)
            .background(StruvaColors.Surface)
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .border(1.dp, StruvaColors.Border, CardShape)
            .padding(16.dp),
        content = { content() },
    )
}
