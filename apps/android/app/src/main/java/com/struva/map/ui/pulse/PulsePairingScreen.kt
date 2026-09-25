package com.struva.map.ui.pulse

import android.content.Intent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import com.struva.map.network.dto.PairDto
import com.struva.map.ui.auth.AuthViewModel
import com.struva.map.ui.auth.isGuestSession
import com.struva.map.ui.common.BackIconButton
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.common.StruvaOutlinedButton
import com.struva.map.ui.theme.IBMPlexMono
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

private enum class PairingMode { Choose, Create, Join }

private val TR = Locale("tr")
private val PairedSinceFormatter = DateTimeFormatter.ofPattern("d MMMM yyyy", TR)

private val FieldShape = RoundedCornerShape(8.dp)

// Kod-elle-gir akışı: deep link kurulmuyor (bkz. FcmService.kt yorumu,
// bilinçli kapsam dışı), davet kodu ACTION_SEND ile paylaşılıyor —
// InviteAndCompareSection'daki davet paylaşım deseniyle aynı.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PulsePairingScreen(
    onBack: () -> Unit,
    onOpenLogin: () -> Unit,
    onOpenRegister: () -> Unit,
    viewModel: PulseViewModel = hiltViewModel(),
    authViewModel: AuthViewModel = hiltViewModel(),
    pairViewModel: PairManagementViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    val pairState by pairViewModel.state.collectAsState()
    val sessionStatus by authViewModel.sessionStatus.collectAsState()
    val isGuest = sessionStatus.isGuestSession()
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
            if (isGuest) {
                // Nabız eşleştirme çok cihazlı, kalıcı kimlik istiyor — anonim
                // oturum bunu karşılamaz (bkz. plan Faz B). Backend'de zorlayıcı
                // bir kısıt yok (pulse_pairs herhangi bir auth.users'ı kabul
                // ediyor), bu yalnızca bir UX yönlendirmesi.
                GuestGateSection(onOpenLogin = onOpenLogin, onOpenRegister = onOpenRegister)
                return@Column
            }
            when (val ps = pairState) {
                is PairManagementUiState.Loading -> CircularProgressIndicator()
                is PairManagementUiState.Error -> Column {
                    Text(ps.message, color = MaterialTheme.colorScheme.error)
                    Spacer(Modifier.height(12.dp))
                    StruvaOutlinedButton(onClick = pairViewModel::load) { Text("Tekrar dene") }
                }
                is PairManagementUiState.Paired -> PairedSection(
                    pair = ps.pair,
                    busy = ps.busy,
                    actionError = ps.actionError,
                    onEnd = pairViewModel::endPairing,
                )
                is PairManagementUiState.NotPaired -> when (mode) {
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
}

@Composable
private fun PairedSection(pair: PairDto, busy: Boolean, actionError: String?, onEnd: () -> Unit) {
    // 0 = kapalı, 1 = ilk uyarı, 2 = geri alınamaz onayı — art arda iki farklı
    // metinli dialog, kazara tek dokunuşla sonlandırmayı engellemek için
    // (bkz. planlama: tek AlertDialog'un "Hesabı sil" gibi tek adımlık akışı
    // burada yeterli değil, iki kişiyi ve paylaşılan geçmişi etkiliyor).
    var confirmStep by remember { mutableStateOf(0) }
    val partnerName = pair.partnerUsername ?: "Partnerin"
    val since = remember(pair.createdAt) { OffsetDateTime.parse(pair.createdAt).toLocalDate().format(PairedSinceFormatter) }

    Text("Eşleşiksin", style = MaterialTheme.typography.titleSmall)
    Spacer(Modifier.height(8.dp))
    Text(
        "$partnerName ile $since tarihinden beri günlük nabız ve emek defterini paylaşıyorsunuz.",
        style = MaterialTheme.typography.bodyMedium,
        color = StruvaColors.Muted,
    )
    if (actionError != null) {
        Spacer(Modifier.height(12.dp))
        Text(actionError, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
    }
    Spacer(Modifier.height(24.dp))
    TextButton(
        onClick = { confirmStep = 1 },
        enabled = !busy,
        colors = ButtonDefaults.textButtonColors(contentColor = StruvaColors.Bad),
    ) { Text("Eşleşmeyi sonlandır") }

    if (confirmStep == 1) {
        AlertDialog(
            onDismissRequest = { confirmStep = 0 },
            title = { Text("Eşleşmeyi sonlandırmak istediğine emin misin?") },
            text = {
                Text("$partnerName ile eşleşmeni sonlandırırsan nabız geçmişiniz ve emek defteriniz birlikte kaybolur.")
            },
            confirmButton = {
                TextButton(onClick = { confirmStep = 2 }) { Text("Devam et") }
            },
            dismissButton = {
                TextButton(onClick = { confirmStep = 0 }) { Text("Vazgeç") }
            },
        )
    }
    if (confirmStep == 2) {
        AlertDialog(
            onDismissRequest = { confirmStep = 0 },
            title = { Text("Bu işlem geri alınamaz") },
            text = { Text("Kayıtlar 30 gün sonra kalıcı silinir. Eşleşme şimdi sonlandırılsın mı?") },
            confirmButton = {
                TextButton(
                    onClick = { confirmStep = 0; onEnd() },
                    colors = ButtonDefaults.textButtonColors(contentColor = StruvaColors.Bad),
                ) { Text("Evet, sonlandır") }
            },
            dismissButton = {
                TextButton(onClick = { confirmStep = 0 }) { Text("Vazgeç") }
            },
        )
    }
}

@Composable
private fun GuestGateSection(onOpenLogin: () -> Unit, onOpenRegister: () -> Unit) {
    Text("Önce bir hesap gerekiyor", style = MaterialTheme.typography.titleSmall)
    Spacer(Modifier.height(8.dp))
    Text(
        "Partnerinle eşleşip günlük nabız check-in'ine başlamak için bir hesaba ihtiyacın var — yeni bir hesap açabilir ya da elindeki hesaba giriş yapabilirsin.",
        style = MaterialTheme.typography.bodyMedium,
        color = StruvaColors.Muted,
    )
    Spacer(Modifier.height(16.dp))
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        StruvaOutlinedButton(onClick = onOpenLogin, modifier = Modifier.weight(1f)) { Text("Giriş yap") }
        StruvaButton(onClick = onOpenRegister, modifier = Modifier.weight(1f)) { Text("Kayıt ol") }
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
        is PulseUiState.Idle, is PulseUiState.Loading -> CircularProgressIndicator()

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
