package com.struva.map.ui.auth

import android.content.Context
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.unit.dp
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.common.StruvaLogo
import com.struva.map.ui.privacy.PRIVACY_URL
import com.struva.map.ui.theme.StruvaColors

private const val PREFS = "struva_prefs"
private const val KEY_AGE_CONFIRMED = "age_confirmed"

// İlk açılışta bir kez sorulur, onay cihazda saklanır. Oturumu zaten açık
// olan (güncellemeyle gelen) kullanıcılara sorulmaz; bkz. MainActivity.
fun isAgeConfirmed(context: Context): Boolean =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_AGE_CONFIRMED, false)

fun confirmAge(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(KEY_AGE_CONFIRMED, true).apply()
}

@Composable
fun AgeGateScreen(onConfirmed: () -> Unit) {
    val uriHandler = LocalUriHandler.current
    var checked by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .systemBarsPadding()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        StruvaLogo(style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(24.dp))
        Text("Başlamadan önce.", style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(12.dp))
        Text(
            "StruvaMap ilişkilerin görünmeyen yapısını haritalar ve 18 yaş ve üzerindeki kişiler içindir.",
            style = MaterialTheme.typography.bodyMedium,
            color = StruvaColors.Muted,
        )
        Spacer(Modifier.height(24.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { checked = !checked },
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Checkbox(
                checked = checked,
                onCheckedChange = { checked = it },
                colors = CheckboxDefaults.colors(checkedColor = StruvaColors.Accent),
            )
            Text("18 yaşında ya da daha büyüğüm.", style = MaterialTheme.typography.bodyMedium)
        }
        Spacer(Modifier.height(16.dp))
        StruvaButton(
            onClick = onConfirmed,
            enabled = checked,
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Devam et") }
        Spacer(Modifier.height(8.dp))
        TextButton(onClick = { uriHandler.openUri(PRIVACY_URL) }, modifier = Modifier.align(Alignment.CenterHorizontally)) {
            Text("Gizlilik metnini oku", color = StruvaColors.Accent)
        }
    }
}
