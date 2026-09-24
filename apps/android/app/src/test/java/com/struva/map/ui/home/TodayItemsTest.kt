package com.struva.map.ui.home

import com.struva.map.network.dto.ResultRowDto
import com.struva.map.network.dto.ScoreResultDto
import com.struva.map.network.dto.TestSummaryDto
import org.junit.Assert.assertEquals
import org.junit.Test
import java.time.Instant

class TodayItemsTest {
    private val now = Instant.parse("2026-09-24T12:00:00Z")
    private val tests = listOf(
        TestSummaryDto(id = "romantic", slug = "romantik", name = "Romantik İlişki", subtitle = ""),
        TestSummaryDto(id = "work", slug = "is", name = "İş İlişkisi", subtitle = ""),
    )

    private fun result(id: String, testId: String, createdAt: String) = ResultRowDto(
        id = id,
        createdAt = createdAt,
        score = ScoreResultDto(
            testId = testId,
            rsi = 60,
            dimensions = emptyMap(),
            indices = emptyMap(),
            strengths = emptyList(),
            tensions = emptyList(),
            interpretation = emptyList(),
        ),
    )

    @Test
    fun `hic sonuc yoksa ilk testi onerir`() {
        assertEquals(
            listOf(TodayItem.FirstTest("romantic", "Romantik İlişki")),
            buildTodayItems(tests, emptyList(), emptyList(), now),
        )
    }

    @Test
    fun `yalnizca en son sonucu 90 gunu gecen test icin yeniden cozme onerir`() {
        val results = listOf(
            result("r1", "romantic", "2026-05-01T10:00:00Z"), // 146 gün
            result("r2", "romantic", "2026-09-01T10:00:00Z"), // en sonu yeni
            result("w1", "work", "2026-06-25T12:00:00Z"), // tam 91 gün
        )
        assertEquals(
            listOf(TodayItem.Retest("work", "İş İlişkisi", 91)),
            buildTodayItems(tests, results, emptyList(), now),
        )
    }

    @Test
    fun `hazir kiyaslama once, bekleyen davet sonra gelir, gorulen kiyaslama dusulur`() {
        val results = listOf(result("r1", "romantic", "2026-09-20T10:00:00+03:00"))
        val invites = listOf(
            InviteStatus("r0", "work", comparisonId = null, seen = false),
            InviteStatus("r1", "romantic", comparisonId = "c1", seen = false),
            InviteStatus("r2", "romantic", comparisonId = "c2", seen = true),
        )
        assertEquals(
            listOf(
                TodayItem.ComparisonReady("c1", "Romantik İlişki"),
                TodayItem.WaitingForInvitee("r0", "İş İlişkisi"),
            ),
            buildTodayItems(tests, results, invites, now),
        )
    }

    @Test
    fun `davet penceresi son 30 gunle sinirli`() {
        val results = listOf(
            result("new", "romantic", "2026-09-10T10:00:00Z"),
            result("old", "romantic", "2026-08-20T10:00:00Z"),
        )
        assertEquals(listOf("new"), recentResults(results, now).map { it.id })
    }
}
