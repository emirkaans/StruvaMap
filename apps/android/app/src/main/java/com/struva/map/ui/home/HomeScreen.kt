package com.struva.map.ui.home

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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.network.dto.TestSummaryDto
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.common.StruvaCard
import com.struva.map.ui.common.StruvaLogo
import com.struva.map.ui.pulse.PulseCard
import com.struva.map.ui.theme.EyebrowStyle
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

private val TR = Locale("tr")
private val TodayFormatter = DateTimeFormatter.ofPattern("d MMMM, EEEE", TR)

// "Bugün" ekranı: sabit test listesi yerine kullanıcının durumuna göre
// değişen bir akış — önce günün nabzı, sonra sende/karşı tarafta bekleyenler
// (bkz. buildTodayItems), en altta tüm testler.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onTestClick: (String) -> Unit = {},
    onOpenPulsePairing: () -> Unit = {},
    onOpenPulseHistory: () -> Unit = {},
    onOpenComparison: (String) -> Unit = {},
    onOpenResult: (String) -> Unit = {},
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    // Kıyaslamadan dönüşte "hazır" kartı düşsün (bkz. HomeViewModel).
    LaunchedEffect(Unit) { viewModel.refreshInviteStatuses() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { StruvaLogo() },
                colors = struvaTopAppBarColors(),
            )
        },
    ) { padding ->
        Box(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentAlignment = Alignment.Center,
        ) {
            when (val s = state) {
                is HomeUiState.Loading -> CircularProgressIndicator()
                is HomeUiState.Error -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Testler yüklenemedi: ${s.message}")
                    Spacer(Modifier.height(12.dp))
                    StruvaButton(onClick = viewModel::load) { Text("Tekrar dene") }
                }
                is HomeUiState.Loaded -> LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                    item { TodayHeader() }
                    item { PulseCard(onOpenPairing = onOpenPulsePairing, onOpenHistory = onOpenPulseHistory) }
                    items(s.today) { item ->
                        TodayCard(
                            item = item,
                            onTestClick = onTestClick,
                            onOpenComparison = onOpenComparison,
                            onOpenResult = onOpenResult,
                        )
                    }
                    item {
                        Text(
                            "Testler",
                            style = MaterialTheme.typography.titleLarge,
                            modifier = Modifier.padding(top = 16.dp, bottom = 6.dp),
                        )
                    }
                    items(s.tests) { test -> TestCard(test, onClick = { onTestClick(test.id) }) }
                }
            }
        }
    }
}

@Composable
private fun TodayHeader() {
    val date = remember { LocalDate.now().format(TodayFormatter).uppercase(TR) }
    Column(Modifier.padding(bottom = 12.dp)) {
        Text(date, style = EyebrowStyle)
        Text("Bugün", style = MaterialTheme.typography.headlineSmall)
    }
}

@Composable
private fun TodayCard(
    item: TodayItem,
    onTestClick: (String) -> Unit,
    onOpenComparison: (String) -> Unit,
    onOpenResult: (String) -> Unit,
) {
    val (eyebrow, title, body, onClick) = when (item) {
        is TodayItem.ComparisonReady -> TodayCardContent(
            "KIYASLAMA HAZIR",
            item.testName,
            "Davet ettiğin kişi testi bitirdi. Algı farklarınızı birlikte görün.",
        ) { onOpenComparison(item.comparisonId) }
        is TodayItem.WaitingForInvitee -> TodayCardContent(
            "DAVET BEKLENİYOR",
            item.testName,
            "Davet ettiğin kişi henüz testi bitirmedi. Bitirdiğinde bildirim alacaksın.",
        ) { onOpenResult(item.resultId) }
        is TodayItem.Retest -> TodayCardContent(
            "YENİDEN ÇÖZ",
            item.testName,
            "Bu testi ${item.daysAgo} gün önce çözdün. Tekrar çözersen neyin değiştiğini zamanla değişim grafiğinde görürsün.",
        ) { onTestClick(item.testId) }
        is TodayItem.FirstTest -> TodayCardContent(
            "İLK ADIM",
            item.testName,
            "İlişkinin görünmeyen yapısını haritalamak için ilk testini çöz. Yaklaşık 5 dakika.",
        ) { onTestClick(item.testId) }
    }
    StruvaCard(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp), onClick = onClick) {
        Text(eyebrow, style = EyebrowStyle)
        Spacer(Modifier.height(4.dp))
        Text(title, style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(4.dp))
        Text(body, style = MaterialTheme.typography.bodyMedium, color = StruvaColors.Muted)
    }
}

private data class TodayCardContent(
    val eyebrow: String,
    val title: String,
    val body: String,
    val onClick: () -> Unit,
)

@Composable
private fun TestCard(test: TestSummaryDto, onClick: () -> Unit) {
    StruvaCard(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp), onClick = onClick) {
        Text(test.name, style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(4.dp))
        Text(test.subtitle, style = MaterialTheme.typography.bodyMedium)
    }
}
