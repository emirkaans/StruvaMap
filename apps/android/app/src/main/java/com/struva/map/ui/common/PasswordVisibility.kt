package com.struva.map.ui.common

import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import com.struva.map.R
import com.struva.map.ui.theme.StruvaColors

// Şifre alanlarının sağındaki göz ikonu. Her alan kendi görünürlük durumunu
// tutar; biri açılınca diğerleri gizli kalır.
@Composable
fun PasswordVisibilityToggle(visible: Boolean, onToggle: () -> Unit) {
    IconButton(onClick = onToggle) {
        Icon(
            painter = painterResource(if (visible) R.drawable.ic_visibility_off else R.drawable.ic_visibility),
            contentDescription = if (visible) "Şifreyi gizle" else "Şifreyi göster",
            tint = StruvaColors.Muted,
        )
    }
}

fun passwordTransformation(visible: Boolean): VisualTransformation =
    if (visible) VisualTransformation.None else PasswordVisualTransformation()
