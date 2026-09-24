package com.struva.map.network.dto

import kotlinx.serialization.Serializable

// apps/api/src/relationships/relationships.service.ts ile birebir.
@Serializable
data class RelationshipDto(
    val id: String,
    val testId: String,
    val label: String,
    val createdAt: String,
)

@Serializable
data class CreateRelationshipRequest(val testId: String, val label: String)

@Serializable
data class RenameRelationshipRequest(val label: String)

@Serializable
data class AssignResultRequest(val resultId: String, val relationshipId: String?)

@Serializable
data class AssignResultResponse(val resultId: String, val relationshipId: String?)

// GET /relationships/map
@Serializable
data class RelationshipMapDto(
    val relationships: List<RelationshipMapNodeDto>,
    val unassignedCount: Int,
    val patterns: List<RelationshipPatternDto>,
)

@Serializable
data class RelationshipMapNodeDto(
    val id: String,
    val testId: String,
    val label: String,
    val createdAt: String,
    val testName: String,
    val resultCount: Int,
    val latest: RelationshipLatestDto? = null,
    // Bir önceki sonucun RSI'si; düğümde ↑/↓ değişim için.
    val previousRsi: Int? = null,
)

@Serializable
data class RelationshipLatestDto(
    val resultId: String,
    val rsi: Int,
    val indices: Map<String, Int>,
    val createdAt: String,
)

// packages/shared/src/relationships.ts RelationshipPattern ile birebir.
@Serializable
data class RelationshipPatternDto(
    val indexId: String,
    val indexName: String,
    val kind: String, // "tension" | "strength"
    val labels: List<String>,
    val total: Int,
)

// GET /relationships/{id} — relationships.service.ts detail() ile birebir.
@Serializable
data class RelationshipDetailDto(
    val id: String,
    val testId: String,
    val label: String,
    val createdAt: String,
    val testName: String,
    val dimensionNames: Map<String, String>,
    val indexNames: Map<String, String>,
    val results: List<RelationshipResultPointDto>, // eskiden yeniye
    val summary: RelationshipHistorySummaryDto,
)

@Serializable
data class RelationshipResultPointDto(
    val resultId: String,
    val createdAt: String,
    val rsi: Int,
    val dimensions: Map<String, Int>,
    val indices: Map<String, Int> = emptyMap(),
)

// packages/shared/src/relationships.ts RelationshipHistorySummary ile birebir.
@Serializable
data class RelationshipHistorySummaryDto(
    val rsiDelta: Int? = null,
    val changes: List<DimensionChangeDto> = emptyList(),
    val persistentTensions: List<String> = emptyList(),
    val persistentStrengths: List<String> = emptyList(),
    val newTensions: List<String> = emptyList(),
    val recovered: List<String> = emptyList(),
)

@Serializable
data class DimensionChangeDto(val dim: String, val from: Int, val to: Int, val delta: Int)
