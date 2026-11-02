package com.fuzzy.christmas.model

const val DEFAULT_NOTE = "A little Christmas warmth from me to you. Wherever we are, you have a place in my world."
val DECORATION_TYPES = listOf("gift", "reindeer", "snowman")

data class EditorState(val note: String = DEFAULT_NOTE, val decorations: List<String> = emptyList(), val read: Boolean = false) {
    fun withNote(value: String): EditorState? = value.trim().takeIf { it.isNotEmpty() && it.length <= 500 }?.let { copy(note = it, read = false) }
    fun add(kind: String) = if (kind in DECORATION_TYPES && decorations.size < 3) copy(decorations = decorations + kind) else this
    fun undo() = copy(decorations = decorations.dropLast(1))
    companion object {
        fun restore(note: String?, decorations: String?, read: Boolean) = EditorState(
            note?.takeIf { it.isNotBlank() }?.take(500) ?: DEFAULT_NOTE,
            decorations.orEmpty().split(',').map { if (it == "pine") "reindeer" else it }.filter { it in DECORATION_TYPES }.take(3), read
        )
    }
}
