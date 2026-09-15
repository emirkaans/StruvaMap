package com.struva.map.ui.common

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.struva.map.ui.theme.StruvaColors

private val ButtonShape = RoundedCornerShape(10.dp)

// Web'deki .btn: accent arka plan + on-accent (koyu lacivert) metin, 10px
// radius. Material3'ün varsayılan Button rengi bu kontrastı vermediği için
// (onPrimary tutarlı uygulanmıyordu) burada açıkça veriyoruz.
@Composable
fun StruvaButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    content: @Composable () -> Unit,
) {
    Button(
        onClick = onClick,
        modifier = modifier,
        enabled = enabled,
        shape = ButtonShape,
        colors = ButtonDefaults.buttonColors(
            containerColor = StruvaColors.Accent,
            contentColor = StruvaColors.OnAccent,
        ),
        content = { content() },
    )
}

// Web'deki .btn.secondary: şeffaf arka plan + accent border/metin.
@Composable
fun StruvaOutlinedButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    content: @Composable () -> Unit,
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier,
        enabled = enabled,
        shape = ButtonShape,
        border = BorderStroke(1.dp, StruvaColors.Accent),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = StruvaColors.Accent),
        content = { content() },
    )
}
