package com.struva.map.ui.prediction

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.ui.common.BackIconButton
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.common.StruvaCard
import com.struva.map.ui.common.bandOf
import com.struva.map.ui.theme.EyebrowStyle
import com.struva.map.ui.theme.IBMPlexMono
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors
import java.util.Locale
import kotlin.math.roundToInt

// 0-100 arası 5'er adım: 21 durak → Slider'da aradaki 19 adım.
private const val SLIDER_STEPS = 19

// Tahmin modu (bkz. packages/shared/src/prediction.ts): davet eden, karşı
// taraf testi bitirmeden önce onun her boyuttaki skorunu tahmin eder;
// kıyaslama ekranında isabet ve "farkı öngörmedin" gibi içgörüler çıkar.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PredictionScreen(
    onBack: () -> Unit,
    onOpenComparison: (String) -> Unit,
    viewModel: PredictionViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Tahmin et") },
                navigationIcon = { BackIconButton(onClick = onBack) },
                colors = struvaTopAppBarColors(),
            )
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
            when (val s = state) {
                is PredictionUiState.Loading -> CircularProgressIndicator()
                is PredictionUiState.Error -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(s.message)
                    Spacer(Modifier.height(12.dp))
                    StruvaButton(onClick = viewModel::load) { Text("Tekrar dene") }
                }
                is PredictionUiState.ComparisonReady -> Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(
                        "Karşı taraf testi bitirdi, kıyaslama hazır. Tahmin artık yapılamıyor.",
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                    )
                    Spacer(Modifier.height(12.dp))
                    StruvaButton(onClick = { onOpenComparison(s.comparisonId) }) { Text("Kıyaslamayı gör") }
                }
                is PredictionUiState.Editing -> PredictionForm(
                    state = s,
                    onValueChange = viewModel::setValue,
                    onSave = viewModel::save,
                    onDone = onBack,
                )
            }
        }
    }
}

@Composable
private fun PredictionForm(
    state: PredictionUiState.Editing,
    onValueChange: (String, Int) -> Unit,
    onSave: () -> Unit,
    onDone: () -> Unit,
) {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        item {
            Text(state.testName.uppercase(Locale.forLanguageTag("tr")), style = EyebrowStyle)
            Spacer(Modifier.height(6.dp))
            Text("Sence o nasıl cevapladı?", style = MaterialTheme.typography.headlineSmall)
            Spacer(Modifier.height(8.dp))
            Text(
                "Karşı taraf testi bitirmeden önce, her alanda nerede duracağını tahmin et. " +
                    "Kıyaslama çıkınca hem ne kadar farklı gördüğünüzü hem de bu farkı ne kadar " +
                    "öngördüğünü göreceksin. Tahminin isabeti kıyaslama sayfasında yer alır.",
                style = MaterialTheme.typography.bodyMedium,
                color = StruvaColors.Muted,
            )
            Spacer(Modifier.height(16.dp))
        }
        items(state.dimensions, key = { it.id }) { dim ->
            val value = state.values[dim.id] ?: 50
            StruvaCard(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(dim.name, modifier = Modifier.weight(1f), style = MaterialTheme.typography.titleSmall)
                    Text(
                        "$value · ${bandOf(value)}",
                        style = MaterialTheme.typography.labelMedium.copy(fontFamily = IBMPlexMono),
                        color = StruvaColors.Accent,
                    )
                }
                if (dim.short.isNotBlank()) {
                    Spacer(Modifier.height(2.dp))
                    Text(dim.short, style = MaterialTheme.typography.bodySmall, color = StruvaColors.Muted)
                }
                Slider(
                    value = value.toFloat(),
                    onValueChange = { onValueChange(dim.id, it.roundToInt()) },
                    valueRange = 0f..100f,
                    steps = SLIDER_STEPS,
                    colors = SliderDefaults.colors(
                        thumbColor = StruvaColors.Accent,
                        activeTrackColor = StruvaColors.Accent,
                        inactiveTrackColor = StruvaColors.Border,
                    ),
                )
                Text("Senin skorun: ${dim.ownScore}", style = MaterialTheme.typography.labelSmall, color = StruvaColors.Muted)
            }
        }
        item {
            Spacer(Modifier.height(16.dp))
            state.errorMessage?.let {
                Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                Spacer(Modifier.height(8.dp))
            }
            if (state.saved) {
                Text(
                    "Tahminin kaydedildi. Karşı taraf testi bitirince kıyaslamada ne kadar isabetli olduğunu göreceksin.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = StruvaColors.Good,
                )
                Spacer(Modifier.height(8.dp))
                StruvaButton(onClick = onDone, modifier = Modifier.fillMaxWidth()) { Text("Tamam") }
            } else {
                StruvaButton(onClick = onSave, enabled = !state.saving, modifier = Modifier.fillMaxWidth()) {
                    Text(
                        when {
                            state.saving -> "Kaydediliyor…"
                            state.hadPrediction -> "Tahmini güncelle"
                            else -> "Tahmini kaydet"
                        },
                    )
                }
            }
            Spacer(Modifier.height(16.dp))
        }
    }
}
