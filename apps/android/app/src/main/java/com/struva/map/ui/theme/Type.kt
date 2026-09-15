@file:OptIn(ExperimentalTextApi::class)

package com.struva.map.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.ExperimentalTextApi
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.struva.map.R

// struva.css'teki üç fontun birebir karşılığı: Archivo (başlıklar), Source
// Sans 3 (gövde metni), IBM Plex Mono (skorlar/etiketler). Archivo ve
// Source Sans 3 Google Fonts'ta yalnızca variable font olarak dağıtılıyor —
// minSdk 26 zaten variable font'u destekliyor, ayrı statik ağırlık dosyası
// aramaya gerek yok.
private val Archivo = FontFamily(
    Font(
        R.font.archivo_variable,
        weight = FontWeight.Bold,
        variationSettings = FontVariation.Settings(FontVariation.weight(700)),
    ),
    Font(
        R.font.archivo_variable,
        weight = FontWeight.ExtraBold,
        variationSettings = FontVariation.Settings(FontVariation.weight(800)),
    ),
)

private val SourceSans3 = FontFamily(
    Font(
        R.font.source_sans_3_variable,
        weight = FontWeight.Normal,
        variationSettings = FontVariation.Settings(FontVariation.weight(400)),
    ),
    Font(
        R.font.source_sans_3_variable,
        weight = FontWeight.SemiBold,
        variationSettings = FontVariation.Settings(FontVariation.weight(600)),
    ),
    Font(
        R.font.source_sans_3_variable,
        weight = FontWeight.Bold,
        variationSettings = FontVariation.Settings(FontVariation.weight(700)),
    ),
)

val IBMPlexMono = FontFamily(
    Font(R.font.ibm_plex_mono_regular, weight = FontWeight.Normal),
    Font(R.font.ibm_plex_mono_medium, weight = FontWeight.Medium),
    Font(R.font.ibm_plex_mono_semibold, weight = FontWeight.SemiBold),
    Font(R.font.ibm_plex_mono_bold, weight = FontWeight.Bold),
)

// Rol eşlemesi: mevcut ekranlar zaten MaterialTheme.typography.* üzerinden
// çağırdığı için font/boyut değişikliği buradan otomatik yayılıyor, tek tek
// ekran dosyasına dokunmadan.
val StruvaTypography = Typography(
    headlineLarge = TextStyle(
        fontFamily = Archivo,
        fontWeight = FontWeight.ExtraBold,
        fontSize = 32.sp,
        lineHeight = 36.sp,
        letterSpacing = (-0.5).sp,
        color = StruvaColors.Text,
    ),
    headlineSmall = TextStyle(
        fontFamily = Archivo,
        fontWeight = FontWeight.ExtraBold,
        fontSize = 24.sp,
        lineHeight = 28.sp,
        letterSpacing = (-0.3).sp,
        color = StruvaColors.Text,
    ),
    // Not: TopAppBar başlığı varsayılan olarak titleLarge kullanır, o yüzden
    // burası dev RSI mono sayısı değil, normal başlık boyutunda kalmalı —
    // RSI sayısı ScoreDonut.kt kendi TextStyle'ını tanımlıyor.
    titleLarge = TextStyle(
        fontFamily = Archivo,
        fontWeight = FontWeight.Bold,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        color = StruvaColors.Text,
    ),
    titleMedium = TextStyle(
        fontFamily = Archivo,
        fontWeight = FontWeight.Bold,
        fontSize = 18.sp,
        lineHeight = 24.sp,
        color = StruvaColors.Text,
    ),
    titleSmall = TextStyle(
        fontFamily = Archivo,
        fontWeight = FontWeight.Bold,
        fontSize = 16.sp,
        lineHeight = 22.sp,
        color = StruvaColors.Text,
    ),
    // Material3'te Button/OutlinedButton/TextButton'ın varsayılan metin
    // stili — web'deki .btn gibi normal (mono değil) gövde fontu, 600
    // ağırlık olmalı. Renk kasıtlı olarak belirtilmiyor: her buton türü
    // kendi contentColor'ını (onPrimary/primary/vb.) LocalContentColor
    // üzerinden versin diye.
    labelLarge = TextStyle(
        fontFamily = SourceSans3,
        fontWeight = FontWeight.SemiBold,
        fontSize = 15.sp,
        lineHeight = 20.sp,
    ),
    labelMedium = TextStyle(
        fontFamily = IBMPlexMono,
        fontWeight = FontWeight.Medium,
        fontSize = 13.sp,
        lineHeight = 18.sp,
        color = StruvaColors.Muted,
    ),
    labelSmall = TextStyle(
        fontFamily = IBMPlexMono,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp,
        color = StruvaColors.Muted,
    ),
    bodyLarge = TextStyle(
        fontFamily = SourceSans3,
        fontWeight = FontWeight.Normal,
        fontSize = 17.sp,
        lineHeight = 25.sp,
        color = StruvaColors.Text,
    ),
    bodyMedium = TextStyle(
        fontFamily = SourceSans3,
        fontWeight = FontWeight.Normal,
        fontSize = 15.sp,
        lineHeight = 22.sp,
        color = StruvaColors.Text,
    ),
    bodySmall = TextStyle(
        fontFamily = SourceSans3,
        fontWeight = FontWeight.Normal,
        fontSize = 13.sp,
        lineHeight = 19.sp,
        color = StruvaColors.Muted,
    ),
)

// Web'deki .eyebrow: mono, izli harf aralığı, accent renk — "32 soru",
// "Soru 1/32" gibi küçük durum etiketleri için. labelLarge'dan bilerek ayrı:
// labelLarge artık Button/OutlinedButton'ın varsayılan metin stili.
val EyebrowStyle = TextStyle(
    fontFamily = IBMPlexMono,
    fontWeight = FontWeight.SemiBold,
    fontSize = 13.sp,
    lineHeight = 18.sp,
    letterSpacing = 1.sp,
    color = StruvaColors.Accent,
)
