package com.struva.map.ui.common

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.struva.map.ui.theme.IBMPlexMono
import com.struva.map.ui.theme.StruvaColors

private val BoxShape = RoundedCornerShape(14.dp)

// "İkili Şerit" yön dili: uygulamanın sen=Accent / partner=Muted ayrımını
// her ikili karşılaştırmada aynı iki panelli / mirror-satır kalıbıyla
// tekrarlar (bkz. tasarım incelemesi, yön 3). Yeni renk yok — Accent,
// AccentSoft, Surface, Border, Muted zaten var olan tema token'ları.
@Composable
fun MirrorHeader(
    meValue: String,
    meLabel: String,
    themValue: String,
    themLabel: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(BoxShape)
            .border(1.dp, StruvaColors.Border, BoxShape),
    ) {
        MirrorHeaderSide(
            value = meValue,
            label = meLabel,
            background = StruvaColors.AccentSoft,
            valueColor = StruvaColors.Accent,
            modifier = Modifier.weight(1f),
        )
        Box(Modifier.width(1.dp).fillMaxHeight().background(StruvaColors.Border))
        MirrorHeaderSide(
            value = themValue,
            label = themLabel,
            background = StruvaColors.Surface,
            valueColor = StruvaColors.Muted,
            modifier = Modifier.weight(1f),
        )
    }
}

@Composable
private fun MirrorHeaderSide(value: String, label: String, background: Color, valueColor: Color, modifier: Modifier) {
    Column(modifier.background(background).padding(14.dp)) {
        Text(
            label,
            style = MaterialTheme.typography.labelSmall,
            color = StruvaColors.Muted,
        )
        Text(
            value,
            style = MaterialTheme.typography.titleLarge.copy(fontFamily = IBMPlexMono),
            color = valueColor,
        )
    }
}

// Tek satırda ikili karşılaştırma: senin değerin sağdan ortaya, partnerin
// değeri soldan ortaya yaklaşır; ortadaki etiket günü/kategoriyi taşır.
@Composable
fun MirrorRow(meValue: String, center: String, themValue: String, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            meValue,
            modifier = Modifier.weight(1f),
            style = MaterialTheme.typography.labelMedium.copy(fontFamily = IBMPlexMono),
            color = StruvaColors.Accent,
            textAlign = TextAlign.End,
        )
        Text(
            center,
            modifier = Modifier.width(84.dp).padding(horizontal = 8.dp),
            style = MaterialTheme.typography.labelSmall,
            color = StruvaColors.Muted,
            textAlign = TextAlign.Center,
        )
        Text(
            themValue,
            modifier = Modifier.weight(1f),
            style = MaterialTheme.typography.labelMedium.copy(fontFamily = IBMPlexMono),
            color = StruvaColors.Muted,
            textAlign = TextAlign.Start,
        )
    }
}
