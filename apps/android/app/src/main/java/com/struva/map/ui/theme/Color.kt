package com.struva.map.ui.theme

import androidx.compose.ui.graphics.Color

// Web'deki struva.css --bg/--surface/--accent/... token'larının birebir
// karşılığı — marka tek koyu tema, açık tema yok (bkz. struva.css yorumu:
// "tek tema: koyu").
object StruvaColors {
    val Background = Color(0xFF0B0C10)
    val Surface = Color(0xFF181A21)
    val Text = Color(0xFFECEDEF)
    val Muted = Color(0xFF9092A0)
    val Border = Color(0xFF26272F)
    val Accent = Color(0xFF5470FF)
    val AccentSoft = Color(0xFF171B30)
    val OnAccent = Color(0xFF050710)
    val Good = Color(0xFF5FBF82)
    val Warn = Color(0xFFD9A441)
    val Bad = Color(0xFFE0715A)

    // charts.tsx'teki bandHex — donut/pill grafiklerde kullanılan, biraz
    // daha matlaştırılmış versiyon (Good/Warn/Bad barlarda kullanılıyor).
    val BandHigh = Color(0xFF4A8A6F)
    val BandMid = Color(0xFFC08A3E)
    val BandLow = Color(0xFFB5654A)
}

fun bandColorForScore(score: Int): Color = when {
    score >= 75 -> StruvaColors.BandHigh
    score >= 55 -> StruvaColors.BandMid
    else -> StruvaColors.BandLow
}
