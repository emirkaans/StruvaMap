package com.struva.map.network.dto

import kotlinx.serialization.Serializable

@Serializable
data class RegisterRequest(val username: String, val password: String)

@Serializable
data class RegisterResponse(val id: String, val username: String)
