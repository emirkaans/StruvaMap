package com.struva.map.network

// Backend'deki apps/api/src/auth/username.util.ts ile birebir aynı formül
// olmak zorunda — ikisi de aynı sentetik e-postayı üretmeli.
private const val SYNTHETIC_EMAIL_DOMAIN = "users.struvamap.internal"

fun usernameToEmail(username: String): String = "${username.lowercase()}@$SYNTHETIC_EMAIL_DOMAIN"
