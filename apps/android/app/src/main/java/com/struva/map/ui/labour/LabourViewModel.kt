package com.struva.map.ui.labour

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.ApiService
import com.struva.map.network.PulseRepository
import com.struva.map.network.apiErrorMessage
import com.struva.map.network.dto.LabourWeekDto
import com.struva.map.network.dto.LogLabourRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import retrofit2.HttpException
import javax.inject.Inject

sealed interface LabourUiState {
    data object Loading : LabourUiState
    data class Error(val message: String) : LabourUiState
    data object NoPair : LabourUiState
    data class Loaded(
        val pairId: String,
        val partnerName: String?,
        val data: LabourWeekDto,
        val busy: Boolean = false,
        val actionError: String? = null,
    ) : LabourUiState
}

@HiltViewModel
class LabourViewModel @Inject constructor(
    private val api: ApiService,
    private val pulseRepository: PulseRepository,
    private val json: Json,
) : ViewModel() {
    private val _state = MutableStateFlow<LabourUiState>(LabourUiState.Loading)
    val state: StateFlow<LabourUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _state.value = LabourUiState.Loading
            _state.value = try {
                val pair = pulseRepository.getActivePair()
                if (pair == null) {
                    LabourUiState.NoPair
                } else {
                    LabourUiState.Loaded(pair.id, pair.partnerUsername, api.getLabourWeek(pair.id))
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                LabourUiState.Error(errorText(e, "Emek defteri yüklenemedi."))
            }
        }
    }

    fun log(category: String) = mutate("Kaydedilemedi.") { pairId ->
        api.logLabour(LogLabourRequest(pairId, category))
    }

    // Bugünkü en son kendi kaydını siler (yanlış dokunuş için).
    fun undoLast() {
        val current = _state.value as? LabourUiState.Loaded ?: return
        val last = current.data.todayMine.firstOrNull() ?: return
        mutate("Geri alınamadı.") { api.deleteLabour(last.id) }
    }

    private fun mutate(fallback: String, action: suspend (pairId: String) -> Unit) {
        val current = _state.value as? LabourUiState.Loaded ?: return
        if (current.busy) return
        _state.value = current.copy(busy = true, actionError = null)
        viewModelScope.launch {
            _state.value = try {
                action(current.pairId)
                current.copy(data = api.getLabourWeek(current.pairId), busy = false)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                current.copy(busy = false, actionError = errorText(e, fallback))
            }
        }
    }

    private fun errorText(e: Exception, fallback: String): String =
        (e as? HttpException)?.apiErrorMessage(json) ?: e.message ?: fallback
}
