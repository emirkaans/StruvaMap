package com.struva.map.network.dto

import kotlinx.serialization.Serializable

// POST /predictions, GET /predictions/by-result/{id} — predictions.service.ts toDto() ile birebir.
@Serializable
data class PredictionDto(
    val resultId: String,
    val dimensions: Map<String, Int>,
    val updatedAt: String,
)

@Serializable
data class SavePredictionRequest(val resultId: String, val dimensions: Map<String, Int>)

// packages/shared/src/prediction.ts PredictionSummary ile birebir.
@Serializable
data class PredictionSummaryDto(
    val accuracy: Int,
    val insights: List<DimensionPredictionInsightDto>,
)

@Serializable
data class DimensionPredictionInsightDto(
    val dim: String,
    val own: Int,
    val predicted: Int,
    val actual: Int,
    val error: Int,
    // "aligned_known" | "different_known" | "different_missed" | "aligned_missed"
    val kind: String,
)

// Kıyaslamadaki her tarafın karşı taraf hakkındaki tahmininin değerlendirmesi;
// tahmin yapılmadıysa null (bkz. comparisons.service.ts hydrate).
@Serializable
data class ComparisonPredictionsDto(
    val a: PredictionSummaryDto? = null,
    val b: PredictionSummaryDto? = null,
)
