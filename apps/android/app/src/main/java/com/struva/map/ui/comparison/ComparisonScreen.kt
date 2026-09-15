package com.struva.map.ui.comparison

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
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.network.dto.ComparisonDto
import com.struva.map.ui.common.DimensionBar
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.theme.IBMPlexMono
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors
import kotlin.math.abs

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComparisonScreen(
    onBack: () -> Unit,
    viewModel: ComparisonViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Kıyaslama") },
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
                is ComparisonUiState.Loading -> CircularProgressIndicator()
                is ComparisonUiState.Error -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Kıyaslama yüklenemedi: ${s.message}")
                    Spacer(Modifier.height(12.dp))
                    StruvaButton(onClick = viewModel::load) { Text("Tekrar dene") }
                }
                is ComparisonUiState.Loaded -> ComparisonView(s.comparison)
            }
        }
    }
}

@Composable
private fun ComparisonView(comparison: ComparisonDto) {
    val a = comparison.a.score
    val b = comparison.b.score

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        item {
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                RsiColumn("Kişi A", a.rsi, Modifier.weight(1f))
                Text(
                    "fark ${abs(a.rsi - b.rsi)}",
                    style = MaterialTheme.typography.labelMedium,
                    color = StruvaColors.Muted,
                )
                RsiColumn("Kişi B", b.rsi, Modifier.weight(1f))
            }
            Spacer(Modifier.height(24.dp))
            HorizontalDivider(color = StruvaColors.Border)
            Spacer(Modifier.height(8.dp))
        }
        items(a.interpretation) { interp ->
            val aScore = a.dimensions[interp.dim] ?: 0
            val bScore = b.dimensions[interp.dim] ?: 0
            Column(modifier = Modifier.padding(vertical = 12.dp)) {
                Text(interp.name, style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.height(8.dp))
                DimensionBar("Kişi A", aScore)
                Spacer(Modifier.height(8.dp))
                DimensionBar("Kişi B", bScore)
            }
        }
    }
}

private val RsiNumberStyle = TextStyle(
    fontFamily = IBMPlexMono,
    fontWeight = FontWeight.Medium,
    fontSize = 32.sp,
    letterSpacing = (-0.5).sp,
    color = StruvaColors.Text,
)

@Composable
private fun RsiColumn(label: String, value: Int, modifier: Modifier = Modifier) {
    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = StruvaColors.Muted)
        Text(value.toString(), style = RsiNumberStyle)
    }
}
