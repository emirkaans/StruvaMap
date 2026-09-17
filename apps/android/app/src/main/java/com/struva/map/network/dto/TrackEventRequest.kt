package com.struva.map.network.dto

import kotlinx.serialization.Serializable

// apps/web/src/lib/analytics.ts ile aynı şema/olay adları — huni tek bir
// events tablosunda web+mobil birleşik görünsün diye (bkz. events.controller.ts,
// EVENT_NAMES @IsIn ile sınırlıyor, burada da aynı isimler kullanılmalı). props
// web'de string|number|boolean karışık olabiliyor; burada basitlik için hepsi
// string'e çevrilip gönderiliyor (backend @IsObject dışında tip zorlamıyor).
@Serializable
data class TrackEventRequest(
    val name: String,
    val sessionId: String,
    val testId: String? = null,
    val props: Map<String, String>? = null,
)
