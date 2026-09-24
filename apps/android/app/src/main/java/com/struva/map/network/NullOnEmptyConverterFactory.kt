package com.struva.map.network

import okhttp3.ResponseBody
import retrofit2.Converter
import retrofit2.Retrofit
import java.lang.reflect.Type

// NestJS, handler null döndürdüğünde 200 + boş gövde gönderiyor (ör.
// comparisons/by-result, predictions/by-result "henüz yok" durumu). JSON
// dönüştürücüsü boş gövdede "Expected start of the object, but had EOF"
// fırlatıyor; bu fabrika boş gövdeyi null'a çevirip gerisini JSON
// dönüştürücüsüne bırakıyor. Retrofit'e JSON fabrikasından ÖNCE eklenmeli.
// null dönebilen uçlar Response<T> ile tanımlanmalı (bkz. ApiServiceNullable.kt).
class NullOnEmptyConverterFactory : Converter.Factory() {
    override fun responseBodyConverter(
        type: Type,
        annotations: Array<out Annotation>,
        retrofit: Retrofit,
    ): Converter<ResponseBody, *> {
        val delegate = retrofit.nextResponseBodyConverter<Any?>(this, type, annotations)
        return Converter<ResponseBody, Any?> { body ->
            // contentLength -1 (chunked) olabilir; exhausted() gövdeyi tüketmeden bakar.
            if (body.contentLength() == 0L || body.source().exhausted()) null else delegate.convert(body)
        }
    }
}
