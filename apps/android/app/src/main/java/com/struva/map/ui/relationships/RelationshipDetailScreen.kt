package com.struva.map.ui.relationships

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
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.network.dto.RelationshipDetailDto
import com.struva.map.network.dto.RelationshipResultPointDto
import com.struva.map.ui.common.BackIconButton
import com.struva.map.ui.common.ConversationCard
import com.struva.map.ui.common.ScoreDonut
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.common.StruvaCard
import com.struva.map.ui.common.TrendChart
import com.struva.map.ui.theme.EyebrowStyle
import com.struva.map.ui.theme.IBMPlexMono
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

private val TR = Locale("tr")
private val DateFormatter = DateTimeFormatter.ofPattern("d MMMM yyyy", TR)

// Bir ilişkinin zaman içindeki seyri: skor grafiği, endeks değişimleri,
// "ne değişti", kalıcı/yeni/toparlanan alanlar ve tüm sonuçlar. Hesaplar
// sunucuda (packages/shared summarizeRelationshipHistory), burada yalnız gösterim.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RelationshipDetailScreen(
    onBack: () -> Unit,
    onOpenResult: (String) -> Unit,
    onRetake: (testId: String, relationshipId: String) -> Unit,
    viewModel: RelationshipDetailViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    var menuOpen by remember { mutableStateOf(false) }
    var renaming by remember { mutableStateOf(false) }
    var deleting by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { viewModel.load() }
    LaunchedEffect(state) { if (state is RelationshipDetailUiState.Deleted) onBack() }

    val loaded = state as? RelationshipDetailUiState.Loaded
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(loaded?.detail?.label ?: "İlişki") },
                navigationIcon = { BackIconButton(onClick = onBack) },
                actions = {
                    if (loaded != null) {
                        Box {
                            TextButton(onClick = { menuOpen = true }) { Text("Düzenle") }
                            DropdownMenu(expanded = menuOpen, onDismissRequest = { menuOpen = false }) {
                                DropdownMenuItem(
                                    text = { Text("Adını değiştir") },
                                    onClick = {
                                        menuOpen = false
                                        renaming = true
                                    },
                                )
                                DropdownMenuItem(
                                    text = { Text("Sil", color = StruvaColors.Bad) },
                                    onClick = {
                                        menuOpen = false
                                        deleting = true
                                    },
                                )
                            }
                        }
                    }
                },
                colors = struvaTopAppBarColors(),
            )
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
            when (val s = state) {
                is RelationshipDetailUiState.Loading, RelationshipDetailUiState.Deleted -> CircularProgressIndicator()
                is RelationshipDetailUiState.Error -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(s.message)
                    Spacer(Modifier.height(12.dp))
                    StruvaButton(onClick = viewModel::load) { Text("Tekrar dene") }
                }
                is RelationshipDetailUiState.Loaded -> DetailContent(
                    detail = s.detail,
                    prompts = s.prompts,
                    actionError = s.actionError,
                    onOpenResult = onOpenResult,
                    onRetake = { onRetake(s.detail.testId, s.detail.id) },
                )
            }
        }
    }

    if (renaming && loaded != null) {
        var label by remember { mutableStateOf(loaded.detail.label) }
        AlertDialog(
            onDismissRequest = { renaming = false },
            title = { Text("İlişkinin adı") },
            text = {
                OutlinedTextField(
                    value = label,
                    onValueChange = { label = it.take(40) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        renaming = false
                        viewModel.rename(label)
                    },
                    enabled = label.isNotBlank(),
                ) { Text("Kaydet") }
            },
            dismissButton = { TextButton(onClick = { renaming = false }) { Text("Vazgeç") } },
        )
    }
    if (deleting && loaded != null) {
        AlertDialog(
            onDismissRequest = { deleting = false },
            title = { Text("\"${loaded.detail.label}\" silinsin mi?") },
            text = { Text("Bağlı sonuçlar silinmez; yalnızca bu ilişkiden ayrılır ve Harita'dan kalkar.") },
            confirmButton = {
                TextButton(onClick = {
                    deleting = false
                    viewModel.delete()
                }) { Text("Sil", color = StruvaColors.Bad) }
            },
            dismissButton = { TextButton(onClick = { deleting = false }) { Text("Vazgeç") } },
        )
    }
}

