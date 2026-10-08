package com.struva.map.network

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Test
import retrofit2.HttpException
import retrofit2.Response
import java.net.SocketTimeoutException
import java.net.UnknownHostException

// Ekranlarda gösterilen hata metni: ham istisna mesajı hiçbir durumda
// kullanıcıya çıkmamalı (bkz. UserError.kt).
class UserErrorTest {

    private fun http(code: Int, body: String = "{}") = HttpException(
        Response.error<Any>(code, body.toResponseBody("application/json".toMediaType())),
    )

    @Test
    fun `internet yoksa ham host mesaji yerine baglanti metni`() {
        val e = UnknownHostException("Unable to resolve host \"struvamap.onrender.com\"")
        assertEquals(ErrorText.OFFLINE, e.userMessage())
    }

    @Test
    fun `sarilmis ag hatasinda asil sebep bulunur`() {
        val e = RuntimeException("HttpRequestException", SocketTimeoutException("timeout"))
        assertEquals(ErrorText.TIMEOUT, e.userMessage())
    }

    @Test
    fun `sunucunun kendi aciklamasi oldugu gibi gosterilir`() {
        val e = http(409, """{"message":"Bu kullanıcı adı zaten alınmış.","statusCode":409}""")
        assertEquals("Bu kullanıcı adı zaten alınmış.", e.userMessage())
    }

    @Test
    fun `sunucu hatasi ve oturum hatasi sabit metne doner`() {
        assertEquals(ErrorText.SERVER, http(500, """{"message":"relation does not exist"}""").userMessage())
        assertEquals(ErrorText.SESSION, http(401).userMessage())
    }

    @Test
    fun `taninmayan hata fallback e duser`() {
        assertEquals("Kaydedilemedi.", IllegalStateException("boom").userMessage("Kaydedilemedi."))
        assertEquals(ErrorText.GENERIC, IllegalStateException("boom").userMessage())
    }

    @Test
    fun `yanlis sifre anlasilir metne doner`() {
        assertEquals(ErrorText.WRONG_CREDENTIALS, Exception("invalid_credentials (Invalid login credentials)").userMessage())
    }
}
