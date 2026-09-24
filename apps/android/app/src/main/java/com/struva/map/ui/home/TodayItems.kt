package com.struva.map.ui.home

import com.struva.map.network.dto.ResultRowDto
import com.struva.map.network.dto.TestSummaryDto
import java.time.Duration
import java.time.Instant
import java.time.OffsetDateTime

// Yeniden çözme hatırlatması: "Zamanla Değişim" grafiği ancak tekrar eden
// sonuçlarla dolar. 90 gün tasarım kararı (mevsimlik bir ritim), ampirik değil.
const val RETEST_AFTER_DAYS = 90L

// Davet edilen kişinin testi bitirip bitirmediğine bu pencere içindeki
// sonuçlar için bakılıyor — daha eskisi büyük ihtimalle unutulmuş bir davet.
const val INVITE_LOOKBACK_DAYS = 30L

sealed interface TodayItem {
    data class FirstTest(val testId: String, val testName: String) : TodayItem
    data class ComparisonReady(val comparisonId: String, val testName: String) : TodayItem
    data class WaitingForInvitee(val resultId: String, val testName: String) : TodayItem
    data class Retest(val testId: String, val testName: String, val daysAgo: Long) : TodayItem
}

// Davet edilmiş bir sonucun kıyaslama durumu (bkz. HomeViewModel):
// comparisonId null → karşı taraf henüz bitirmedi.
data class InviteStatus(val resultId: String, val testId: String, val comparisonId: String?, val seen: Boolean)

// Saf fonksiyon (ağ/Android yok) — sıralama önemli: önce sende bekleyen
// (hazır kıyaslama), sonra karşı tarafta bekleyen, en son hatırlatmalar.
fun buildTodayItems(
    tests: List<TestSummaryDto>,
    results: List<ResultRowDto>,
    inviteStatuses: List<InviteStatus>,
    now: Instant,
): List<TodayItem> {
    val names = tests.associate { it.id to it.name }
    fun nameOf(testId: String) = names[testId] ?: testId

    if (results.isEmpty()) {
        val first = tests.firstOrNull() ?: return emptyList()
        return listOf(TodayItem.FirstTest(first.id, first.name))
    }

    val ready = inviteStatuses
        .filter { it.comparisonId != null && !it.seen }
        .map { TodayItem.ComparisonReady(it.comparisonId!!, nameOf(it.testId)) }
    val waiting = inviteStatuses
        .filter { it.comparisonId == null }
        .map { TodayItem.WaitingForInvitee(it.resultId, nameOf(it.testId)) }

    val retests = results
        .groupBy { it.score.testId }
        .mapNotNull { (testId, rows) ->
            val latest = rows.mapNotNull { parseInstant(it.createdAt) }.maxOrNull() ?: return@mapNotNull null
            val daysAgo = Duration.between(latest, now).toDays()
            if (daysAgo >= RETEST_AFTER_DAYS && testId in names) TodayItem.Retest(testId, nameOf(testId), daysAgo) else null
        }
        .sortedByDescending { it.daysAgo }

    return ready + waiting + retests
}

// Davet penceresine giren (son INVITE_LOOKBACK_DAYS gün) sonuçlar.
fun recentResults(results: List<ResultRowDto>, now: Instant): List<ResultRowDto> =
    results.filter { row ->
        val created = parseInstant(row.createdAt) ?: return@filter false
        Duration.between(created, now).toDays() < INVITE_LOOKBACK_DAYS
    }

private fun parseInstant(iso: String): Instant? = try {
    OffsetDateTime.parse(iso).toInstant()
} catch (e: Exception) {
    null
}
