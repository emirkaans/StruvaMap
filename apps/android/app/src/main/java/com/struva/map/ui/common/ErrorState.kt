package com.struva.map.ui.common

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.struva.map.BuildConfig
import com.struva.map.network.ErrorReporting
import com.struva.map.ui.theme.StruvaColors

// Bir ekranın içeriği yüklenemediğinde gösterilen ortak durum: ne olmadığını
// söyleyen kısa başlık, nedenini anlatan tek cümle ve "Tekrar dene".
@Composable
fun ErrorState(
    title: String,
    message: String,
    onRetry: (() -> Unit)?,
    modifier: Modifier = Modifier,
) {
    // İnternet yüzünden açılamayan ekran, bağlantı geri gelince kendiliğinden
    // yeniden denenir; kullanıcının "Tekrar dene"ye basması gerekmez.
    val online = LocalOnline.current
    var sawOffline by remember { mutableStateOf(!online) }
    LaunchedEffect(online) {
        if (!online) {
            sawOffline = true
        } else if (sawOffline && onRetry != null) {
            sawOffline = false
            onRetry()
        }
    }
    Column(
        modifier = modifier.fillMaxWidth().padding(horizontal = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(title, style = MaterialTheme.typography.titleMedium, textAlign = TextAlign.Center)
        Spacer(Modifier.height(8.dp))
        Text(
            message,
            style = MaterialTheme.typography.bodyMedium,
            color = StruvaColors.Muted,
            textAlign = TextAlign.Center,
        )
        if (onRetry != null) {
            Spacer(Modifier.height(20.dp))
            StruvaButton(onClick = onRetry) { Text("Tekrar dene") }
        }
        // Geliştirme sürümlerinde (debug, preview) test ederken sebebi görmek
        // için son hatanın teknik özeti; yayın sürümünde hiç görünmez.
        val detail = remember(message) { ErrorReporting.latestDetail }
        if (BuildConfig.DEBUG && detail != null) {
            Spacer(Modifier.height(24.dp))
            Text(
                detail,
                style = MaterialTheme.typography.labelSmall,
                color = StruvaColors.Muted.copy(alpha = 0.6f),
                textAlign = TextAlign.Center,
            )
        }
    }
}
