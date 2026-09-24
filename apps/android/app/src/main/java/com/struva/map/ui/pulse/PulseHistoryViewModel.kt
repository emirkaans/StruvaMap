package com.struva.map.ui.pulse

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.PulseRepository
import com.struva.map.network.apiErrorMessage
import com.struva.map.network.dto.PulseHistoryDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import retrofit2.HttpException
import javax.inject.Inject

sealed interface PulseHistoryUiState {
    data object Loading : PulseHistoryUiState
    data class Error(val message: String) : PulseHistoryUiState
    data object NoPair : PulseHistoryUiState
    data class Loaded(val history: PulseHistoryDto, val partnerName: String?) : PulseHistoryUiState
}

@HiltViewModel
class PulseHistoryViewModel @Inject constructor(
    private val repository: PulseRepository,
    private val json: Json,
) : ViewModel() {
    private val _state = MutableStateFlow<PulseHistoryUiState>(PulseHistoryUiState.Loading)
    val state: StateFlow<PulseHistoryUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _state.value = PulseHistoryUiState.Loading
            _state.value = try {
                val pair = repository.getActivePair()
                if (pair == null) {
                    PulseHistoryUiState.NoPair
                } else {
                    PulseHistoryUiState.Loaded(repository.getHistory(pair.id), pair.partnerUsername)
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: HttpException) {
                PulseHistoryUiState.Error(e.apiErrorMessage(json) ?: "Geçmiş yüklenemedi.")
            } catch (e: Exception) {
                PulseHistoryUiState.Error(e.message ?: "Bir hata oluştu.")
            }
        }
    }
}
