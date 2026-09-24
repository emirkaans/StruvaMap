package com.struva.map.ui.comparison

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.Analytics
import com.struva.map.network.ApiService
import com.struva.map.network.InvitedResultStore
import com.struva.map.network.ResultsRepository
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
    data class Loaded(
        val comparison: ComparisonDto,
        val test: TestDetailDto,
        // boyut id → konuşma kartı soruları; yüklenemezse boş (bölüm gizlenir).
        val prompts: Map<String, List<String>> = emptyMap(),
        // Ekrana bakan kişi davet eden (a) mı, katılan (b) mı? Cihazdaki
        // sonuçlardan çıkarılıyor; bilinemiyorsa (ör. web linkinden açıldı) null.
        val viewerIsA: Boolean? = null,
    ) : ComparisonUiState
    data class Error(val message: String) : ComparisonUiState
}

@HiltViewModel
class ComparisonViewModel @Inject constructor(
    private val api: ApiService,
    private val analytics: Analytics,
    private val invitedStore: InvitedResultStore,
    private val resultsRepository: ResultsRepository,
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
                invitedStore.markComparisonSeen(comparison.id)
                ComparisonUiState.Loaded(
                    comparison = comparison,
                    test = test,
                    prompts = loadPrompts(comparison.testId),
                    viewerIsA = viewerIsA(comparison),
                )
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                ComparisonUiState.Error(e.message ?: "Bilinmeyen hata")
            }
        }
    }

    // Konuşma kartları ekranın asıl içeriği değil — hata kıyaslamayı düşürmesin.
    private suspend fun loadPrompts(testId: String): Map<String, List<String>> = try {
        api.getConversationPrompts(testId)
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        emptyMap()
    }

    private suspend fun viewerIsA(comparison: ComparisonDto): Boolean? {
        val mine = try {
            resultsRepository.cachedAll().map { it.id }.toSet()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            return null
        }
        return when {
            comparison.a.id in mine -> true
            comparison.b.id in mine -> false
            else -> null
        }
    }
}
