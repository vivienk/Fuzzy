package com.fuzzy.christmas.model

// Native transforms use degrees. These are the authored 2.8-second head and carrot keys.
private val times = floatArrayOf(0f, .35f, .85f, 1.10f, 1.32f, 1.55f, 1.80f, 2.05f, 2.45f, 2.80f)
private val angles = floatArrayOf(0f, -.18f, -.88f, -.96f, -.79f, -.94f, -.81f, -.78f, -.30f, 0f)
private val sizes = floatArrayOf(0f, 1f, 1f, .84f, .72f, .51f, .28f, 0f, 0f, 0f)

internal fun mooseFeedFrame(seconds: Float): Pair<Float, Float> {
    val i = times.indexOfFirst { it > seconds }
    if (i <= 0) return 0f to 0f
    val t = (seconds - times[i - 1]) / (times[i] - times[i - 1])
    fun sample(keys: FloatArray) = keys[i - 1] + t * (keys[i] - keys[i - 1])
    return Math.toDegrees(sample(angles).toDouble()).toFloat() to sample(sizes)
}
