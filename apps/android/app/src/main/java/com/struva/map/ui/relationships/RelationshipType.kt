package com.struva.map.ui.relationships

// İlişki türü = ilişkinin bağlı olduğu test. Test adları uzun ("Ev Arkadaşlığı
// Yapısı Anlık Görünümü"); seçim ve listelerde kısa tür adı gösterilir.
// Bilinmeyen (yeni eklenmiş) bir test için testin kendi adına düşer.
private val TYPE_LABELS = mapOf(
    "romantic" to "Romantik",
    "friendship" to "Arkadaş",
    "roommate" to "Ev arkadaşı",
    "work" to "İş",
    "family" to "Aile",
)

fun relationshipTypeLabel(testId: String, fallback: String): String = TYPE_LABELS[testId] ?: fallback
