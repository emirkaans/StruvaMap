package com.struva.map.ui.testdetail

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.TestDefinitionCache
import com.struva.map.network.ArchiveContextRepository
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
    private val testCache: TestDefinitionCache,
    private val archiveContext: ArchiveContextRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {
    private val testId: String = checkNotNull(savedStateHandle["testId"])

    // Test daha önce açıldıysa sayfa yükleniyor göstermeden dolu açılır.
    private val _uiState = MutableStateFlow<TestDetailUiState>(
        testCache.peek(testId)?.let { TestDetailUiState.Loaded(it) } ?: TestDetailUiState.Loading,
    )
    val uiState: StateFlow<TestDetailUiState> = _uiState.asStateFlow()

    init {
        load()
        // "Geçmiş sonuçlarım" açıldığında beklemesin diye sonuçlar, ilişki
        // adları ve test tanımı şimdiden arka planda yüklenir.
        viewModelScope.launch { archiveContext.refresh(testId) }
    }

    fun load() {
        viewModelScope.launch {
            if (_uiState.value !is TestDetailUiState.Loaded) _uiState.value = TestDetailUiState.Loading
            _uiState.value = try {
                TestDetailUiState.Loaded(testCache.get(testId).also(archiveContext::rememberTest))
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                TestDetailUiState.Error(e.message ?: "Bilinmeyen hata")
            }
        }
    }
}
