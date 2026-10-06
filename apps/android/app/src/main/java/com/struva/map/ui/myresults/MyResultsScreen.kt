package com.struva.map.ui.myresults

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.ui.common.BackIconButton
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.history.ArchiveRowItem
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyResultsScreen(
    onBack: () -> Unit,
    onResultClick: (String) -> Unit,
    viewModel: MyResultsViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Geçmiş sonuçlarım") },
                navigationIcon = { BackIconButton(onClick = onBack) },
                colors = struvaTopAppBarColors(),
            )
        },
    ) { padding ->
        Box(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentAlignment = Alignment.Center,
        ) {
            when (val s = state) {
                is MyResultsUiState.Loading -> CircularProgressIndicator()
                is MyResultsUiState.Error -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Sonuçlar yüklenemedi. ${s.message}")
                    Spacer(Modifier.height(12.dp))
                    StruvaButton(onClick = viewModel::load) { Text("Tekrar dene") }
                }
                is MyResultsUiState.Loaded -> {
                    if (s.rows.isEmpty()) {
                        Text(
                            "Bu testi henüz çözmedin.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = StruvaColors.Muted,
                        )
                    } else {
                        LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
                            item {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp, bottom = 2.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Text(
                                        "${s.typeLabel} · ${s.rows.size} ölçüm",
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
