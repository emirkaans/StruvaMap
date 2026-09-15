package com.struva.map.network.dto

import kotlinx.serialization.Serializable

@Serializable
data class RegisterDeviceRequest(val resultId: String, val fcmToken: String)
