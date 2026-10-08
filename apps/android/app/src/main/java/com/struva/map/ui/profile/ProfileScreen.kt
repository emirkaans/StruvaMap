package com.struva.map.ui.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.ui.common.ListRow
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.common.StruvaOutlinedButton
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors

// Hesabın kim olduğu ve kiminle eşleştiği. Kullanıcı adı, şifre, gizlilik ve
// hesap silme buradan açılan Ayarlar ekranında (bkz. SettingsScreen).
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onOpenPulsePairing: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenLogin: () -> Unit,
    onOpenRegister: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel(),
) {
    val username by viewModel.username.collectAsState()
    val isGuest by viewModel.isGuest.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Profil") },
                colors = struvaTopAppBarColors(),
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(padding)
                .padding(vertical = 16.dp),
        ) {
            Column(Modifier.padding(horizontal = 16.dp)) {
                if (isGuest) {
                    // Anonim oturum: çıkış yapma bilerek gösterilmiyor; anonim
                    // oturumdan çıkarsan geri dönecek bir kullanıcı adı/şifren
                    // olmadığı için o kimliğe (ve sonuçlarına) bir daha erişemezsin.
                    Text("Misafir olarak kullanıyorsun", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Sonuçların bu cihazda tutuluyor. Başka bir cihazdan erişmek ya da partnerinle eşleşmek istersen bir hesap oluşturman gerekir.",
                        style = MaterialTheme.typography.bodySmall,
                        color = StruvaColors.Muted,
                    )
                    Spacer(Modifier.height(16.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        StruvaOutlinedButton(onClick = onOpenLogin, modifier = Modifier.weight(1f)) {
                            Text("Giriş yap")
                        }
                        StruvaButton(onClick = onOpenRegister, modifier = Modifier.weight(1f)) {
                            Text("Kayıt ol")
                        }
                    }
                } else {
                    Text("Kullanıcı adı", style = MaterialTheme.typography.labelMedium)
                    Spacer(Modifier.height(4.dp))
                    Text(username ?: "…", style = MaterialTheme.typography.titleMedium)
                }
            }
            Spacer(Modifier.height(16.dp))
            HorizontalDivider(color = StruvaColors.Border)
            ListRow("Partner eşleştirme", onClick = onOpenPulsePairing)
            HorizontalDivider(color = StruvaColors.Border)
            ListRow("Ayarlar", onClick = onOpenSettings)
            HorizontalDivider(color = StruvaColors.Border)

            if (!isGuest) {
                Spacer(Modifier.height(24.dp))
                StruvaOutlinedButton(
                    onClick = viewModel::logout,
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                ) { Text("Çıkış yap") }
            }
        }
    }
}
