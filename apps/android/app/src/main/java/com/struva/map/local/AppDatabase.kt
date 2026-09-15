package com.struva.map.local

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(entities = [CachedTestEntity::class, CachedResultEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun testDao(): TestDao
    abstract fun resultDao(): ResultDao
}
