package com.struva.map.ui.profile

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
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.common.StruvaOutlinedButton
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onOpenPrivacy: () -> Unit,
    onOpenPulsePairing: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel(),
) {
    val username by viewModel.username.collectAsState()
    val actionState by viewModel.actionState.collectAsState()
    var showDeleteConfirm by remember { mutableStateOf(false) }
    var pendingUsernameFieldReset by remember { mutableStateOf(0) }

    // Kullanıcı adı değişimi başarılı olunca alandaki eski değeri temizle.
    LaunchedEffect(actionState) {
        if (actionState is ProfileActionState.Success) pendingUsernameFieldReset++
    }

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
                .padding(16.dp),
        ) {
            Text("Kullanıcı adı", style = MaterialTheme.typography.labelMedium)
            Spacer(Modifier.height(4.dp))
            Text(username ?: "…", style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(24.dp))

            val currentAction = actionState
            if (currentAction is ProfileActionState.Error) {
                Text(currentAction.message, color = MaterialTheme.colorScheme.error)
                Spacer(Modifier.height(16.dp))
            } else if (currentAction is ProfileActionState.Success) {
                Text(currentAction.message, color = StruvaColors.Good)
                Spacer(Modifier.height(16.dp))
            }

            StruvaOutlinedButton(
                onClick = viewModel::logout,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Çıkış yap") }

            Spacer(Modifier.height(12.dp))
            TextButton(onClick = onOpenPulsePairing) { Text("Partner eşleştirme") }
            Spacer(Modifier.height(4.dp))
            TextButton(onClick = onOpenPrivacy) { Text("Gizlilik & KVKK") }

            Spacer(Modifier.height(16.dp))
            HorizontalDivider(color = StruvaColors.Border)
            Spacer(Modifier.height(20.dp))

            ChangeUsernameSection(
                isLoading = actionState is ProfileActionState.Loading,
                resetKey = pendingUsernameFieldReset,
                onSubmit = { viewModel.changeUsername(it) },
            )

            Spacer(Modifier.height(28.dp))
            HorizontalDivider(color = StruvaColors.Border)
            Spacer(Modifier.height(20.dp))

            ChangePasswordSection(
                isLoading = actionState is ProfileActionState.Loading,
                resetKey = pendingUsernameFieldReset,
                onSubmit = { current, new -> viewModel.changePassword(current, new) },
            )

            Spacer(Modifier.height(28.dp))
            HorizontalDivider(color = StruvaColors.Border)
            Spacer(Modifier.height(20.dp))

            Text("Hesabı sil", style = MaterialTheme.typography.titleSmall)
            Spacer(Modifier.height(8.dp))
            Text(
                "Hesabın ve girişin kalıcı olarak silinir. Geçmiş sonuçların kişisel bilgi taşımadan (kime ait olduğu bilgisi silinerek) saklanmaya devam eder.",
                style = MaterialTheme.typography.bodySmall,
                color = StruvaColors.Muted,
            )
            Spacer(Modifier.height(12.dp))
            TextButton(
                onClick = { showDeleteConfirm = true },
                colors = ButtonDefaults.textButtonColors(contentColor = StruvaColors.Bad),
            ) { Text("Hesabımı sil") }
        }
    }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Hesabını silmek istediğine emin misin?") },
            text = { Text("Bu işlem geri alınamaz.") },
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
    var newPassword by remember(resetKey) { mutableStateOf("") }
    var confirmPassword by remember(resetKey) { mutableStateOf("") }

    Text("Şifreyi değiştir", style = MaterialTheme.typography.titleSmall)
    Spacer(Modifier.height(12.dp))
    OutlinedTextField(
        value = currentPassword,
        onValueChange = { currentPassword = it },
        label = { Text("Mevcut şifre") },
        singleLine = true,
        visualTransformation = PasswordVisualTransformation(),
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
        visualTransformation = PasswordVisualTransformation(),
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
        visualTransformation = PasswordVisualTransformation(),
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
