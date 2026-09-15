package com.struva.map.ui.myresults

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
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.network.dto.ResultRowDto
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.common.StruvaCard
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

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
                is MyResultsUiState.Loading -> CircularProgressIndicator()
                is MyResultsUiState.Error -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Sonuçlar yüklenemedi: ${s.message}")
                    Spacer(Modifier.height(12.dp))
                    StruvaButton(onClick = viewModel::load) { Text("Tekrar dene") }
                }
                is MyResultsUiState.Loaded -> {
                    if (s.results.isEmpty()) {
                        Text("Bu testi henüz çözmedin.")
                    } else {
                        LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                            items(s.results) { result -> ResultRow(result, onClick = { onResultClick(result.id) }) }
                        }
                    }
                }
            }
        }
    }
}

private val ResultDateFormatter = DateTimeFormatter.ofPattern("d MMMM yyyy, HH:mm", Locale("tr"))

private fun formatResultDate(iso: String): String = try {
    OffsetDateTime.parse(iso).format(ResultDateFormatter)
} catch (e: Exception) {
    iso
}

@Composable
private fun ResultRow(result: ResultRowDto, onClick: () -> Unit) {
    StruvaCard(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp), onClick = onClick) {
        Text("Genel skor ${result.score.rsi}", style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(4.dp))
        Text(formatResultDate(result.createdAt), style = MaterialTheme.typography.bodySmall, color = StruvaColors.Muted)
    }
}
