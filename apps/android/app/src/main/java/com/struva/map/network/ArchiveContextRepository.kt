package com.struva.map.network

import com.struva.map.network.dto.ResultRowDto
import com.struva.map.network.dto.TestDetailDto
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

/* Geçmiş satırlarının ihtiyaç duyduğu, sonuçların kendisinde olmayan bilgi:
   test tanımları (profil başlığı için endeks adları) ve hangi sonucun hangi
   ilişkiye ait olduğu (Room önbelleği relationship_id tutmuyor) ile ilişki
   adları. Uygulama açık kaldıkça bellekte tutulur; böylece Geçmiş ya da
   "Geçmiş sonuçlarım" ikinci kez açıldığında beklemeden çizilir, test detayı
   da ilk açılışı için arka planda önceden yükler (bkz. TestDetailViewModel). */
@Singleton
class ArchiveContextRepository @Inject constructor(
    private val api: ApiService,
    private val results: ResultsRepository,
) {
    private val _tests = MutableStateFlow<Map<String, TestDetailDto>>(emptyMap())
    val tests: StateFlow<Map<String, TestDetailDto>> = _tests.asStateFlow()

    // sonuç id → ilişki id; yalnızca ağdan gelen satırlardan öğrenilir.
    private val links = MutableStateFlow<Map<String, String>>(emptyMap())
    private val relationshipNames = MutableStateFlow<Map<String, String>>(emptyMap())

    private val _labels = MutableStateFlow<Map<String, String>>(emptyMap())
    // sonuç id → ilişki adı.
    val labels: StateFlow<Map<String, String>> = _labels.asStateFlow()

    // Bağlantıları en az bir kez ağdan öğrenilmiş testler ("tümü" için null).
    private val linksLoadedFor = mutableSetOf<String?>()

    fun rememberTest(test: TestDetailDto) {
        _tests.value = _tests.value + (test.id to test)
    }

    fun isReady(testId: String?): Boolean =
        synchronized(linksLoadedFor) { testId in linksLoadedFor || null in linksLoadedFor } &&
            (testId == null || testId in _tests.value)

    /* Sonuçları (testId null ise hepsini) ağdan tazeler, eksik test
       tanımlarını ve ilişki adlarını paralel alır. Hata yutulur: eksik kalan
       bilgi olmadan satırlar yine çizilir. Sonuçlar ağdan alınabildiyse true. */
    suspend fun refresh(testId: String?): Boolean =
        coroutineScope {
            val rowsJob = async { attempt { if (testId == null) results.refreshAll() else results.refresh(testId) } }
            val namesJob = async { attempt { api.getRelationships().associate { it.id to it.label } } }
            val testJob = async { if (testId != null) ensureTest(testId) }

            val rows = rowsJob.await()
            if (rows != null) {
                learnLinks(rows)
                ensureTests(rows.map { it.score.testId }.toSet())
                synchronized(linksLoadedFor) { linksLoadedFor += testId }
            }
            namesJob.await()?.let { relationshipNames.value = it }
            testJob.await()
            recomputeLabels()
            rows != null
        }

    private fun learnLinks(rows: List<ResultRowDto>) {
        val updated = links.value.toMutableMap()
        for (r in rows) {
            if (r.relationshipId != null) updated[r.id] = r.relationshipId else updated.remove(r.id)
        }
        links.value = updated
    }

    private fun recomputeLabels() {
        val names = relationshipNames.value
        _labels.value = links.value.mapNotNull { (resultId, relId) -> names[relId]?.let { resultId to it } }.toMap()
    }

    private suspend fun ensureTest(testId: String) {
        if (testId in _tests.value) return
        attempt { api.getTest(testId) }?.let { rememberTest(it) }
    }

    private suspend fun ensureTests(ids: Set<String>) {
        coroutineScope { (ids - _tests.value.keys).map { async { ensureTest(it) } }.awaitAll() }
    }

    private suspend fun <T> attempt(block: suspend () -> T): T? = try {
        block()
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        null
    }
}
