package com.struva.map.network

import com.struva.map.network.dto.AcceptInviteRequest
import com.struva.map.network.dto.AssignResultRequest
import com.struva.map.network.dto.AssignResultResponse
import com.struva.map.network.dto.CreateRelationshipRequest
import com.struva.map.network.dto.LabourEntryDto
import com.struva.map.network.dto.LinkPulseRequest
import com.struva.map.network.dto.LabourWeekDto
import com.struva.map.network.dto.LogLabourRequest
import com.struva.map.network.dto.RelationshipDetailDto
import com.struva.map.network.dto.RelationshipDto
import com.struva.map.network.dto.RelationshipMapDto
import com.struva.map.network.dto.RenameRelationshipRequest
import com.struva.map.network.dto.ChangeUsernameRequest
import com.struva.map.network.dto.RedeemClaimRequest
import com.struva.map.network.dto.RedeemClaimResponse
import com.struva.map.network.dto.ChangeUsernameResponse
import com.struva.map.network.dto.ComparisonDto
import com.struva.map.network.dto.CreateInviteRequest
import com.struva.map.network.dto.PairDto
import com.struva.map.network.dto.PredictionDto
import com.struva.map.network.dto.SavePredictionRequest
import com.struva.map.network.dto.PulseHistoryDto
import com.struva.map.network.dto.PulseTodayDto
import com.struva.map.network.dto.RegisterDeviceRequest
import com.struva.map.network.dto.RegisterRequest
import com.struva.map.network.dto.RegisterResponse
import com.struva.map.network.dto.RegisterUserDeviceRequest
import com.struva.map.network.dto.ResetPasswordRequest
import com.struva.map.network.dto.ResultRowDto
import com.struva.map.network.dto.SecurityQuestionResponse
import com.struva.map.network.dto.SubmitPulseAnswerRequest
import com.struva.map.network.dto.SubmitResultRequest
import com.struva.map.network.dto.SubmitResultResponseDto
import com.struva.map.network.dto.TestDetailDto
import com.struva.map.network.dto.TestSummaryDto
import com.struva.map.network.dto.TrackEventRequest
import retrofit2.Response
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

    // Konuşma kartları: boyut id → sorular (bkz. packages/shared/src/conversation-prompts.ts).
    @GET("tests/{testId}/conversation-prompts")
    suspend fun getConversationPrompts(@Path("testId") testId: String): Map<String, List<String>>

    @POST("results")
    suspend fun submitResult(@Body body: SubmitResultRequest): SubmitResultResponseDto

    // testId verilmezse (null) kullanıcının çözdüğü tüm testlerin sonuçları
    // döner — "Geçmiş" sekmesi için (bkz. results.controller.ts).
    @GET("results/mine")
    suspend fun getMyResults(@Query("testId") testId: String?): List<ResultRowDto>

    @GET("results/{id}")
    suspend fun getResult(@Path("id") id: String): ResultRowDto

    // Karşı taraf henüz testi bitirmediyse sunucu 404 değil null (boş gövde)
    // döner. Retrofit suspend dönüş tipindeki `?`'i göremediği için ham
    // Response alınıyor — çağıranlar ApiServiceNullable.kt'deki
    // getComparisonByResult() uzantısını kullanır.
    @GET("comparisons/by-result/{resultId}")
    suspend fun getComparisonByResultResponse(@Path("resultId") resultId: String): Response<ComparisonDto>

    @GET("comparisons/{id}")
    suspend fun getComparison(@Path("id") id: String): ComparisonDto

    @POST("devices/register")
    suspend fun registerDevice(@Body body: RegisterDeviceRequest)

    // Oturum açma bu uçtan dönmez — başarılı kayıttan sonra istemci aynı
    // sentetik e-postayla Supabase SDK üzerinden signInWithPassword çağırır
    // (bkz. apps/api/src/auth/auth.controller.ts yorumu).
    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): RegisterResponse

    // Anonim → gerçek hesap yükseltme (bkz. AuthViewModel.register, plan:
    // düşük sürtünmeli mobil giriş). RegisterRequest'i aynen yeniden
    // kullanıyor — sunucu tarafında da aynı DTO (RegisterDto).
    @PATCH("auth/complete-profile")
    suspend fun completeProfile(@Body body: RegisterRequest): RegisterResponse

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

    // Kalıcı, kullanıcı bazlı push token — nabız check-in bildirimleri için
    // (bkz. AuthViewModel.registerPushTokenIfNeeded). Eski registerDevice
    // (result_id bazlı, davet-anı) ayrı, dokunulmuyor.
    @POST("devices/register-user")
    suspend fun registerUserDevice(@Body body: RegisterUserDeviceRequest)

    @POST("pairs/invite")
    suspend fun createPairInvite(@Body body: CreateInviteRequest): PairDto

    @POST("pairs/accept")
    suspend fun acceptPairInvite(@Body body: AcceptInviteRequest): PairDto

    @GET("pairs/mine")
    suspend fun getMyPairs(): List<PairDto>

    @GET("pulse/today")
    suspend fun getPulseToday(@Query("pairId") pairId: String): PulseTodayDto

    // Takvim + haftalık özet (son 7 gün) — bkz. PulseHistoryScreen.
    @GET("pulse/history")
    suspend fun getPulseHistory(@Query("pairId") pairId: String, @Query("days") days: Int): PulseHistoryDto

    @POST("pulse/answer")
    suspend fun submitPulseAnswer(@Body body: SubmitPulseAnswerRequest): PulseTodayDto

    // Tahmin modu: kıyaslama oluşana kadar kaydedilebilir/güncellenebilir.
    @POST("predictions")
    suspend fun savePrediction(@Body body: SavePredictionRequest): PredictionDto

    // Henüz tahmin yoksa sunucu 404 değil null döner (bkz. getComparisonByResultResponse).
    @GET("predictions/by-result/{resultId}")
    suspend fun getMyPredictionResponse(@Path("resultId") resultId: String): Response<PredictionDto>

    // Kişisel ilişki haritası (bkz. MapScreen).
    @GET("relationships")
    suspend fun getRelationships(): List<RelationshipDto>

    @GET("relationships/map")
    suspend fun getRelationshipMap(): RelationshipMapDto

    @GET("relationships/{id}")
    suspend fun getRelationship(@Path("id") id: String): RelationshipDetailDto

    @POST("relationships")
    suspend fun createRelationship(@Body body: CreateRelationshipRequest): RelationshipDto

    @PATCH("relationships/{id}")
    suspend fun renameRelationship(@Path("id") id: String, @Body body: RenameRelationshipRequest): RelationshipDto

    // pairId null → nabız bağı kaldırılır.
    @PATCH("relationships/{id}/pulse-pair")
    suspend fun linkRelationshipPulse(@Path("id") id: String, @Body body: LinkPulseRequest): RelationshipDto

    @DELETE("relationships/{id}")
    suspend fun deleteRelationship(@Path("id") id: String)

    // relationshipId null → sonucun ilişki bağı kaldırılır.
    @POST("relationships/assign")
    suspend fun assignResult(@Body body: AssignResultRequest): AssignResultResponse

    // Emek defteri (bkz. LabourScreen) — aktif nabız eşleşmesine bağlı.
    @GET("labour/week")
    suspend fun getLabourWeek(@Query("pairId") pairId: String): LabourWeekDto

    @POST("labour")
    suspend fun logLabour(@Body body: LogLabourRequest): LabourEntryDto

    @DELETE("labour/{id}")
    suspend fun deleteLabour(@Path("id") id: String)

    // Web'de çözülen bir sonucu formsuz bu cihaza bağlar (bkz. MainActivity
    // pano kontrolü, apps/web/src/components/AppCta.tsx claim akışı).
    @POST("claims/redeem")
    suspend fun redeemClaim(@Body body: RedeemClaimRequest): RedeemClaimResponse
}
