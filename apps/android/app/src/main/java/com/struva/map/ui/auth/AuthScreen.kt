package com.struva.map.ui.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
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
import com.struva.map.ui.common.StruvaLogo
import com.struva.map.ui.theme.StruvaColors

// Web'de karşılığı olmayan tek ekran (auth) — .admin-input'un diliyle
// tutarlı: 8px radius, ince border, odakta accent renk.
private val FieldShape = RoundedCornerShape(8.dp)
private val fieldColors
    @Composable get() = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = StruvaColors.Accent,
        unfocusedBorderColor = StruvaColors.Border,
        focusedLabelColor = StruvaColors.Accent,
        unfocusedLabelColor = StruvaColors.Muted,
        cursorColor = StruvaColors.Accent,
    )

private enum class AuthMode { LOGIN, REGISTER, FORGOT_PASSWORD }

@Composable
fun AuthScreen(viewModel: AuthViewModel = hiltViewModel()) {
    var mode by remember { mutableStateOf(AuthMode.LOGIN) }

    Scaffold { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp),
            verticalArrangement = Arrangement.Center,
        ) {
            StruvaLogo(style = MaterialTheme.typography.headlineLarge)
            Spacer(Modifier.height(40.dp))
            when (mode) {
                AuthMode.LOGIN, AuthMode.REGISTER -> LoginOrRegisterForm(
                    viewModel = viewModel,
                    isRegisterMode = mode == AuthMode.REGISTER,
                    onToggleMode = { mode = if (mode == AuthMode.REGISTER) AuthMode.LOGIN else AuthMode.REGISTER },
                    onForgotPassword = {
                        viewModel.resetForgotPasswordFlow()
                        mode = AuthMode.FORGOT_PASSWORD
                    },
                )
                AuthMode.FORGOT_PASSWORD -> ForgotPasswordForm(
                    viewModel = viewModel,
                    onBackToLogin = { mode = AuthMode.LOGIN },
                )
            }
        }
    }
}

@Composable
private fun LoginOrRegisterForm(
    viewModel: AuthViewModel,
    isRegisterMode: Boolean,
    onToggleMode: () -> Unit,
    onForgotPassword: () -> Unit,
) {
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var securityQuestion by remember { mutableStateOf("") }
    var securityAnswer by remember { mutableStateOf("") }
    val formState by viewModel.formState.collectAsState()
    val isLoading = formState is AuthFormState.Loading

    Text(
        if (isRegisterMode) "Hesap oluştur" else "Giriş yap",
        style = MaterialTheme.typography.headlineSmall,
    )
    Spacer(Modifier.height(24.dp))
    OutlinedTextField(
        value = username,
        onValueChange = { username = it },
        label = { Text("Kullanıcı adı") },
        singleLine = true,
        shape = FieldShape,
        colors = fieldColors,
        modifier = Modifier.fillMaxWidth(),
    )
    Spacer(Modifier.height(12.dp))
    OutlinedTextField(
        value = password,
        onValueChange = { password = it },
        label = { Text("Şifre") },
        singleLine = true,
        visualTransformation = PasswordVisualTransformation(),
        shape = FieldShape,
        colors = fieldColors,
        modifier = Modifier.fillMaxWidth(),
    )
    if (isRegisterMode) {
        Spacer(Modifier.height(20.dp))
        Text(
            "Güvenlik sorusu (opsiyonel — şifreni unutursan kurtarma için kullanılır)",
            style = MaterialTheme.typography.bodySmall,
            color = StruvaColors.Muted,
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = securityQuestion,
            onValueChange = { securityQuestion = it },
            label = { Text("Soru") },
            singleLine = true,
            shape = FieldShape,
            colors = fieldColors,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = securityAnswer,
            onValueChange = { securityAnswer = it },
            label = { Text("Cevap") },
            singleLine = true,
            shape = FieldShape,
            colors = fieldColors,
            modifier = Modifier.fillMaxWidth(),
        )
    }
    val currentState = formState
    if (currentState is AuthFormState.Error) {
        Spacer(Modifier.height(8.dp))
        Text(currentState.message, color = MaterialTheme.colorScheme.error)
    }
    Spacer(Modifier.height(20.dp))
    StruvaButton(
        onClick = {
            if (isRegisterMode) {
                viewModel.register(
                    username,
                    password,
                    securityQuestion.takeIf { it.isNotBlank() },
                    securityAnswer.takeIf { it.isNotBlank() },
                )
            } else {
                viewModel.login(username, password)
            }
        },
        enabled = !isLoading && username.isNotBlank() && password.isNotBlank() &&
            (securityQuestion.isBlank() == securityAnswer.isBlank()),
        modifier = Modifier.fillMaxWidth(),
    ) {
        if (isLoading) {
            CircularProgressIndicator(modifier = Modifier.height(20.dp), strokeWidth = 2.dp)
        } else {
            Text(if (isRegisterMode) "Kayıt ol" else "Giriş yap")
        }
    }
    if (!isRegisterMode) {
        Spacer(Modifier.height(4.dp))
        TextButton(onClick = onForgotPassword) { Text("Şifremi unuttum") }
    }
    Spacer(Modifier.height(4.dp))
    TextButton(onClick = onToggleMode) {
        Text(if (isRegisterMode) "Zaten hesabın var mı? Giriş yap" else "Hesabın yok mu? Kayıt ol")
    }
}

