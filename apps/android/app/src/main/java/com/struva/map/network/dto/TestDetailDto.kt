package com.struva.map.network.dto

import kotlinx.serialization.Serializable

// GET /tests/{testId} — test çözme ekranı için gereken alanlar.
// dimensions/indices bilinçli olarak dışarıda: skorlama ve yorum metinleri
// backend'de hesaplanıp ScoreResult.interpretation içinde dönüyor, client
// ham dimension/index tanımlarına ihtiyaç duymuyor (bkz. results.service.ts).
@Serializable
data class TestDetailDto(
    val id: String,
    val slug: String,
    val name: String,
    val subtitle: String,
    val inviteCta: String,
    val questions: List<QuestionDto>,
    val contextQuestions: List<ContextQuestionDto> = emptyList(),
    val disclaimerNote: String? = null,
    // Sonuç ekranının profil başlığı (bkz. ProfileLabel.kt) ve endeks
    // halkalarının etiketleri için — skorlama server'da zaten hesaplanıyor,
    // burada yalnız isimler lazım.
    val indices: Map<String, IndexDefDto> = emptyMap(),
)

@Serializable
data class IndexDefDto(val name: String)

@Serializable
data class QuestionDto(
    val id: Int,
    val dim: String,
    val type: String,
    val text: String,
    val options: List<OptionDto>,
    val satisfactionQuestion: Boolean = false,
    val textByRole: Map<String, String>? = null,
)

@Serializable
data class OptionDto(val label: String, val score: Int)

@Serializable
data class ContextQuestionDto(
    val id: String,
    val text: String,
    val options: List<ContextQuestionOptionDto>,
)

@Serializable
data class ContextQuestionOptionDto(val label: String, val value: String)
