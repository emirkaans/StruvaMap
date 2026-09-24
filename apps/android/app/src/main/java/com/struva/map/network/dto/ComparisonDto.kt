package com.struva.map.network.dto

import kotlinx.serialization.Serializable

// GET /comparisons/... — comparisons.service.ts hydrate() çıktısıyla birebir.
@Serializable
data class ComparisonDto(
    val id: String,
    val testId: String,
    val a: ResultRowDto,
    val b: ResultRowDto,
    // Tahmin modu öncesi API sürümleri bu alanı döndürmüyor.
    val predictions: ComparisonPredictionsDto? = null,
)
