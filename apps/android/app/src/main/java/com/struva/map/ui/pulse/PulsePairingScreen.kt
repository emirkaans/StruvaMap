package com.struva.map.ui.pulse

import android.content.Intent
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.ui.common.BackIconButton
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.common.StruvaOutlinedButton
import com.struva.map.ui.theme.IBMPlexMono
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors

private enum class PairingMode { Choose, Create, Join }

private val FieldShape = RoundedCornerShape(8.dp)

// Kod-elle-gir akışı: deep link kurulmuyor (bkz. FcmService.kt yorumu,
// bilinçli kapsam dışı), davet kodu ACTION_SEND ile paylaşılıyor —
// InviteAndCompareSection'daki davet paylaşım deseniyle aynı.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PulsePairingScreen(
    onBack: () -> Unit,
    viewModel: PulseViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    var mode by remember { mutableStateOf(PairingMode.Choose) }
    val context = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Partner eşleştirme") },
                navigationIcon = { BackIconButton(onClick = onBack) },
                colors = struvaTopAppBarColors(),
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
        ) {
            when (mode) {
                PairingMode.Choose -> ChooseSection(
                    onCreate = { mode = PairingMode.Create; viewModel.startPairing() },
                    onJoin = { mode = PairingMode.Join },
                )
                PairingMode.Create -> CreateSection(state = state, onBack = onBack)
                PairingMode.Join -> JoinSection(
                    state = state,
                    onSubmit = viewModel::acceptInvite,
                    onBack = onBack,
                )
            }
        }
    }
}

@Composable
private fun ChooseSection(onCreate: () -> Unit, onJoin: () -> Unit) {
    Text(
        "Partnerinle günlük nabız check-in'ine başlamak için bir davet kodu oluştur ya da sana gelen kodu gir.",
        style = MaterialTheme.typography.bodyMedium,
        color = StruvaColors.Muted,
    )
    Spacer(Modifier.height(24.dp))
    StruvaButton(onClick = onCreate, modifier = Modifier.fillMaxWidth()) { Text("Davet kodu oluştur") }
    Spacer(Modifier.height(12.dp))
    StruvaOutlinedButton(onClick = onJoin, modifier = Modifier.fillMaxWidth()) { Text("Kod girdim") }
}

@Composable
private fun CreateSection(state: PulseUiState, onBack: () -> Unit) {
    val context = LocalContext.current

    when (state) {
        is PulseUiState.Loading -> CircularProgressIndicator()

        is PulseUiState.PendingInvite -> {
            Text("Kodun hazır", style = MaterialTheme.typography.titleSmall)
            Spacer(Modifier.height(8.dp))
            Text(
                state.inviteCode,
                style = MaterialTheme.typography.headlineMedium.copy(fontFamily = IBMPlexMono, fontWeight = FontWeight.SemiBold),
                color = StruvaColors.Accent,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                "Bu kodu partnerine gönder, kabul edince günlük nabız burada başlayacak.",
                style = MaterialTheme.typography.bodySmall,
                color = StruvaColors.Muted,
            )
            Spacer(Modifier.height(16.dp))
            StruvaOutlinedButton(
                onClick = {
                    val sendIntent = Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(Intent.EXTRA_TEXT, "StruvaMap'te günlük nabız check-in'i için davet kodum: ${state.inviteCode}")
                    }
                    context.startActivity(Intent.createChooser(sendIntent, null))
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Kodu paylaş") }
        }

        is PulseUiState.Unanswered, is PulseUiState.WaitingForPartner, is PulseUiState.BothAnswered -> {
            Text("Partnerin kodu kabul etti, günlük nabız hazır.", style = MaterialTheme.typography.bodyMedium)
            Spacer(Modifier.height(16.dp))
            StruvaButton(onClick = onBack, modifier = Modifier.fillMaxWidth()) { Text("Anasayfaya dön") }
        }

        is PulseUiState.Error -> Text(state.message, color = MaterialTheme.colorScheme.error)

        is PulseUiState.NoPair -> Unit
    }
}

@Composable
private fun JoinSection(state: PulseUiState, onSubmit: (String) -> Unit, onBack: () -> Unit) {
    var code by remember { mutableStateOf("") }
    val joined = state is PulseUiState.Unanswered || state is PulseUiState.WaitingForPartner || state is PulseUiState.BothAnswered

    if (joined) {
        Text("Eşleştin, günlük nabız hazır.", style = MaterialTheme.typography.bodyMedium)
        Spacer(Modifier.height(16.dp))
        StruvaButton(onClick = onBack, modifier = Modifier.fillMaxWidth()) { Text("Anasayfaya dön") }
        return
    }

    Text("Partnerinden aldığın davet kodunu gir.", style = MaterialTheme.typography.bodyMedium, color = StruvaColors.Muted)
    Spacer(Modifier.height(16.dp))
    OutlinedTextField(
        value = code,
        onValueChange = { code = it.uppercase() },
        label = { Text("Davet kodu") },
        singleLine = true,
        shape = FieldShape,
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = StruvaColors.Accent,
            unfocusedBorderColor = StruvaColors.Border,
            focusedLabelColor = StruvaColors.Accent,
            unfocusedLabelColor = StruvaColors.Muted,
            cursorColor = StruvaColors.Accent,
        ),
        modifier = Modifier.fillMaxWidth(),
    )
    Spacer(Modifier.height(12.dp))
    StruvaButton(
        onClick = { onSubmit(code) },
        enabled = code.isNotBlank() && state !is PulseUiState.Loading,
        modifier = Modifier.fillMaxWidth(),
    ) { Text("Katıl") }

    if (state is PulseUiState.Error) {
        Spacer(Modifier.height(8.dp))
        Text(state.message, color = MaterialTheme.colorScheme.error)
    }
}
