package com.struva.map.ui.common

import android.content.Intent
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.ui.theme.StruvaColors

private const val WEB_BASE_URL = "https://struvamap.com"

// Web'deki ResultPage.tsx davet/kıyaslama akışının mobil karşılığı: davet
// linki paylaş, karşı taraf tamamlayana kadar arka planda yokla (poll),
// kıyaslama oluşunca göster. Hem yeni çözülen testin sonuç ekranında hem de
// geçmişten açılan bir sonuçta aynı şekilde kullanılıyor.
@Composable
fun InviteAndCompareSection(
    resultId: String,
    testId: String,
    onOpenComparison: (String) -> Unit,
    // Verilirse davet sonrası bekleme durumunda "Beklerken tahmin et" çıkar
    // (bkz. PredictionScreen).
    onOpenPrediction: ((String) -> Unit)? = null,
    viewModel: InviteViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(resultId) { viewModel.init(resultId) }

    Column {
        when {
            state.comparisonId != null -> {
                Text("Kıyaslama hazır", style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.height(8.dp))
                StruvaButton(
                    onClick = { onOpenComparison(state.comparisonId!!) },
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("Kıyaslamayı gör") }
            }
            state.invited -> {
                Text(
                    "Davet gönderildi. Karşı taraf testi tamamladığında kıyaslama burada görünecek.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = StruvaColors.Muted,
                )
                if (onOpenPrediction != null) {
                    Spacer(Modifier.height(8.dp))
                    StruvaOutlinedButton(
                        onClick = { onOpenPrediction(resultId) },
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text("Beklerken onun cevaplarını tahmin et") }
                }
            }
            else -> StruvaOutlinedButton(
                onClick = {
                    val url = "$WEB_BASE_URL/test/$testId?compareWith=$resultId"
                    val sendIntent = Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(Intent.EXTRA_TEXT, url)
                    }
                    context.startActivity(Intent.createChooser(sendIntent, null))
                    viewModel.invite(resultId, testId)
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Karşılaştırmak için davet et") }
        }
    }
}
