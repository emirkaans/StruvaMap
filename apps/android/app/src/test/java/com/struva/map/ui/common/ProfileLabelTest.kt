package com.struva.map.ui.common

import com.struva.map.network.dto.DimensionInterpretationDto
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

// packages/shared/src/scoring.test.ts'teki bandOf sınır testleriyle aynı
// vektörler + computeProfileLabel'ın her dalı için birer örnek — Kotlin
// portu (ProfileLabel.kt) web'deki mantıkla aynı sonucu üretmeli.
class ProfileLabelTest {

    @Test
    fun `bandOf esik sinirlarini dogru bantlar`() {
        assertEquals("orta", bandOf(74))
        assertEquals("yüksek", bandOf(75))
        assertEquals("düşük", bandOf(54))
        assertEquals("orta", bandOf(55))
    }

    @Test
    fun `hic endeks yoksa dengeli doner`() {
        val profile = computeProfileLabel(emptyMap(), emptyMap())
        assertEquals("Dengeli Yapı", profile.title)
    }

    @Test
    fun `en yuksek endeks bile dusukse genel gerilimli doner`() {
        val names = mapOf("a" to "A", "b" to "B", "c" to "C")
        val scores = mapOf("a" to 40, "b" to 30, "c" to 20)
        val profile = computeProfileLabel(names, scores)
        assertEquals("Genel Olarak Gerilimli Yapı", profile.title)
    }

    @Test
    fun `fark 10dan kucukse dengeli doner`() {
        val names = mapOf("a" to "A", "b" to "B", "c" to "C")
        val scores = mapOf("a" to 60, "b" to 58, "c" to 55)
        val profile = computeProfileLabel(names, scores)
        assertEquals("Dengeli Yapı", profile.title)
    }

    @Test
    fun `yuksek ve dusuk birlikteyse agirlikli-gerilimli baslik doner`() {
        val names = mapOf("a" to "Güç", "b" to "Emek")
        val scores = mapOf("a" to 85, "b" to 40)
        val profile = computeProfileLabel(names, scores)
        assertEquals("Güç Ağırlıklı, Emek Gerilimli", profile.title)
    }

    @Test
    fun `yuksek ve orta ise agirlikli yapi doner`() {
        val names = mapOf("a" to "Güç", "b" to "Emek")
        val scores = mapOf("a" to 85, "b" to 60)
        val profile = computeProfileLabel(names, scores)
        assertEquals("Güç Ağırlıklı Yapı", profile.title)
    }

    @Test
    fun `orta ve dusuk ise gerilimli yapi doner`() {
        val names = mapOf("a" to "Güç", "b" to "Emek")
        val scores = mapOf("a" to 65, "b" to 40)
        val profile = computeProfileLabel(names, scores)
        assertEquals("Emek Gerilimli Yapı", profile.title)
    }

    @Test
    fun `composeProfileStory en guclu ve en gerilimli boyutu ekler`() {
        val profile = ProfileLabel("Dengeli Yapı", "Açıklama.")
        val interpretation = listOf(
            DimensionInterpretationDto("power", "Güç", 90, "yüksek", "Güç metni."),
            DimensionInterpretationDto("labour", "Emek", 30, "düşük", "Emek metni."),
        )
        val story = composeProfileStory(profile, interpretation, listOf("power"), listOf("labour"))
        assertTrue(story.contains("Güç metni."))
        assertTrue(story.contains("Emek metni."))
    }
}
