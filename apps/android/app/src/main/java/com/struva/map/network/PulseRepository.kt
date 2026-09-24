package com.struva.map.network

import com.struva.map.network.dto.AcceptInviteRequest
import com.struva.map.network.dto.CreateInviteRequest
import com.struva.map.network.dto.PairDto
import com.struva.map.network.dto.PulseHistoryDto
import com.struva.map.network.dto.PulseTodayDto
import com.struva.map.network.dto.SubmitPulseAnswerRequest
import javax.inject.Inject
import javax.inject.Singleton

// Takvim 4 tam hafta gösteriyor (bkz. PulseHistoryScreen).
const val HISTORY_DAYS = 28

// Room cache yok (bilinçli): "bugünün nabzı" canlı veri, ekrana her girişte
// ağdan tazelenir (bkz. TestsRepository'nin aksine — orada offline'da da
// gösterilecek bir liste var, burada değil).
@Singleton
class PulseRepository @Inject constructor(
    private val api: ApiService,
) {
    suspend fun createInvite(testId: String): PairDto = api.createPairInvite(CreateInviteRequest(testId))

    suspend fun acceptInvite(inviteCode: String): PairDto = api.acceptPairInvite(AcceptInviteRequest(inviteCode))

    suspend fun getMyPairs(): List<PairDto> = api.getMyPairs()

    // Faz 1'de kullanıcının tek aktif eşleşmesi var (bkz. PulseViewModel) —
    // widget/geçmiş ekranı da aynı "ilk aktif" seçimini kullanıyor.
    suspend fun getActivePair(): PairDto? = api.getMyPairs().firstOrNull { it.status == "active" }

    suspend fun getToday(pairId: String): PulseTodayDto = api.getPulseToday(pairId)

    suspend fun getHistory(pairId: String, days: Int = HISTORY_DAYS): PulseHistoryDto = api.getPulseHistory(pairId, days)

    suspend fun submitAnswer(checkinId: String, answer: Int): PulseTodayDto =
        api.submitPulseAnswer(SubmitPulseAnswerRequest(checkinId, answer))
}
