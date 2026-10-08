package com.struva.map.ui.common

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.struva.map.ui.theme.StruvaColors

// Uygulamanın kökünden (MainActivity) sağlanır; telefon internete bağlı mı.
val LocalOnline = compositionLocalOf { true }

// Sekme çubuğunun hemen üstünde ince şerit: internetsizken ekranlar telefonda
// kayıtlı içeriği gösterir, bu şerit gördüğünün güncel olmayabileceğini söyler.
@Composable
fun OfflineBanner(modifier: Modifier = Modifier) {
    Text(
        "Çevrimdışısın. Bazı içerikler güncel olmayabilir.",
        style = MaterialTheme.typography.labelMedium,
        color = StruvaColors.Text,
        textAlign = TextAlign.Center,
        modifier = modifier
            .fillMaxWidth()
            .background(StruvaColors.Surface)
            .padding(horizontal = 16.dp, vertical = 8.dp),
    )
}
