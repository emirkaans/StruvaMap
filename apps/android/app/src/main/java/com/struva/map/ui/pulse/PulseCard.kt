package com.struva.map.ui.pulse

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.ui.common.StruvaCard
import com.struva.map.ui.common.StruvaOutlinedButton
import com.struva.map.ui.theme.IBMPlexMono
import com.struva.map.ui.theme.StruvaColors

// HomeScreen'in en üstüne sabit kart olarak eklenir (bkz. HomeScreen.kt) —
// ayrı tam ekran değil, günde 2 açılışın tetikleyicisi Home'un ilk göründüğü
// an bu kartın görünür olması. NoPair/PendingInvite'ta eşleştirme akışı
// PulsePairingScreen'e devrediliyor, burada yalnızca durum özeti var.
@Composable
fun PulseCard(
    onOpenPairing: () -> Unit,
    viewModel: PulseViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    LaunchedEffect(Unit) { viewModel.refresh() }

    StruvaCard(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)) {
        when (val s = state) {
            is PulseUiState.Loading -> CircularProgressIndicator(modifier = Modifier.height(20.dp))

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
                Text("Günlük nabız", style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.height(8.dp))
                Text(s.questionText, style = MaterialTheme.typography.bodyMedium)
                Spacer(Modifier.height(12.dp))
                PulseScaleRow(onSelect = viewModel::submitAnswer)
            }

            is PulseUiState.WaitingForPartner -> {
                Text("Günlük nabız", style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.height(4.dp))
                Text(
                    "Cevabın kaydedildi (${s.myAnswer}/5). Partnerin yanıtlayınca burada göreceksin.",
                    style = MaterialTheme.typography.bodySmall,
                    color = StruvaColors.Muted,
                )
            }

            is PulseUiState.BothAnswered -> {
                Text("Bugünün nabzı", style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.height(4.dp))
                Text("Sen: ${s.myAnswer}/5 · Partnerin: ${s.partnerAnswer}/5", style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

@Composable
private fun PulseScaleRow(onSelect: (Int) -> Unit) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        for (value in 1..5) {
            StruvaOutlinedButton(onClick = { onSelect(value) }, modifier = Modifier.weight(1f)) {
                Text("$value")
            }
        }
    }
}
