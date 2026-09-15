package com.struva.map.network

import com.struva.map.local.CachedTestEntity
import com.struva.map.local.TestDao
import com.struva.map.network.dto.TestSummaryDto
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

// Cache-then-network: HomeViewModel önce cachedTests'ten (varsa) anında
// bir şey gösterir, refresh() ağdan çekip Room'a yazar — Room'un Flow'u
// kendiliğinden yeni veriyle tekrar emit eder. Ağ yoksa cache elde kalan
// tek şey olur.
@Singleton
class TestsRepository @Inject constructor(
    private val api: ApiService,
    private val dao: TestDao,
) {
    val cachedTests: Flow<List<TestSummaryDto>> = dao.observeAll().map { rows ->
        rows.map { TestSummaryDto(id = it.id, slug = it.slug, name = it.name, subtitle = it.subtitle) }
    }

    suspend fun refresh() {
        val tests = api.getTests()
        dao.deleteAll()
        dao.insertAll(tests.map { CachedTestEntity(id = it.id, slug = it.slug, name = it.name, subtitle = it.subtitle) })
    }
}
