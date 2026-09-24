package com.struva.map.ui.labour

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.network.dto.LabourCategoryCountDto
import com.struva.map.ui.common.BackIconButton
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.common.StruvaCard
import com.struva.map.ui.theme.EyebrowStyle
import com.struva.map.ui.theme.IBMPlexMono
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors

private val ChipShape = RoundedCornerShape(20.dp)

// Emek defteri (bkz. packages/shared/src/labour.ts): günlük işleri tek
// dokunuşla kaydet, hafta sonunda kimin neyi üstlendiğini gör. Test
// içindeki "Emek" endeksi bir algıdır; burası o algının yanına kayıt koyar.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LabourScreen(
    onBack: () -> Unit,
    onOpenPairing: () -> Unit,
    viewModel: LabourViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Emek defteri") },
                navigationIcon = { BackIconButton(onClick = onBack) },
                colors = struvaTopAppBarColors(),
            )
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
            when (val s = state) {
                is LabourUiState.Loading -> CircularProgressIndicator()
                is LabourUiState.Error -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(s.message)
                    Spacer(Modifier.height(12.dp))
                    StruvaButton(onClick = viewModel::load) { Text("Tekrar dene") }
                }
                is LabourUiState.NoPair -> Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(
                        "Emek defteri, partnerinle eşleştiğinde açılır: ikiniz de günlük işleri kaydedersiniz.",
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                    )
                    Spacer(Modifier.height(12.dp))
                    StruvaButton(onClick = onOpenPairing) { Text("Partner eşleştir") }
                }
                is LabourUiState.Loaded -> LabourContent(
                    state = s,
                    onLog = viewModel::log,
                    onUndo = viewModel::undoLast,
                )
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun LabourContent(state: LabourUiState.Loaded, onLog: (String) -> Unit, onUndo: () -> Unit) {
    val partnerName = state.partnerName ?: "Partnerin"
    val labels = state.data.categories.associate { it.id to it.label }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        StruvaCard(modifier = Modifier.fillMaxWidth()) {
            Text("BUGÜN NE YAPTIN?", style = EyebrowStyle)
            Spacer(Modifier.height(4.dp))
            Text(
                "Yaptığın işe dokun; her dokunuş bir kayıt. Yanlış dokunduysan geri alabilirsin.",
                style = MaterialTheme.typography.bodySmall,
                color = StruvaColors.Muted,
            )
            Spacer(Modifier.height(12.dp))
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                state.data.categories.forEach { category ->
                    Text(
                        category.label,
                        modifier = Modifier
                            .clip(ChipShape)
                            .background(StruvaColors.AccentSoft)
                            .border(1.dp, StruvaColors.Accent, ChipShape)
                            .clickable(enabled = !state.busy) { onLog(category.id) }
                            .padding(horizontal = 14.dp, vertical = 8.dp),
                        style = MaterialTheme.typography.labelMedium,
                        color = StruvaColors.Accent,
                    )
                }
            }
            state.actionError?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
            }
            if (state.data.todayMine.isNotEmpty()) {
                Spacer(Modifier.height(12.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "Bugün: " + summarizeToday(state.data.todayMine.map { labels[it.category] ?: it.category }),
                        modifier = Modifier.weight(1f),
                        style = MaterialTheme.typography.bodySmall,
                    )
                    TextButton(onClick = onUndo, enabled = !state.busy) { Text("Geri al") }
                }
            }
        }

        Spacer(Modifier.height(12.dp))
        WeekCard(state.data.week.mine, state.data.week.partner, state.data.week.myShare, state.data.week.categories, partnerName)

        Spacer(Modifier.height(16.dp))
        Text(
            "Bu bir sayımdır: bir işin süresi ve ağırlığı diğerinden farklı olabilir. Amaç kimin daha çok yaptığını " +
                "kanıtlamak değil, görünmeyen işleri görünür kılıp konuşmak.",
            style = MaterialTheme.typography.bodySmall,
        )
    }
}

@Composable
private fun WeekCard(
    mine: Int,
    partner: Int,
    myShare: Int?,
    categories: List<LabourCategoryCountDto>,
    partnerName: String,
) {
    StruvaCard(modifier = Modifier.fillMaxWidth()) {
        Text("SON 7 GÜN", style = EyebrowStyle)
        Spacer(Modifier.height(8.dp))
        if (myShare == null) {
            Text(
                "Bu hafta henüz kayıt yok. İkiniz de birkaç gün kaydettikçe dağılım burada görünür.",
                style = MaterialTheme.typography.bodyMedium,
            )
        } else {
            WeekBreakdown(mine, partner, myShare, categories, partnerName)
        }
    }
}

@Composable
private fun WeekBreakdown(
    mine: Int,
    partner: Int,
    myShare: Int,
    categories: List<LabourCategoryCountDto>,
    partnerName: String,
) {
    Column {
        Text("Kayıtlarda senin payın: %$myShare", style = MaterialTheme.typography.titleMedium)
        Text(
            "Sen $mine · $partnerName $partner kayıt",
            style = MaterialTheme.typography.bodySmall,
            color = StruvaColors.Muted,
        )
        Spacer(Modifier.height(12.dp))
        ShareLegend(partnerName)
        categories.filter { it.mine + it.partner > 0 }.forEach { category ->
            Spacer(Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(category.label, modifier = Modifier.weight(1f), style = MaterialTheme.typography.labelMedium)
                Text(
                    "${category.mine} · ${category.partner}",
                    style = MaterialTheme.typography.labelMedium.copy(fontFamily = IBMPlexMono),
                    color = StruvaColors.Muted,
                )
            }
            Spacer(Modifier.height(4.dp))
            SplitBar(category.mine, category.partner)
        }
    }
}

// Tek çubukta iki taraf: sol sen (accent), sağ partner (soluk).
@Composable
private fun SplitBar(mine: Int, partner: Int) {
    val total = (mine + partner).coerceAtLeast(1)
    Row(
        Modifier
            .fillMaxWidth()
            .height(8.dp)
            .clip(RoundedCornerShape(99.dp))
            .background(StruvaColors.Border),
    ) {
        if (mine > 0) Box(Modifier.weight(mine.toFloat() / total).fillMaxHeight().background(StruvaColors.Accent))
        if (partner > 0) Box(Modifier.weight(partner.toFloat() / total).fillMaxHeight().background(StruvaColors.Muted))
    }
}

@Composable
private fun ShareLegend(partnerName: String) {
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        LegendDot(StruvaColors.Accent, "Sen")
        LegendDot(StruvaColors.Muted, partnerName)
    }
}

@Composable
private fun LegendDot(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.padding(end = 6.dp).clip(RoundedCornerShape(99.dp)).background(color).padding(4.dp))
        Text(label, style = MaterialTheme.typography.labelSmall, color = StruvaColors.Muted)
    }
}

// "Yemek ×2, Temizlik" — bugünkü kendi kayıtlarının kısa özeti.
private fun summarizeToday(labels: List<String>): String =
    labels.groupingBy { it }.eachCount().entries.joinToString(", ") { (label, count) ->
        if (count > 1) "$label ×$count" else label
    }
