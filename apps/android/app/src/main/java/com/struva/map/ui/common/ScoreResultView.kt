package com.struva.map.ui.common

import android.content.Intent
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.network.dto.ScoreResultDto
import com.struva.map.ui.relationships.RelationshipAssignSection
import com.struva.map.ui.theme.EyebrowStyle
import com.struva.map.ui.theme.StruvaColors
import java.util.Locale

private const val WEB_BASE_URL = "https://struvamap.com"

// Yeni çözülen test sonucuyla ("Sonuç" ekranı) geçmişten açılan bir sonucun
// ("Geçmişim" ekranı) aynı görünümü paylaşması için ortak bileşen. Web'deki
// ResultPage.tsx'in mobil karşılığı — bölüm sırası ve içeriği kasıtlı olarak
// birebir aynı: hero (profil başlığı + RSI) → eylemler → endeksler →
// boyutlar (radar + barlar) → güçlü/gerilim → sosyolojik yorum →
// zamanla değişim → sorumluluk reddi.
@Composable
fun ScoreResultView(
    score: ScoreResultDto,
    resultId: String,
    onOpenComparison: (String) -> Unit,
    onDone: (() -> Unit)? = null,
    onOpenPrediction: ((String) -> Unit)? = null,
    detailViewModel: ScoreDetailViewModel = hiltViewModel(),
) {
    val detail by detailViewModel.state.collectAsState()
    val test = detail.test
    val context = LocalContext.current

    LaunchedEffect(score.testId) { detailViewModel.init(score.testId) }
    LaunchedEffect(resultId) { detailViewModel.trackResultView(resultId, score.testId) }

    val profile = test?.let { computeProfileLabel(it.indices.mapValues { e -> e.value.name }, score.indices) }
    val story = profile?.let { composeProfileStory(it, score.interpretation, score.strengths, score.tensions) }
    val interpByDim = score.interpretation.associateBy { it.dim }

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        item {
            Column(modifier = Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                if (test != null) {
                    Text(test.name.uppercase(Locale.forLanguageTag("tr")), style = EyebrowStyle)
                    Spacer(Modifier.height(10.dp))
                }
                if (profile != null) {
                    Text(
                        profile.title,
                        style = MaterialTheme.typography.headlineLarge,
                        textAlign = TextAlign.Center,
                    )
                    Spacer(Modifier.height(10.dp))
                }
                if (story != null) {
                    Text(
                        story,
                        style = MaterialTheme.typography.bodyMedium,
                        color = StruvaColors.Muted,
                        textAlign = TextAlign.Center,
                    )
                    Spacer(Modifier.height(20.dp))
                }
                ScoreDonut(score.rsi)
                Spacer(Modifier.height(12.dp))
                Text(
                    "Bu puan incelenen alanlardaki denge/uyum düzeyini gösterir; \"ilişki sağlığı yüzdesi\" değildir.",
                    style = MaterialTheme.typography.bodySmall,
                    color = StruvaColors.Muted,
                    textAlign = TextAlign.Center,
                )
            }
            Spacer(Modifier.height(24.dp))

            InviteAndCompareSection(resultId, score.testId, onOpenComparison, onOpenPrediction)
            Spacer(Modifier.height(8.dp))
            StruvaOutlinedButton(
                onClick = {
                    val url = "$WEB_BASE_URL/result/$resultId"
                    val sendIntent = Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(Intent.EXTRA_TEXT, url)
                    }
                    context.startActivity(Intent.createChooser(sendIntent, null))
                    detailViewModel.trackResultShared(score.testId)
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Sonucu paylaş") }
            if (onDone != null) {
                Spacer(Modifier.height(8.dp))
                StruvaOutlinedButton(onClick = onDone, modifier = Modifier.fillMaxWidth()) {
                    Text("Ana sayfaya dön")
                }
            }
            Spacer(Modifier.height(16.dp))
            RelationshipAssignSection(resultId = resultId, testId = score.testId)
            Spacer(Modifier.height(28.dp))

            if (test != null && score.indices.isNotEmpty()) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                    score.indices.forEach { (key, value) ->
                        val name = test.indices[key]?.name ?: key
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            ScoreDonut(value, size = 108.dp, strokeWidth = 9.dp)
                            Spacer(Modifier.height(8.dp))
                            Text(name, style = MaterialTheme.typography.bodyMedium, textAlign = TextAlign.Center)
                        }
                    }
                }
                Spacer(Modifier.height(32.dp))
            }

            Text("Boyutlar", style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.height(16.dp))
            StruvaCard(modifier = Modifier.fillMaxWidth()) {
                RadarChart(score.interpretation.map { it.name to it.score })
            }
            Spacer(Modifier.height(16.dp))
        }

        items(score.interpretation) { interp ->
            Column(modifier = Modifier.padding(vertical = 8.dp)) {
                DimensionBar(interp.name, interp.score)
                val satisfaction = score.satisfaction?.get(interp.dim)
                if (satisfaction != null) {
                    Spacer(Modifier.height(4.dp))
                    val imbalancedButSatisfied = interp.band == "düşük" && bandOf(satisfaction) == "yüksek"
                    Text(
                        "Memnuniyet: $satisfaction/100" +
                            if (imbalancedButSatisfied) {
                                " — dağılım dengesiz görünüyor, ama memnuniyet yüksek; bu rızaya dayalı bir tercih olabilir."
                            } else {
                                ""
                            },
                        style = MaterialTheme.typography.bodySmall,
                        color = StruvaColors.Muted,
                    )
                }
            }
        }

        item {
            Spacer(Modifier.height(20.dp))
            Row(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("En güçlü alanlar", style = MaterialTheme.typography.titleSmall)
                    Spacer(Modifier.height(8.dp))
                    if (score.strengths.isEmpty()) {
                        Text("Belirgin bir güçlü alan öne çıkmadı.", style = MaterialTheme.typography.bodySmall, color = StruvaColors.Muted)
                    } else {
                        score.strengths.forEach { dim ->
                            interpByDim[dim]?.let {
                                Text(
                                    "${it.name}  ${it.score}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = StruvaColors.Good,
                                )
                                Spacer(Modifier.height(4.dp))
                            }
                        }
                    }
                }
                Spacer(Modifier.width(16.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text("Yapısal gerilim alanları", style = MaterialTheme.typography.titleSmall)
                    Spacer(Modifier.height(8.dp))
                    if (score.tensions.isEmpty()) {
                        Text("Belirgin bir gerilim alanı öne çıkmadı.", style = MaterialTheme.typography.bodySmall, color = StruvaColors.Muted)
                    } else {
                        score.tensions.forEach { dim ->
                            interpByDim[dim]?.let {
                                Text(
                                    "${it.name}  ${it.score}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = StruvaColors.Bad,
                                )
                                Spacer(Modifier.height(4.dp))
                            }
                        }
                    }
                }
            }
            Spacer(Modifier.height(28.dp))

            // Gerilim alanlarını kendi kendine ya da karşı tarafla konuşmaya
            // çevirmek için — kıyaslama ekranındaki kartlarla aynı içerik.
            val tensionPrompts = score.tensions.filter { !detail.prompts[it].isNullOrEmpty() }.take(2)
            if (tensionPrompts.isNotEmpty()) {
                Text("Üzerine Düşünmek İçin", style = MaterialTheme.typography.titleLarge)
                Spacer(Modifier.height(6.dp))
                Text(
                    "Gerilim çıkan alanlar için birkaç soru; kendine sorabilir ya da karşı tarafla konuşabilirsin.",
                    style = MaterialTheme.typography.bodySmall,
                    color = StruvaColors.Muted,
                )
                Spacer(Modifier.height(8.dp))
                tensionPrompts.forEach { dim ->
                    ConversationCard(
                        dimensionName = interpByDim[dim]?.name ?: dim,
                        prompts = detail.prompts[dim].orEmpty(),
                    )
                }
                Spacer(Modifier.height(28.dp))
            }

            Text("Sosyolojik Yorum", style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.height(12.dp))
        }

        items(score.interpretation) { it2 ->
            Column(modifier = Modifier.padding(vertical = 10.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("${it2.name} — ${it2.score}", style = MaterialTheme.typography.titleSmall)
                    if (it2.band == "yüksek") {
                        Spacer(Modifier.width(8.dp))
                        InterpretationTag("güçlü", StruvaColors.Good)
                    } else if (it2.band == "düşük") {
                        Spacer(Modifier.width(8.dp))
                        InterpretationTag("gerilim", StruvaColors.Bad)
                    }
                }
                Spacer(Modifier.height(4.dp))
                Text(it2.text, style = MaterialTheme.typography.bodySmall, color = StruvaColors.Muted)
                Spacer(Modifier.height(10.dp))
                HorizontalDivider(color = StruvaColors.Border)
            }
        }

        item {
            Spacer(Modifier.height(20.dp))
            Text("Zamanla Değişim", style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.height(16.dp))
            StruvaCard(modifier = Modifier.fillMaxWidth()) {
                if (detail.rsiHistory.size >= 2) {
                    TrendChart(detail.rsiHistory)
                } else {
                    Text(
                        "Trend için bu testi tekrar çözün.",
                        style = MaterialTheme.typography.bodySmall,
                        color = StruvaColors.Muted,
                    )
                }
            }
            Spacer(Modifier.height(28.dp))

            Column(modifier = Modifier.fillMaxWidth()) {
                Text("TEŞHİS DEĞİL", style = EyebrowStyle)
                Spacer(Modifier.height(10.dp))
                Text(
                    "Bu analiz tanımlayıcıdır. \"Toksik\", \"sağlıksız\" gibi etiketler kullanmaz; " +
                        "yalnızca yapısal denge, asimetri ve sınırları tanımlar.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = StruvaColors.Muted,
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    "Eşik değerleri (55/75) ve eşit ağırlıklandırma (boyut→endeks, endeks→RSI) ampirik " +
                        "araştırmaya değil tasarım kararına dayanır; bu klinik ya da tanısal bir araç değildir.",
                    style = MaterialTheme.typography.bodySmall,
                    color = StruvaColors.Muted,
                )
                test?.disclaimerNote?.let {
                    Spacer(Modifier.height(8.dp))
                    Text(it, style = MaterialTheme.typography.bodySmall, color = StruvaColors.Muted)
                }
            }
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun InterpretationTag(text: String, color: androidx.compose.ui.graphics.Color) {
    Text(
        text,
        style = MaterialTheme.typography.labelSmall,
        color = color,
    )
}
