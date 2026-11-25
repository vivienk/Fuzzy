package com.fuzzy.christmas.model

import kotlin.math.*
data class EffectFrame(val scale: Float, val opacity: Float, val dx: Float = 0f, val dy: Float = 0f)
fun effectFrame(kind: String, seconds: Float, phase: Float, size: Float): EffectFrame = when (kind) {
    "glow" -> { val pulse = (.5 + .5 * sin(seconds * 2 * PI / 4.8 + phase)).toFloat(); EffectFrame(size * (.94f + .18f * pulse), .55f + .35f * pulse) }
    "spark" -> { val pulse = max(0f, sin(seconds * 2 * PI.toFloat() / 5.6f + phase)).pow(8); EffectFrame(size * (.95f + .35f * pulse), .08f + .82f * pulse) }
    "smoke" -> {
        val p = (seconds / 7f + phase) % 1f
        val opacity = when {
            p < .15f -> .6f * p / .15f
            p < .5f -> .6f - .22f * (p - .15f) / .35f
            else -> .38f * (1f - p) / .5f
        }
        val early = minOf(p * 2f, 1f)
        val late = maxOf(2f * p - 1f, 0f)
        EffectFrame(.95f + .70f * early + .85f * late, opacity,
            .024f * early + .043f * late, .094f * early + .133f * late)
    }
    else -> {
        val p = (seconds / 11f + phase) % 1f
        EffectFrame(.95f + p * 1.3f, sin(p * PI).toFloat().coerceIn(0f, 1f) * .65f,
            sin(p * PI.toFloat() * 2) * .025f, p * .17f)
    }
}
