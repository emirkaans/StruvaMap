package com.struva.map.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface ResultDao {
    @Query("SELECT * FROM cached_results WHERE testId = :testId ORDER BY createdAt DESC")
    fun observeByTest(testId: String): Flow<List<CachedResultEntity>>

    @Query("SELECT * FROM cached_results ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<CachedResultEntity>>

    @Query("DELETE FROM cached_results WHERE testId = :testId")
    suspend fun deleteByTest(testId: String)

    @Query("DELETE FROM cached_results")
    suspend fun deleteAll()

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(results: List<CachedResultEntity>)
}
