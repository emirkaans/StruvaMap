package com.struva.map.network.dto

import kotlinx.serialization.Serializable

// GET /pairs/mine, POST /pairs/invite, POST /pairs/accept — pairs.service.ts toDto() ile birebir.
@Serializable
data class PairDto(
    val id: String,
    val testId: String,
    val status: String, // "pending" | "active"
    val inviteCode: String,
    val partnerUsername: String?,
)

@Serializable
data class CreateInviteRequest(val testId: String)

@Serializable
data class AcceptInviteRequest(val inviteCode: String)

// GET /pulse/today, POST /pulse/answer — pulse.service.ts toDto() ile birebir.
@Serializable
data class PulseTodayDto(
    val id: String,
    val pairId: String,
    val questionText: String,
    val myAnswer: Int?,
    val partnerAnswered: Boolean,
    val partnerAnswer: Int?,
)

@Serializable
data class SubmitPulseAnswerRequest(val checkinId: String, val answer: Int)

@Serializable
data class RegisterUserDeviceRequest(val fcmToken: String)
