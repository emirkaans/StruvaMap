package com.struva.map.network

import com.struva.map.network.dto.AcceptInviteRequest
import com.struva.map.network.dto.CreateInviteRequest
import com.struva.map.network.dto.PairDto
import com.struva.map.network.dto.PulseTodayDto
import com.struva.map.network.dto.SubmitPulseAnswerRequest
import javax.inject.Inject
import javax.inject.Singleton

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

    suspend fun getToday(pairId: String): PulseTodayDto = api.getPulseToday(pairId)

    suspend fun submitAnswer(checkinId: String, answer: Int): PulseTodayDto =
        api.submitPulseAnswer(SubmitPulseAnswerRequest(checkinId, answer))
}
