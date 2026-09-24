package com.struva.map.network.dto

import kotlinx.serialization.Serializable

// apps/api/src/labour/labour.service.ts ile birebir.
@Serializable
data class LabourCategoryDto(val id: String, val label: String)

@Serializable
data class LabourEntryDto(val id: String, val category: String, val date: String)

@Serializable
data class LogLabourRequest(val pairId: String, val category: String)

// packages/shared/src/labour.ts LabourWeekSummary ile birebir.
@Serializable
data class LabourCategoryCountDto(val id: String, val label: String, val mine: Int, val partner: Int)

@Serializable
data class LabourWeekSummaryDto(
    val mine: Int,
    val partner: Int,
    val myShare: Int?,
    val categories: List<LabourCategoryCountDto>,
)

@Serializable
data class LabourWeekDto(
    val categories: List<LabourCategoryDto>,
    val week: LabourWeekSummaryDto,
    val todayMine: List<LabourEntryDto>,
)
