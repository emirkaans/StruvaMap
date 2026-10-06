package com.struva.map.ui.home

import com.struva.map.network.dto.RelationshipMapNodeDto
import com.struva.map.network.dto.ResultRowDto
import com.struva.map.network.dto.TestSummaryDto
import com.struva.map.ui.common.computeProfileLabel
import com.struva.map.ui.relationships.relationshipTypeLabel
import java.time.Duration
import java.time.Instant
import java.time.OffsetDateTime

// Anasayfa testlerin döngüsünü (çöz → davet et → kıyasla → haritaya koy →
// yeniden çöz) her ilişki türü için bir adım ileri taşır. Buradaki saf
// fonksiyonlar o bölümleri veriden kurar; ekran yalnızca çizer.

// Tek "sıradaki adım": liste baskı yaratır, tek kart yön gösterir.
// Önce hazır olan (kıyaslama), sonra beklerken yapılabilecek (tahmin), sonra
// zamanı gelen (yeniden çöz), en son ilk test.
fun pickNextStep(items: List<TodayItem>): TodayItem? =
    items.firstOrNull { it is TodayItem.ComparisonReady }
        ?: items.firstOrNull { it is TodayItem.WaitingForInvitee }
        ?: items.firstOrNull { it is TodayItem.Retest }
        ?: items.firstOrNull { it is TodayItem.FirstTest }

data class RelationshipRowUi(
    val id: String,
    val label: String,
    val typeLabel: String,
    // Son haritanın sözlü özeti (sonuç ekranındaki profil başlığı); ölçüm yoksa null.
    val summary: String?,
    val daysSince: Long?,
    // İlişki için açık duran eylem; yoksa null.
    val hint: String?,
)

fun buildRelationshipRows(
    nodes: List<RelationshipMapNodeDto>,
    indexNamesByTest: Map<String, Map<String, String>>,
    now: Instant,
): List<RelationshipRowUi> = nodes
    .filter { it.archivedAt == null }
    .map { node ->
        val latest = node.latest
        val names = indexNamesByTest[node.testId]
        val days = latest?.let { parseIso(it.createdAt) }?.let { Duration.between(it, now).toDays() }
        RelationshipRowUi(
            id = node.id,
            label = node.label,
            typeLabel = relationshipTypeLabel(node.testId, node.testName),
            summary = if (latest != null && !names.isNullOrEmpty()) computeProfileLabel(names, latest.indices).title else null,
            daysSince = days,
            hint = when {
                latest == null -> "Henüz ölçülmedi, testi çöz"
                days != null && days >= RETEST_AFTER_DAYS -> "Yeniden haritalama zamanı"
                else -> null
            },
        )
    }
    // En son ölçülen önce; hiç ölçülmemişler en sonda.
    .sortedWith(compareBy<RelationshipRowUi> { it.daysSince == null }.thenBy { it.daysSince ?: 0 })

data class TestRowUi(
    val id: String,
    val typeLabel: String,
    val subtitle: String,
    // Bu türde hiç sonucu yoksa true: "henüz haritalamadın" olarak öne çıkar.
    val unmapped: Boolean,
    val daysSinceLast: Long?,
)

// Bütün testler, haritalanmamış türler önce. Yeniden çözmek isteyen için
// liste her zaman burada; ayrı bir "haritalamadıkların" bölümü yerine tek liste.
fun buildTestRows(tests: List<TestSummaryDto>, results: List<ResultRowDto>, now: Instant): List<TestRowUi> {
    val lastByTest = results
        .groupBy { it.score.testId }
        .mapValues { (_, rows) -> rows.mapNotNull { parseIso(it.createdAt) }.maxOrNull() }
    return tests
        .map { t ->
            val last = lastByTest[t.id]
            TestRowUi(
                id = t.id,
                typeLabel = relationshipTypeLabel(t.id, t.name),
                subtitle = t.subtitle,
                unmapped = last == null,
                daysSinceLast = last?.let { Duration.between(it, now).toDays() },
            )
        }
        .sortedByDescending { it.unmapped }
}

data class MapPrompt(val testId: String, val typeLabel: String, val dimName: String, val prompts: List<String>)

// "Haritandan bir soru": en son sonuçta en düşük çıkan boyut. Konuşma soruları
// üç test için de var; soru sonucun kendisine bağlı kalır.
fun lowestDimensionOfLatest(results: List<ResultRowDto>): Pair<ResultRowDto, String>? {
    val latest = results.maxByOrNull { parseIso(it.createdAt) ?: Instant.EPOCH } ?: return null
    val dim = latest.score.dimensions.minByOrNull { it.value }?.key ?: return null
    return latest to dim
}

fun dimensionName(result: ResultRowDto, dim: String): String =
    result.score.interpretation.firstOrNull { it.dim == dim }?.name ?: dim

internal fun parseIso(iso: String): Instant? = try {
    OffsetDateTime.parse(iso).toInstant()
} catch (e: Exception) {
    null
}
