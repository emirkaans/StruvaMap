package com.struva.map.network.dto

import kotlinx.serialization.Serializable

// GET /tests — anasayfa listesi için yalnızca gösterim alanları. Tam
// TestDefinition (questions/dimensions/indices) test çözme ekranı
// yapılırken genişletilecek (bkz. packages/shared/src/types.ts).
@Serializable
data class TestSummaryDto(
    val id: String,
    val slug: String,
    val name: String,
    val subtitle: String,
)
