package com.struva.map.local

import androidx.room.Entity
import androidx.room.PrimaryKey

// score sunucudan gelen ScoreResultDto'nun JSON'a serileştirilmiş hali —
// iç içe map/liste yapısını Room için ayrı tablolara bölmeye değmiyor,
// zaten tek parça gösteriliyor (bkz. ScoreResultView).
@Entity(tableName = "cached_results")
data class CachedResultEntity(
    @PrimaryKey val id: String,
    val testId: String,
    val createdAt: String,
    val scoreJson: String,
)
