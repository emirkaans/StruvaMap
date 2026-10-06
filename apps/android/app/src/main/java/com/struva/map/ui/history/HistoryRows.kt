package com.struva.map.ui.history

import com.struva.map.network.dto.ResultRowDto
import com.struva.map.ui.common.computeProfileLabel
import com.struva.map.ui.relationships.relationshipTypeLabel
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

private val TR = Locale("tr")
private val MonthFormatter = DateTimeFormatter.ofPattern("MMM", TR)

// Geçmiş ekranının (filtreli arşiv) bir satırı: tarih, sözlü özet (profil
// başlığı), ilişki ve türü, genel skor ve testin üç endeksi.
data class ArchiveRow(
    val resultId: String,
    val testId: String,
    val day: String, // "28"
    val month: String, // "EYL", bu yıl değilse "EYL 25"
    val title: String,
    val who: String,
    val typeLabel: String,
    val score: Int,
    // Testin kendi sırasıyla endeksler: (ad, skor).
    val indices: List<Pair<String, Int>>,
    val createdAt: String,
)

data class TestDefinitionInfo(
    val name: String,
    // Endeks id → ad, testin tanımındaki sırayla.
    val indexNames: Map<String, String>,
)

fun buildArchiveRows(
    results: List<ResultRowDto>,
    tests: Map<String, TestDefinitionInfo>,
    relationshipLabelByResult: Map<String, String>,
    currentYear: Int,
): List<ArchiveRow> = results.map { r ->
    val testId = r.score.testId
    val info = tests[testId]
    val names = info?.indexNames.orEmpty()
    val date = try {
        OffsetDateTime.parse(r.createdAt).atZoneSameInstant(ZoneId.systemDefault())
    } catch (e: Exception) {
        null
    }
    val month = date?.format(MonthFormatter)?.uppercase(TR)?.trimEnd('.') ?: ""
    ArchiveRow(
        resultId = r.id,
        testId = testId,
        day = date?.dayOfMonth?.toString()?.padStart(2, '0') ?: "",
        month = if (date != null && date.year != currentYear) "$month ${date.year % 100}" else month,
        title = if (names.isNotEmpty()) computeProfileLabel(names, r.score.indices).title else (info?.name ?: testId),
        who = relationshipLabelByResult[r.id] ?: "İlişkiye bağlı değil",
        typeLabel = relationshipTypeLabel(testId, info?.name ?: testId),
        score = r.score.rsi,
        indices = if (names.isNotEmpty()) {
            names.map { (id, name) -> name to (r.score.indices[id] ?: 0) }
        } else {
            r.score.indices.entries.map { it.key to it.value }
        },
        createdAt = r.createdAt,
    )
}

// filter null = tümü; newestFirst false = en eski önce.
fun filterAndSort(rows: List<ArchiveRow>, filter: String?, newestFirst: Boolean): List<ArchiveRow> {
    val filtered = if (filter == null) rows else rows.filter { it.testId == filter }
    val sorted = filtered.sortedBy { it.createdAt }
    return if (newestFirst) sorted.reversed() else sorted
}

fun com.struva.map.network.dto.TestDetailDto.toDefinitionInfo(): TestDefinitionInfo =
    TestDefinitionInfo(name, indices.mapValues { it.value.name })
