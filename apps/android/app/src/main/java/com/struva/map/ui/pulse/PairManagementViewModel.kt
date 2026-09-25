package com.struva.map.ui.pulse

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.PulseRepository
import com.struva.map.network.apiErrorMessage
import com.struva.map.network.dto.PairDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import retrofit2.HttpException
import javax.inject.Inject

sealed interface PairManagementUiState {
    data object Loading : PairManagementUiState
    data object NotPaired : PairManagementUiState
    data class Error(val message: String) : PairManagementUiState
    data class Paired(val pair: PairDto, val busy: Boolean = false, val actionError: String? = null) : PairManagementUiState
}

// PulseViewModel'in state'i o günün check-in akışına odaklı (Unanswered/
// WaitingForPartner/...) — burada tersine yalnızca "eşleşiksin, kiminle,
// ne zamandır" ve sonlandırma aksiyonu lazım, o yüzden ayrı ve küçük tutuldu.
@HiltViewModel
class PairManagementViewModel @Inject constructor(
    private val repository: PulseRepository,
    private val json: Json,
) : ViewModel() {
    private val _state = MutableStateFlow<PairManagementUiState>(PairManagementUiState.Loading)
    val state: StateFlow<PairManagementUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _state.value = PairManagementUiState.Loading
            _state.value = try {
                val active = repository.getActivePair()
                if (active != null) PairManagementUiState.Paired(active) else PairManagementUiState.NotPaired
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                PairManagementUiState.Error(errorText(e))
            }
        }
    }

    fun endPairing() {
        val current = _state.value as? PairManagementUiState.Paired ?: return
        if (current.busy) return
        _state.value = current.copy(busy = true, actionError = null)
        viewModelScope.launch {
            _state.value = try {
                repository.endPair(current.pair.id)
                PairManagementUiState.NotPaired
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                current.copy(busy = false, actionError = errorText(e))
            }
        }
    }

    private fun errorText(e: Exception): String =
        (e as? HttpException)?.apiErrorMessage(json) ?: e.message ?: "Bir hata oluştu."
}
