package com.fuzzy.christmas.model

import kotlin.math.*
data class EffectFrame(val scale: Float, val opacity: Float, val dx: Float = 0f, val dy: Float = 0f)
fun effectFrame(kind: String, seconds: Float, phase: Float, size: Float): EffectFrame = when (kind) {
    "glow" -> { val pulse = (.5 + .5 * sin(seconds * 2 * PI / 4.8 + phase)).toFloat(); EffectFrame(size * (.94f + .18f * pulse), .55f + .35f * pulse) }
    "spark" -> { val pulse = max(0f, sin(seconds * 2 * PI.toFloat() / 5.6f + phase)).pow(8); EffectFrame(size * (.95f + .35f * pulse), .08f + .82f * pulse) }
    else -> {
        val smoke = kind == "smoke"; val p = ((seconds / if (smoke) 7f else 11f) + phase) % 1f
        EffectFrame(.95f + p * 1.3f, sin(p * PI).toFloat().coerceIn(0f, 1f) * .65f,
            if (smoke) p * .07f else sin(p * PI.toFloat() * 2) * .025f, p * if (smoke) .26f else .17f)
    }
}
