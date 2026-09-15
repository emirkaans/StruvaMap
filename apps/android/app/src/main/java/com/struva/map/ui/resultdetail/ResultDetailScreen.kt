package com.struva.map.ui.resultdetail

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.IconButton
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
import com.struva.map.ui.common.ScoreResultView
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.theme.struvaTopAppBarColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResultDetailScreen(
    onBack: () -> Unit,
    onOpenComparison: (String) -> Unit,
    viewModel: ResultDetailViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Sonuç") },
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
                is ResultDetailUiState.Loading -> CircularProgressIndicator()
                is ResultDetailUiState.Error -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Sonuç yüklenemedi: ${s.message}")
                    Spacer(Modifier.height(12.dp))
                    StruvaButton(onClick = viewModel::load) { Text("Tekrar dene") }
                }
                is ResultDetailUiState.Loaded -> ScoreResultView(
                    s.score,
                    resultId = viewModel.resultId,
                    onOpenComparison = onOpenComparison,
                )
            }
        }
    }
}
