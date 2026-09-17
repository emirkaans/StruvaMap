package com.struva.map.ui.comparison

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.Analytics
import com.struva.map.network.ApiService
import com.struva.map.network.dto.ComparisonDto
import com.struva.map.network.dto.TestDetailDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface ComparisonUiState {
    data object Loading : ComparisonUiState
    data class Loaded(val comparison: ComparisonDto, val test: TestDetailDto) : ComparisonUiState
    data class Error(val message: String) : ComparisonUiState
}

@HiltViewModel
class ComparisonViewModel @Inject constructor(
    private val api: ApiService,
    private val analytics: Analytics,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {
    private val comparisonId: String = checkNotNull(savedStateHandle["comparisonId"])

    private val _uiState = MutableStateFlow<ComparisonUiState>(ComparisonUiState.Loading)
    val uiState: StateFlow<ComparisonUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _uiState.value = ComparisonUiState.Loading
            _uiState.value = try {
                val comparison = api.getComparison(comparisonId)
                val test = api.getTest(comparison.testId)
                analytics.track("comparison_view", testId = comparison.testId)
                ComparisonUiState.Loaded(comparison, test)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                ComparisonUiState.Error(e.message ?: "Bilinmeyen hata")
            }
        }
    }
}
