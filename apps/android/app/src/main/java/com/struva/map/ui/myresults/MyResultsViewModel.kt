package com.struva.map.ui.myresults

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.struva.map.network.ArchiveContextRepository
import com.struva.map.network.ResultsRepository
import com.struva.map.network.TestsRepository
import com.struva.map.ui.history.ArchiveRow
import com.struva.map.ui.history.TestDefinitionInfo
import com.struva.map.ui.history.buildArchiveRows
import com.struva.map.ui.history.filterAndSort
import com.struva.map.ui.history.toDefinitionInfo
import com.struva.map.ui.relationships.relationshipTypeLabel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

sealed interface MyResultsUiState {
    data object Loading : MyResultsUiState
    data class Loaded(val typeLabel: String, val rows: List<ArchiveRow>, val newestFirst: Boolean) : MyResultsUiState
    data class Error(val message: String) : MyResultsUiState
}

// Test detayındaki "Geçmiş sonuçlarım": tek bir testin sonuçları, Geçmiş
// sekmesiyle aynı satırlarla (bkz. ArchiveRowItem). Satırlar ancak profil
// başlığı ve ilişki adları için gereken bilgi hazır olunca çizilir; test
// detayı bunu arka planda önceden yüklediği için çoğu zaman bekleme olmaz.
@HiltViewModel
class MyResultsViewModel @Inject constructor(
    private val results: ResultsRepository,
    private val tests: TestsRepository,
    private val context: ArchiveContextRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {
    private val testId: String = checkNotNull(savedStateHandle["testId"])

    private val _uiState = MutableStateFlow<MyResultsUiState>(MyResultsUiState.Loading)
    val uiState: StateFlow<MyResultsUiState> = _uiState.asStateFlow()

    private val ready = MutableStateFlow(context.isReady(testId))
    private val newestFirst = MutableStateFlow(true)

    init {
        viewModelScope.launch {
            combine(
                combine(results.observeByTest(testId), tests.cachedTests, ::Pair),
                context.tests,
                context.labels,
                newestFirst,
                ready,
            ) { (rows, summaries), definitions, labels, newest, isReady ->
                if (!isReady) return@combine null
                val info = definitions[testId]?.toDefinitionInfo()
                    ?: TestDefinitionInfo(summaries.firstOrNull { it.id == testId }?.name ?: testId, emptyMap())
                MyResultsUiState.Loaded(
                    typeLabel = relationshipTypeLabel(testId, info.name),
                    rows = filterAndSort(buildArchiveRows(rows, mapOf(testId to info), labels, LocalDate.now().year), null, newest),
                    newestFirst = newest,
                )
            }.collect { state -> if (state != null) _uiState.value = state }
        }
        load()
    }

    fun toggleSort() {
        newestFirst.value = !newestFirst.value
    }

    // Hazırsa ekran hemen çizilir ve bu yenileme sessizce arkada çalışır;
    // değilse bitene kadar yükleniyor gösterilir. Ağ hatasında da elde ne
    // varsa onunla açılır.
    fun load() {
        viewModelScope.launch {
            if (_uiState.value is MyResultsUiState.Error) _uiState.value = MyResultsUiState.Loading
            val fetched = context.refresh(testId)
            // Ağ yok ve önbellek boş: "henüz çözmedin" yanıltıcı olur.
            if (!fetched && results.cachedAll().none { it.score.testId == testId }) {
                _uiState.value = MyResultsUiState.Error("İnternet bağlantını kontrol edip tekrar dene.")
            } else {
                ready.value = true
            }
        }
    }
}
