package com.struva.map.network

import com.struva.map.local.CachedResultEntity
import com.struva.map.local.ResultDao
import com.struva.map.network.dto.ResultRowDto
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ResultsRepository @Inject constructor(
    private val api: ApiService,
    private val dao: ResultDao,
    private val json: Json,
) {
    fun observeByTest(testId: String): Flow<List<ResultRowDto>> = dao.observeByTest(testId).map { rows ->
        rows.map { ResultRowDto(id = it.id, createdAt = it.createdAt, score = json.decodeFromString(it.scoreJson)) }
    }

    // "Geçmiş" sekmesi: testId'den bağımsız, kullanıcının çözdüğü tüm testlerin
    // sonuçları — her satırdaki score.testId zaten hangi teste ait olduğunu taşır.
    fun observeAll(): Flow<List<ResultRowDto>> = dao.observeAll().map { rows ->
        rows.map { ResultRowDto(id = it.id, createdAt = it.createdAt, score = json.decodeFromString(it.scoreJson)) }
    }

    // Tek seferlik okuma (Flow'u dinlemeden) — bkz. HomeViewModel davet kontrolü.
    suspend fun cachedAll(): List<ResultRowDto> = observeAll().first()

    suspend fun refresh(testId: String) {
        val results = api.getMyResults(testId)
        dao.deleteByTest(testId)
        dao.insertAll(
            results.map {
                CachedResultEntity(
                    id = it.id,
                    testId = testId,
                    createdAt = it.createdAt,
                    scoreJson = json.encodeToString(it.score),
                )
            },
        )
    }

    // Tam anlık görüntü (snapshot) değişimi: sunucudaki tüm sonuçlarla cache'i
    // baştan kurar, testId bazlı refresh()'lerle çakışmaz çünkü satır id'si
    // birincil anahtar (REPLACE).
    suspend fun refreshAll() {
        val results = api.getMyResults(testId = null)
        dao.deleteAll()
        dao.insertAll(
            results.map {
                CachedResultEntity(
                    id = it.id,
                    testId = it.score.testId,
                    createdAt = it.createdAt,
                    scoreJson = json.encodeToString(it.score),
                )
            },
        )
    }
}
