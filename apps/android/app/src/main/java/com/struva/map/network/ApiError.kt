package com.struva.map.network

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonPrimitive
import retrofit2.HttpException

// Nest'in default exception filter'ı hataları {message, error, statusCode} olarak
// döner; message class-validator doğrulama hatalarında dizi, tekil
// ConflictException/BadRequestException'da düz string olabilir — ikisini de kapsar.
fun HttpException.apiErrorMessage(json: Json): String? {
    val body = response()?.errorBody()?.string() ?: return null
    return try {
        when (val message = (json.parseToJsonElement(body) as? JsonObject)?.get("message")) {
            is JsonArray -> message.joinToString("\n") { it.jsonPrimitive.content }
            is JsonPrimitive -> message.content
            else -> null
        }
    } catch (e: Exception) {
        null
    }
}
