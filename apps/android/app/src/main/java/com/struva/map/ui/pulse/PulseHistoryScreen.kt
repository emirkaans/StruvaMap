package com.struva.map.ui.pulse

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.network.HISTORY_DAYS
import com.struva.map.network.dto.PulseHistoryDayDto
import com.struva.map.network.dto.PulseWeekSummaryDto
import com.struva.map.ui.common.BackIconButton
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.common.StruvaCard
import com.struva.map.ui.theme.EyebrowStyle
import com.struva.map.ui.theme.IBMPlexMono
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.abs

// packages/shared/src/pulse.ts PULSE_GAP_THRESHOLD ile aynı — takvimdeki
// "algı farkı" çerçevesi haftalık özetteki gapDays ile tutarlı kalsın.
private const val GAP_THRESHOLD = 2

private val TR = Locale("tr")
private val DayFormatter = DateTimeFormatter.ofPattern("d MMMM, EEEE", TR)
private val ShortDayFormatter = DateTimeFormatter.ofPattern("d MMMM", TR)
private val WeekdayLabels = listOf("Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PulseHistoryScreen(
    onBack: () -> Unit,
    onOpenPairing: () -> Unit,
    viewModel: PulseHistoryViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Nabız geçmişi") },
                navigationIcon = { BackIconButton(onClick = onBack) },
                colors = struvaTopAppBarColors(),
            )
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
            when (val s = state) {
                is PulseHistoryUiState.Loading -> CircularProgressIndicator()
                is PulseHistoryUiState.Error -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(s.message)
                    Spacer(Modifier.height(12.dp))
                    StruvaButton(onClick = viewModel::load) { Text("Tekrar dene") }
                }
                is PulseHistoryUiState.NoPair -> Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(
                        "Geçmiş, partnerinle eşleştikten sonra birikmeye başlar.",
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                    )
                    Spacer(Modifier.height(12.dp))
                    StruvaButton(onClick = onOpenPairing) { Text("Partner eşleştir") }
                }
                is PulseHistoryUiState.Loaded -> HistoryContent(
                    days = s.history.days,
                    week = s.history.week,
                    partnerName = s.partnerName ?: "Partnerin",
                )
            }
        }
    }
}

@Composable
private fun HistoryContent(days: List<PulseHistoryDayDto>, week: PulseWeekSummaryDto, partnerName: String) {
    val byDate = remember(days) { days.associateBy { LocalDate.parse(it.date) } }
    val today = remember { LocalDate.now() }
    // Varsayılan seçim: en son kaydı olan gün (çoğunlukla bugün).
    var selected by remember(days) { mutableStateOf(byDate.keys.maxOrNull() ?: today) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        WeekSummaryCard(week, partnerName)
        Spacer(Modifier.height(12.dp))
        StruvaCard(modifier = Modifier.fillMaxWidth()) {
            Text("SON 4 HAFTA", style = EyebrowStyle)
            Spacer(Modifier.height(12.dp))
            PulseCalendar(today = today, byDate = byDate, selected = selected, onSelect = { selected = it })
            Spacer(Modifier.height(8.dp))
            Text(
                "Renk koyulaştıkça ikinizin ortalaması yükselir. Kırmızı çerçeve: cevaplarınız arasında $GAP_THRESHOLD+ puan fark.",
                style = MaterialTheme.typography.bodySmall,
            )
        }
        Spacer(Modifier.height(12.dp))
        SelectedDayCard(date = selected, day = byDate[selected], partnerName = partnerName)
        Spacer(Modifier.height(16.dp))
        Text(
            "TEŞHİS DEĞİL · Günlük nabız, ilişkinin o günkü hissini kaydeder; bir puan ya da yargı değildir.",
            style = MaterialTheme.typography.bodySmall,
        )
    }
}

@Composable
private fun WeekSummaryCard(week: PulseWeekSummaryDto, partnerName: String) {
    StruvaCard(modifier = Modifier.fillMaxWidth()) {
        Text("SON 7 GÜN", style = EyebrowStyle)
        Spacer(Modifier.height(12.dp))
        if (week.answeredDays == 0 && week.bothAnsweredDays == 0) {
            Text("Bu hafta henüz cevap yok. Bugünün sorusu ana sayfada seni bekliyor.", style = MaterialTheme.typography.bodyMedium)
        } else {
            WeekSummaryBody(week, partnerName)
        }
    }
}

@Composable
private fun WeekSummaryBody(week: PulseWeekSummaryDto, partnerName: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Stat(label = "Senin ort.", value = week.myAverage?.let(::formatAverage) ?: "–")
        Stat(label = "$partnerName ort.", value = week.partnerAverage?.let(::formatAverage) ?: "–")
        Stat(label = "Birlikte", value = "${week.bothAnsweredDays}/7 gün")
    }
    if (week.gapDays > 0) {
        Spacer(Modifier.height(12.dp))
        Text(
            "${week.gapDays} gün cevaplarınız arasında $GAP_THRESHOLD+ puan fark vardı. Aynı günü farklı yaşamış olabilirsiniz; konuşmaya değer.",
            style = MaterialTheme.typography.bodyMedium,
        )
    }
    week.lowest?.let { lowest ->
        Spacer(Modifier.height(12.dp))
        Text("Haftanın en düşük anı", style = MaterialTheme.typography.labelMedium, color = StruvaColors.Muted)
        Spacer(Modifier.height(2.dp))
        Text(lowest.questionText, style = MaterialTheme.typography.titleSmall)
        Text(
            "${LocalDate.parse(lowest.date).format(ShortDayFormatter)} · ortalama ${formatAverage(lowest.average)}",
            style = MaterialTheme.typography.bodySmall,
        )
    }
}

