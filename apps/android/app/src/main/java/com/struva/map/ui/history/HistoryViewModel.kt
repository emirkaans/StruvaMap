package com.struva.map.ui.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.ResultsRepository
import com.struva.map.network.TestsRepository
import com.struva.map.network.dto.ResultRowDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HistoryRow(val result: ResultRowDto, val testName: String)

sealed interface HistoryUiState {
    data object Loading : HistoryUiState
    data class Loaded(val rows: List<HistoryRow>) : HistoryUiState
    data class Error(val message: String) : HistoryUiState
}

// "Geçmiş" sekmesi: testId'ye bağlı MyResultsViewModel'den farklı olarak
// kullanıcının çözdüğü TÜM testlerin sonuçlarını, hangi teste ait olduğunu
// gösteren tek bir akışta listeler.
@HiltViewModel
class HistoryViewModel @Inject constructor(
    private val resultsRepository: ResultsRepository,
    private val testsRepository: TestsRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow<HistoryUiState>(HistoryUiState.Loading)
    val uiState: StateFlow<HistoryUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            combine(resultsRepository.observeAll(), testsRepository.cachedTests) { results, tests ->
                val namesById = tests.associate { it.id to it.name }
                results.map { HistoryRow(it, namesById[it.score.testId] ?: it.score.testId) }
            }.collect { rows ->
                if (rows.isNotEmpty()) _uiState.value = HistoryUiState.Loaded(rows)
            }
        }
        load()
    }

    fun load() {
        viewModelScope.launch {
            if (_uiState.value !is HistoryUiState.Loaded) _uiState.value = HistoryUiState.Loading
            try {
                resultsRepository.refreshAll()
                testsRepository.refresh()
                if (_uiState.value !is HistoryUiState.Loaded) {
                    _uiState.value = HistoryUiState.Loaded(emptyList())
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
}
