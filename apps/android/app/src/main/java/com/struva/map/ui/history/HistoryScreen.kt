package com.struva.map.ui.history

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.common.StruvaCard
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

private val HistoryDateFormatter = DateTimeFormatter.ofPattern("d MMMM yyyy, HH:mm", Locale("tr"))

private fun formatHistoryDate(iso: String): String = try {
    OffsetDateTime.parse(iso).format(HistoryDateFormatter)
} catch (e: Exception) {
    iso
}

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
                is HistoryUiState.Error -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Geçmiş yüklenemedi: ${s.message}")
                    Spacer(Modifier.height(12.dp))
                    StruvaButton(onClick = viewModel::load) { Text("Tekrar dene") }
                }
                is HistoryUiState.Loaded -> {
                    if (s.rows.isEmpty()) {
                        Text(
                            "Henüz bir test çözmedin.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = StruvaColors.Muted,
                        )
                    } else {
                        LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                            items(s.rows, key = { it.result.id }) { row ->
                                HistoryCard(row, onClick = { onResultClick(row.result.id) })
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun HistoryCard(row: HistoryRow, onClick: () -> Unit) {
    StruvaCard(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp), onClick = onClick) {
        Text(row.testName, style = MaterialTheme.typography.labelSmall, color = StruvaColors.Muted)
        Spacer(Modifier.height(4.dp))
        Text("Genel skor ${row.result.score.rsi}", style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(4.dp))
        Text(formatHistoryDate(row.result.createdAt), style = MaterialTheme.typography.bodySmall, color = StruvaColors.Muted)
    }
}
