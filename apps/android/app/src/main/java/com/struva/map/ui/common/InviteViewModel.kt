package com.struva.map.ui.common

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.messaging.FirebaseMessaging
import com.struva.map.network.ApiService
import com.struva.map.network.InvitedResultStore
import com.struva.map.network.dto.RegisterDeviceRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

data class InviteState(val invited: Boolean = false, val comparisonId: String? = null)

private const val POLL_INTERVAL_MS = 6000L

@HiltViewModel
class InviteViewModel @Inject constructor(
    private val api: ApiService,
    private val invitedStore: InvitedResultStore,
) : ViewModel() {
    private val _state = MutableStateFlow(InviteState())
    val state: StateFlow<InviteState> = _state.asStateFlow()

    private var pollJob: Job? = null
    private var initializedFor: String? = null

    // Aynı sonuç için birden fazla kez çağrılırsa (recomposition) tekrar
    // başlatmasın diye resultId bazlı idempotent init.
    fun init(resultId: String) {
        if (initializedFor == resultId) return
        initializedFor = resultId
        val invited = invitedStore.isInvited(resultId)
        _state.value = InviteState(invited = invited)
        if (invited) startPolling(resultId)
    }

    fun invite(resultId: String) {
        invitedStore.markInvited(resultId)
        _state.value = _state.value.copy(invited = true)
        startPolling(resultId)
        registerPushToken(resultId)
    }

    // En iyi çaba: token kaydı başarısız olsa bile davet linki zaten
    // paylaşıldı, kullanıcı yoklama (polling) ile yine sonucu görür.
    private fun registerPushToken(resultId: String) {
        viewModelScope.launch {
            try {
                val token = FirebaseMessaging.getInstance().token.await()
                Log.d("StruvaFcm", "token alındı: $token")
                api.registerDevice(RegisterDeviceRequest(resultId, token))
                Log.d("StruvaFcm", "token backend'e kaydedildi")
            } catch (e: Exception) {
                Log.w("StruvaFcm", "push token kaydı başarısız", e)
            }
        }
    }

    private fun startPolling(resultId: String) {
        if (pollJob?.isActive == true) return
        pollJob = viewModelScope.launch {
            while (true) {
                try {
                    val comparison = api.getComparisonByResult(resultId)
                    if (comparison != null) {
                        _state.value = _state.value.copy(comparisonId = comparison.id)
                        return@launch
                    }
                } catch (e: Exception) {
                    // Geçici ağ hatası — bir sonraki turda tekrar dener, web'deki
                    // .catch(() => {}) ile aynı davranış.
                }
                delay(POLL_INTERVAL_MS)
            }
        }
    }

    override fun onCleared() {
        pollJob?.cancel()
    }
}
