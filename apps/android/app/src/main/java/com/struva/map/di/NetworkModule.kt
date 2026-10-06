package com.struva.map.di

import android.os.Build
import com.struva.map.BuildConfig
import com.struva.map.network.ApiService
import com.struva.map.network.AuthInterceptor
import com.struva.map.network.NullOnEmptyConverterFactory
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.createSupabaseClient
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideSupabaseClient(): SupabaseClient = createSupabaseClient(
        supabaseUrl = BuildConfig.SUPABASE_URL,
        supabaseKey = BuildConfig.SUPABASE_ANON_KEY,
    ) {
        install(Auth)
    }

    @Provides
    @Singleton
    fun provideAuthInterceptor(supabaseClient: SupabaseClient): AuthInterceptor =
        AuthInterceptor(supabaseClient)

    @Provides
    @Singleton
    fun provideOkHttpClient(authInterceptor: AuthInterceptor): OkHttpClient =
        OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(
                HttpLoggingInterceptor().apply {
                    level = if (BuildConfig.DEBUG) {
                        HttpLoggingInterceptor.Level.BODY
                    } else {
                        HttpLoggingInterceptor.Level.NONE
                    }
                },
            )
            .build()

    @Provides
    @Singleton
    fun provideJson(): Json = Json { ignoreUnknownKeys = true }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient, json: Json): Retrofit =
        Retrofit.Builder()
            .baseUrl(apiBaseUrl())
            .client(okHttpClient)
            .addConverterFactory(NullOnEmptyConverterFactory())
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()

    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService = retrofit.create(ApiService::class.java)

    // Debug build 127.0.0.1'i hedefliyor; bu adb reverse ister ve emulator'un
    // adb bağlantısı her yenilendiğinde reverse kuralı silinip "failed to
    // connect" veriyor. Emulator makineye 10.0.2.2 üzerinden kuralsız erişir,
    // bu yüzden emulator'da onu kullan. Gerçek cihaz 127.0.0.1 + adb reverse'te kalır.
    private fun apiBaseUrl(): String {
        val url = BuildConfig.API_BASE_URL
        return if (BuildConfig.DEBUG && isEmulator()) url.replace("127.0.0.1", "10.0.2.2") else url
    }

    private fun isEmulator(): Boolean =
        Build.HARDWARE == "ranchu" ||
            Build.HARDWARE == "goldfish" ||
            Build.PRODUCT.startsWith("sdk_gphone") ||
            Build.FINGERPRINT.startsWith("generic")
}
