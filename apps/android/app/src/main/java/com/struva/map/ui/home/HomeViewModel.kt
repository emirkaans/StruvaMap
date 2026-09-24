package com.struva.map.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.ApiService
import com.struva.map.network.InvitedResultStore
import com.struva.map.network.ResultsRepository
import com.struva.map.network.TestsRepository
import com.struva.map.network.dto.ResultRowDto
import com.struva.map.network.dto.TestSummaryDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import java.time.Instant
import javax.inject.Inject

sealed interface HomeUiState {
    data object Loading : HomeUiState
    data class Loaded(val tests: List<TestSummaryDto>, val today: List<TodayItem>) : HomeUiState
    data class Error(val message: String) : HomeUiState
}

// Aynı anda en fazla bu kadar davetin kıyaslama durumu sorulur — "Bugün"
// ekranı bir bildirim merkezi değil, en güncel birkaç davet yeterli.
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

    init {
        // Cache'te bir şey varsa hemen göster (internetsizken de çalışır),
        // sonra load() ağdan tazeler — Room'un Flow'u yeni veriyle kendiliğinden
        // tekrar emit eder.
        viewModelScope.launch {
            combine(repository.cachedTests, resultsRepository.observeAll(), inviteStatuses) { tests, results, invites ->
                tests to buildTodayItems(tests, results, invites, Instant.now())
            }.collect { (tests, today) ->
                if (tests.isNotEmpty()) _uiState.value = HomeUiState.Loaded(tests, today)
            }
        }
        load()
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
        // "Bugün" kartları en iyi çaba: başarısız olursa test listesi yine görünür.
        viewModelScope.launch {
            try {
                resultsRepository.refreshAll()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                // cache'teki sonuçlarla devam
            }
            refreshInviteStatuses()
        }
    }

    // Kıyaslama açılıp dönüldüğünde "Kıyaslaman hazır" kartı düşsün diye
    // ekrana her dönüşte çağrılır (bkz. HomeScreen).
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
