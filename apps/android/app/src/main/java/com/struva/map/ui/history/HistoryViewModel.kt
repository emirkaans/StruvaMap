package com.struva.map.ui.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.ApiService
import com.struva.map.network.ResultsRepository
import com.struva.map.network.TestsRepository
import com.struva.map.ui.relationships.relationshipTypeLabel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

data class HistoryFilter(val testId: String?, val label: String)

sealed interface HistoryUiState {
    data object Loading : HistoryUiState
    data class Loaded(
        val rows: List<ArchiveRow>,
        val total: Int,
        val filters: List<HistoryFilter>,
        val filter: String?,
        val newestFirst: Boolean,
    ) : HistoryUiState
    data class Error(val message: String) : HistoryUiState
}

// "Geçmiş" sekmesi: kullanıcının çözdüğü bütün testlerin sonuçları, filtreli
// arşiv olarak (tür filtresi, sıralama). Sonuçlar Room önbelleğinden anında,
// test tanımları (endeks adları) ve ilişki adları ağdan gelir; gelmezse satır
// test adı ve "ilişkiye bağlı değil" ile yine görünür.
@HiltViewModel
class HistoryViewModel @Inject constructor(
    private val resultsRepository: ResultsRepository,
    private val testsRepository: TestsRepository,
    private val api: ApiService,
) : ViewModel() {
    private val _uiState = MutableStateFlow<HistoryUiState>(HistoryUiState.Loading)
    val uiState: StateFlow<HistoryUiState> = _uiState.asStateFlow()

    private val testInfo = MutableStateFlow<Map<String, TestDefinitionInfo>>(emptyMap())
    private val relationshipLabels = MutableStateFlow<Map<String, String>>(emptyMap())
    private val filter = MutableStateFlow<String?>(null)
    private val newestFirst = MutableStateFlow(true)
    private var loadedOnce = false

    init {
        viewModelScope.launch {
            combine(
                combine(resultsRepository.observeAll(), testsRepository.cachedTests, ::Pair),
                testInfo,
                relationshipLabels,
                filter,
                newestFirst,
            ) { (results, tests), info, labels, f, newest ->
                // Önbellek boşken ağ cevabı gelmeden "henüz test yok" deme.
                if (results.isEmpty() && !loadedOnce) return@combine null
                // Endeks adları gelmemiş testler için en azından test adı.
                val withNames = info + tests.filter { it.id !in info }.associate { it.id to TestDefinitionInfo(it.name, emptyMap()) }
                val all = buildArchiveRows(results, withNames, labels, LocalDate.now().year)
                val typeIds = (tests.map { it.id } + all.map { it.testId }).distinct()
                val filters = listOf(HistoryFilter(null, "Tümü")) +
                    typeIds.map { id -> HistoryFilter(id, shortFilterLabel(id, withNames[id]?.name ?: id)) }
                HistoryUiState.Loaded(filterAndSort(all, f, newest), all.size, filters, f, newest)
            }.collect { state -> if (state != null) _uiState.value = state }
        }
        load()
    }

    fun setFilter(testId: String?) {
        filter.value = testId
    }

    fun toggleSort() {
        newestFirst.value = !newestFirst.value
    }

    fun load() {
        viewModelScope.launch {
            if (_uiState.value !is HistoryUiState.Loaded) _uiState.value = HistoryUiState.Loading
            try {
                val fresh = resultsRepository.refreshAll()
                testsRepository.refresh()
                loadedOnce = true
                loadTestInfo(fresh.map { it.score.testId }.toSet())
                loadRelationshipLabels(fresh.mapNotNull { r -> r.relationshipId?.let { r.id to it } }.toMap())
                if (_uiState.value !is HistoryUiState.Loaded) {
                    _uiState.value = HistoryUiState.Loaded(emptyList(), 0, emptyList(), null, true)
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                if (_uiState.value !is HistoryUiState.Loaded) {
                    _uiState.value = HistoryUiState.Error(e.message ?: "Bilinmeyen hata")
                }
            }
        }
    }

    private suspend fun loadTestInfo(testIds: Set<String>) {
        val missing = testIds - testInfo.value.keys
        if (missing.isEmpty()) return
        val loaded = coroutineScope {
            missing.map { id ->
                async {
                    try {
                        val t = api.getTest(id)
                        id to TestDefinitionInfo(t.name, t.indices.mapValues { it.value.name })
                    } catch (e: CancellationException) {
                        throw e
                    } catch (e: Exception) {
                        null
                    }
                }
            }.awaitAll().filterNotNull().toMap()
        }
        testInfo.value = testInfo.value + loaded
    }

    private suspend fun loadRelationshipLabels(relationshipByResult: Map<String, String>) {
        if (relationshipByResult.isEmpty()) return
        try {
            val labels = api.getRelationships().associate { it.id to it.label }
            relationshipLabels.value = relationshipByResult.mapNotNull { (resultId, relId) ->
                labels[relId]?.let { resultId to it }
            }.toMap()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            // ilişki adları gelmezse satırlar "ilişkiye bağlı değil" görünür
        }
    }
}

// Filtre çubuğu dar: ev arkadaşlığı "Ev" olarak kısalır.
private fun shortFilterLabel(testId: String, fallback: String): String =
    if (testId == "roommate") "Ev" else relationshipTypeLabel(testId, fallback)
