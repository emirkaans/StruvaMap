package com.struva.map.ui.testdetail

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
import com.struva.map.network.dto.DimensionDefDto
import com.struva.map.ui.common.BackIconButton
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.common.StruvaCard
import com.struva.map.ui.common.StruvaOutlinedButton
import com.struva.map.ui.theme.EyebrowStyle
import com.struva.map.ui.theme.IBMPlexMono
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

private val StatNumberStyle = TextStyle(
    fontFamily = IBMPlexMono,
    fontWeight = FontWeight.SemiBold,
    fontSize = 26.sp,
    color = StruvaColors.Text,
)

private fun parseMinutes(subtitle: String): String =
    Regex("~?(\\d+)\\s*dakika").find(subtitle)?.groupValues?.get(1) ?: "?"

// Web'de bu istatistik şeridi + metodoloji grid'i LandingPage'de (per-test
// hero altında) yer alır; mobilde giriş sonrası doğrudan test detayına
// gelindiği için aynı içerik burada, ana CTA'nın (Teste başla) ALTINDA —
// hero eylemi hâlâ scroll'suz görünür kalır, bu ek bağlam onun altına eklenir.
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
                is TestDetailUiState.Loading -> CircularProgressIndicator()
                is TestDetailUiState.Error -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Test yüklenemedi: ${s.message}")
                    Spacer(Modifier.height(12.dp))
                    StruvaButton(onClick = viewModel::load) { Text("Tekrar dene") }
                }
                is TestDetailUiState.Loaded -> {
                    val test = s.test
                    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                        item {
                            Text(test.name, style = MaterialTheme.typography.headlineSmall)
                            Spacer(Modifier.height(8.dp))
                            Text(test.subtitle, style = MaterialTheme.typography.bodyMedium)
                            Spacer(Modifier.height(16.dp))
                            Text("${test.questions.size} soru", style = EyebrowStyle)
                            test.disclaimerNote?.let {
                                Spacer(Modifier.height(16.dp))
                                Text(it, style = MaterialTheme.typography.bodySmall)
                            }
                            Spacer(Modifier.height(24.dp))
                            StruvaButton(onClick = { onStart(test.id) }, modifier = Modifier.fillMaxWidth()) {
                                Text("Teste başla")
                            }
                            Spacer(Modifier.height(8.dp))
                            StruvaOutlinedButton(onClick = { onMyResults(test.id) }, modifier = Modifier.fillMaxWidth()) {
                                Text("Geçmiş sonuçlarım")
                            }
                            Spacer(Modifier.height(32.dp))

                            Row(modifier = Modifier.fillMaxWidth()) {
                                StatItem(test.dimensions.size.toString(), "Boyut", Modifier.weight(1f))
                                StatItem(test.indices.size.toString(), "Endeks", Modifier.weight(1f))
                                StatItem("~${parseMinutes(test.subtitle)}dk", "Ortalama süre", Modifier.weight(1f))
                            }
                            Spacer(Modifier.height(28.dp))

                            if (test.dimensions.isNotEmpty()) {
                                Text(
                                    "${test.dimensions.size} boyutu, ${test.indices.size} endekste ölçüyoruz.",
                                    style = MaterialTheme.typography.titleLarge,
                                )
                                Spacer(Modifier.height(16.dp))
                            }
                        }

                        items(test.dimensions.values.toList()) { dim ->
                            DimensionMethodCard(dim, indexName = test.indices[dim.index]?.name ?: dim.index)
                            Spacer(Modifier.height(10.dp))
                        }

                        item {
                            Spacer(Modifier.height(24.dp))
                            Text("TEŞHİS DEĞİL", style = EyebrowStyle)
                            Spacer(Modifier.height(10.dp))
                            Text(
                                "Bu skor \"%X sağlıklı\" anlamına gelmez. İncelenen sosyal-yapısal " +
                                    "alanlardaki denge ve uyum düzeyini gösterir; tanımlayıcı bir sosyolojik haritadır.",
                                style = MaterialTheme.typography.bodySmall,
                                color = StruvaColors.Muted,
                            )
                            Spacer(Modifier.height(16.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatItem(value: String, label: String, modifier: Modifier = Modifier) {
    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, style = StatNumberStyle)
        Spacer(Modifier.height(4.dp))
        Text(label, style = MaterialTheme.typography.bodySmall, color = StruvaColors.Muted)
    }
}

@Composable
private fun DimensionMethodCard(dim: DimensionDefDto, indexName: String) {
    StruvaCard(modifier = Modifier.fillMaxWidth()) {
        Text(indexName, style = MaterialTheme.typography.labelSmall)
        Spacer(Modifier.height(6.dp))
        Text(dim.name, style = MaterialTheme.typography.titleSmall)
        Spacer(Modifier.height(4.dp))
        Text(dim.short, style = MaterialTheme.typography.bodySmall, color = StruvaColors.Muted)
    }
}
