package com.struva.map.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "cached_tests")
data class CachedTestEntity(
    @PrimaryKey val id: String,
    val slug: String,
    val name: String,
    val subtitle: String,
)
