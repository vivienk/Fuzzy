package com.fuzzy.christmas

import com.fuzzy.christmas.model.parcelEmail
import java.net.URLDecoder
import org.junit.Assert.assertEquals
import org.junit.Test

class ParcelEmailTest {
    @Test fun emailDraftPreservesTheWholeParcelIncludingEscapedNote() {
        val parcel = "https://example.com/receive#parcel=1&world=candy&paper=berry&album=buble&sender=V&note=A%26B%0A%F0%9F%8E%81&gift=preset%3Abicycle&gift=preset%3Alantern&gift=preset%3Asnowman"
        val mail = parcelEmail("vivien+test@example.com", parcel)
        fun decode(s: String) = URLDecoder.decode(s, "UTF-8")
        assertEquals("mailto:vivien+test@example.com", decode(mail.substringBefore('?')))
        val fields = mail.substringAfter('?').split('&').associate { it.substringBefore('=') to decode(it.substringAfter('=')) }
        assertEquals("A winter world for you", fields["subject"])
        assertEquals(parcel, fields.getValue("body").substringAfter("\n\n"))
    }
}
