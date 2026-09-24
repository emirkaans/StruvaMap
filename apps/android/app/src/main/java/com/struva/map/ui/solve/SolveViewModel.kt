package com.struva.map.ui.solve

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.Analytics
import com.struva.map.network.ApiService
import com.struva.map.network.SessionIdProvider
import com.struva.map.network.dto.AssignResultRequest
import com.struva.map.network.dto.ContextQuestionDto
import com.struva.map.network.dto.QuestionDto
import com.struva.map.network.dto.ScoreResultDto
import com.struva.map.network.dto.SubmitResultRequest
import com.struva.map.network.dto.TestDetailDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface SolveUiState {
    data object Loading : SolveUiState
    data class ContextQuestion(val question: ContextQuestionDto, val position: Int, val total: Int) : SolveUiState
    data class Question(
        val question: QuestionDto,
        val position: Int,
        val total: Int,
        val isLast: Boolean,
        val selectedOptionIndex: Int? = null,
        val submitting: Boolean = false,
    ) : SolveUiState
    data class Result(val resultId: String, val score: ScoreResultDto) : SolveUiState
    data class Error(val message: String) : SolveUiState
    // Ağ hatası testin başından "load()" ile atmasın diye Error'dan ayrı —
    // cevaplar (answers) bellekte duruyor, retrySubmit() sadece submit()'i
    // tekrar dener, ilerlemeyi silmez.
    data class SubmitFailed(val message: String) : SolveUiState
}

@HiltViewModel
class SolveViewModel @Inject constructor(
    private val api: ApiService,
    private val sessionIdProvider: SessionIdProvider,
    private val analytics: Analytics,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {
    private val testId: String = checkNotNull(savedStateHandle["testId"])

    // İlişki detayındaki "Yeniden çöz"den gelindiyse sonuç gönderilince bu
    // ilişkiye otomatik bağlanır (elle "İlişkiye bağla" adımı gerekmez).
    private var relationshipId: String? = savedStateHandle["relationshipId"]

    private val _uiState = MutableStateFlow<SolveUiState>(SolveUiState.Loading)
    val uiState: StateFlow<SolveUiState> = _uiState.asStateFlow()

    private var test: TestDetailDto? = null
    private var shuffledQuestions: List<QuestionDto> = emptyList()
    private val answers = mutableMapOf<Int, Int>()
    private val contextAnswers = mutableMapOf<String, String>()
    private var contextIndex = 0
    private var questionIndex = 0

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _uiState.value = SolveUiState.Loading
            try {
                val t = api.getTest(testId)
                test = t
                shuffledQuestions = t.questions.shuffled()
                answers.clear()
                contextAnswers.clear()
                contextIndex = 0
                questionIndex = 0
                analytics.track("test_start", testId = testId)
                advance()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _uiState.value = SolveUiState.Error(e.message ?: "Bilinmeyen hata")
            }
        }
    }

    fun chooseContextAnswer(questionId: String, value: String) {
        contextAnswers[questionId] = value
        contextIndex++
        advance()
    }

    // Web'deki TestPage.chooseAnswer ile aynı: seçim hemen vurgulanır, 220ms
    // sonra sıradaki soruya geçilir — son soruda ise geçilmez, kullanıcı
    // "Sonucu Gör"e basana kadar seçimini değiştirebilir (bkz. finish()).
    fun chooseAnswer(questionId: Int, optionIndex: Int) {
        answers[questionId] = optionIndex
        (_uiState.value as? SolveUiState.Question)?.let {
            _uiState.value = it.copy(selectedOptionIndex = optionIndex)
        }
        // Terk noktasını görebilmek için her 5 soruda bir ilerleme kaydı
        // (web'deki TestPage.PROGRESS_STEP ile aynı).
        val answered = questionIndex + 1
        if (answered % 5 == 0) {
            analytics.track(
                "test_progress",
                testId = testId,
                props = mapOf("answered" to answered.toString(), "total" to shuffledQuestions.size.toString()),
            )
        }
        if (questionIndex < shuffledQuestions.size - 1) {
            viewModelScope.launch {
                delay(220)
                questionIndex++
                advance()
            }
        }
    }

    // Yalnız asıl sorular arasında geri gidilebilir (web'deki goPrev ile
    // aynı) — bağlam soruları ileri-yönlü kalır.
    fun goBack() {
        if (questionIndex <= 0) return
        questionIndex--
        advance()
    }

    fun finish() {
        val t = test ?: return
        val q = shuffledQuestions.getOrNull(questionIndex) ?: return
        if (answers[q.id] == null) return
        (_uiState.value as? SolveUiState.Question)?.let {
            _uiState.value = it.copy(submitting = true)
        }
        submit(t)
    }

    // Gönderim başarısız olunca (ör. ağ kopması) çağrılır — answers/contextAnswers
    // bellekte hâlâ dolu, testi baştan başlatmadan sadece gönderimi tekrar dener.
    fun retrySubmit() {
        val t = test ?: return
        submit(t)
    }

    private fun advance() {
        val t = test ?: return
        val contextQuestions = t.contextQuestions
        _uiState.value = when {
            contextIndex < contextQuestions.size ->
                SolveUiState.ContextQuestion(contextQuestions[contextIndex], contextIndex, contextQuestions.size)
            questionIndex < shuffledQuestions.size -> {
                val q = shuffledQuestions[questionIndex]
                SolveUiState.Question(
                    question = q,
                    position = questionIndex,
                    total = shuffledQuestions.size,
                    isLast = questionIndex == shuffledQuestions.size - 1,
                    selectedOptionIndex = answers[q.id],
                )
            }
            else -> _uiState.value
        }
    }

    // En iyi çaba: bağlama başarısız olursa sonuç yine kaydedildi; kullanıcı
    // sonuç ekranındaki "İlişki" kartından elle bağlayabilir.
    private suspend fun assignToRelationship(resultId: String, relationshipId: String) {
        try {
            api.assignResult(AssignResultRequest(resultId, relationshipId))
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            // yut
        }
    }

    private fun submit(t: TestDetailDto) {
        viewModelScope.launch {
            _uiState.value = try {
                val response = api.submitResult(
                    SubmitResultRequest(
                        testId = t.id,
                        sessionId = sessionIdProvider.sessionId,
                        answers = answers.toMap(),
                        contextAnswers = contextAnswers.takeIf { it.isNotEmpty() },
                    ),
                )
                analytics.track("test_complete", testId = t.id)
                relationshipId?.let { assignToRelationship(response.id, it) }
                SolveUiState.Result(response.id, response.score)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                SolveUiState.SubmitFailed(e.message ?: "Sonuç gönderilemedi, bağlantını kontrol et.")
            }
        }
    }
}
