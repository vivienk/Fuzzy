package com.fuzzy.christmas.model

/** Recipient-flow state. Persistent data is written only after Keep succeeds. */
data class GreetingState(
    val opened: Boolean = false,
    val lightsOn: Boolean = false,
    val turned: Boolean = false,
    val kept: Boolean = false,
) {
    fun unwrap() = copy(opened = true)
    fun toggleLights() = if (opened) copy(lightsOn = !lightsOn) else this
    fun turn() = if (opened) copy(turned = !turned) else this
    fun saveResult(success: Boolean) = if (opened && success) copy(kept = true) else this
    fun wrapAgain() = copy(opened = false, lightsOn = false, turned = false)
    fun openKept(savedLights: Boolean) = if (kept) copy(opened = true, lightsOn = savedLights, turned = false) else this
}
