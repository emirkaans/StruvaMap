package com.struva.map.ui.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.ArchiveContextRepository
import com.struva.map.network.ResultsRepository
import com.struva.map.network.TestsRepository
import com.struva.map.ui.relationships.relationshipTypeLabel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

data class HistoryFilter(val testId: String?, val label: String)

sealed interface HistoryUiState {
    data object Loading : HistoryUiState
    data class Loaded(
        val rows: List<ArchiveRow>,
        val total: Int,
        val filters: List<HistoryFilter>,
        val filter: String?,
        val newestFirst: Boolean,
    ) : HistoryUiState
    data class Error(val message: String) : HistoryUiState
}

// "Geçmiş" sekmesi: kullanıcının çözdüğü bütün testlerin sonuçları, filtreli
// arşiv olarak. Profil başlığı ve ilişki adları için gereken bilgi
// ArchiveContextRepository'de bellekte tutulur; satırlar o bilgi hazır olunca
// çizilir, böylece başlık yerine test kimliği ya da yanlış "bağlı değil"
// bir an görünüp değişmez.
@HiltViewModel
class HistoryViewModel @Inject constructor(
    private val resultsRepository: ResultsRepository,
    private val testsRepository: TestsRepository,
    private val context: ArchiveContextRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow<HistoryUiState>(HistoryUiState.Loading)
    val uiState: StateFlow<HistoryUiState> = _uiState.asStateFlow()

    private val ready = MutableStateFlow(context.isReady(null))
    private val filter = MutableStateFlow<String?>(null)
    private val newestFirst = MutableStateFlow(true)

    init {
        viewModelScope.launch {
            combine(
                combine(resultsRepository.observeAll(), testsRepository.cachedTests, ::Pair),
                combine(context.tests, context.labels, ::Pair),
                filter,
                newestFirst,
                ready,
            ) { (results, tests), (definitions, labels), f, newest, isReady ->
                if (!isReady) return@combine null
                // Tanımı gelmemiş testler için en azından test adı.
                val info = tests.associate { it.id to TestDefinitionInfo(it.name, emptyMap()) } +
                    definitions.mapValues { it.value.toDefinitionInfo() }
                val all = buildArchiveRows(results, info, labels, LocalDate.now().year)
                val typeIds = (tests.map { it.id } + all.map { it.testId }).distinct()
                val filters = listOf(HistoryFilter(null, "Tümü")) +
                    typeIds.map { id -> HistoryFilter(id, shortFilterLabel(id, info[id]?.name ?: id)) }
                HistoryUiState.Loaded(filterAndSort(all, f, newest), all.size, filters, f, newest)
            }.collect { state -> if (state != null) _uiState.value = state }
        }
        load()
    }

    fun setFilter(testId: String?) {
        filter.value = testId
    }

    fun toggleSort() {
        newestFirst.value = !newestFirst.value
    }

    // Hazırsa ekran hemen çizilir, bu yenileme arkada sessizce çalışır.
    // Ağ yoksa elde ne varsa onunla açılır.
    fun load() {
        // Test listesi (filtre adları) ayrı ve paralel tazelenir, bekletmez.
        viewModelScope.launch {
            try {
                testsRepository.refresh()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                // önbellekteki test listesiyle devam
            }
        }
        viewModelScope.launch {
            if (_uiState.value is HistoryUiState.Error) _uiState.value = HistoryUiState.Loading
            val fetched = context.refresh(null)
            // Ağ yok ve önbellek boş: "henüz test çözmedin" yanıltıcı olur.
            if (!fetched && resultsRepository.cachedAll().isEmpty()) {
                _uiState.value = HistoryUiState.Error("İnternet bağlantını kontrol edip tekrar dene.")
            } else {
                ready.value = true
            }
        }
    }
}

// Filtre çubuğu dar: ev arkadaşlığı "Ev" olarak kısalır.
private fun shortFilterLabel(testId: String, fallback: String): String =
    if (testId == "roommate") "Ev" else relationshipTypeLabel(testId, fallback)
