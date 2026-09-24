package com.struva.map.network.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class SubmitResultRequest(
    val testId: String,
    val sessionId: String,
    val answers: Map<Int, Int>,
    val contextAnswers: Map<String, String>? = null,
)

// Sunucu ResultRow (Supabase satırı) döner; burada yalnız sonuç ekranının
// ihtiyaç duyduğu alanlar tutulur, kalanı Json(ignoreUnknownKeys=true) atlar.
@Serializable
data class SubmitResultResponseDto(
    val id: String,
    val score: ScoreResultDto,
)

@Serializable
data class ScoreResultDto(
    val testId: String,
    val rsi: Int,
    val dimensions: Map<String, Int>,
    val indices: Map<String, Int>,
    val strengths: List<String>,
    val tensions: List<String>,
    val interpretation: List<DimensionInterpretationDto>,
    val satisfaction: Map<String, Int>? = null,
)

// GET /results/mine ve GET /results/:id — Supabase satırı (results.service.ts
// ResultRow). answers/test_id/session_id/user_id burada gerekmiyor,
// Json(ignoreUnknownKeys=true) atlıyor.
@Serializable
data class ResultRowDto(
    val id: String,
    @SerialName("created_at") val createdAt: String,
    val score: ScoreResultDto,
    // Kullanıcının bu sonucu bağladığı ilişki (bkz. RelationshipAssignSection).
    // Room önbelleği bunu tutmuyor; yalnız doğrudan API'den gelen satırda dolu.
    @SerialName("relationship_id") val relationshipId: String? = null,
)

@Serializable
data class DimensionInterpretationDto(
    val dim: String,
    val name: String,
    val score: Int,
    val band: String,
    val text: String,
)
