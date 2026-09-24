package com.struva.map.ui.relationships

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.network.dto.RelationshipMapDto
import com.struva.map.network.dto.RelationshipMapNodeDto
import com.struva.map.network.dto.RelationshipPatternDto
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.common.StruvaCard
import com.struva.map.ui.theme.EyebrowStyle
import com.struva.map.ui.theme.IBMPlexMono
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.bandColorForScore
import com.struva.map.ui.theme.struvaTopAppBarColors
import kotlin.math.cos
import kotlin.math.sin

private val NodeSize = 56.dp
private val CenterSize = 64.dp
private val LabelWidth = 88.dp

// Düğüm sütunu = daire + 4dp boşluk + ~18dp etiket; sütun merkezlenince
// dairenin merkezi çizginin ucuna gelsin diye etiket payının yarısı kadar aşağı.
private val NodeLabelShift = 11.dp

// Haritada gösterilen en fazla düğüm — daha fazlası çemberde üst üste biner;
// hepsi yine de alttaki listede yer alır.
private const val MAX_MAP_NODES = 8

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MapScreen(
    onOpenResult: (String) -> Unit,
    onOpenHistory: () -> Unit,
    viewModel: MapViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    LaunchedEffect(Unit) { viewModel.load() }

    Scaffold(
        topBar = { TopAppBar(title = { Text("İlişki Haritası") }, colors = struvaTopAppBarColors()) },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
            when (val s = state) {
                is MapUiState.Loading -> CircularProgressIndicator()
                is MapUiState.Error -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(s.message)
                    Spacer(Modifier.height(12.dp))
                    StruvaButton(onClick = viewModel::load) { Text("Tekrar dene") }
                }
                is MapUiState.Loaded -> MapContent(
                    map = s.map,
                    actionError = s.actionError,
                    onOpenResult = onOpenResult,
                    onOpenHistory = onOpenHistory,
                    onRename = viewModel::rename,
                    onDelete = viewModel::delete,
                )
            }
        }
    }
}

@Composable
private fun MapContent(
    map: RelationshipMapDto,
    actionError: String?,
    onOpenResult: (String) -> Unit,
    onOpenHistory: () -> Unit,
    onRename: (String, String) -> Unit,
    onDelete: (String) -> Unit,
) {
    var renaming by remember { mutableStateOf<RelationshipMapNodeDto?>(null) }
    var deleting by remember { mutableStateOf<RelationshipMapNodeDto?>(null) }

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        if (map.relationships.isEmpty()) {
            item { EmptyMap(hasUnassigned = map.unassignedCount > 0, onOpenHistory = onOpenHistory) }
        } else {
            item {
                EgoMap(map.relationships.take(MAX_MAP_NODES), onNodeClick = { node ->
                    node.latest?.let { onOpenResult(it.resultId) }
                })
                Spacer(Modifier.height(20.dp))
            }
            item { PatternsSection(map) }
            item {
                Text("İlişkilerin", style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(top = 20.dp, bottom = 6.dp))
                actionError?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
                }
            }
            items(map.relationships, key = { it.id }) { node ->
                RelationshipRow(
                    node = node,
                    onOpen = { node.latest?.let { onOpenResult(it.resultId) } },
                    onRename = { renaming = node },
                    onDelete = { deleting = node },
                )
            }
            if (map.unassignedCount > 0) {
                item {
                    Spacer(Modifier.height(8.dp))
                    StruvaCard(modifier = Modifier.fillMaxWidth(), onClick = onOpenHistory) {
                        Text(
                            "${map.unassignedCount} sonuç henüz bir ilişkiye bağlı değil. Geçmiş'ten bir sonucu açıp " +
                                "\"İlişkiye bağla\" diyebilirsin.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = StruvaColors.Muted,
                        )
                    }
                }
            }
        }
        item {
            Spacer(Modifier.height(20.dp))
            Text(
                "TEŞHİS DEĞİL · Harita her ilişkinin en son sonucunu gösterir. Örüntüler bir eğilime işaret eder; " +
                    "kişiliğin ya da ilişkilerin hakkında bir yargı değildir.",
                style = MaterialTheme.typography.bodySmall,
            )
            Spacer(Modifier.height(16.dp))
        }
    }

    renaming?.let { node ->
        RenameDialog(
            initial = node.label,
            onDismiss = { renaming = null },
            onConfirm = { label ->
                renaming = null
                onRename(node.id, label)
            },
        )
    }
    deleting?.let { node ->
        AlertDialog(
            onDismissRequest = { deleting = null },
            title = { Text("\"${node.label}\" silinsin mi?") },
            text = { Text("Bağlı sonuçlar silinmez; yalnızca bu ilişkiden ayrılır ve Harita'dan kalkar.") },
            confirmButton = {
                TextButton(onClick = {
                    deleting = null
                    onDelete(node.id)
                }) { Text("Sil", color = StruvaColors.Bad) }
            },
            dismissButton = { TextButton(onClick = { deleting = null }) { Text("Vazgeç") } },
        )
    }
}

