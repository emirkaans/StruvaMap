package com.struva.map.ui.resultdetail

import com.struva.map.network.userMessage
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.ApiService
import com.struva.map.network.ResultsRepository
import com.struva.map.network.dto.ScoreResultDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface ResultDetailUiState {
    data object Loading : ResultDetailUiState
    data class Loaded(val score: ScoreResultDto) : ResultDetailUiState
    data class Error(val message: String) : ResultDetailUiState
}

@HiltViewModel
class ResultDetailViewModel @Inject constructor(
    private val api: ApiService,
    private val resultsRepository: ResultsRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {
    val resultId: String = checkNotNull(savedStateHandle["resultId"])

    private val _uiState = MutableStateFlow<ResultDetailUiState>(ResultDetailUiState.Loading)
    val uiState: StateFlow<ResultDetailUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _uiState.value = ResultDetailUiState.Loading
            _uiState.value = try {
                ResultDetailUiState.Loaded(api.getResult(resultId).score)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                // İnternetsizken Geçmiş'ten açılan sonuç telefonda kayıtlı
                // kopyasından gösterilir.
                resultsRepository.cachedAll().firstOrNull { it.id == resultId }
                    ?.let { ResultDetailUiState.Loaded(it.score) }
                    ?: ResultDetailUiState.Error(e.userMessage())
            }
        }
    }
}
