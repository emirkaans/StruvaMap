package com.struva.map.network

import com.struva.map.network.dto.TrackEventRequest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

// apps/web/src/lib/analytics.ts'in mobil karşılığı: kendi API'mize yazılan
// olay kaydı, üçüncü taraf yok. Herhangi bir ViewModel'den çağrılabilsin diye
// kendi SupervisorJob'lu scope'unda çalışır — çağıran ekranın ViewModel'i
// temizlense (onCleared) bile event kaybolmaz, ve ölçüm hatası app akışını
// asla etkilemez (sessizce yutulur).
@Singleton
class Analytics @Inject constructor(
    private val api: ApiService,
    private val sessionIdProvider: SessionIdProvider,
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    fun track(name: String, testId: String? = null, props: Map<String, String>? = null) {
        scope.launch {
            try {
                api.trackEvent(TrackEventRequest(name, sessionIdProvider.sessionId, testId, props))
            } catch (e: Exception) {
                // Ölçüm kaydı başarısız olursa kullanıcı akışı etkilenmemeli.
            }
        }
    }
}
