package com.struva.map.ui.common

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.Analytics
import com.struva.map.network.ApiService
import com.struva.map.network.TestDefinitionCache
import com.struva.map.network.ResultsRepository
import com.struva.map.network.dto.TestDetailDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ScoreDetailState(
    val test: TestDetailDto? = null,
    val rsiHistory: List<TrendPoint> = emptyList(),
    // boyut id → konuşma kartı soruları (gerilim alanları için).
    val prompts: Map<String, List<String>> = emptyMap(),
    // Test tanımı, konuşma soruları ve geçmiş ilk kez gelince (başarısız
    // olsalar da) true; ekran o ana kadar parça parça değil, tek seferde açılır.
    val ready: Boolean = false,
)

// ScoreResultView'in kendi başına yeterli olması için: hem yeni çözülen
// sonuç ekranında hem de geçmişten açılan sonuçta aynı şekilde çağrılıyor
// (bkz. InviteViewModel'deki idempotent init deseni), skor zaten elde var —
// burada yalnız hero/endeks/trend bölümleri için eksik olan test tanımı ve
// geçmiş sonuçlar getiriliyor.
@HiltViewModel
class ScoreDetailViewModel @Inject constructor(
    private val api: ApiService,
    private val testCache: TestDefinitionCache,
    private val resultsRepository: ResultsRepository,
    private val analytics: Analytics,
) : ViewModel() {
    private val _state = MutableStateFlow(ScoreDetailState())
    val state: StateFlow<ScoreDetailState> = _state.asStateFlow()

    private var initializedFor: String? = null
    private var trackedResultId: String? = null

    // resultId testId'den ayrı idempotent — aynı test farklı sonuçlarla
    // (geçmişte birden çok kez çözülmüş) tekrar açılırsa her biri kendi
    // result_view'ini kaydetsin diye.
    fun trackResultView(resultId: String, testId: String) {
        if (trackedResultId == resultId) return
        trackedResultId = resultId
        analytics.track("result_view", testId = testId)
    }

    // Web'de "Bağlantıyı kopyala" — mobilde paylaşım sayfası (share sheet)
    // aynı işi görüyor, aynı olay adıyla huniye yazılıyor.
    fun trackResultShared(testId: String) {
        analytics.track("link_copied", testId = testId)
    }

    fun init(testId: String) {
        if (initializedFor == testId) return
        initializedFor = testId

        viewModelScope.launch {
            coroutineScope {
                launch {
                    try {
                        val test = testCache.get(testId)
                        _state.value = _state.value.copy(test = test)
                    } catch (e: CancellationException) {
                        throw e
                    } catch (e: Exception) {
                        // Hero zenginleştirmesi (başlık/öykü/endeks isimleri) olmadan
                        // devam eder — skor kartı zaten elde, ekran boş kalmaz.
                    }
                }
                launch {
                    try {
                        val prompts = api.getConversationPrompts(testId)
                        _state.value = _state.value.copy(prompts = prompts)
                    } catch (e: CancellationException) {
                        throw e
                    } catch (e: Exception) {
                        // Konuşma kartları olmadan devam eder.
                    }
                }
                launch {
                    try {
                        resultsRepository.refresh(testId)
                    } catch (e: CancellationException) {
                        throw e
                    } catch (e: Exception) {
                        // Sessizce yut — trend bölümü "tekrar çözün" mesajına düşer.
                    }
                }
            }
            _state.value = _state.value.copy(ready = true)
        }
        viewModelScope.launch {
            resultsRepository.observeByTest(testId).collect { rows ->
                val ordered = rows.sortedBy { it.createdAt }.map { TrendPoint(it.score.rsi, trendDateLabel(it.createdAt)) }
                _state.value = _state.value.copy(rsiHistory = ordered)
            }
        }
    }
}
