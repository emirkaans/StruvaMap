package com.struva.map.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.TestsRepository
import com.struva.map.network.dto.TestSummaryDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface HomeUiState {
    data object Loading : HomeUiState
    data class Loaded(val tests: List<TestSummaryDto>) : HomeUiState
    data class Error(val message: String) : HomeUiState
}

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repository: TestsRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        // Cache'te bir şey varsa hemen göster (internetsizken de çalışır),
        // sonra load() ağdan tazeler — Room'un Flow'u yeni veriyle kendiliğinden
        // tekrar emit eder.
        viewModelScope.launch {
            repository.cachedTests.collect { tests ->
                if (tests.isNotEmpty()) _uiState.value = HomeUiState.Loaded(tests)
            }
        }
        load()
    }

    fun load() {
        viewModelScope.launch {
            if (_uiState.value !is HomeUiState.Loaded) _uiState.value = HomeUiState.Loading
            try {
                repository.refresh()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                // Cache'ten gösterilecek bir şey varsa sessizce kalsın,
                // yoksa hata göster.
                if (_uiState.value !is HomeUiState.Loaded) {
                    _uiState.value = HomeUiState.Error(e.message ?: "Bilinmeyen hata")
                }
            }
        }
    }
}
