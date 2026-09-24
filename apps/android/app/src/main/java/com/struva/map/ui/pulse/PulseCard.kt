package com.struva.map.ui.pulse

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.common.StruvaCard
import com.struva.map.ui.common.StruvaOutlinedButton
import com.struva.map.ui.theme.IBMPlexMono
import com.struva.map.ui.theme.StruvaColors

private val TrackHeight = 6.dp
private val PartnerTrackHeight = 4.dp
private val KnobSize = 30.dp

// HomeScreen'in en üstüne sabit kart olarak eklenir (bkz. HomeScreen.kt) —
// ayrı tam ekran değil, günde 2 açılışın tetikleyicisi Home'un ilk göründüğü
// an bu kartın görünür olması. NoPair/PendingInvite'ta eşleştirme akışı
// PulsePairingScreen'e devrediliyor, burada yalnızca durum özeti var.
//
// Cevap kartı, buton listesi yerine tek bir yatay gösterge (5 tasarım
// örneğinden seçilen "Gösterge" konsepti) — kullanıcı bir sayıya değil,
// 1-5 arası bir çizgi üzerindeki noktaya dokunuyor, partnerin cevabı altta
// soluk ikinci bir çizgi olarak duruyor.
@Composable
fun PulseCard(
    onOpenPairing: () -> Unit,
    onOpenHistory: () -> Unit,
    onOpenLabour: () -> Unit,
    viewModel: PulseViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    LaunchedEffect(Unit) { viewModel.refresh() }

    StruvaCard(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)) {
        when (val s = state) {
            is PulseUiState.Idle, is PulseUiState.Loading ->
                CircularProgressIndicator(modifier = Modifier.height(20.dp))

            is PulseUiState.Error -> {
                Text("Nabız yüklenemedi", style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.height(4.dp))
                Text(s.message, style = MaterialTheme.typography.bodySmall, color = StruvaColors.Muted)
            }

            is PulseUiState.NoPair -> {
                Text("Günlük nabız", style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.height(4.dp))
                Text(
                    "Partnerinle günlük check-in başlat, ikiniz de her gün küçük bir soruya cevap verin.",
                    style = MaterialTheme.typography.bodySmall,
                    color = StruvaColors.Muted,
                )
                Spacer(Modifier.height(12.dp))
                StruvaOutlinedButton(onClick = onOpenPairing, modifier = Modifier.fillMaxWidth()) {
                    Text("Partner eşleştir")
                }
            }

            is PulseUiState.PendingInvite -> {
                Text("Davet bekleniyor", style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.height(4.dp))
                Text(
                    s.inviteCode,
                    style = MaterialTheme.typography.headlineSmall.copy(fontFamily = IBMPlexMono, fontWeight = FontWeight.SemiBold),
                    color = StruvaColors.Accent,
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    "Partnerin bu kodu girince günlük nabız burada başlayacak.",
                    style = MaterialTheme.typography.bodySmall,
                    color = StruvaColors.Muted,
                )
            }

            is PulseUiState.Unanswered -> {
                Text(s.questionText, style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.height(16.dp))
                UnansweredGauge(checkinId = s.checkinId, onSubmit = viewModel::submitAnswer)
                PulseLinks(onOpenHistory, onOpenLabour)
            }

            is PulseUiState.WaitingForPartner -> {
                Text("Günlük nabız", style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.height(16.dp))
                PulseGaugeTrack(value = s.myAnswer)
                Spacer(Modifier.height(4.dp))
                GaugeEndLabels()
                Spacer(Modifier.height(16.dp))
                PulsePartnerRow(value = null, waiting = true)
                PulseLinks(onOpenHistory, onOpenLabour)
            }

            is PulseUiState.BothAnswered -> {
                Text(
                    "BUGÜN · 2/2 CEVAPLANDI",
                    style = MaterialTheme.typography.labelSmall,
                    color = StruvaColors.Accent,
                )
                Spacer(Modifier.height(16.dp))
                PulseGaugeTrack(value = s.myAnswer)
                Spacer(Modifier.height(4.dp))
                GaugeEndLabels()
                Spacer(Modifier.height(16.dp))
                PulsePartnerRow(value = s.partnerAnswer, waiting = false)
                PulseLinks(onOpenHistory, onOpenLabour)
            }
        }
    }
}