@Composable
private fun ForgotPasswordForm(viewModel: AuthViewModel, onBackToLogin: () -> Unit) {
    val state by viewModel.forgotPasswordState.collectAsState()

    Text("Şifremi unuttum", style = MaterialTheme.typography.headlineSmall)
    Spacer(Modifier.height(24.dp))

    when (val s = state) {
        is ForgotPasswordState.EnterUsername -> {
            var username by remember { mutableStateOf("") }
            OutlinedTextField(
                value = username,
                onValueChange = { username = it },
                label = { Text("Kullanıcı adı") },
                singleLine = true,
                shape = FieldShape,
                colors = fieldColors,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(20.dp))
            StruvaButton(
                onClick = { viewModel.fetchSecurityQuestion(username) },
                enabled = username.isNotBlank(),
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Devam et") }
        }

        is ForgotPasswordState.Loading -> CircularProgressIndicator()

        is ForgotPasswordState.AnswerQuestion -> {
            var answer by remember { mutableStateOf("") }
            var newPassword by remember { mutableStateOf("") }
            var confirmPassword by remember { mutableStateOf("") }
            Text(s.question, style = MaterialTheme.typography.bodyLarge)
            Spacer(Modifier.height(16.dp))
            OutlinedTextField(
                value = answer,
                onValueChange = { answer = it },
                label = { Text("Cevap") },
                singleLine = true,
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
            Spacer(Modifier.height(20.dp))
            StruvaButton(
                onClick = { viewModel.resetPassword(s.username, answer, newPassword, s.question) },
                enabled = answer.isNotBlank() && newPassword.length >= 8 && newPassword == confirmPassword,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Şifreyi sıfırla") }
        }

        is ForgotPasswordState.Done -> {
            Text(
                "Şifren güncellendi. Şimdi yeni şifrenle giriş yapabilirsin.",
                style = MaterialTheme.typography.bodyMedium,
            )
            Spacer(Modifier.height(20.dp))
            StruvaButton(onClick = onBackToLogin, modifier = Modifier.fillMaxWidth()) { Text("Girişe dön") }
        }

        is ForgotPasswordState.Error -> {
            Text(s.message, color = MaterialTheme.colorScheme.error)
            Spacer(Modifier.height(20.dp))
            StruvaButton(
                onClick = { viewModel.clearForgotPasswordError(s.fallback) },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Tekrar dene") }
        }
    }

    Spacer(Modifier.height(4.dp))
    TextButton(onClick = onBackToLogin) { Text("Girişe dön") }
}
