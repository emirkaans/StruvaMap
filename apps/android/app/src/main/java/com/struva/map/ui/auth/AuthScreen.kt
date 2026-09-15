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

@Composable
fun AuthScreen(viewModel: AuthViewModel = hiltViewModel()) {
    var isRegisterMode by remember { mutableStateOf(false) }
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    val formState by viewModel.formState.collectAsState()
    val isLoading = formState is AuthFormState.Loading

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
            val currentState = formState
            if (currentState is AuthFormState.Error) {
                Spacer(Modifier.height(8.dp))
                Text(currentState.message, color = MaterialTheme.colorScheme.error)
            }
            Spacer(Modifier.height(20.dp))
            StruvaButton(
                onClick = {
                    if (isRegisterMode) {
                        viewModel.register(username, password)
                    } else {
                        viewModel.login(username, password)
                    }
                },
                enabled = !isLoading && username.isNotBlank() && password.isNotBlank(),
                modifier = Modifier.fillMaxWidth(),
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.height(20.dp), strokeWidth = 2.dp)
                } else {
                    Text(if (isRegisterMode) "Kayıt ol" else "Giriş yap")
                }
            }
            Spacer(Modifier.height(12.dp))
            TextButton(onClick = { isRegisterMode = !isRegisterMode }) {
                Text(if (isRegisterMode) "Zaten hesabın var mı? Giriş yap" else "Hesabın yok mu? Kayıt ol")
            }
        }
    }
}
