package com.struva.map.ui.home

import com.struva.map.network.dto.DimensionInterpretationDto
import com.struva.map.network.dto.RelationshipLatestDto
import com.struva.map.network.dto.RelationshipMapNodeDto
import com.struva.map.network.dto.ResultRowDto
import com.struva.map.network.dto.ScoreResultDto
import com.struva.map.network.dto.TestSummaryDto
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.Instant

class HomeSectionsTest {
    private val now = Instant.parse("2026-10-06T12:00:00Z")

    private fun result(id: String, testId: String, createdAt: String, dims: Map<String, Int> = emptyMap()) = ResultRowDto(
        id = id,
        createdAt = createdAt,
        score = ScoreResultDto(
            testId = testId,
            rsi = 60,
            dimensions = dims,
            indices = emptyMap(),
            strengths = emptyList(),
            tensions = emptyList(),
            interpretation = dims.keys.map { DimensionInterpretationDto(dim = it, name = "Ad-$it", score = dims.getValue(it), band = "orta", text = "") },
        ),
    )

    private fun node(id: String, testId: String, latestAt: String?, archived: Boolean = false) = RelationshipMapNodeDto(
        id = id,
        testId = testId,
        label = "İlişki $id",
        createdAt = "2026-01-01T00:00:00Z",
        testName = testId,
        archivedAt = if (archived) "2026-09-01T00:00:00Z" else null,
        resultCount = if (latestAt == null) 0 else 1,
        latest = latestAt?.let { RelationshipLatestDto(resultId = "r", rsi = 60, indices = mapOf("power" to 80, "labour" to 40), createdAt = it) },
    )

    @Test
    fun `sıradaki adımda hazır kıyaslama yeniden çözmenin önüne geçer`() {
        val items = listOf(
            TodayItem.Retest("romantic", "Romantik", 120),
            TodayItem.ComparisonReady("c1", "Romantik"),
        )
        assertTrue(pickNextStep(items) is TodayItem.ComparisonReady)
        assertNull(pickNextStep(emptyList()))
    }

    @Test
    fun `arşivli ilişkiler çıkar, ölçülmemiş ilişki sona ve ipucuyla gelir`() {
        val rows = buildRelationshipRows(
            listOf(
                node("a", "romantic", null),
                node("b", "friendship", "2026-10-01T00:00:00Z"),
                node("c", "roommate", "2026-01-01T00:00:00Z"),
                node("d", "romantic", "2026-10-05T00:00:00Z", archived = true),
            ),
            indexNamesByTest = mapOf("friendship" to mapOf("power" to "Güç", "labour" to "Emek")),
            now = now,
        )
        assertEquals(listOf("b", "c", "a"), rows.map { it.id })
        assertEquals("Henüz ölçülmedi, testi çöz", rows.last().hint)
        assertEquals("Yeniden haritalama zamanı", rows[1].hint)
        assertNull(rows[0].hint)
        // Endeks adları bilinmeyen türde özet yok, bilinen türde profil başlığı var.
        assertTrue(rows[0].summary != null)
        assertNull(rows[1].summary)
        assertEquals("Arkadaş", rows[0].typeLabel)
    }

    @Test
    fun `haritalanmamış testler listenin başına gelir`() {
        val tests = listOf(
            TestSummaryDto("romantic", "r", "Romantik", ""),
            TestSummaryDto("friendship", "f", "Arkadaşlık", ""),
        )
        val rows = buildTestRows(tests, listOf(result("1", "romantic", "2026-10-04T12:00:00Z")), now)
        assertEquals(listOf("friendship", "romantic"), rows.map { it.id })
        assertTrue(rows[0].unmapped)
        assertEquals(2L, rows[1].daysSinceLast)
    }

    @Test
    fun `soru en son sonucun en düşük boyutundan seçilir`() {
        val older = result("1", "romantic", "2026-09-01T00:00:00Z", mapOf("decision" to 10))
        val newer = result("2", "friendship", "2026-10-01T00:00:00Z", mapOf("support" to 70, "honesty" to 30))
        val (row, dim) = lowestDimensionOfLatest(listOf(older, newer))!!
        assertEquals("2", row.id)
        assertEquals("honesty", dim)
        assertEquals("Ad-honesty", dimensionName(row, dim))
    }
}
