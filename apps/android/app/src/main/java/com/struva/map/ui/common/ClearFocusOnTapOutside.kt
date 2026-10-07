package com.struva.map.ui.common

import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalFocusManager

// Uygulamanın kökünde: boş bir yere dokununca yazı alanı odağını bırakır ve
// klavye kapanır. Buton, alan gibi dokunmayı kendisi işleyen öğeler olayı
// tükettiği için onlara basmak odağı etkilemez; kaydırma da dokunma sayılmaz.
@Composable
fun ClearFocusOnTapOutside(content: @Composable () -> Unit) {
    val focusManager = LocalFocusManager.current
    Box(Modifier.fillMaxSize().pointerInput(Unit) { detectTapGestures { focusManager.clearFocus() } }) {
        content()
    }
}
