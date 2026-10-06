package com.struva.map.ui.common

import androidx.annotation.DrawableRes
import com.struva.map.R

// Webdeki anasayfa heykelleri (apps/web/src/assets/heykel-*.webp), her ilişki
// türü için bir tane. Yayında olmayan testlerin görseli yok; o zaman null.
@DrawableRes
fun statueFor(testId: String): Int? = when (testId) {
    "romantic" -> R.drawable.statue_romantic
    "friendship" -> R.drawable.statue_friendship
    "roommate" -> R.drawable.statue_roommate
    else -> null
}
