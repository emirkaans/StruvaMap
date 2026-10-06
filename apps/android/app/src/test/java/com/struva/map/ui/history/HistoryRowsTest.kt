package com.struva.map.ui.history

import com.struva.map.network.dto.ResultRowDto
import com.struva.map.network.dto.ScoreResultDto
import org.junit.Assert.assertEquals
import org.junit.Test

class HistoryRowsTest {
    private fun result(id: String, testId: String, createdAt: String, rsi: Int, indices: Map<String, Int>) = ResultRowDto(
        id = id,
        createdAt = createdAt,
        score = ScoreResultDto(
            testId = testId,
            rsi = rsi,
            dimensions = emptyMap(),
            indices = indices,
            strengths = emptyList(),
            tensions = emptyList(),
            interpretation = emptyList(),
        ),
    )

    private val romantic = TestDefinitionInfo(
        name = "İlişki Yapısı Anlık Görünümü",
        indexNames = linkedMapOf("power" to "Güç", "labour" to "Emek", "autonomy" to "Özerklik"),
    )

    @Test
    fun `endeksler testin sırasıyla gelir, ilişki adı yoksa bağlı değil yazar`() {
        val rows = buildArchiveRows(
            listOf(result("r1", "romantic", "2026-09-28T12:00:00+00:00", 68, mapOf("autonomy" to 72, "power" to 71, "labour" to 52))),
            mapOf("romantic" to romantic),
            relationshipLabelByResult = emptyMap(),
            currentYear = 2026,
        )
        val row = rows.single()
        assertEquals(listOf("Güç" to 71, "Emek" to 52, "Özerklik" to 72), row.indices)
        assertEquals("İlişkiye bağlı değil", row.who)
        assertEquals("Romantik", row.typeLabel)
        assertEquals(68, row.score)
        assertEquals("28", row.day)
    }

    @Test
    fun `geçen yılın ölçümünde ay yılla birlikte yazılır`() {
        val rows = buildArchiveRows(
            listOf(result("r1", "romantic", "2025-03-03T12:00:00+00:00", 57, emptyMap())),
            mapOf("romantic" to romantic),
            relationshipLabelByResult = mapOf("r1" to "Ayşe"),
            currentYear = 2026,
        )
        assertEquals("03", rows.single().day)
        assertEquals(true, rows.single().month.endsWith(" 25"))
        assertEquals("Ayşe", rows.single().who)
    }

    @Test
    fun `filtre ve sıralama`() {
        val rows = buildArchiveRows(
            listOf(
                result("a", "romantic", "2026-03-01T00:00:00+00:00", 50, emptyMap()),
                result("b", "friendship", "2026-05-01T00:00:00+00:00", 60, emptyMap()),
                result("c", "romantic", "2026-09-01T00:00:00+00:00", 70, emptyMap()),
            ),
            mapOf("romantic" to romantic),
            emptyMap(),
            2026,
        )
        assertEquals(listOf("c", "b", "a"), filterAndSort(rows, null, newestFirst = true).map { it.resultId })
        assertEquals(listOf("a", "c"), filterAndSort(rows, "romantic", newestFirst = false).map { it.resultId })
    }
}
