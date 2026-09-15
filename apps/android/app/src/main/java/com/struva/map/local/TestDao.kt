package com.struva.map.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface TestDao {
    @Query("SELECT * FROM cached_tests")
    fun observeAll(): Flow<List<CachedTestEntity>>

    @Query("DELETE FROM cached_tests")
    suspend fun deleteAll()

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(tests: List<CachedTestEntity>)
}
