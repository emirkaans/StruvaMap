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
import com.struva.map.network.dto.RelationshipComparisonDto
import com.struva.map.network.dto.RelationshipDetailDto
import com.struva.map.network.dto.RelationshipNoteDto
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

// apps/api relationship.dto.ts NOTE_MAX_LENGTH ile aynı.
private const val NOTE_MAX_LENGTH = 500

// Kıyaslama ekranı ve packages/shared PERCEPTION_GAP_THRESHOLD ile aynı.
private const val PERCEPTION_GAP_THRESHOLD = 20

// Bir ilişkinin zaman içindeki seyri: skor grafiği, endeks değişimleri,
// "ne değişti", kalıcı/yeni/toparlanan alanlar ve tüm sonuçlar. Hesaplar
// sunucuda (packages/shared summarizeRelationshipHistory), burada yalnız gösterim.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RelationshipDetailScreen(
    onBack: () -> Unit,
    onOpenResult: (String) -> Unit,
    onRetake: (testId: String, relationshipId: String) -> Unit,
    onOpenPulseHistory: () -> Unit,
    onOpenLabour: () -> Unit,
    onOpenComparison: (String) -> Unit,
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
                                if (loaded.detail.pulse != null) {
                                    DropdownMenuItem(
                                        text = { Text("Nabız bağını kaldır") },
                                        onClick = {
                                            menuOpen = false
                                            viewModel.linkPulse(null)
                                        },
                                    )
                                }
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
                    onLinkPulse = viewModel::linkPulse,
                    onOpenPulseHistory = onOpenPulseHistory,
                    onOpenLabour = onOpenLabour,
                    onOpenComparison = onOpenComparison,
                    onAddNote = viewModel::addNote,
                    onDeleteNote = viewModel::deleteNote,
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
    onLinkPulse: (String) -> Unit,
    onOpenPulseHistory: () -> Unit,
    onOpenLabour: () -> Unit,
    onOpenComparison: (String) -> Unit,
    onAddNote: (String) -> Unit,
    onDeleteNote: (String) -> Unit,
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
            // Yeniden çözmeden önce: son ölçümden beri yazılan notlar hatırlatılır.
            val notesSince = latest?.let { l -> detail.notes.count { isAfter(it.createdAt, l.createdAt) } } ?: 0
            if (notesSince > 0) {
                Spacer(Modifier.height(8.dp))
                Text(
                    "Son ölçümden beri $notesSince not yazdın; yeniden çözmeden önce aşağıdan göz atabilirsin.",
                    style = MaterialTheme.typography.bodySmall,
                    color = StruvaColors.Muted,
                )
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

        if (detail.pulse != null || detail.linkablePairId != null) {
            item {
                Section("Günlük Nabız ve Emek")
                PulseSection(detail, onLinkPulse, onOpenPulseHistory, onOpenLabour)
                Spacer(Modifier.height(24.dp))
            }
        }

        if (detail.comparisons.isNotEmpty()) {
            item {
                Section("Karşı Tarafın Gözünden")
                ComparisonTrend(detail.comparisons)
            }
            items(detail.comparisons.reversed(), key = { it.comparisonId }) { comparison ->
                ComparisonRow(comparison, onClick = { onOpenComparison(comparison.comparisonId) })
            }
            item { Spacer(Modifier.height(24.dp)) }
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

        item {
            Section("Notlar")
            NotesSection(
                notes = detail.notes,
                lastMeasuredAt = latest?.createdAt,
                onAdd = onAddNote,
                onDelete = onDeleteNote,
            )
            Spacer(Modifier.height(24.dp))
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

// Testteki algının yanına gündelik kayıt: bağlı nabız eşleşmesinin son 7
// günü ve emek defteri payı, testteki Emek endeksiyle yan yana.
@Composable
private fun PulseSection(
    detail: RelationshipDetailDto,
    onLinkPulse: (String) -> Unit,
    onOpenPulseHistory: () -> Unit,
    onOpenLabour: () -> Unit,
) {
    val pulse = detail.pulse
    StruvaCard(modifier = Modifier.fillMaxWidth()) {
        if (pulse == null) {
            Text(
                "Bu ilişki için partnerinle bir nabız eşleşmen var. Bağlarsan günlük nabız ve emek defteri " +
                    "özetleri test sonuçlarının yanında burada görünür.",
                style = MaterialTheme.typography.bodyMedium,
            )
            Spacer(Modifier.height(10.dp))
            detail.linkablePairId?.let { pairId ->
                StruvaButton(onClick = { onLinkPulse(pairId) }, modifier = Modifier.fillMaxWidth()) {
                    Text("Nabzı bu ilişkiye bağla")
                }
            }
        } else {
            val week = pulse.week
            Text("SON 7 GÜN", style = EyebrowStyle)
            Spacer(Modifier.height(8.dp))
            if (week.answeredDays == 0 && week.bothAnsweredDays == 0) {
                Text("Bu hafta nabız cevabı yok.", style = MaterialTheme.typography.bodyMedium, color = StruvaColors.Muted)
            } else {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    MiniStat("Senin ort.", week.myAverage?.let { String.format(TR, "%.1f", it) } ?: "–")
                    MiniStat("Partnerin ort.", week.partnerAverage?.let { String.format(TR, "%.1f", it) } ?: "–")
                    MiniStat("Birlikte", "${week.bothAnsweredDays}/7")
                }
                if (week.gapDays > 0) {
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "${week.gapDays} gün cevaplarınız arasında belirgin fark vardı.",
                        style = MaterialTheme.typography.bodySmall,
                        color = StruvaColors.Muted,
                    )
                }
            }
            val labourShare = detail.labour?.myShare
            val labourIndex = detail.results.lastOrNull()?.indices?.get("labour")
            if (labourShare != null || labourIndex != null) {
                Spacer(Modifier.height(12.dp))
                Text("EMEK: ALGI VE KAYIT", style = EyebrowStyle)
                Spacer(Modifier.height(4.dp))
                labourIndex?.let {
                    Text(
                        "Testteki ${detail.indexNames["labour"] ?: "Emek"} endeksi: $it",
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
                Text(
                    labourShare?.let { "Emek defterinde son 7 gün senin payın: %$it" }
                        ?: "Emek defterinde bu hafta kayıt yok.",
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
            Row {
                TextButton(onClick = onOpenPulseHistory) { Text("Nabız geçmişi →") }
                TextButton(onClick = onOpenLabour) { Text("Emek defteri →") }
            }
        }
    }
}

// İlk ve son kıyaslama arasında algı farkı ve tahmin isabetinin yönü.
@Composable
private fun ComparisonTrend(comparisons: List<RelationshipComparisonDto>) {
    val first = comparisons.first()
    val last = comparisons.last()
    val lines = buildList {
        if (comparisons.size >= 2) {
            val direction = when {
                last.gap < first.gap -> "aranızdaki algı farkı kapanıyor"
                last.gap > first.gap -> "aranızdaki algı farkı açılıyor"
                else -> "algı farkı aynı kalmış"
            }
            add("Algı farkı ${first.gap} → ${last.gap}: $direction.")
        } else {
            add("Tek kıyaslama var: aranızda ${last.gap} puan algı farkı.")
        }
        val accuracies = comparisons.mapNotNull { it.predictionAccuracy }
        if (accuracies.size >= 2) {
            add("Tahmin isabetin %${accuracies.first()} → %${accuracies.last()}.")
        }
    }
    lines.forEach {
        Text(it, style = MaterialTheme.typography.bodyMedium)
    }
    Spacer(Modifier.height(8.dp))
}

@Composable
private fun ComparisonRow(comparison: RelationshipComparisonDto, onClick: () -> Unit) {
    StruvaCard(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp), onClick = onClick) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(formatDate(comparison.createdAt), modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
            Text(
                "fark ${comparison.gap}",
                style = MaterialTheme.typography.labelMedium.copy(fontFamily = IBMPlexMono),
                color = if (comparison.gap >= PERCEPTION_GAP_THRESHOLD) StruvaColors.Bad else StruvaColors.Muted,
            )
        }
        Text(
            "Sen ${comparison.myRsi} · Karşı taraf ${comparison.otherRsi}" +
                (comparison.predictionAccuracy?.let { " · tahmin isabeti %$it" } ?: ""),
            style = MaterialTheme.typography.bodySmall,
            color = StruvaColors.Muted,
        )
    }
}

@Composable
private fun NotesSection(
    notes: List<RelationshipNoteDto>,
    lastMeasuredAt: String?,
    onAdd: (String) -> Unit,
    onDelete: (String) -> Unit,
) {
    var draft by remember { mutableStateOf("") }
    Text(
        "Yalnızca sen görürsün. Aklında kalmasını istediğin anları, konuşmaları yaz; yeniden çözerken hatırlatırız.",
        style = MaterialTheme.typography.bodySmall,
        color = StruvaColors.Muted,
    )
    Spacer(Modifier.height(8.dp))
    OutlinedTextField(
        value = draft,
        onValueChange = { draft = it.take(NOTE_MAX_LENGTH) },
        placeholder = { Text("Bugün ne oldu?") },
        modifier = Modifier.fillMaxWidth(),
        minLines = 2,
    )
    Spacer(Modifier.height(8.dp))
    StruvaButton(
        onClick = {
            onAdd(draft)
            draft = ""
        },
        enabled = draft.isNotBlank(),
        modifier = Modifier.fillMaxWidth(),
    ) { Text("Notu kaydet") }
    notes.forEach { note ->
        Spacer(Modifier.height(10.dp))
        StruvaCard(modifier = Modifier.fillMaxWidth()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    formatDate(note.createdAt),
                    modifier = Modifier.weight(1f),
                    style = MaterialTheme.typography.labelSmall,
                    color = StruvaColors.Muted,
                )
                if (lastMeasuredAt != null && isAfter(note.createdAt, lastMeasuredAt)) {
                    Text("SON ÖLÇÜMDEN SONRA", style = EyebrowStyle.copy(fontSize = EyebrowStyle.fontSize * 0.8f))
                }
            }
            Spacer(Modifier.height(4.dp))
            Text(note.body, style = MaterialTheme.typography.bodyMedium)
            TextButton(onClick = { onDelete(note.id) }) { Text("Sil", color = StruvaColors.Muted) }
        }
    }
}

// ISO zaman damgalarını karşılaştırır; ayrıştırılamazsa false.
private fun isAfter(iso: String, otherIso: String): Boolean = try {
    OffsetDateTime.parse(iso).isAfter(OffsetDateTime.parse(otherIso))
} catch (e: Exception) {
    false
}

@Composable
private fun MiniStat(label: String, value: String) {
    Column {
        Text(value, style = MaterialTheme.typography.titleMedium.copy(fontFamily = IBMPlexMono))
        Text(label, style = MaterialTheme.typography.labelSmall, color = StruvaColors.Muted)
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
