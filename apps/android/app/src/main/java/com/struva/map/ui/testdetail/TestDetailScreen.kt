package com.struva.map.ui.testdetail

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import com.struva.map.ui.common.StruvaOutlinedButton
import com.struva.map.ui.theme.EyebrowStyle
import com.struva.map.ui.theme.struvaTopAppBarColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TestDetailScreen(
    onBack: () -> Unit,
    onStart: (String) -> Unit,
    onMyResults: (String) -> Unit,
    viewModel: TestDetailViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Test detayı") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Text("←") }
                },
                colors = struvaTopAppBarColors(),
            )
        },
    ) { padding ->
        Box(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentAlignment = Alignment.Center,
        ) {
            when (val s = state) {
                is TestDetailUiState.Loading -> CircularProgressIndicator()
                is TestDetailUiState.Error -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Test yüklenemedi: ${s.message}")
                    Spacer(Modifier.height(12.dp))
                    StruvaButton(onClick = viewModel::load) { Text("Tekrar dene") }
                }
                is TestDetailUiState.Loaded -> Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                    Text(s.test.name, style = MaterialTheme.typography.headlineSmall)
                    Spacer(Modifier.height(8.dp))
                    Text(s.test.subtitle, style = MaterialTheme.typography.bodyMedium)
                    Spacer(Modifier.height(16.dp))
                    Text("${s.test.questions.size} soru", style = EyebrowStyle)
                    s.test.disclaimerNote?.let {
                        Spacer(Modifier.height(16.dp))
                        Text(it, style = MaterialTheme.typography.bodySmall)
                    }
                    Spacer(Modifier.height(24.dp))
                    StruvaButton(onClick = { onStart(s.test.id) }, modifier = Modifier.fillMaxWidth()) {
                        Text("Teste başla")
                    }
                    Spacer(Modifier.height(8.dp))
                    StruvaOutlinedButton(onClick = { onMyResults(s.test.id) }, modifier = Modifier.fillMaxWidth()) {
                        Text("Geçmiş sonuçlarım")
                    }
                }
            }
        }
    }
}
