package com.fuzzy.christmas

import com.fuzzy.christmas.model.*
import org.junit.Assert.*
import org.junit.Test

class EditorAndEffectsTest {
    @Test fun originalGreetingIsPreservedForFreshInstall() {
        val state = EditorState.restore(null, null, false)
        assertEquals(DEFAULT_NOTE, state.note)
        assertFalse(state.read)
        assertTrue(state.decorations.isEmpty())
    }
    @Test fun noteEditingRejectsBlankAndOversizedInput() {
        assertNull(EditorState().withNote("  \n "))
        assertNull(EditorState().withNote("a".repeat(501)))
        assertEquals(500, EditorState().withNote("a".repeat(500))!!.note.length)
    }
    @Test fun replacementNoteCreatesNewMailWithoutLosingDecorations() {
        val before = EditorState(read = true).add("reindeer")
        val after = before.withNote("  Merry Christmas!  ")!!
        assertEquals("Merry Christmas!", after.note)
        assertFalse(after.read)
        assertEquals(listOf("reindeer"), after.decorations)
    }
    @Test fun additionsCannotExceedAvailableSnowOrUseUnknownTypes() {
        val filled = EditorState().add("gift").add("reindeer").add("snowman")
        assertEquals(filled, filled.add("gift"))
        assertEquals(EditorState(), EditorState().add("capybara"))
        assertEquals(listOf("gift", "reindeer"), filled.undo().decorations)
        assertEquals(EditorState(), EditorState().undo())
    }
    @Test fun restoreMigratesPineAndSanitizesMalformedStorage() {
        val state = EditorState.restore("hello", "pine,unknown,gift,snowman,reindeer", true)
        assertEquals(listOf("reindeer", "gift", "snowman"), state.decorations)
        assertEquals("hello", state.note)
        assertTrue(state.read)
        assertEquals(DEFAULT_NOTE, EditorState.restore(" ", "", false).note)
    }
    @Test fun savedNoteAndDecorationOrderRoundTrip() {
        val state = EditorState("See you soon ♡", listOf("reindeer", "gift"), true)
        assertEquals(state, EditorState.restore(state.note, state.decorations.joinToString(","), state.read))
    }
    @Test fun allEffectFramesRemainFiniteAndWithinOpacityBounds() {
        for (kind in listOf("glow", "spark", "smoke", "steam")) {
            for (tick in 0..1000) {
                val f = effectFrame(kind, tick / 30f, .37f, 2f)
                assertTrue(f.scale.isFinite() && f.scale > 0)
                assertTrue(f.opacity in 0f..1f)
                assertTrue(f.dx.isFinite() && f.dy.isFinite())
            }
        }
    }
    @Test fun smokeAndSteamRiseAndFadeAtTheCycleBoundary() {
        assertEquals(0f, effectFrame("smoke", 0f, 0f, 1f).opacity)
        assertTrue(effectFrame("smoke", 3.5f, 0f, 1f).dy > 0f)
        assertEquals(0f, effectFrame("smoke", 7f, 0f, 1f).opacity)
        assertTrue(effectFrame("steam", 5.5f, 0f, 1f).dy > 0f)
        assertEquals(0f, effectFrame("steam", 11f, 0f, 1f).opacity)
    }
}
