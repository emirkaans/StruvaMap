package com.struva.map.ui.testdetail

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.ApiService
import com.struva.map.network.dto.TestDetailDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface TestDetailUiState {
    data object Loading : TestDetailUiState
    data class Loaded(val test: TestDetailDto) : TestDetailUiState
    data class Error(val message: String) : TestDetailUiState
}

@HiltViewModel
class TestDetailViewModel @Inject constructor(
    private val api: ApiService,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {
    private val testId: String = checkNotNull(savedStateHandle["testId"])

    private val _uiState = MutableStateFlow<TestDetailUiState>(TestDetailUiState.Loading)
    val uiState: StateFlow<TestDetailUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _uiState.value = TestDetailUiState.Loading
            _uiState.value = try {
                TestDetailUiState.Loaded(api.getTest(testId))
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                TestDetailUiState.Error(e.message ?: "Bilinmeyen hata")
            }
        }
    }
}
