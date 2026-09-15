package com.struva.map.ui.comparison

import android.content.Intent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.network.dto.ComparisonDto
import com.struva.map.network.dto.TestDetailDto
import com.struva.map.ui.common.DimensionBar
import com.struva.map.ui.common.ScoreDonut
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.common.StruvaCard
import com.struva.map.ui.common.StruvaOutlinedButton
import com.struva.map.ui.common.bandOf
import com.struva.map.ui.theme.EyebrowStyle
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors
import kotlin.math.abs
import kotlin.math.roundToInt

private const val WEB_BASE_URL = "https://struvamap.netlify.app"
private const val PERCEPTION_GAP_THRESHOLD = 20

// Web'deki ComparisonPage.tsx ile aynı yapı: eyebrow+"düello" halkaları+fark
// → eylemler → boyut bazında kıyaslama kartları (algı farkı etiketi +
// değerlendirme metni) → sorumluluk reddi.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComparisonScreen(
    onBack: () -> Unit,
    onHome: () -> Unit = onBack,
    viewModel: ComparisonViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Kıyaslama") },
                navigationIcon = { IconButton(onClick = onBack) { Text("←") } },
                colors = struvaTopAppBarColors(),
            )
        },
    ) { padding ->
        Box(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentAlignment = Alignment.Center,
        ) {
            when (val s = state) {
                is ComparisonUiState.Loading -> CircularProgressIndicator()
                is ComparisonUiState.Error -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Kıyaslama yüklenemedi: ${s.message}")
                    Spacer(Modifier.height(12.dp))
                    StruvaButton(onClick = viewModel::load) { Text("Tekrar dene") }
                }
                is ComparisonUiState.Loaded -> ComparisonView(s.comparison, s.test, onHome)
            }
        }
    }
}

@Composable
private fun ComparisonView(comparison: ComparisonDto, test: TestDetailDto, onHome: () -> Unit) {
    val context = LocalContext.current
    val a = comparison.a.score
    val b = comparison.b.score
    val rsiGap = abs(a.rsi - b.rsi)
    val gapColor = when {
        rsiGap >= PERCEPTION_GAP_THRESHOLD -> StruvaColors.Bad
        rsiGap >= PERCEPTION_GAP_THRESHOLD / 2 -> StruvaColors.Warn
        else -> StruvaColors.Good
    }

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        item {
            Column(modifier = Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                Text("KIYASLAMA", style = EyebrowStyle)
                Spacer(Modifier.height(4.dp))
                Text(test.name, style = MaterialTheme.typography.bodySmall, color = StruvaColors.Muted)
                Spacer(Modifier.height(20.dp))

                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceEvenly) {
                    DuelSide("Davet eden", a.rsi, Modifier.weight(1f))
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("FARK", style = EyebrowStyle)
                        Text(
                            rsiGap.toString(),
                            style = MaterialTheme.typography.headlineSmall,
                            color = gapColor,
                        )
                    }
                    DuelSide("Katılan", b.rsi, Modifier.weight(1f))
                }
                Spacer(Modifier.height(16.dp))
                Text(
                    if (rsiGap >= PERCEPTION_GAP_THRESHOLD) {
                        "İki taraf arasında $rsiGap puanlık belirgin bir genel algı farkı var."
                    } else {
                        "Genel skorlar birbirine yakın; büyük bir algı farkı görünmüyor."
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = StruvaColors.Muted,
                    textAlign = TextAlign.Center,
                )
            }
            Spacer(Modifier.height(24.dp))

            Row(modifier = Modifier.fillMaxWidth()) {
                StruvaOutlinedButton(onClick = onHome, modifier = Modifier.weight(1f)) {
                    Text("Anasayfaya dön")
                }
                Spacer(Modifier.width(8.dp))
                StruvaOutlinedButton(
                    onClick = {
                        val url = "$WEB_BASE_URL/comparisons/${comparison.id}"
                        val sendIntent = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_TEXT, url)
                        }
                        context.startActivity(Intent.createChooser(sendIntent, null))
                    },
                    modifier = Modifier.weight(1f),
                ) { Text("Bağlantıyı paylaş") }
            }
            Spacer(Modifier.height(28.dp))

            Text("Boyut Bazında Kıyaslama", style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.height(16.dp))
        }

        items(a.interpretation) { interp ->
            val dim = test.dimensions[interp.dim]
            val aScore = a.dimensions[interp.dim] ?: 0
            val bScore = b.dimensions[interp.dim] ?: 0
            val gap = abs(aScore - bScore)
            val hasGap = gap >= PERCEPTION_GAP_THRESHOLD
            val lowerIsA = aScore <= bScore
            val lowerLabel = if (lowerIsA) "Davet eden" else "Katılan"
            val lowerScore = if (lowerIsA) aScore else bScore
            val avgScore = ((aScore + bScore) / 2.0).roundToInt()
            val assessment = dim?.interpretation?.let { texts ->
                if (hasGap) {
                    "$lowerLabel bu alanı daha dengesiz algılıyor: ${texts[bandOf(lowerScore)] ?: ""}"
                } else {
                    "İki taraf bu alanı benzer algılıyor ($gap puan fark): ${texts[bandOf(avgScore)] ?: ""}"
                }
            }

            StruvaCard(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(interp.name, style = MaterialTheme.typography.titleSmall)
                    if (hasGap) {
                        Spacer(Modifier.width(8.dp))
                        Text("algı farkı $gap", style = MaterialTheme.typography.labelSmall, color = StruvaColors.Bad)
                    }
                }
                Spacer(Modifier.height(12.dp))
                DimensionBar("Davet eden", aScore)
                Spacer(Modifier.height(8.dp))
                DimensionBar("Katılan", bScore)
                if (assessment != null) {
                    Spacer(Modifier.height(10.dp))
                    Text(assessment, style = MaterialTheme.typography.bodySmall, color = StruvaColors.Muted)
                }
            }
        }

        item {
            Spacer(Modifier.height(24.dp))
            Text("TEŞHİS DEĞİL", style = EyebrowStyle)
            Spacer(Modifier.height(10.dp))
            Text(
                "Bu kıyaslama teşhis değildir; yalnızca iki tarafın aynı ilişkiyi ne kadar benzer ya da " +
                    "farklı algıladığını gösterir. Büyük farklar konuşmaya değer bir başlangıç noktasıdır.",
                style = MaterialTheme.typography.bodySmall,
                color = StruvaColors.Muted,
            )
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun DuelSide(label: String, rsi: Int, modifier: Modifier = Modifier) {
    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        ScoreDonut(rsi, size = 116.dp, strokeWidth = 10.dp)
        Spacer(Modifier.height(8.dp))
        Text(label, style = MaterialTheme.typography.bodyMedium)
    }
}
