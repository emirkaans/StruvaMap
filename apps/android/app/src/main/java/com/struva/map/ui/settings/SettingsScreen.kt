package com.struva.map.ui.settings

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.ui.common.ListRow
import com.struva.map.ui.common.PasswordVisibilityToggle
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.common.passwordTransformation
import com.struva.map.ui.profile.ProfileActionState
import com.struva.map.ui.profile.ProfileViewModel
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors

// Hesap ayarları: kullanıcı adı, şifre, gizlilik metni ve hesap silme.
// Misafir oturumda kullanıcı adı/şifre olmadığı için yalnızca gizlilik metni
// ve hesap oluşturma notu görünür.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onOpenPrivacy: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel(),
) {
    val isGuest by viewModel.isGuest.collectAsState()
    val actionState by viewModel.actionState.collectAsState()
    var showDeleteConfirm by remember { mutableStateOf(false) }
    var pendingFieldReset by remember { mutableStateOf(0) }

    // Bir değişiklik başarılı olunca alanlardaki eski değerleri temizle.
    LaunchedEffect(actionState) {
        if (actionState is ProfileActionState.Success) pendingFieldReset++
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Ayarlar") },
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
            if (isGuest) {
                Text(
                    "Kullanıcı adı ve şifre ayarları hesap oluşturunca burada açılır. Hesap oluşturmak için Profil sekmesine geç.",
                    style = MaterialTheme.typography.bodySmall,
                    color = StruvaColors.Muted,
                    modifier = Modifier.padding(horizontal = 16.dp),
                )
                Spacer(Modifier.height(16.dp))
            } else {
                Column(Modifier.padding(horizontal = 16.dp)) {
                    val currentAction = actionState
                    if (currentAction is ProfileActionState.Error) {
                        Text(currentAction.message, color = MaterialTheme.colorScheme.error)
                        Spacer(Modifier.height(16.dp))
                    } else if (currentAction is ProfileActionState.Success) {
                        Text(currentAction.message, color = StruvaColors.Good)
                        Spacer(Modifier.height(16.dp))
                    }

                    ChangeUsernameSection(
                        isLoading = actionState is ProfileActionState.Loading,
                        resetKey = pendingFieldReset,
                        onSubmit = { viewModel.changeUsername(it) },
                    )
                    Spacer(Modifier.height(28.dp))
                    HorizontalDivider(color = StruvaColors.Border)
                    Spacer(Modifier.height(20.dp))
                    ChangePasswordSection(
                        isLoading = actionState is ProfileActionState.Loading,
                        resetKey = pendingFieldReset,
                        onSubmit = { current, new -> viewModel.changePassword(current, new) },
                    )
                }
                Spacer(Modifier.height(28.dp))
            }

            HorizontalDivider(color = StruvaColors.Border)
            ListRow("Gizlilik metni", onClick = onOpenPrivacy)
            HorizontalDivider(color = StruvaColors.Border)

            if (!isGuest) {
                Spacer(Modifier.height(28.dp))
                Text(
                    "Hesabı sil",
                    style = MaterialTheme.typography.titleSmall,
                    modifier = Modifier.padding(horizontal = 16.dp),
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    "Hesabın, test sonuçların, kıyaslamaların, nabız ve ilişki kayıtların kalıcı olarak silinir.",
                    style = MaterialTheme.typography.bodySmall,
                    color = StruvaColors.Muted,
                    modifier = Modifier.padding(horizontal = 16.dp),
                )
                Spacer(Modifier.height(4.dp))
                ListRow("Hesabımı sil", onClick = { showDeleteConfirm = true }, color = StruvaColors.Bad)
            }
        }
    }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Hesabını silmek istediğine emin misin?") },
            text = { Text("Bu işlem geri alınamaz. Hesabın, test sonuçların, kıyaslamaların, nabız ve ilişki kayıtların kalıcı olarak silinir.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDeleteConfirm = false
                        viewModel.deleteAccount()
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = StruvaColors.Bad),
                ) { Text("Sil") }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) { Text("Vazgeç") }
            },
        )
    }
}

