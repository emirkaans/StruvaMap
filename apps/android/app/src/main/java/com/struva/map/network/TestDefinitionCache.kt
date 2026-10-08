package com.struva.map.network

import com.struva.map.network.dto.TestDetailDto
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.util.concurrent.ConcurrentHashMap
import javax.inject.Inject
import javax.inject.Singleton

// Test tanımları (sorular, boyutlar, endeksler) uygulama açık kaldığı sürece
// bellekte tutulur: test bilgi sayfası, sonuç, kıyaslama ve tahmin ekranları
// aynı testi her açılışta yeniden indirmez. Uygulama kapanınca boşalır, böylece
// admin panelinden yapılan bir değişiklik bir sonraki açılışta görünür.
// Aynı test için aynı anda gelen istekler tek ağ çağrısını bekler.
@Singleton
class TestDefinitionCache @Inject constructor(
    private val api: ApiService,
) {
    private val loaded = ConcurrentHashMap<String, TestDetailDto>()
    private val inFlight = HashMap<String, CompletableDeferred<TestDetailDto>>()
    private val lock = Mutex()

    // Önbellekte varsa beklemeden döner; ekran ilk karede dolu açılabilsin diye.
    fun peek(testId: String): TestDetailDto? = loaded[testId]

    suspend fun get(testId: String): TestDetailDto {
        loaded[testId]?.let { return it }
        var owner = false
        val deferred = lock.withLock {
            loaded[testId]?.let { return it }
            inFlight.getOrPut(testId) { owner = true; CompletableDeferred() }
        }
        if (!owner) return deferred.await()
        try {
            val test = api.getTest(testId)
            loaded[testId] = test
            deferred.complete(test)
            return test
        } catch (e: Throwable) {
            deferred.completeExceptionally(e)
            throw e
        } finally {
            lock.withLock { inFlight.remove(testId) }
        }
    }
}
