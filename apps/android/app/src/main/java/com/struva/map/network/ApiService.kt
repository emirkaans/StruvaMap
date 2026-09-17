package com.struva.map.network

import com.struva.map.network.dto.ChangeUsernameRequest
import com.struva.map.network.dto.ChangeUsernameResponse
import com.struva.map.network.dto.ComparisonDto
import com.struva.map.network.dto.RegisterDeviceRequest
import com.struva.map.network.dto.RegisterRequest
import com.struva.map.network.dto.RegisterResponse
import com.struva.map.network.dto.ResetPasswordRequest
import com.struva.map.network.dto.ResultRowDto
import com.struva.map.network.dto.SecurityQuestionResponse
import com.struva.map.network.dto.SubmitResultRequest
import com.struva.map.network.dto.SubmitResultResponseDto
import com.struva.map.network.dto.TestDetailDto
import com.struva.map.network.dto.TestSummaryDto
import com.struva.map.network.dto.TrackEventRequest
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {
    @GET("tests")
    suspend fun getTests(): List<TestSummaryDto>

    @GET("tests/{testId}")
    suspend fun getTest(@Path("testId") testId: String): TestDetailDto

    @POST("results")
    suspend fun submitResult(@Body body: SubmitResultRequest): SubmitResultResponseDto

    // testId verilmezse (null) kullanıcının çözdüğü tüm testlerin sonuçları
    // döner — "Geçmiş" sekmesi için (bkz. results.controller.ts).
    @GET("results/mine")
    suspend fun getMyResults(@Query("testId") testId: String?): List<ResultRowDto>

    @GET("results/{id}")
    suspend fun getResult(@Path("id") id: String): ResultRowDto

    // Karşı taraf henüz testi bitirmediyse sunucu 404 değil null döner.
    @GET("comparisons/by-result/{resultId}")
    suspend fun getComparisonByResult(@Path("resultId") resultId: String): ComparisonDto?

    @GET("comparisons/{id}")
    suspend fun getComparison(@Path("id") id: String): ComparisonDto

    @POST("devices/register")
    suspend fun registerDevice(@Body body: RegisterDeviceRequest)

    // Oturum açma bu uçtan dönmez — başarılı kayıttan sonra istemci aynı
    // sentetik e-postayla Supabase SDK üzerinden signInWithPassword çağırır
    // (bkz. apps/api/src/auth/auth.controller.ts yorumu).
    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): RegisterResponse

    // Şifremi unuttum — adım 1: kayıtlı soruyu getir (yoksa 404).
    @GET("auth/security-question")
    suspend fun getSecurityQuestion(@Query("username") username: String): SecurityQuestionResponse

    // Şifremi unuttum — adım 2: cevap doğrulanırsa şifre değişir.
    @POST("auth/reset-password")
    suspend fun resetPassword(@Body body: ResetPasswordRequest)

    @PATCH("auth/username")
    suspend fun changeUsername(@Body body: ChangeUsernameRequest): ChangeUsernameResponse

    @DELETE("auth/me")
    suspend fun deleteAccount()

    // apps/web/src/lib/analytics.ts ile aynı uç — huni web+mobil birleşik.
    @POST("events")
    suspend fun trackEvent(@Body body: TrackEventRequest)
}
