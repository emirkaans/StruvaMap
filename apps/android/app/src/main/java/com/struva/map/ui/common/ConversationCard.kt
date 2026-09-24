package com.struva.map.ui.common

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.struva.map.ui.theme.EyebrowStyle
import com.struva.map.ui.theme.StruvaColors
import java.util.Locale

// Bir boyut için konuşma kartı: tek seferde bir soru, "Sonraki soru" ile
// döner (bkz. packages/shared/src/conversation-prompts.ts). Hem kıyaslama
// (algı farkı) hem tek kişilik sonuç (gerilim alanları) ekranında kullanılıyor.
@Composable
fun ConversationCard(dimensionName: String, prompts: List<String>, modifier: Modifier = Modifier) {
    if (prompts.isEmpty()) return
    var index by remember(prompts) { mutableIntStateOf(0) }

    StruvaCard(modifier = modifier.fillMaxWidth().padding(vertical = 6.dp)) {
        Text(dimensionName.uppercase(Locale.forLanguageTag("tr")), style = EyebrowStyle)
        Spacer(Modifier.height(8.dp))
        Text("“${prompts[index]}”", style = MaterialTheme.typography.titleSmall)
        Spacer(Modifier.height(4.dp))
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text(
                "${index + 1}/${prompts.size}",
                modifier = Modifier.weight(1f),
                style = MaterialTheme.typography.labelSmall,
                color = StruvaColors.Muted,
            )
            if (prompts.size > 1) {
                TextButton(onClick = { index = (index + 1) % prompts.size }, contentPadding = PaddingValues(0.dp)) {
                    Text("Sonraki soru →", style = MaterialTheme.typography.labelMedium, color = StruvaColors.Accent)
                }
            }
        }
    }
}