@Composable
private fun DetailContent(
    detail: RelationshipDetailDto,
    prompts: Map<String, List<String>>,
    actionError: String?,
    onOpenResult: (String) -> Unit,
    onRetake: () -> Unit,
) {
    val summary = detail.summary
    val latest = detail.results.lastOrNull()
    val dimName = { dim: String -> detail.dimensionNames[dim] ?: dim }

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        item {
            Text(detail.testName.uppercase(TR), style = EyebrowStyle)
            Spacer(Modifier.height(12.dp))
            actionError?.let {
                Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
                Spacer(Modifier.height(8.dp))
            }
            if (latest == null) {
                Text(
                    "Bu ilişkiye henüz bağlı sonuç yok. Testi bu ilişki için çözdüğünde sonuç otomatik olarak buraya bağlanır.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = StruvaColors.Muted,
                )
            } else {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    ScoreDonut(latest.rsi, size = 96.dp, strokeWidth = 8.dp)
                    Spacer(Modifier.width(16.dp))
                    Column {
                        Text("Güncel skor", style = MaterialTheme.typography.labelMedium, color = StruvaColors.Muted)
                        Text(
                            "${detail.results.size} ölçüm · son: ${formatDate(latest.createdAt)}",
                            style = MaterialTheme.typography.bodyMedium,
                        )
                        summary.rsiDelta?.let { delta ->
                            Text(
                                "İlk ölçümden bu yana ${signed(delta)}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = deltaColor(delta),
                            )
                        }
                    }
                }
            }
            Spacer(Modifier.height(16.dp))
            StruvaButton(onClick = onRetake, modifier = Modifier.fillMaxWidth()) {
                Text(if (latest == null) "Bu ilişki için testi çöz" else "Yeniden çöz")
            }
            Spacer(Modifier.height(24.dp))
        }

        if (detail.results.size >= 2) {
            item {
                Section("Zaman İçinde")
                StruvaCard(modifier = Modifier.fillMaxWidth()) {
                    TrendChart(detail.results.map { it.rsi })
                }
                Spacer(Modifier.height(12.dp))
                IndexChanges(detail.results.first(), detail.results.last(), detail.indexNames)
                Spacer(Modifier.height(24.dp))
            }
        }

        if (summary.changes.isNotEmpty()) {
            item {
                Section("Son Ölçümde Ne Değişti?")
                StruvaCard(modifier = Modifier.fillMaxWidth()) {
                    summary.changes.forEachIndexed { i, change ->
                        if (i > 0) Spacer(Modifier.height(10.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(dimName(change.dim), modifier = Modifier.weight(1f), style = MaterialTheme.typography.titleSmall)
                            Text(
                                "${change.from} → ${change.to}  ${signed(change.delta)}",
                                style = MaterialTheme.typography.labelMedium.copy(fontFamily = IBMPlexMono),
                                color = deltaColor(change.delta),
                            )
                        }
                    }
                }
                Spacer(Modifier.height(24.dp))
            }
        }

        val statusRows = listOf(
            Triple("Kalıcı gerilim", summary.persistentTensions, StruvaColors.Bad),
            Triple("Yeni gerilim", summary.newTensions, StruvaColors.Warn),
            Triple("Toparlanan", summary.recovered, StruvaColors.Good),
            Triple("Kalıcı güçlü alan", summary.persistentStrengths, StruvaColors.Good),
        ).filter { it.second.isNotEmpty() }
        if (statusRows.isNotEmpty()) {
            item {
                Section("Alanların Durumu")
                StruvaCard(modifier = Modifier.fillMaxWidth()) {
                    statusRows.forEachIndexed { i, (label, dims, color) ->
                        if (i > 0) Spacer(Modifier.height(10.dp))
                        Text(label.uppercase(TR), style = EyebrowStyle.copy(color = color))
                        Text(dims.joinToString(", ") { dimName(it) }, style = MaterialTheme.typography.bodyMedium)
                    }
                }
                Spacer(Modifier.height(24.dp))
            }
        }

        // Konuşma kartları: önce kalıcı, sonra yeni gerilimler.
        val talkDims = (summary.persistentTensions + summary.newTensions).distinct()
            .filter { !prompts[it].isNullOrEmpty() }
            .take(2)
        if (talkDims.isNotEmpty()) {
            item { Section("Konuşmaya Değer") }
            items(talkDims) { dim -> ConversationCard(dimensionName = dimName(dim), prompts = prompts[dim].orEmpty()) }
            item { Spacer(Modifier.height(24.dp)) }
        }

        if (detail.results.isNotEmpty()) {
            item { Section("Sonuçlar") }
            items(detail.results.reversed(), key = { it.resultId }) { point ->
                ResultRow(point, onClick = { onOpenResult(point.resultId) })
            }
        }
        item {
            Spacer(Modifier.height(20.dp))
            Text(
                "TEŞHİS DEĞİL · Değişimler, aynı testin farklı zamanlardaki cevaplarından hesaplanır; " +
                    "ilişki hakkında bir yargı değil, konuşmaya başlangıç noktasıdır.",
                style = MaterialTheme.typography.bodySmall,
            )
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun Section(title: String) {
    Text(title, style = MaterialTheme.typography.titleLarge)
    Spacer(Modifier.height(10.dp))
}

// Endeks bazında ilk → son ölçüm (ör. Güç / Emek / Özerklik).
@Composable
private fun IndexChanges(
    first: RelationshipResultPointDto,
    last: RelationshipResultPointDto,
    indexNames: Map<String, String>,
) {
    if (last.indices.isEmpty()) return
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        last.indices.forEach { (index, to) ->
            val from = first.indices[index]
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("$to", style = MaterialTheme.typography.titleMedium.copy(fontFamily = IBMPlexMono))
                if (from != null) {
                    Text(signed(to - from), style = MaterialTheme.typography.labelSmall, color = deltaColor(to - from))
                }
                Text(indexNames[index] ?: index, style = MaterialTheme.typography.labelSmall, color = StruvaColors.Muted)
            }
        }
    }
}

@Composable
private fun ResultRow(point: RelationshipResultPointDto, onClick: () -> Unit) {
    StruvaCard(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp), onClick = onClick) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(formatDate(point.createdAt), modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
            Text("${point.rsi}", style = MaterialTheme.typography.titleMedium.copy(fontFamily = IBMPlexMono))
        }
    }
}

private fun signed(value: Int): String = if (value > 0) "+$value" else "$value"

private fun deltaColor(delta: Int): Color = when {
    delta > 0 -> StruvaColors.Good
    delta < 0 -> StruvaColors.Bad
    else -> StruvaColors.Muted
}

private fun formatDate(iso: String): String = try {
    OffsetDateTime.parse(iso).format(DateFormatter)
} catch (e: Exception) {
    iso
}
