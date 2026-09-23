package com.struva.map.network.dto

import kotlinx.serialization.Serializable

@Serializable
data class RedeemClaimRequest(val token: String)

// POST /claims/redeem — claims.service.ts redeem() çıktısıyla birebir.
@Serializable
data class RedeemClaimResponse(val resultId: String)