@Composable
private fun Stat(label: String, value: String) {
    Column {
        Text(value, style = MaterialTheme.typography.titleMedium.copy(fontFamily = IBMPlexMono))
        Text(label, style = MaterialTheme.typography.labelSmall, color = StruvaColors.Muted)
    }
}

// Pazartesi başlangıçlı ızgara; son HISTORY_DAYS gün, bugünle biter.
// Aralığın dışındaki (baştaki hizalama ve bugünden sonraki) hücreler boş.
@Composable
private fun PulseCalendar(
    today: LocalDate,
    byDate: Map<LocalDate, PulseHistoryDayDto>,
    selected: LocalDate,
    onSelect: (LocalDate) -> Unit,
) {
    val start = today.minusDays((HISTORY_DAYS - 1).toLong())
    val gridStart = start.minusDays((start.dayOfWeek.value - 1).toLong())
    val weeks = ((today.toEpochDay() - gridStart.toEpochDay()) / 7 + 1).toInt()

    Row(Modifier.fillMaxWidth()) {
        WeekdayLabels.forEach {
            Text(
                it,
                modifier = Modifier.weight(1f),
                style = MaterialTheme.typography.labelSmall,
                color = StruvaColors.Muted,
                textAlign = TextAlign.Center,
            )
        }
    }
    Spacer(Modifier.height(4.dp))
    for (week in 0 until weeks) {
        Row(Modifier.fillMaxWidth()) {
            for (weekday in 0 until 7) {
                val date = gridStart.plusDays((week * 7 + weekday).toLong())
                Box(Modifier.weight(1f).aspectRatio(1f).padding(2.dp)) {
                    if (!date.isBefore(start) && !date.isAfter(today)) {
                        DayCell(date, byDate[date], isSelected = date == selected, onClick = { onSelect(date) })
                    }
                }
            }
        }
    }
}

@Composable
private fun DayCell(date: LocalDate, day: PulseHistoryDayDto?, isSelected: Boolean, onClick: () -> Unit) {
    val answers = listOfNotNull(day?.myAnswer, day?.partnerAnswer)
    val fill = if (answers.isEmpty()) {
        StruvaColors.Border
    } else {
        // 1 → soluk, 5 → tam accent.
        StruvaColors.Accent.copy(alpha = 0.2f + (answers.average().toFloat() - 1f) / 4f * 0.8f)
    }
    val mine = day?.myAnswer
    val partner = day?.partnerAnswer
    val hasGap = mine != null && partner != null && abs(mine - partner) >= GAP_THRESHOLD
    val borderColor = when {
        isSelected -> StruvaColors.Text
        hasGap -> StruvaColors.Bad
        else -> Color.Transparent
    }
    val shape = RoundedCornerShape(6.dp)
    Box(
        modifier = Modifier
            .fillMaxSize()
            .clip(shape)
            .background(fill)
            .border(if (isSelected || hasGap) 2.dp else 0.dp, borderColor, shape)
            .clickable(onClick = onClick)
            .semantics { contentDescription = date.format(DayFormatter) },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            "${date.dayOfMonth}",
            style = MaterialTheme.typography.labelSmall,
            color = if (answers.isEmpty()) StruvaColors.Muted else StruvaColors.Text,
        )
    }
}

@Composable
private fun SelectedDayCard(date: LocalDate, day: PulseHistoryDayDto?, partnerName: String) {
    StruvaCard(modifier = Modifier.fillMaxWidth()) {
        Text(date.format(DayFormatter).uppercase(TR), style = EyebrowStyle)
        Spacer(Modifier.height(8.dp))
        if (day == null) {
            Text("Bu gün için nabız kaydı yok.", style = MaterialTheme.typography.bodyMedium, color = StruvaColors.Muted)
        } else {
            Text(day.questionText, style = MaterialTheme.typography.titleSmall)
            Spacer(Modifier.height(10.dp))
            AnswerRow("Sen", day.myAnswer)
            Spacer(Modifier.height(6.dp))
            AnswerRow(partnerName, day.partnerAnswer)
        }
    }
}

@Composable
private fun AnswerRow(label: String, value: Int?) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text(label, modifier = Modifier.weight(0.35f), style = MaterialTheme.typography.labelMedium)
        Box(
            modifier = Modifier
                .weight(0.55f)
                .height(6.dp)
                .clip(RoundedCornerShape(99.dp))
                .background(StruvaColors.Border),
        ) {
            if (value != null) {
                Box(
                    Modifier
                        .fillMaxWidth(value / 5f)
                        .height(6.dp)
                        .clip(RoundedCornerShape(99.dp))
                        .background(StruvaColors.Accent),
                )
            }
        }
        Text(
            value?.toString() ?: "–",
            modifier = Modifier.weight(0.1f),
            style = MaterialTheme.typography.labelMedium.copy(fontFamily = IBMPlexMono),
            textAlign = TextAlign.End,
        )
    }
}

private fun formatAverage(value: Double): String = String.format(TR, "%.1f", value)
