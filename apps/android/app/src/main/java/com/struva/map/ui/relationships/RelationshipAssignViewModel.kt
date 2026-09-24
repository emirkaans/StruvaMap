package com.struva.map.ui.relationships

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.ApiService
import com.struva.map.network.apiErrorMessage
import com.struva.map.network.dto.AssignResultRequest
import com.struva.map.network.dto.CreateRelationshipRequest
import com.struva.map.network.dto.RelationshipDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import retrofit2.HttpException
import javax.inject.Inject

data class RelationshipAssignState(
    val loaded: Boolean = false,
    // Yalnızca bu sonucun test türündeki ilişkiler.
    val options: List<RelationshipDto> = emptyList(),
    val current: RelationshipDto? = null,
    val saving: Boolean = false,
    val errorMessage: String? = null,
    // İlk yükleme başarısızsa kart gizlenmez, hatayı + "Tekrar dene"yi gösterir.
    val loadError: String? = null,
)

@HiltViewModel
class RelationshipAssignViewModel @Inject constructor(
    private val api: ApiService,
    private val json: Json,
) : ViewModel() {
    private val _state = MutableStateFlow(RelationshipAssignState())
    val state: StateFlow<RelationshipAssignState> = _state.asStateFlow()

    private var resultId: String? = null
    private var testId: String? = null

    // InviteViewModel'deki gibi resultId bazlı idempotent init.
    fun init(resultId: String, testId: String) {
        if (this.resultId == resultId) return
        this.resultId = resultId
        this.testId = testId
        load()
    }

    fun load() {
        val resultId = resultId ?: return
        val testId = testId ?: return
        viewModelScope.launch {
            _state.value = try {
                val options = api.getRelationships().filter { it.testId == testId }
                val currentId = api.getResult(resultId).relationshipId
                RelationshipAssignState(
                    loaded = true,
                    options = options,
                    current = options.firstOrNull { it.id == currentId },
                )
            } catch (e: CancellationException) {
                throw e
            } catch (e: HttpException) {
                RelationshipAssignState(loadError = e.apiErrorMessage(json) ?: "HTTP ${e.code()}")
            } catch (e: Exception) {
                RelationshipAssignState(loadError = e.message ?: "Bağlantı hatası")
            }
        }
    }

    // existingId verilirse ona bağlar; yoksa newLabel ile yeni ilişki
    // oluşturup bağlar; ikisi de null ise bağı kaldırır.
    fun assign(existingId: String?, newLabel: String?) {
        val resultId = resultId ?: return
        val testId = testId ?: return
        val current = _state.value
        if (current.saving) return
        _state.value = current.copy(saving = true, errorMessage = null)
        viewModelScope.launch {
            _state.value = try {
                var options = current.options
                val target = when {
                    existingId != null -> options.firstOrNull { it.id == existingId }
                    !newLabel.isNullOrBlank() -> api.createRelationship(CreateRelationshipRequest(testId, newLabel.trim()))
                        .also { options = options + it }
                    else -> null
                }
                api.assignResult(AssignResultRequest(resultId, target?.id))
                current.copy(options = options, current = target, saving = false)
            } catch (e: CancellationException) {
                throw e
            } catch (e: HttpException) {
                current.copy(saving = false, errorMessage = e.apiErrorMessage(json) ?: "İlişki kaydedilemedi.")
            } catch (e: Exception) {
                current.copy(saving = false, errorMessage = e.message ?: "İlişki kaydedilemedi.")
            }
        }
    }
}