// Cevaplanmamış durumda göstergeyi kendi seçim durumuyla sarar: dokunmak
// artık anında göndermiyor, topu o pozisyona taşıyor (bkz. PulseGaugeTrack'in
// animasyonu) — kullanıcı fikrini değiştirip başka bir noktaya dokunabilir,
// yalnızca "Gönder"e basınca kesinleşiyor. checkinId'yi remember anahtarı
// yapıyoruz ki yeni bir güne geçildiğinde (yeni checkinId) seçim sıfırlansın.
@Composable
private fun UnansweredGauge(checkinId: String, onSubmit: (Int) -> Unit) {
    var selected by remember(checkinId) { mutableStateOf<Int?>(null) }

    PulseGaugeTrack(value = selected, onTap = { selected = it })
    Spacer(Modifier.height(4.dp))
    GaugeEndLabels()
    Spacer(Modifier.height(12.dp))
    StruvaButton(
        onClick = { selected?.let(onSubmit) },
        enabled = selected != null,
        modifier = Modifier.fillMaxWidth(),
    ) { Text("Gönder") }
}

// Tek gösterge hem girdi hem gösterim için: onTap verilirse 1-5 arası 5 eşit
// dokunma alanı aktif olur (değer her dokunuşta değişir, "geri alma" budur),
// verilmezse salt-okunur (WaitingForPartner/BothAnswered). Top'un yatay
// konumu iç içe fillMaxWidth(fraction) + CenterEnd hizalama ile piksel
// hesaplamadan elde ediliyor; animateFloatAsState topu bir değerden diğerine
// kaydırarak taşıyor, ani zıplama yerine "dinamik" hissettiriyor.
@Composable
private fun PulseGaugeTrack(value: Int?, onTap: ((Int) -> Unit)? = null) {
    val fraction by animateFloatAsState(
        targetValue = value?.let { ((it - 1) / 4f).coerceIn(0.06f, 1f) } ?: 0f,
        animationSpec = tween(200),
        label = "pulseGauge",
    )

    Box(Modifier.fillMaxWidth().height(KnobSize), contentAlignment = Alignment.CenterStart) {
        Box(
            Modifier
                .fillMaxWidth()
                .height(TrackHeight)
                .clip(RoundedCornerShape(99.dp))
                .background(StruvaColors.Border),
        )
        if (value != null) {
            Box(
                Modifier
                    .fillMaxWidth(fraction)
                    .height(TrackHeight)
                    .clip(RoundedCornerShape(99.dp))
                    .background(StruvaColors.Accent),
            )
            Box(Modifier.fillMaxWidth(fraction), contentAlignment = Alignment.CenterEnd) {
                Box(
                    modifier = Modifier
                        .size(KnobSize)
                        .clip(CircleShape)
                        .background(StruvaColors.Accent),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        "$value",
                        style = MaterialTheme.typography.labelMedium.copy(fontFamily = IBMPlexMono, fontWeight = FontWeight.SemiBold),
                        color = StruvaColors.OnAccent,
                    )
                }
            }
        }
        if (onTap != null) {
            Row(Modifier.fillMaxWidth().fillMaxHeight()) {
                for (v in 1..5) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .clickable { onTap(v) },
                    )
                }
            }
        }
    }
}

// Yalnızca aktif eşleşmede (soru durumlarında) görünür — geçmiş/özet ve
// emek defteri eşleşmesiz anlamsız.
@Composable
private fun PulseLinks(onOpenHistory: () -> Unit, onOpenLabour: () -> Unit) {
    Spacer(Modifier.height(8.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        TextButton(onClick = onOpenHistory, contentPadding = PaddingValues(0.dp)) {
            Text("Geçmiş ve özet →", style = MaterialTheme.typography.labelMedium, color = StruvaColors.Accent)
        }
        TextButton(onClick = onOpenLabour, contentPadding = PaddingValues(0.dp)) {
            Text("Emek defteri →", style = MaterialTheme.typography.labelMedium, color = StruvaColors.Accent)
        }
    }
}

@Composable
private fun GaugeEndLabels() {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text("1 · zayıf", style = MaterialTheme.typography.labelSmall)
        Text("5 · güçlü", style = MaterialTheme.typography.labelSmall)
    }
}

// Partnerin cevabı ana göstergeden bilerek daha ince/soluk — ikincil bilgi,
// ana odak hep kendi cevabın.
@Composable
private fun PulsePartnerRow(value: Int?, waiting: Boolean) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text("Partnerin", style = MaterialTheme.typography.labelSmall)
        Box(
            modifier = Modifier
                .weight(1f)
                .height(PartnerTrackHeight)
                .clip(RoundedCornerShape(99.dp))
                .background(StruvaColors.Border),
        ) {
            if (value != null) {
                val fraction = ((value - 1) / 4f).coerceIn(0.08f, 1f)
                Box(
                    Modifier
                        .fillMaxWidth(fraction)
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(99.dp))
                        .background(StruvaColors.Muted),
                )
            }
        }
        Text(
            if (waiting) "Bekleniyor…" else "$value",
            style = MaterialTheme.typography.labelSmall,
        )
    }
}
