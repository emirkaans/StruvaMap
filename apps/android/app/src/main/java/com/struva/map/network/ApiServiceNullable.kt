package com.struva.map.network

import com.struva.map.network.dto.ComparisonDto
import com.struva.map.network.dto.PredictionDto
import retrofit2.HttpException
import retrofit2.Response

// "Henüz yok" durumunda null dönen uçlar. Retrofit, suspend fonksiyonun
// Kotlin nullability'sini göremediği için `T?` dönüşte boş gövdeyi
// "was null but response body type was declared as non-null" diye
// reddediyor; ham Response alıp gövdeyi burada çözüyoruz. Boş gövdenin
// null'a çevrilmesi NullOnEmptyConverterFactory'de.

suspend fun ApiService.getComparisonByResult(resultId: String): ComparisonDto? =
    getComparisonByResultResponse(resultId).nullableBody()

suspend fun ApiService.getMyPrediction(resultId: String): PredictionDto? =
    getMyPredictionResponse(resultId).nullableBody()

// Başarısız durum kodları (4xx/5xx) eskisi gibi HttpException olarak fırlar.
private fun <T> Response<T>.nullableBody(): T? {
    if (!isSuccessful) throw HttpException(this)
    return body()
}
