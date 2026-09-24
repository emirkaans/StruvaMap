package com.struva.map.ui.pulse

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.PulseRepository
import com.struva.map.network.apiErrorMessage
import com.struva.map.network.dto.PulseTodayDto
import com.struva.map.pulse.PulseAnswerSource
import com.struva.map.pulse.PulseAnswerSubmitter
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import retrofit2.HttpException
import javax.inject.Inject

// Faz 1: nabız yalnızca romantic testi için içerik taşıyor (bkz.
// packages/shared/src/pulse.ts PULSE_QUESTIONS) — eşleştirme bu türle sabit.
private const val PULSE_TEST_ID = "romantic"
private const val POLL_INTERVAL_MS = 6000L

sealed interface PulseUiState {
    // Henüz hiçbir ağ çağrısı yapılmamış başlangıç durumu — Loading'den ayrı
    // tutuluyor çünkü PulsePairingScreen'in "Kod gir" akışı hiç refresh()
    // çağırmıyor, viewModel state'i acceptInvite() tetiklenene kadar burada
    // kalıyor. Loading ile aynı sayılsaydı "Katıl" butonu kod girilse bile
    // hep pasif kalırdı (bkz. JoinSection'daki `state !is Loading` şartı).
    data object Idle : PulseUiState
    data object Loading : PulseUiState
    data class Error(val message: String) : PulseUiState
    data object NoPair : PulseUiState
    data class PendingInvite(val inviteCode: String) : PulseUiState
    data class Unanswered(val checkinId: String, val questionText: String) : PulseUiState
    data class WaitingForPartner(val myAnswer: Int) : PulseUiState
    data class BothAnswered(val myAnswer: Int, val partnerAnswer: Int) : PulseUiState
}

@HiltViewModel
class PulseViewModel @Inject constructor(
    private val repository: PulseRepository,
    private val answerSubmitter: PulseAnswerSubmitter,
    private val json: Json,
) : ViewModel() {
    private val _state = MutableStateFlow<PulseUiState>(PulseUiState.Idle)
    val state: StateFlow<PulseUiState> = _state.asStateFlow()

    private var activePairId: String? = null
    private var pollJob: Job? = null

    // Room cache yok, canlı veri (bkz. PulseRepository) — PulseCard bunu her
    // composition'a girişte çağırır (ilk açılış + tab'a dönüş + eşleştirme
    // ekranından dönüş), guard'lı "yalnızca ilk sefer" mantığı bilinçli yok.
    fun refresh() {
        viewModelScope.launch {
            _state.value = PulseUiState.Loading
            _state.value = try {
                val pairs = repository.getMyPairs()
                val active = pairs.firstOrNull { it.status == "active" }
                val pending = pairs.firstOrNull { it.status == "pending" }
                when {
                    active != null -> {
                        activePairId = active.id
                        loadTodayState(active.id)
                    }
                    pending != null -> {
                        activePairId = pending.id
                        startPollingForAcceptance()
                        PulseUiState.PendingInvite(pending.inviteCode)
                    }
                    else -> PulseUiState.NoPair
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: HttpException) {
                PulseUiState.Error(e.apiErrorMessage(json) ?: "Nabız yüklenemedi.")
            } catch (e: Exception) {
                PulseUiState.Error(e.message ?: "Bir hata oluştu.")
            }
        }
    }

    fun startPairing() {
        viewModelScope.launch {
            _state.value = PulseUiState.Loading
            _state.value = try {
                val pair = repository.createInvite(PULSE_TEST_ID)
                activePairId = pair.id
                startPollingForAcceptance()
                PulseUiState.PendingInvite(pair.inviteCode)
            } catch (e: CancellationException) {
                throw e
            } catch (e: HttpException) {
                PulseUiState.Error(e.apiErrorMessage(json) ?: "Davet oluşturulamadı.")
            } catch (e: Exception) {
                PulseUiState.Error(e.message ?: "Bir hata oluştu.")
            }
        }
    }

    fun acceptInvite(code: String) {
        viewModelScope.launch {
            _state.value = PulseUiState.Loading
            _state.value = try {
                val pair = repository.acceptInvite(code.trim())
                activePairId = pair.id
                loadTodayState(pair.id)
            } catch (e: CancellationException) {
                throw e
            } catch (e: HttpException) {
                PulseUiState.Error(e.apiErrorMessage(json) ?: "Kod kabul edilemedi.")
            } catch (e: Exception) {
                PulseUiState.Error(e.message ?: "Bir hata oluştu.")
            }
        }
    }

    fun submitAnswer(answer: Int) {
        val checkinId = (_state.value as? PulseUiState.Unanswered)?.checkinId ?: return
        viewModelScope.launch {
            _state.value = try {
                applyToday(answerSubmitter.submit(checkinId, answer, PulseAnswerSource.APP))
            } catch (e: CancellationException) {
                throw e
            } catch (e: HttpException) {
                PulseUiState.Error(e.apiErrorMessage(json) ?: "Cevap gönderilemedi.")
            } catch (e: Exception) {
                PulseUiState.Error(e.message ?: "Bir hata oluştu.")
            }
        }
    }

    private suspend fun loadTodayState(pairId: String): PulseUiState =
        applyToday(repository.getToday(pairId))

    private fun applyToday(today: PulseTodayDto): PulseUiState = when {
        today.myAnswer == null -> PulseUiState.Unanswered(today.id, today.questionText)
        !today.partnerAnswered -> PulseUiState.WaitingForPartner(today.myAnswer)
        else -> PulseUiState.BothAnswered(today.myAnswer, today.partnerAnswer ?: today.myAnswer)
    }

    // InviteViewModel.startPolling ile aynı desen: sabit aralık, geçici ağ
    // hatasını yutup bir sonraki turda tekrar dener.
    private fun startPollingForAcceptance() {
        if (pollJob?.isActive == true) return
        val pairId = activePairId ?: return
        pollJob = viewModelScope.launch {
            while (true) {
                delay(POLL_INTERVAL_MS)
                try {
                    val pairs = repository.getMyPairs()
                    val active = pairs.firstOrNull { it.id == pairId && it.status == "active" }
                    if (active != null) {
                        _state.value = loadTodayState(active.id)
                        return@launch
                    }
                } catch (e: CancellationException) {
                    throw e
                } catch (e: Exception) {
                    // geçici ağ hatası — sıradaki turda tekrar dener
                }
            }
        }
    }

    override fun onCleared() {
        pollJob?.cancel()
    }
}
