package com.struva.map.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.ApiService
import com.struva.map.network.InvitedResultStore
import com.struva.map.network.ResultsRepository
import com.struva.map.network.TestsRepository
import com.struva.map.network.getComparisonByResult
import com.struva.map.network.dto.RelationshipMapNodeDto
import com.struva.map.network.dto.ResultRowDto
import com.struva.map.network.dto.TestSummaryDto
import com.struva.map.ui.relationships.relationshipTypeLabel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import javax.inject.Inject

sealed interface HomeUiState {
    data object Loading : HomeUiState
    data class Loaded(
        val nextStep: TodayItem?,
        val relationships: List<RelationshipRowUi>,
        // Sonucu olup henüz hiçbir ilişkiye bağlanmamış kullanıcı: haritaya davet.
        val hasUnlinkedResults: Boolean,
        val tests: List<TestRowUi>,
        val prompt: MapPrompt?,
    ) : HomeUiState
    data class Error(val message: String) : HomeUiState
}

// Aynı anda en fazla bu kadar davetin kıyaslama durumu sorulur — anasayfa
// bir bildirim merkezi değil, en güncel birkaç davet yeterli.
private const val MAX_INVITE_CHECKS = 3

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repository: TestsRepository,
    private val resultsRepository: ResultsRepository,
    private val invitedStore: InvitedResultStore,
    private val api: ApiService,
) : ViewModel() {
    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    private val inviteStatuses = MutableStateFlow<List<InviteStatus>>(emptyList())
    // Harita ve test tanımları ağdan gelir (önbellek yok); gelmezse ilgili
    // bölüm boş kalır, anasayfanın geri kalanı çalışır.
    private val mapNodes = MutableStateFlow<List<RelationshipMapNodeDto>>(emptyList())
    private val indexNamesByTest = MutableStateFlow<Map<String, Map<String, String>>>(emptyMap())
    private val prompt = MutableStateFlow<MapPrompt?>(null)

    init {
        // Cache'te bir şey varsa hemen göster (internetsizken de çalışır),
        // sonra load() ağdan tazeler — Room'un Flow'u yeni veriyle kendiliğinden
        // tekrar emit eder.
        viewModelScope.launch {
            combine(
                combine(repository.cachedTests, resultsRepository.observeAll(), inviteStatuses, ::Triple),
                mapNodes,
                indexNamesByTest,
                prompt,
            ) { (tests, results, invites), nodes, names, p ->
                build(tests, results, invites, nodes, names, p)
            }.collect { state -> if (state != null) _uiState.value = state }
        }
        load()
    }

    private fun build(
        tests: List<TestSummaryDto>,
        results: List<ResultRowDto>,
        invites: List<InviteStatus>,
        nodes: List<RelationshipMapNodeDto>,
        names: Map<String, Map<String, String>>,
        p: MapPrompt?,
    ): HomeUiState.Loaded? {
        if (tests.isEmpty()) return null
        val now = Instant.now()
        return HomeUiState.Loaded(
            nextStep = pickNextStep(buildTodayItems(tests, results, invites, now)),
            relationships = buildRelationshipRows(nodes, names, now),
            hasUnlinkedResults = results.isNotEmpty() && nodes.none { it.archivedAt == null },
            tests = buildTestRows(tests, results, now),
            prompt = p,
        )
    }

    fun load() {
        viewModelScope.launch {
            if (_uiState.value !is HomeUiState.Loaded) _uiState.value = HomeUiState.Loading
            try {
                repository.refresh()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                // Cache'ten gösterilecek bir şey varsa sessizce kalsın,
                // yoksa hata göster.
                if (_uiState.value !is HomeUiState.Loaded) {
                    _uiState.value = HomeUiState.Error(e.message ?: "Bilinmeyen hata")
                }
            }
        }
        // Sıradaki adım ve soru en iyi çaba: başarısız olursa test listesi yine görünür.
        viewModelScope.launch {
            try {
                resultsRepository.refreshAll()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                // cache'teki sonuçlarla devam
            }
            refreshInviteStatuses()
            loadPrompt()
        }
        refreshMap()
    }

    // Kıyaslama ya da ilişki detayından dönüldüğünde kartlar güncellensin
    // diye ekrana her dönüşte çağrılır (bkz. HomeScreen).
    fun refreshOnReturn() {
        refreshInviteStatuses()
        refreshMap()
    }

    private fun refreshMap() {
        viewModelScope.launch {
            try {
                val map = api.getRelationshipMap()
                mapNodes.value = map.relationships
                loadIndexNames(map.relationships.map { it.testId }.toSet())
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                // harita bölümü boş kalır
            }
        }
    }

    // Sözlü özet (profil başlığı) endeks adlarına ihtiyaç duyar; her test türü
    // için bir kez alınır.
    private suspend fun loadIndexNames(testIds: Set<String>) {
        val missing = testIds - indexNamesByTest.value.keys
        if (missing.isEmpty()) return
        val loaded = coroutineScope {
            missing.map { id ->
                async {
                    try {
                        id to api.getTest(id).indices.mapValues { it.value.name }
                    } catch (e: CancellationException) {
                        throw e
                    } catch (e: Exception) {
                        null
                    }
                }
            }.awaitAll().filterNotNull().toMap()
        }
        indexNamesByTest.value = indexNamesByTest.value + loaded
    }

    private suspend fun loadPrompt() {
        try {
            val (result, dim) = lowestDimensionOfLatest(resultsRepository.cachedAll()) ?: return
            val testId = result.score.testId
            val prompts = api.getConversationPrompts(testId)[dim].orEmpty()
            if (prompts.isEmpty()) return
            val testName = repository.cachedTests.first().firstOrNull { it.id == testId }?.name ?: testId
            // Gün içinde aynı soru kalsın; ertesi gün sıradakine geçilir.
            val start = LocalDate.now().dayOfYear % prompts.size
            prompt.value = MapPrompt(
                testId = testId,
                typeLabel = relationshipTypeLabel(testId, testName),
                dimName = dimensionName(result, dim),
                prompts = prompts.drop(start) + prompts.take(start),
            )
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            // soru kartı gösterilmez
        }
    }

    fun refreshInviteStatuses() {
        viewModelScope.launch {
            val results = try {
                resultsRepository.cachedAll()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                return@launch
            }
            inviteStatuses.value = checkInvites(results)
        }
    }

    private suspend fun checkInvites(results: List<ResultRowDto>): List<InviteStatus> {
        val invited = recentResults(results, Instant.now())
            .filter { invitedStore.isInvited(it.id) }
            .sortedByDescending { it.createdAt }
            .take(MAX_INVITE_CHECKS)
        return coroutineScope {
            invited.map { row ->
                async {
                    try {
                        val comparison = api.getComparisonByResult(row.id)
                        InviteStatus(
                            resultId = row.id,
                            testId = row.score.testId,
                            comparisonId = comparison?.id,
                            seen = comparison?.let { invitedStore.isComparisonSeen(it.id) } ?: false,
                        )
                    } catch (e: CancellationException) {
                        throw e
                    } catch (e: Exception) {
                        null // ağ hatası: bu davet için kart gösterme
                    }
                }
            }.awaitAll().filterNotNull()
        }
    }
}
