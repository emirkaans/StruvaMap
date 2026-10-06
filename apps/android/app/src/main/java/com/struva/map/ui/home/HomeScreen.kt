package com.struva.map.ui.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.common.StruvaCard
import com.struva.map.ui.common.StruvaLogo
import com.struva.map.ui.common.statueFor
import com.struva.map.ui.pulse.PulseCard
import com.struva.map.ui.theme.EyebrowStyle
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

private val TR = Locale("tr")
private val TodayFormatter = DateTimeFormatter.ofPattern("d MMMM, EEEE", TR)

// Anasayfa testlerin döngüsü etrafında kurulu (bkz. HomeSections.kt): tek bir
// sıradaki adım, ilişkilerin son haritaları, eşleşmesi olana nabız, haritadan
// bir konuşma sorusu ve testler. Üç ilişki türü eşit ağırlıkta.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onTestClick: (String) -> Unit = {},
    onOpenPulsePairing: () -> Unit = {},
    onOpenPulseHistory: () -> Unit = {},
    onOpenComparison: (String) -> Unit = {},
    onOpenPrediction: (String) -> Unit = {},
    onOpenRelationship: (String) -> Unit = {},
    onOpenMap: () -> Unit = {},
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    // Kıyaslamadan ya da ilişki detayından dönüşte kartlar güncellensin.
    LaunchedEffect(Unit) { viewModel.refreshOnReturn() }

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
                is HomeUiState.Loaded -> LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
                    item { TodayHeader() }

                    s.nextStep?.let { step ->
                        item {
                            TodayCard(
                                item = step,
                                onTestClick = onTestClick,
                                onOpenComparison = onOpenComparison,
                                onOpenPrediction = onOpenPrediction,
                            )
                        }
                    }

                    if (s.relationships.isNotEmpty()) {
                        item { SectionTitle("İlişkilerin", action = "Harita", onAction = onOpenMap) }
                        items(s.relationships, key = { it.id }) { row ->
                            RelationshipRow(row, onClick = { onOpenRelationship(row.id) })
                        }
                    } else if (s.hasUnlinkedResults) {
                        item { SectionTitle("İlişkilerin") }
                        item {
                            StruvaCard(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp), onClick = onOpenMap) {
                                Text("Haritanı başlat", style = MaterialTheme.typography.titleMedium)
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    "Sonuçlarını kimin için çözdüğünü belirt; her ilişkinin son haritası burada, yan yana görünür.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = StruvaColors.Muted,
                                )
                            }
                        }
                    }

                    item {
                        PulseCard(
                            onOpenPairing = onOpenPulsePairing,
                            onOpenHistory = onOpenPulseHistory,
                            hideWhenNoPair = true,
                        )
                    }

                    s.prompt?.let { p ->
                        item { SectionTitle("Haritandan bir soru") }
                        item { PromptCard(p) }
                    }

                    item { SectionTitle("Testler") }
                    items(s.tests, key = { it.id }) { row -> TestRow(row, onClick = { onTestClick(row.id) }) }
                    item { Spacer(Modifier.height(16.dp)) }
                }
            }
        }
    }
}

@Composable
private fun TodayHeader() {
    val date = remember { LocalDate.now().format(TodayFormatter).uppercase(TR) }
    Column(Modifier.padding(top = 16.dp, bottom = 12.dp)) {
        Text(date, style = EyebrowStyle)
        Text("Bugün", style = MaterialTheme.typography.headlineSmall)
    }
}

@Composable
private fun SectionTitle(title: String, action: String? = null, onAction: () -> Unit = {}) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(top = 16.dp, bottom = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(title, style = MaterialTheme.typography.titleLarge, modifier = Modifier.weight(1f))
        if (action != null) {
            TextButton(onClick = onAction) { Text(action, color = StruvaColors.Accent) }
        }
    }
}

private fun agoText(days: Long): String = when (days) {
    0L -> "bugün"
    1L -> "dün"
    else -> "$days gün önce"
}

@Composable
private fun RelationshipRow(row: RelationshipRowUi, onClick: () -> Unit) {
    StruvaCard(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp), onClick = onClick) {
        Row(verticalAlignment = Alignment.Top) {
            Text(row.label, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
            Text(
                row.daysSince?.let { "${row.typeLabel} · ${agoText(it)}" } ?: row.typeLabel,
                style = MaterialTheme.typography.labelSmall,
                color = StruvaColors.Muted,
                modifier = Modifier.padding(top = 4.dp),
            )
        }
        row.summary?.let {
            Spacer(Modifier.height(4.dp))
            Text(it, style = MaterialTheme.typography.bodyMedium, color = StruvaColors.Muted)
        }
        row.hint?.let {
            Spacer(Modifier.height(6.dp))
            Text(it, style = MaterialTheme.typography.labelMedium, color = StruvaColors.Accent)
        }
    }
}

