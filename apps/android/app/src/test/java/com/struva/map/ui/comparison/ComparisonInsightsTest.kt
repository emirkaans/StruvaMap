package com.struva.map.ui.comparison

import com.struva.map.network.dto.DimensionPredictionInsightDto
import org.junit.Assert.assertEquals
import org.junit.Test

class ComparisonInsightsTest {
    private fun insight(dim: String, kind: String, error: Int) =
        DimensionPredictionInsightDto(dim = dim, own = 50, predicted = 50, actual = 50, error = error, kind = kind)

    @Test
    fun `ongorulmemis farklar once, ayni turde buyuk hata once gelir`() {
        val sorted = sortInsights(
            listOf(
                insight("a", "aligned_known", 5),
                insight("b", "different_missed", 20),
                insight("c", "aligned_missed", 30),
                insight("d", "different_missed", 40),
                insight("e", "different_known", 10),
            ),
        )
        assertEquals(listOf("d", "b", "c", "e", "a"), sorted.map { it.dim })
    }

    @Test
    fun `konusma kartlari once ongorulmemis farki, sonra en buyuk algi farkini secer`() {
        val a = mapOf("decision" to 80, "domestic" to 30, "mental" to 60)
        val b = mapOf("decision" to 75, "domestic" to 90, "mental" to 20)
        assertEquals(listOf("domestic", "mental"), pickConversationDims(a, b, viewerInsights = null))
        assertEquals(
            listOf("decision", "domestic"),
            pickConversationDims(a, b, listOf(insight("decision", "different_missed", 25))),
        )
    }
}
