package com.struva.map.ui.common

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.struva.map.ui.theme.StruvaColors

// Profil ve Ayarlar'daki bağlantı satırları: görünüşte yalnızca metin, ama
// dokunma alanı satırın tamamı. Metnin dışına basmak da satırı açar.
@Composable
fun ListRow(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    color: Color = StruvaColors.Accent,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = 52.dp)
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(label, style = MaterialTheme.typography.bodyLarge, color = color)
    }
}
