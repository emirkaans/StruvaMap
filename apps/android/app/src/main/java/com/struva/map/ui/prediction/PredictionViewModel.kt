package com.struva.map.ui.prediction

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.Analytics
import com.struva.map.network.ApiService
import com.struva.map.network.apiErrorMessage
import com.struva.map.network.getComparisonByResult
import com.struva.map.network.getMyPrediction
import com.struva.map.network.dto.SavePredictionRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import retrofit2.HttpException
import javax.inject.Inject

// Kaydırıcıların başlangıç değeri: kendi skorundan başlatmak tahmini
// "karşı taraf da benim gibi düşünüyor"a doğru çeker, orta nokta nötr.
private const val DEFAULT_PREDICTION = 50

data class PredictionDimension(
    val id: String,
    val name: String,
    val short: String,
    val ownScore: Int,
)

sealed interface PredictionUiState {
    data object Loading : PredictionUiState
    data class Error(val message: String) : PredictionUiState
    // Kıyaslama çıktıysa tahmin artık anlamsız (sunucu da reddeder).
    data class ComparisonReady(val comparisonId: String) : PredictionUiState
    data class Editing(
        val testName: String,
        val dimensions: List<PredictionDimension>,
        val values: Map<String, Int>,
        val hadPrediction: Boolean,
        val saving: Boolean = false,
        val saved: Boolean = false,
        val errorMessage: String? = null,
    ) : PredictionUiState
}

@HiltViewModel
class PredictionViewModel @Inject constructor(
    private val api: ApiService,
    private val analytics: Analytics,
    private val json: Json,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {
    private val resultId: String = checkNotNull(savedStateHandle["resultId"])
    private var testId: String? = null

    private val _state = MutableStateFlow<PredictionUiState>(PredictionUiState.Loading)
    val state: StateFlow<PredictionUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _state.value = PredictionUiState.Loading
            _state.value = try {
                val comparison = api.getComparisonByResult(resultId)
                if (comparison != null) {
                    PredictionUiState.ComparisonReady(comparison.id)
                } else {
                    val result = api.getResult(resultId)
                    testId = result.score.testId
                    val test = api.getTest(result.score.testId)
                    val existing = api.getMyPrediction(resultId)
                    // Sıra sonuç ekranıyla aynı (score.interpretation test tanımındaki sırayı taşır).
                    val dimensions = result.score.interpretation.map { interp ->
                        PredictionDimension(
                            id = interp.dim,
                            name = interp.name,
                            short = test.dimensions[interp.dim]?.short.orEmpty(),
                            ownScore = interp.score,
                        )
                    }
                    PredictionUiState.Editing(
                        testName = test.name,
                        dimensions = dimensions,
                        values = dimensions.associate { it.id to (existing?.dimensions?.get(it.id) ?: DEFAULT_PREDICTION) },
                        hadPrediction = existing != null,
                    )
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: HttpException) {
                PredictionUiState.Error(e.apiErrorMessage(json) ?: "Tahmin ekranı yüklenemedi.")
            } catch (e: Exception) {
                PredictionUiState.Error(e.message ?: "Bir hata oluştu.")
            }
        }
    }

    fun setValue(dim: String, value: Int) {
        val current = _state.value as? PredictionUiState.Editing ?: return
        _state.value = current.copy(values = current.values + (dim to value), saved = false, errorMessage = null)
    }

    fun save() {
        val current = _state.value as? PredictionUiState.Editing ?: return
        if (current.saving) return
        _state.value = current.copy(saving = true, errorMessage = null)
        viewModelScope.launch {
            _state.value = try {
                api.savePrediction(SavePredictionRequest(resultId, current.values))
                analytics.track("prediction_saved", testId = testId)
                current.copy(saving = false, saved = true, hadPrediction = true)
            } catch (e: CancellationException) {
                throw e
            } catch (e: HttpException) {
                // 409: bu arada karşı taraf testi bitirdi, kıyaslama hazır.
                if (e.code() == 409) {
                    val comparisonId = try {
                        api.getComparisonByResult(resultId)?.id
                    } catch (ce: CancellationException) {
                        throw ce
                    } catch (_: Exception) {
                        null
                    }
                    comparisonId?.let { PredictionUiState.ComparisonReady(it) }
                        ?: current.copy(saving = false, errorMessage = "Kıyaslama hazır, tahmin artık değiştirilemez.")
                } else {
                    current.copy(saving = false, errorMessage = e.apiErrorMessage(json) ?: "Tahmin kaydedilemedi.")
                }
            } catch (e: Exception) {
                current.copy(saving = false, errorMessage = e.message ?: "Tahmin kaydedilemedi.")
            }
        }
    }
}
