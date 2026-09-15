package com.struva.map.ui.theme

import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.TopAppBarColors
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

// Web'deki struva.css palet/tema token'larının birebir karşılığı — marka
// tutarlılığı iki platform arasında korunsun diye. Web'de tek tema (koyu)
// var, burada da öyle.
private val StruvaDarkColors = darkColorScheme(
    primary = StruvaColors.Accent,
    onPrimary = StruvaColors.OnAccent,
    primaryContainer = StruvaColors.AccentSoft,
    onPrimaryContainer = StruvaColors.Text,
    secondary = StruvaColors.Accent,
    onSecondary = StruvaColors.OnAccent,
    background = StruvaColors.Background,
    onBackground = StruvaColors.Text,
    surface = StruvaColors.Surface,
    onSurface = StruvaColors.Text,
    surfaceVariant = StruvaColors.Surface,
    onSurfaceVariant = StruvaColors.Muted,
    outline = StruvaColors.Border,
    outlineVariant = StruvaColors.Border,
    error = StruvaColors.Bad,
    onError = StruvaColors.OnAccent,
)

@Composable
fun StruvaMapTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = StruvaDarkColors,
        typography = StruvaTypography,
        content = content,
    )
}

// Web'de header sayfa arka planıyla aynı tonda, ton geçişli elevation
// tint'i yok — M3'ün varsayılan tonal elevation'ını burada bilerek iptal
// ediyoruz.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun struvaTopAppBarColors(): TopAppBarColors = TopAppBarDefaults.topAppBarColors(
    containerColor = StruvaColors.Background,
    scrolledContainerColor = StruvaColors.Background,
    titleContentColor = StruvaColors.Text,
    navigationIconContentColor = StruvaColors.Text,
    actionIconContentColor = StruvaColors.Accent,
)
