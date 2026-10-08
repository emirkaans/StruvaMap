package com.struva.map.network

import android.content.Context
import com.struva.map.network.dto.TestDetailDto
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import java.io.File
import java.util.concurrent.ConcurrentHashMap
import javax.inject.Inject
import javax.inject.Singleton

// Test tanımları (sorular, boyutlar, endeksler) uygulama açık kaldığı sürece
// bellekte tutulur: test bilgi sayfası, sonuç, kıyaslama ve tahmin ekranları
// aynı testi her açılışta yeniden indirmez. Uygulama kapanınca bellek boşalır,
// böylece admin panelinden yapılan bir değişiklik bir sonraki açılışta görünür.
// Aynı test için aynı anda gelen istekler tek ağ çağrısını bekler.
//
// Her başarılı indirme telefona da yazılır. İnternet yokken ağ çağrısı
// başarısız olursa son kaydedilen tanım kullanılır; daha önce açılmış bir test
// çevrimdışı da açılır.
@Singleton
class TestDefinitionCache @Inject constructor(
    private val api: ApiService,
    private val json: Json,
    @ApplicationContext context: Context,
) {
    private val loaded = ConcurrentHashMap<String, TestDetailDto>()
    private val inFlight = HashMap<String, CompletableDeferred<TestDetailDto>>()
    private val lock = Mutex()
    private val dir = File(context.filesDir, "test_definitions")

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
            val test = fetch(testId)
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

    private suspend fun fetch(testId: String): TestDetailDto {
        val test = try {
            api.getTest(testId)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            return readSaved(testId) ?: throw e
        }
        save(test)
        return test
    }

    private suspend fun save(test: TestDetailDto) = withContext(Dispatchers.IO) {
        runCatching {
            dir.mkdirs()
            fileFor(test.id).writeText(json.encodeToString(TestDetailDto.serializer(), test))
        }
    }

    private suspend fun readSaved(testId: String): TestDetailDto? = withContext(Dispatchers.IO) {
        runCatching { json.decodeFromString(TestDetailDto.serializer(), fileFor(testId).readText()) }.getOrNull()
    }

    // Test id'si sunucudan gelir; dosya adına yalnızca güvenli karakterler girer.
    private fun fileFor(testId: String) = File(dir, testId.replace(Regex("[^A-Za-z0-9_-]"), "_") + ".json")
}
