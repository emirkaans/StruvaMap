package com.struva.map.ui.comparison

import com.struva.map.network.dto.DimensionPredictionInsightDto
import kotlin.math.abs

// Konuşmaya en değer olan önce: öngörülmemiş fark, sonra yanlış sanılan
// fark; bilinenler en sonda. Aynı türde hatası büyük olan önce.
private val KIND_ORDER = listOf("different_missed", "aligned_missed", "different_known", "aligned_known")

fun sortInsights(insights: List<DimensionPredictionInsightDto>): List<DimensionPredictionInsightDto> =
    insights.sortedWith(
        compareBy<DimensionPredictionInsightDto> { KIND_ORDER.indexOf(it.kind).let { i -> if (i < 0) KIND_ORDER.size else i } }
            .thenByDescending { it.error },
    )

// Konuşma kartı gösterilecek boyutlar: önce tahminde "farkı öngörmedin"
// çıkanlar, sonra iki taraf arasındaki algı farkı en büyük olanlar.
fun pickConversationDims(
    a: Map<String, Int>,
    b: Map<String, Int>,
    viewerInsights: List<DimensionPredictionInsightDto>?,
    max: Int = 2,
): List<String> {
    val missed = viewerInsights.orEmpty()
        .filter { it.kind == "different_missed" }
        .sortedByDescending { it.error }
        .map { it.dim }
    val byGap = a.keys
        .filter { it in b }
        .sortedByDescending { abs((a[it] ?: 0) - (b[it] ?: 0)) }
    return (missed + byGap).distinct().take(max)
}
