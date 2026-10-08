package com.struva.map.ui.relationships

import com.struva.map.network.userMessage
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.ApiService
import com.struva.map.network.TestsRepository
import com.struva.map.network.apiErrorMessage
import com.struva.map.network.dto.CreateRelationshipRequest
import com.struva.map.network.dto.RelationshipMapDto
import com.struva.map.network.dto.TestSummaryDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import retrofit2.HttpException
import javax.inject.Inject

sealed interface MapUiState {
    data object Loading : MapUiState
    data class Error(val message: String) : MapUiState
    data class Loaded(val map: RelationshipMapDto) : MapUiState
}

data class CreateRelationshipState(val saving: Boolean = false, val errorMessage: String? = null)

@HiltViewModel
class MapViewModel @Inject constructor(
    private val api: ApiService,
    private val testsRepository: TestsRepository,
    private val json: Json,
) : ViewModel() {
    private val _state = MutableStateFlow<MapUiState>(MapUiState.Loading)
    val state: StateFlow<MapUiState> = _state.asStateFlow()

    // "İlişki ekle" diyaloğundaki tür seçenekleri: yayındaki testler.
    val relationshipTypes: StateFlow<List<TestSummaryDto>> =
        testsRepository.cachedTests.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    private val _createState = MutableStateFlow(CreateRelationshipState())
    val createState: StateFlow<CreateRelationshipState> = _createState.asStateFlow()

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
        // Tür listesi Room önbelleğinden gelir; ağ yoksa önbellekte kalan yeter.
        viewModelScope.launch {
            try {
                testsRepository.refresh()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                // Sessiz: diyalog önbellekteki türlerle açılır.
            }
        }
    }

    fun clearCreateError() {
        _createState.value = _createState.value.copy(errorMessage = null)
    }

    fun createRelationship(testId: String, label: String, onCreated: (String) -> Unit) {
        if (_createState.value.saving) return
        _createState.value = CreateRelationshipState(saving = true)
        viewModelScope.launch {
            try {
                val created = api.createRelationship(CreateRelationshipRequest(testId, label.trim()))
                _createState.value = CreateRelationshipState()
                load()
                onCreated(created.id)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _createState.value = CreateRelationshipState(errorMessage = errorText(e, "İlişki oluşturulamadı."))
            }
        }
    }

    private fun errorText(e: Exception, fallback: String): String =
        e.userMessage(fallback)
}
