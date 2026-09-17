package com.struva.map.ui.common

import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics

// App genelinde geri butonu ikon yerine düz "←" metni kullanıyor (bkz.
// design pass notları) — ekran okuyucu için semantics ile etiket ekleniyor.
@Composable
fun BackIconButton(onClick: () -> Unit) {
    IconButton(onClick = onClick, modifier = Modifier.semantics { contentDescription = "Geri" }) {
        Text("←")
    }
}
