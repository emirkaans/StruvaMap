package com.struva.map.ui.myresults

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.ResultsRepository
import com.struva.map.network.dto.ResultRowDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface MyResultsUiState {
    data object Loading : MyResultsUiState
    data class Loaded(val results: List<ResultRowDto>) : MyResultsUiState
    data class Error(val message: String) : MyResultsUiState
}

@HiltViewModel
class MyResultsViewModel @Inject constructor(
    private val repository: ResultsRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {
    private val testId: String = checkNotNull(savedStateHandle["testId"])

    private val _uiState = MutableStateFlow<MyResultsUiState>(MyResultsUiState.Loading)
    val uiState: StateFlow<MyResultsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repository.observeByTest(testId).collect { results ->
                if (results.isNotEmpty()) _uiState.value = MyResultsUiState.Loaded(results)
            }
        }
        load()
    }

    fun load() {
        viewModelScope.launch {
            if (_uiState.value !is MyResultsUiState.Loaded) _uiState.value = MyResultsUiState.Loading
            try {
                repository.refresh(testId)
                if (_uiState.value !is MyResultsUiState.Loaded) {
                    _uiState.value = MyResultsUiState.Loaded(emptyList())
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
}
