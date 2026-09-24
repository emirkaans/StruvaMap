package com.struva.map.ui.relationships

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.ApiService
import com.struva.map.network.apiErrorMessage
import com.struva.map.network.dto.RelationshipDetailDto
import com.struva.map.network.dto.RenameRelationshipRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import retrofit2.HttpException
import javax.inject.Inject

sealed interface RelationshipDetailUiState {
    data object Loading : RelationshipDetailUiState
    data class Error(val message: String) : RelationshipDetailUiState
    data object Deleted : RelationshipDetailUiState
    data class Loaded(
        val detail: RelationshipDetailDto,
        // boyut id → konuşma kartı soruları (kalıcı gerilimler için).
        val prompts: Map<String, List<String>> = emptyMap(),
        val actionError: String? = null,
    ) : RelationshipDetailUiState
}

@HiltViewModel
class RelationshipDetailViewModel @Inject constructor(
    private val api: ApiService,
    private val json: Json,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {
    private val relationshipId: String = checkNotNull(savedStateHandle["relationshipId"])

    private val _state = MutableStateFlow<RelationshipDetailUiState>(RelationshipDetailUiState.Loading)
    val state: StateFlow<RelationshipDetailUiState> = _state.asStateFlow()

    // Ekrana her dönüşte çağrılır ("Yeniden çöz" sonrası yeni sonuç gelmiş olabilir).
    fun load() {
        viewModelScope.launch {
            if (_state.value !is RelationshipDetailUiState.Loaded) _state.value = RelationshipDetailUiState.Loading
            try {
                val detail = api.getRelationship(relationshipId)
                val prompts = try {
                    api.getConversationPrompts(detail.testId)
                } catch (e: CancellationException) {
                    throw e
                } catch (e: Exception) {
                    emptyMap()
                }
                _state.value = RelationshipDetailUiState.Loaded(detail, prompts)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                if (_state.value !is RelationshipDetailUiState.Loaded) {
                    _state.value = RelationshipDetailUiState.Error(errorText(e, "İlişki yüklenemedi."))
                }
            }
        }
    }

    fun rename(label: String) {
        val current = _state.value as? RelationshipDetailUiState.Loaded ?: return
        viewModelScope.launch {
            _state.value = try {
                val renamed = api.renameRelationship(relationshipId, RenameRelationshipRequest(label.trim()))
                current.copy(detail = current.detail.copy(label = renamed.label), actionError = null)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                current.copy(actionError = errorText(e, "Ad değiştirilemedi."))
            }
        }
    }

    fun delete() {
        val current = _state.value as? RelationshipDetailUiState.Loaded ?: return
        viewModelScope.launch {
            _state.value = try {
                api.deleteRelationship(relationshipId)
                RelationshipDetailUiState.Deleted
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                current.copy(actionError = errorText(e, "İlişki silinemedi."))
            }
        }
    }

    private fun errorText(e: Exception, fallback: String): String =
        (e as? HttpException)?.apiErrorMessage(json) ?: e.message ?: fallback
}
