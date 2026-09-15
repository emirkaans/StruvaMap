package com.struva.map.ui.common

import com.struva.map.network.dto.DimensionInterpretationDto

// packages/shared/src/scoring.ts (computeProfileLabel/composeProfileStory/bandOf)
// ile birebir aynı mantık — sunucu bu metni hesaplamıyor, web client'ı
// endeks skorlarından deterministik üretiyor, burada da öyle.

data class ProfileLabel(val title: String, val description: String)

private const val BALANCED_GAP = 10

fun bandOf(score: Int): String = when {
    score >= 75 -> "yüksek"
    score >= 55 -> "orta"
    else -> "düşük"
}

private fun joinNamesTr(names: List<String>): String {
    if (names.size <= 1) return names.joinToString("")
    return "${names.dropLast(1).joinToString(", ")} ve ${names.last()}"
}

fun computeProfileLabel(indexNames: Map<String, String>, indexScores: Map<String, Int>): ProfileLabel {
    val ids = indexNames.keys.toList()
    val names = ids.map { indexNames.getValue(it) }
    val sorted = ids.sortedByDescending { indexScores[it] ?: 0 }
    val highest = sorted.firstOrNull()
    val lowest = sorted.lastOrNull()

    if (highest == null) {
        return ProfileLabel(
            title = "Dengeli Yapı",
            description = "Bu sonuçta ${joinNamesTr(names)} arasında belirgin bir fark yok; yapı genel olarak dengeli görünüyor.",
        )
    }

    val highScore = indexScores[highest] ?: 0
    val lowScore = indexScores[lowest] ?: 0
    val gap = highScore - lowScore
    val highBand = bandOf(highScore)
    val lowBand = bandOf(lowScore)
    val highName = indexNames.getValue(highest)
    val lowName = indexNames.getValue(lowest!!)

    if (highBand == "düşük") {
        return ProfileLabel(
            title = "Genel Olarak Gerilimli Yapı",
            description = "Bu sonuçta ${joinNamesTr(names)} eksenlerinin hiçbiri güçlü görünmüyor; genel olarak gerilimli bir tablo var.",
        )
    }
    if (gap < BALANCED_GAP) {
        return ProfileLabel(
            title = "Dengeli Yapı",
            description = "Bu sonuçta ${joinNamesTr(names)} arasında belirgin bir fark yok; yapı genel olarak dengeli görünüyor.",
        )
    }
    if (highBand == "yüksek") {
        if (lowBand == "düşük") {
            return ProfileLabel(
                title = "$highName Ağırlıklı, $lowName Gerilimli",
                description = "Bu sonuçta $highName güçlü bir örüntü gösterirken, $lowName tarafı geride kalıyor.",
            )
        }
        return ProfileLabel(
            title = "$highName Ağırlıklı Yapı",
            description = "Bu sonuçta en çok öne çıkan eksen $highName; diğer alanlara kıyasla burada daha net bir örüntü var.",
        )
    }
    if (lowBand == "düşük") {
        return ProfileLabel(
            title = "$lowName Gerilimli Yapı",
            description = "Bu sonuçta hiçbir eksen çok güçlü değil, ama $lowName özellikle geride kalıyor.",
        )
    }
    return ProfileLabel(
        title = "Dengeli Yapı",
        description = "Bu sonuçta ${joinNamesTr(names)} arasında belirgin bir fark yok; yapı genel olarak dengeli görünüyor.",
    )
}

fun composeProfileStory(
    profile: ProfileLabel,
    interpretation: List<DimensionInterpretationDto>,
    strengths: List<String>,
    tensions: List<String>,
): String {
    val topStrength = interpretation.find { it.dim == strengths.firstOrNull() }
    val topTension = interpretation.find { it.dim == tensions.firstOrNull() }

    var story = profile.description
    if (topStrength != null) {
        story += " En güçlü olduğu alan ${topStrength.name}: ${topStrength.text}"
    }
    if (topTension != null && topTension.dim != topStrength?.dim) {
        story += " Buna karşılık ${topTension.name} konusunda bir gerilim öne çıkıyor: ${topTension.text}"
    }
    return story
}