// Merkezde kullanıcı, çevresinde eşit aralıklı ilişkiler. Mesafe bilerek
// sabit: RSI "yakınlık" değil denge ölçüsü; skor düğüm rengi ve içindeki
// sayı ile veriliyor (bandColorForScore — sonuç ekranıyla aynı bantlar).
@Composable
private fun EgoMap(nodes: List<RelationshipMapNodeDto>, onNodeClick: (RelationshipMapNodeDto) -> Unit) {
    BoxWithConstraints(Modifier.fillMaxWidth().aspectRatio(1f)) {
        val side = maxWidth
        val radius = side / 2 - LabelWidth / 2 - 4.dp
        val angles = nodes.indices.map { i -> -Math.PI / 2 + 2 * Math.PI * i / nodes.size }

        Canvas(Modifier.fillMaxSize()) {
            val center = Offset(size.width / 2, size.height / 2)
            val r = radius.toPx()
            nodes.forEachIndexed { i, node ->
                val end = Offset(center.x + r * cos(angles[i]).toFloat(), center.y + r * sin(angles[i]).toFloat())
                val color = node.latest?.let { bandColorForScore(it.rsi) } ?: StruvaColors.Border
                drawLine(color = color.copy(alpha = 0.6f), start = center, end = end, strokeWidth = 2.dp.toPx())
            }
        }

        Box(
            modifier = Modifier
                .align(Alignment.Center)
                .size(CenterSize)
                .clip(CircleShape)
                .background(StruvaColors.AccentSoft)
                .border(2.dp, StruvaColors.Accent, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Text("Sen", style = MaterialTheme.typography.titleSmall, color = StruvaColors.Accent)
        }

        nodes.forEachIndexed { i, node ->
            val x = radius * cos(angles[i]).toFloat()
            val y = radius * sin(angles[i]).toFloat()
            Column(
                modifier = Modifier
                    .align(Alignment.Center)
                    .offset(x = x, y = y + NodeLabelShift)
                    .width(LabelWidth)
                    .clickable(enabled = node.latest != null) { onNodeClick(node) },
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                val score = node.latest?.rsi
                Box(
                    modifier = Modifier
                        .size(NodeSize)
                        .clip(CircleShape)
                        .background(StruvaColors.Surface)
                        .border(2.dp, score?.let(::bandColorForScore) ?: StruvaColors.Border, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        score?.toString() ?: "–",
                        style = MaterialTheme.typography.titleSmall.copy(fontFamily = IBMPlexMono),
                    )
                }
                Spacer(Modifier.height(4.dp))
                Text(
                    node.label,
                    style = MaterialTheme.typography.labelMedium,
                    textAlign = TextAlign.Center,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

@Composable
private fun PatternsSection(map: RelationshipMapDto) {
    Text("Örüntüler", style = MaterialTheme.typography.titleLarge)
    Spacer(Modifier.height(6.dp))
    if (map.patterns.isEmpty()) {
        val withResults = map.relationships.count { it.latest != null }
        Text(
            if (withResults < 2) {
                "Örüntüler, en az iki ilişkiye sonuç bağladığında görünür."
            } else {
                "İlişkilerin arasında tekrar eden belirgin bir güçlü ya da gerilimli alan görünmüyor."
            },
            style = MaterialTheme.typography.bodyMedium,
            color = StruvaColors.Muted,
        )
        return
    }
    map.patterns.forEach { PatternCard(it) }
}

@Composable
private fun PatternCard(pattern: RelationshipPatternDto) {
    val tension = pattern.kind == "tension"
    val names = joinTr(pattern.labels)
    StruvaCard(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
        Text(
            if (tension) "TEKRAR EDEN GERİLİM" else "TEKRAR EDEN GÜÇ",
            style = EyebrowStyle.copy(color = if (tension) StruvaColors.Bad else StruvaColors.Good),
        )
        Spacer(Modifier.height(6.dp))
        Text(
            "${pattern.labels.size}/${pattern.total} ilişkide ${pattern.indexName} " + if (tension) "düşük" else "güçlü",
            style = MaterialTheme.typography.titleSmall,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            if (tension) {
                "$names ile ilişkilerinde ${pattern.indexName} alanı zayıf çıkıyor. Aynı şey birden fazla ilişkide " +
                    "tekrar ediyorsa, bu tek bir kişiden çok senin bu alandaki alışkanlıklarınla ilgili olabilir."
            } else {
                "$names ile ilişkilerinde ${pattern.indexName} alanı güçlü. Bu ilişkilerde işe yarayanı diğerlerine " +
                    "taşımayı düşünebilirsin."
            },
            style = MaterialTheme.typography.bodySmall,
            color = StruvaColors.Muted,
        )
    }
}

@Composable
private fun RelationshipRow(
    node: RelationshipMapNodeDto,
    onOpen: () -> Unit,
    onRename: () -> Unit,
    onDelete: () -> Unit,
) {
    StruvaCard(
        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
        onClick = if (node.latest != null) onOpen else null,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(node.label, style = MaterialTheme.typography.titleMedium)
                Text(node.testName, style = MaterialTheme.typography.labelSmall, color = StruvaColors.Muted)
            }
            node.latest?.let {
                Text(
                    "${it.rsi}",
                    style = MaterialTheme.typography.titleMedium.copy(fontFamily = IBMPlexMono),
                    color = bandColorForScore(it.rsi),
                )
            }
        }
        Spacer(Modifier.height(4.dp))
        Text(
            if (node.resultCount == 0) "Henüz bağlı sonuç yok." else "${node.resultCount} sonuç · son skor gösteriliyor",
            style = MaterialTheme.typography.bodySmall,
            color = StruvaColors.Muted,
        )
        Row {
            TextButton(onClick = onRename) { Text("Adını değiştir") }
            TextButton(onClick = onDelete) { Text("Sil", color = StruvaColors.Bad) }
        }
    }
}

@Composable
private fun EmptyMap(hasUnassigned: Boolean, onOpenHistory: () -> Unit) {
    Column(Modifier.fillMaxWidth().padding(top = 24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Haritan henüz boş", style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(8.dp))
        Text(
            "Bir sonucu açıp \"İlişkiye bağla\" dediğinde o ilişki burada bir düğüm olur. Farklı ilişkilerini " +
                "(partner, arkadaş, aile, iş) bağladıkça aralarında tekrar eden örüntüleri görürsün.",
            style = MaterialTheme.typography.bodyMedium,
            color = StruvaColors.Muted,
            textAlign = TextAlign.Center,
        )
        if (hasUnassigned) {
            Spacer(Modifier.height(16.dp))
            StruvaButton(onClick = onOpenHistory) { Text("Sonuçlarıma git") }
        }
    }
}

@Composable
private fun RenameDialog(initial: String, onDismiss: () -> Unit, onConfirm: (String) -> Unit) {
    var label by remember { mutableStateOf(initial) }
    AlertDialog(
        onDismissRequest = onDismiss,
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
            TextButton(onClick = { onConfirm(label) }, enabled = label.isNotBlank()) { Text("Kaydet") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Vazgeç") } },
    )
}

// "Ayşe, Can ve Ece" — ProfileLabel.kt'deki joinNamesTr ile aynı kalıp.
private fun joinTr(names: List<String>): String = when (names.size) {
    0 -> ""
    1 -> names[0]
    else -> names.dropLast(1).joinToString(", ") + " ve " + names.last()
}
