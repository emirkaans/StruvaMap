package com.struva.map.network.dto

import kotlinx.serialization.Serializable

@Serializable
data class RegisterRequest(
    val username: String,
    val password: String,
    val securityQuestion: String? = null,
    val securityAnswer: String? = null,
)

@Serializable
data class RegisterResponse(val id: String, val username: String)

@Serializable
data class SecurityQuestionResponse(val question: String)

@Serializable
data class ResetPasswordRequest(val username: String, val securityAnswer: String, val newPassword: String)

@Serializable
data class ChangeUsernameRequest(val newUsername: String)

@Serializable
data class ChangeUsernameResponse(val username: String)
