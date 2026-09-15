package com.struva.map.ui.common

import androidx.compose.foundation.layout.Row
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.TextStyle
import com.struva.map.ui.theme.StruvaColors

// Web'de logo görsel değil, iki renkli düz metin (Header.tsx/Footer.tsx):
// "Struva" ana metin rengi + "Map" accent rengi. Aynı yaklaşım burada da.
@Composable
fun StruvaLogo(
    modifier: Modifier = Modifier,
    style: TextStyle = MaterialTheme.typography.titleMedium,
) {
    Row(modifier = modifier) {
        Text("Struva", style = style, color = StruvaColors.Text)
        Text("Map", style = style, color = StruvaColors.Accent)
    }
}
