package com.struva.map.ui.history

import com.struva.map.ui.common.ErrorState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
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
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors

private val SegmentShape = RoundedCornerShape(10.dp)
private val SegmentItemShape = RoundedCornerShape(8.dp)

// Geçmiş: filtreli arşiv. Her satırda tarih, sözlü özet, ilişki, genel skor ve
// testin üç endeksi küçük çubuklar halinde.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HistoryScreen(
    onResultClick: (String) -> Unit,
    viewModel: HistoryViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Geçmiş") }, colors = struvaTopAppBarColors())
        },
    ) { padding ->
        Box(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentAlignment = Alignment.Center,
        ) {
            when (val s = state) {
                is HistoryUiState.Loading -> CircularProgressIndicator()
                is HistoryUiState.Error -> ErrorState(title = "Geçmiş yüklenemedi", message = s.message, onRetry = viewModel::load)
                is HistoryUiState.Loaded -> {
                    if (s.total == 0) {
                        Text(
                            "Henüz bir test çözmedin. Çözdüğün her test, o günkü haritan olarak burada saklanır.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = StruvaColors.Muted,
                            modifier = Modifier.padding(32.dp),
                        )
                    } else {
                        LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
                            item {
                                FilterBar(s.filters, s.filter, onPick = viewModel::setFilter)
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp, bottom = 2.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Text(
                                        "${s.rows.size} ölçüm",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = StruvaColors.Muted,
                                        modifier = Modifier.weight(1f),
                                    )
                                    TextButton(onClick = viewModel::toggleSort) {
                                        Text(
                                            if (s.newestFirst) "En yeni önce" else "En eski önce",
                                            color = StruvaColors.Accent,
                                            fontWeight = FontWeight.SemiBold,
                                        )
                                    }
                                }
                                HorizontalDivider(color = StruvaColors.Border)
                            }
                            items(s.rows, key = { it.resultId }) { row ->
                                ArchiveRowItem(row, onClick = { onResultClick(row.resultId) })
                                HorizontalDivider(color = StruvaColors.Border)
                            }
                            item {
                                Text(
                                    "Sağdaki sayı genel skor; altındaki üç çizgi testin üç endeksi. Uzunluk skoru, renk dengeyi gösterir.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = StruvaColors.Muted,
                                    modifier = Modifier.padding(top = 12.dp, bottom = 24.dp),
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun FilterBar(filters: List<HistoryFilter>, selected: String?, onPick: (String?) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 12.dp)
            .clip(SegmentShape)
            .background(StruvaColors.Surface)
            .border(1.dp, StruvaColors.Border, SegmentShape)
            .padding(3.dp),
    ) {
        filters.forEach { f ->
            val on = f.testId == selected
            Box(
                modifier = Modifier
                    .weight(1f)
                    .heightIn(min = 40.dp)
                    .clip(SegmentItemShape)
                    .background(if (on) StruvaColors.Border else StruvaColors.Surface)
                    .semantics { this.selected = on }
                    .clickable { onPick(f.testId) },
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    f.label,
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (on) StruvaColors.Text else StruvaColors.Muted,
                    fontWeight = if (on) FontWeight.SemiBold else FontWeight.Normal,
                    maxLines = 1,
                )
            }
        }
    }
}