@Composable
private fun PromptCard(p: MapPrompt) {
    var index by remember(p) { mutableIntStateOf(0) }
    StruvaCard(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)) {
        Text("“${p.prompts[index % p.prompts.size]}”", style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(8.dp))
        Text(
            "Son ${p.typeLabel.lowercase(TR)} sonucunda en düşük alan: ${p.dimName}. Kimin haklı olduğunu değil, aynı yapıyı neden farklı yaşadığınızı konuşmak için.",
            style = MaterialTheme.typography.bodySmall,
            color = StruvaColors.Muted,
        )
        if (p.prompts.size > 1) {
            TextButton(onClick = { index++ }) { Text("Başka bir soru", color = StruvaColors.Accent) }
        }
    }
}

@Composable
private fun TestRow(row: TestRowUi, onClick: () -> Unit) {
    StruvaCard(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp), onClick = onClick) {
        Text(row.typeLabel, style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(2.dp))
        Text(row.subtitle, style = MaterialTheme.typography.bodySmall, color = StruvaColors.Muted)
        Spacer(Modifier.height(6.dp))
        if (row.unmapped) {
            Text("Henüz haritalamadın", style = MaterialTheme.typography.labelMedium, color = StruvaColors.Accent)
        } else {
            row.daysSinceLast?.let {
                Text("Son ölçüm ${agoText(it)}", style = MaterialTheme.typography.labelMedium, color = StruvaColors.Muted)
            }
        }
    }
}

@Composable
private fun TodayCard(
    item: TodayItem,
    onTestClick: (String) -> Unit,
    onOpenComparison: (String) -> Unit,
    onOpenPrediction: (String) -> Unit,
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
            "Davet ettiğin kişi henüz testi bitirmedi. Beklerken onun cevaplarını tahmin et; kıyaslamada ne kadar isabetli olduğunu göreceksin.",
        ) { onOpenPrediction(item.resultId) }
        is TodayItem.Retest -> TodayCardContent(
            "YENİDEN HARİTALA",
            item.testName,
            "Bu testi ${item.daysAgo} gün önce çözdün. Yeniden çözersen yapının nasıl değiştiğini görürsün.",
        ) { onTestClick(item.testId) }
        is TodayItem.FirstTest -> TodayCardContent(
            "İLK ADIM",
            item.testName,
            "Bir ilişkinin görünmeyen yapısını haritalamak için ilk testini çöz. Yaklaşık 7 dakika.",
        ) { onTestClick(item.testId) }
    }
    val statue = statueFor(
        when (item) {
            is TodayItem.ComparisonReady -> item.testId
            is TodayItem.WaitingForInvitee -> item.testId
            is TodayItem.Retest -> item.testId
            is TodayItem.FirstTest -> item.testId
        },
    )
    StruvaCard(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp), onClick = onClick) {
        // Kartın sağ yarısında ilişki türünün heykeli; sola doğru kart
        // zeminine karışır, yazı okunur kalır. Sayfadaki tek heykel burası.
        Box(Modifier.fillMaxWidth().heightIn(min = 150.dp)) {
            if (statue != null) {
                // matchParentSize: görsel kartın boyunu belirlemesin, taşan
                // kısmı kartın köşelerinde kırpılsın.
                Box(Modifier.matchParentSize()) {
                    Image(
                        painter = painterResource(statue),
                        contentDescription = null,
                        contentScale = ContentScale.FillWidth,
                        alignment = Alignment.TopCenter,
                        alpha = 0.6f,
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .offset(x = 28.dp, y = (-20).dp)
                            .width(180.dp)
                            .wrapContentHeight(align = Alignment.Top, unbounded = true),
                    )
                }
                Box(
                    Modifier
                        .matchParentSize()
                        .background(
                            Brush.horizontalGradient(
                                0.45f to StruvaColors.Surface,
                                0.7f to StruvaColors.Surface.copy(alpha = 0.55f),
                                1f to StruvaColors.Surface.copy(alpha = 0.15f),
                            ),
                        ),
                )
            }
            Column(Modifier.widthIn(max = 205.dp)) {
                Text(eyebrow, style = EyebrowStyle)
                Spacer(Modifier.height(4.dp))
                Text(title, style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(4.dp))
                Text(body, style = MaterialTheme.typography.bodyMedium, color = StruvaColors.Muted)
            }
        }
    }
}

private data class TodayCardContent(
    val eyebrow: String,
    val title: String,
    val body: String,
    val onClick: () -> Unit,
)
