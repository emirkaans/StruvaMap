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
