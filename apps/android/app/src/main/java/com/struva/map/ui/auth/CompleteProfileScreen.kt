package com.struva.map.ui.auth

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.ui.common.BackIconButton
import com.struva.map.ui.theme.struvaTopAppBarColors

// Anonim → gerçek hesap giriş noktası (bkz. plan: düşük sürtünmeli mobil
// giriş, Faz B). AuthScreen'in aksine bir NavHost route'u — Profil'deki
// "Hesabını kaydet" ve PulsePairingScreen'in misafir kapısından buraya
// düşülür. AuthScreen'deki AuthFlowBody'yi (giriş/kayıt/şifremi unuttum,
// aynı toggle'lar) REGISTER'da açık başlayarak yeniden kullanır — misafirin
// yalnızca yeni hesap açması değil, elinde zaten bir hesabı varsa ona giriş
// yapabilmesi de gerekiyor (önceki "yalnızca kayıt" formu bunu karşılamıyordu).
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CompleteProfileScreen(
    initialMode: AuthMode,
    onDone: () -> Unit,
    onBack: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel(),
) {
    val sessionStatus by viewModel.sessionStatus.collectAsState()
    val isGuest = sessionStatus.isGuestSession()

    // Hem kayıt (complete-profile) hem giriş (signInWith) sonrası oturum
    // anonim olmayan bir kullanıcıya döner — identities dolar, isGuest
    // false'a düşer. AuthFormState'de ayrı bir Success durumu yok (register()
    // sadece Idle'a döner, login() de öyle), bu yüzden "bitti" sinyali burada.
    LaunchedEffect(isGuest) {
        if (!isGuest) onDone()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Giriş yap / Kayıt ol") },
                navigationIcon = { BackIconButton(onClick = onBack) },
                colors = struvaTopAppBarColors(),
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp),
        ) {
            AuthFlowBody(viewModel = viewModel, initialMode = initialMode)
        }
    }
}