private val FieldShape = androidx.compose.foundation.shape.RoundedCornerShape(8.dp)
private val fieldColors
    @Composable get() = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = StruvaColors.Accent,
        unfocusedBorderColor = StruvaColors.Border,
        focusedLabelColor = StruvaColors.Accent,
        unfocusedLabelColor = StruvaColors.Muted,
        cursorColor = StruvaColors.Accent,
    )

@Composable
private fun ChangeUsernameSection(isLoading: Boolean, resetKey: Int, onSubmit: (String) -> Unit) {
    var newUsername by remember(resetKey) { mutableStateOf("") }

    Text("Kullanıcı adını değiştir", style = MaterialTheme.typography.titleSmall)
    Spacer(Modifier.height(12.dp))
    OutlinedTextField(
        value = newUsername,
        onValueChange = { newUsername = it },
        label = { Text("Yeni kullanıcı adı") },
        singleLine = true,
        shape = FieldShape,
        colors = fieldColors,
        modifier = Modifier.fillMaxWidth(),
    )
    Spacer(Modifier.height(12.dp))
    StruvaButton(
        onClick = { onSubmit(newUsername) },
        enabled = !isLoading && newUsername.isNotBlank(),
        modifier = Modifier.fillMaxWidth(),
    ) { Text("Kullanıcı adını güncelle") }
}

@Composable
private fun ChangePasswordSection(isLoading: Boolean, resetKey: Int, onSubmit: (String, String) -> Unit) {
    var currentPassword by remember(resetKey) { mutableStateOf("") }
    var showCurrentPassword by remember(resetKey) { mutableStateOf(false) }
    var newPassword by remember(resetKey) { mutableStateOf("") }
    var showNewPassword by remember(resetKey) { mutableStateOf(false) }
    var confirmPassword by remember(resetKey) { mutableStateOf("") }
    var showConfirmPassword by remember(resetKey) { mutableStateOf(false) }

    Text("Şifreyi değiştir", style = MaterialTheme.typography.titleSmall)
    Spacer(Modifier.height(12.dp))
    OutlinedTextField(
        value = currentPassword,
        onValueChange = { currentPassword = it },
        label = { Text("Mevcut şifre") },
        singleLine = true,
        visualTransformation = passwordTransformation(showCurrentPassword),
        trailingIcon = { PasswordVisibilityToggle(showCurrentPassword) { showCurrentPassword = !showCurrentPassword } },
        shape = FieldShape,
        colors = fieldColors,
        modifier = Modifier.fillMaxWidth(),
    )
    Spacer(Modifier.height(12.dp))
    OutlinedTextField(
        value = newPassword,
        onValueChange = { newPassword = it },
        label = { Text("Yeni şifre") },
        singleLine = true,
        visualTransformation = passwordTransformation(showNewPassword),
        trailingIcon = { PasswordVisibilityToggle(showNewPassword) { showNewPassword = !showNewPassword } },
        shape = FieldShape,
        colors = fieldColors,
        modifier = Modifier.fillMaxWidth(),
    )
    Spacer(Modifier.height(12.dp))
    OutlinedTextField(
        value = confirmPassword,
        onValueChange = { confirmPassword = it },
        label = { Text("Yeni şifre (tekrar)") },
        singleLine = true,
        visualTransformation = passwordTransformation(showConfirmPassword),
        trailingIcon = { PasswordVisibilityToggle(showConfirmPassword) { showConfirmPassword = !showConfirmPassword } },
        shape = FieldShape,
        colors = fieldColors,
        modifier = Modifier.fillMaxWidth(),
    )
    if (newPassword.isNotEmpty() && confirmPassword.isNotEmpty() && newPassword != confirmPassword) {
        Spacer(Modifier.height(8.dp))
        Text("Şifreler eşleşmiyor.", color = MaterialTheme.colorScheme.error)
    }
    Spacer(Modifier.height(12.dp))
    StruvaButton(
        onClick = { onSubmit(currentPassword, newPassword) },
        enabled = !isLoading && currentPassword.isNotBlank() && newPassword.length >= 8 && newPassword == confirmPassword,
        modifier = Modifier.fillMaxWidth(),
    ) { Text("Şifreyi güncelle") }
}
