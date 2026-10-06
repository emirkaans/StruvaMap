package com.struva.map.ui.myresults

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.ApiService
import com.struva.map.network.ResultsRepository
import com.struva.map.ui.history.ArchiveRow
import com.struva.map.ui.history.TestDefinitionInfo
import com.struva.map.ui.history.buildArchiveRows
import com.struva.map.ui.history.filterAndSort
import com.struva.map.ui.relationships.relationshipTypeLabel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

sealed interface MyResultsUiState {
    data object Loading : MyResultsUiState
    data class Loaded(val typeLabel: String, val rows: List<ArchiveRow>, val newestFirst: Boolean) : MyResultsUiState
    data class Error(val message: String) : MyResultsUiState
}

// Test detayındaki "Geçmiş sonuçlarım": tek bir testin sonuçları, Geçmiş
// sekmesiyle aynı satırlarla (bkz. ArchiveRowItem). Tür filtresi yok, test zaten belli.
@HiltViewModel
class MyResultsViewModel @Inject constructor(
    private val repository: ResultsRepository,
    private val api: ApiService,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {
    private val testId: String = checkNotNull(savedStateHandle["testId"])

    private val _uiState = MutableStateFlow<MyResultsUiState>(MyResultsUiState.Loading)
    val uiState: StateFlow<MyResultsUiState> = _uiState.asStateFlow()

    private val testInfo = MutableStateFlow<TestDefinitionInfo?>(null)
    private val relationshipLabels = MutableStateFlow<Map<String, String>>(emptyMap())
    private val newestFirst = MutableStateFlow(true)
    private var loadedOnce = false

    init {
        viewModelScope.launch {
            combine(repository.observeByTest(testId), testInfo, relationshipLabels, newestFirst) { results, info, labels, newest ->
                if (results.isEmpty() && !loadedOnce) return@combine null
                val tests = info?.let { mapOf(testId to it) }.orEmpty()
                val rows = buildArchiveRows(results, tests, labels, LocalDate.now().year)
                MyResultsUiState.Loaded(
                    typeLabel = relationshipTypeLabel(testId, info?.name ?: testId),
                    rows = filterAndSort(rows, null, newest),
                    newestFirst = newest,
                )
            }.collect { state -> if (state != null) _uiState.value = state }
        }
        load()
    }

    fun toggleSort() {
        newestFirst.value = !newestFirst.value
    }

    fun load() {
        viewModelScope.launch {
            if (_uiState.value !is MyResultsUiState.Loaded) _uiState.value = MyResultsUiState.Loading
            try {
                val fresh = repository.refresh(testId)
                loadedOnce = true
                loadExtras(fresh.mapNotNull { r -> r.relationshipId?.let { r.id to it } }.toMap())
                if (_uiState.value !is MyResultsUiState.Loaded) {
                    _uiState.value = MyResultsUiState.Loaded(relationshipTypeLabel(testId, testId), emptyList(), true)
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                if (_uiState.value !is MyResultsUiState.Loaded) {
                    _uiState.value = MyResultsUiState.Error(e.message ?: "Bilinmeyen hata")
                }
            }
        }
    }

    // Endeks adları ve ilişki adları en iyi çaba: gelmezse satırlar test adı
    // ve "ilişkiye bağlı değil" ile görünür.
    private suspend fun loadExtras(relationshipByResult: Map<String, String>) {
        try {
            val t = api.getTest(testId)
            testInfo.value = TestDefinitionInfo(t.name, t.indices.mapValues { it.value.name })
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            // endeks adları olmadan devam
        }
        if (relationshipByResult.isEmpty()) return
        try {
            val labels = api.getRelationships().associate { it.id to it.label }
            relationshipLabels.value = relationshipByResult.mapNotNull { (resultId, relId) ->
                labels[relId]?.let { resultId to it }
            }.toMap()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            // ilişki adları olmadan devam
        }
    }
}
