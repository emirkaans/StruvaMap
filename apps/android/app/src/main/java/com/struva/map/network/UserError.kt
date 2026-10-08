package com.struva.map.network

import kotlinx.serialization.json.Json
import retrofit2.HttpException
import java.io.IOException
import java.io.InterruptedIOException
import java.net.ConnectException
import java.net.NoRouteToHostException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

// Arayüzde gösterilen hata metni. Ham istisna mesajları ("Unable to resolve
// host ...") kullanıcıya hiçbir şey anlatmadığı için ekranlar hatayı her zaman
// buradan geçirir; teknik ayrıntı arayüze çıkmaz.
object ErrorText {
    const val OFFLINE = "İnternet bağlantın yok gibi görünüyor. Bağlanınca tekrar dene."
    const val TIMEOUT = "Sunucu şu an yanıt vermiyor. Birazdan tekrar dene."
    const val SERVER = "Sunucuda bir sorun var. Birazdan tekrar dene."
    const val SESSION = "Oturumun sona ermiş. Uygulamayı kapatıp yeniden aç."
    const val WRONG_CREDENTIALS = "Kullanıcı adı ya da şifre hatalı."
    const val GENERIC = "Bir sorun oluştu. Tekrar dene."
}

private val errorJson = Json { ignoreUnknownKeys = true }

// İstisnayı kullanıcının anlayacağı tek cümleye çevirir. Sunucunun kendi
// açıklaması olan 4xx hataları ("Bu kullanıcı adı zaten alınmış.") olduğu gibi
// gösterilir, çünkü onlar zaten kullanıcıya yazıldı. Tanınmayan her şey
// fallback'e (verilmezse genel mesaja) düşer.
fun Throwable.userMessage(fallback: String = ErrorText.GENERIC): String {
    val http = this as? HttpException
    if (http != null) {
        val code = http.code()
        return when {
            code == 401 -> ErrorText.SESSION
            code >= 500 -> ErrorText.SERVER
            else -> http.apiErrorMessage(errorJson) ?: fallback
        }
    }
    // Supabase ve Ktor ağ hatalarını kendi istisnalarına sarıyor; asıl sebep
    // zincirin içinde.
    for (cause in causeChain()) {
        when (cause) {
            is UnknownHostException, is ConnectException, is NoRouteToHostException -> return ErrorText.OFFLINE
            is SocketTimeoutException, is InterruptedIOException -> return ErrorText.TIMEOUT
            is IOException -> return ErrorText.OFFLINE
        }
    }
    if (message?.contains("Invalid login credentials", ignoreCase = true) == true) return ErrorText.WRONG_CREDENTIALS
    return fallback
}

private fun Throwable.causeChain(): Sequence<Throwable> =
    generateSequence(this) { it.cause?.takeIf { c -> c !== it } }.take(8)
