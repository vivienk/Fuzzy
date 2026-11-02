package com.fuzzy.christmas

import com.fuzzy.christmas.model.GreetingState
import org.junit.Assert.*
import org.junit.Test

class ChristmasFlowTest {
    @Test fun unopenedGiftCannotInteractOrSave() {
        val state = GreetingState()
        assertEquals(state, state.toggleLights().turn().saveResult(true).openKept(true))
    }
    @Test fun completeChristmasFlow() {
        val state = GreetingState().unwrap().toggleLights().turn().saveResult(true)
        assertTrue(state.opened && state.lightsOn && state.turned && state.kept)
    }
    @Test fun wrappingPreservesKeepsakeButResetsScene() {
        val state = GreetingState().unwrap().toggleLights().turn().saveResult(true).wrapAgain()
        assertTrue(state.kept)
        assertFalse(state.opened || state.lightsOn || state.turned)
    }
    @Test fun failedSaveDoesNotClaimSuccess() {
        assertFalse(GreetingState().unwrap().saveResult(false).kept)
    }
    @Test fun restoredKeepsakeOpensWithSavedLighting() {
        val state = GreetingState(kept = true).openKept(true)
        assertTrue(state.opened && state.lightsOn && state.kept)
        assertFalse(state.turned)
    }
    @Test fun togglesReturnToOriginalView() {
        val state = GreetingState().unwrap()
        assertEquals(state, state.toggleLights().toggleLights().turn().turn())
    }
}
