package com.struva.map.ui.history

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.struva.map.ui.theme.IBMPlexMono
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.bandColorForScore

private val BarShape = RoundedCornerShape(99.dp)

// Geçmiş sekmesi ve test detayındaki "Geçmiş sonuçlarım" aynı satırı kullanır:
// tarih, sözlü özet, ilişki, genel skor ve testin üç endeksi.
@Composable
fun ArchiveRowItem(row: ArchiveRow, onClick: () -> Unit) {
    val description = "Genel skor ${row.score}, " + row.indices.joinToString(", ") { "${it.first} ${it.second}" }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 14.dp, horizontal = 2.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Column(Modifier.width(48.dp)) {
            Text(row.day, style = MaterialTheme.typography.titleSmall.copy(fontFamily = IBMPlexMono))
            Text(row.month, style = MaterialTheme.typography.labelSmall, color = StruvaColors.Muted)
        }
        Column(Modifier.weight(1f)) {
            Text(
                row.title,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                "${row.who} · ${row.typeLabel}",
                style = MaterialTheme.typography.bodySmall,
                color = StruvaColors.Muted,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        Column(
            modifier = Modifier.width(72.dp).semantics { contentDescription = description },
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(
                "${row.score}",
                style = MaterialTheme.typography.titleMedium.copy(fontFamily = IBMPlexMono, fontWeight = FontWeight.SemiBold),
                color = bandColorForScore(row.score),
            )
            row.indices.take(3).forEach { (_, value) -> IndexBar(value) }
        }
    }
}

@Composable
private fun IndexBar(value: Int) {
    Box(
        Modifier
            .fillMaxWidth()
            .height(5.dp)
            .clip(BarShape)
            .background(StruvaColors.Border),
    ) {
        Box(
            Modifier
                .fillMaxWidth(value.coerceIn(0, 100) / 100f)
                .fillMaxHeight()
                .clip(BarShape)
                .background(bandColorForScore(value)),
        )
    }
}
