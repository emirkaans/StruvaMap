package com.struva.map.ui.relationships

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.ApiService
import com.struva.map.network.apiErrorMessage
import com.struva.map.network.dto.RelationshipMapDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import retrofit2.HttpException
import javax.inject.Inject

sealed interface MapUiState {
    data object Loading : MapUiState
    data class Error(val message: String) : MapUiState
    data class Loaded(val map: RelationshipMapDto) : MapUiState
}

@HiltViewModel
class MapViewModel @Inject constructor(
    private val api: ApiService,
    private val json: Json,
) : ViewModel() {
    private val _state = MutableStateFlow<MapUiState>(MapUiState.Loading)
    val state: StateFlow<MapUiState> = _state.asStateFlow()

    // Sekmeye her dönüşte çağrılır (sonuç ekranında yeni bağlama yapılmış olabilir);
    // elde veri varsa yükleniyor ekranına düşmeden tazeler.
    fun load() {
        viewModelScope.launch {
            if (_state.value !is MapUiState.Loaded) _state.value = MapUiState.Loading
            try {
                _state.value = MapUiState.Loaded(api.getRelationshipMap())
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                if (_state.value !is MapUiState.Loaded) _state.value = MapUiState.Error(errorText(e, "Harita yüklenemedi."))
            }
        }
    }

    private fun errorText(e: Exception, fallback: String): String =
        (e as? HttpException)?.apiErrorMessage(json) ?: e.message ?: fallback
}
