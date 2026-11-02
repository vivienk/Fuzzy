package com.fuzzy.christmas.content

import com.fuzzy.christmas.model.GreetingState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pico.spatial.core.ecs.Entity
import com.pico.spatial.core.ecs.TransformComponent
import com.pico.spatial.core.math.EulerAngles
import com.pico.spatial.core.math.Vector3
import com.pico.spatial.ui.design.Button
import com.pico.spatial.ui.design.ButtonDefaults
import com.pico.spatial.ui.design.Text
import com.pico.spatial.ui.foundation.content.SpatialView

private val Cream = Color(0xFFFFF6EB)
private val Cocoa = Color(0xFF50392E)
private val Cranberry = Color(0xFFAC5144)

@Composable
fun HomeVolume() {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("fuzzy_keepsakes_v2", 0) }
    var greeting by remember { mutableStateOf(GreetingState(kept = prefs.getBoolean("christmas_kept", false))) }
    val kept = greeting.kept
    val opened = greeting.opened
    val lit = greeting.lightsOn
    val turned = greeting.turned
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var saving by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf("A little Christmas warmth, waiting for you.") }
    var world by remember { mutableStateOf<Entity?>(null) }
    var gift by remember { mutableStateOf<Entity?>(null) }
    var lights by remember { mutableStateOf<Entity?>(null) }
    var attempt by remember { mutableIntStateOf(0) }
    val reveal by animateFloatAsState(if (opened) 1f else 0f, tween(900), label = "unwrap")
    val angle by animateFloatAsState(if (turned) 155f else 0f, tween(1000), label = "turn")

    LaunchedEffect(saving) {
        if (saving) {
            val saved = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
                prefs.edit().putBoolean("christmas_kept", true)
                    .putString("message", "A little Christmas warmth from me to you. Wherever we are, you have a place in my world.")
                    .putBoolean("tree_lit", lit).commit()
            }
            greeting = greeting.saveResult(saved)
            status = if (saved) "Kept in your collection. It will be here when you return." else "Could not save. Please try Keep again."
            saving = false
        }
    }

    key(attempt) {
        DisposableEffect(Unit) {
            onDispose {
                world?.let { if (it.valid) { it.removeFromParent(); it.destroy() } }
                gift?.let { if (it.valid) { it.removeFromParent(); it.destroy() } }
                world = null; gift = null; lights = null
            }
        }
        SpatialView(
            initial = { content, attachments ->
                try {
                    val scene = Entity.loadSuspend(uriString = "asset://christmas-world.glb")
                    world = scene
                    scene.components[TransformComponent::class.java]?.setPosition(Vector3(0f, .08f, 0f))
                    scene.enabled = false
                    lights = scene.findEntity("TreeLights")
                    lights?.enabled = false
                    content.addEntity(scene)
                    val present = Entity.loadSuspend(uriString = "asset://christmas-gift.glb")
                    gift = present
                    present.components[TransformComponent::class.java]?.setPosition(Vector3(0f, .15f, 0f))
                    content.addEntity(present)
                    loading = false
                } catch (cancelled: kotlinx.coroutines.CancellationException) {
                    throw cancelled
                } catch (failure: Exception) {
                    android.util.Log.e("Fuzzy", "Christmas asset loading failed", failure)
                    error = "The Christmas world could not load. Select Retry to try again."
                    loading = false
                }
                attachments.entity("controls")?.let {
                    it.components[TransformComponent::class.java]?.setPosition(Vector3(0f, -.65f, .65f))
                    content.addEntity(it)
                }
                attachments.entity("title")?.let {
                    it.components[TransformComponent::class.java]?.setPosition(Vector3(0f, 1.25f, .10f))
                    content.addEntity(it)
                }
            },
            update = { _, _ ->
                world?.enabled = reveal > .15f
                world?.components?.get(TransformComponent::class.java)?.apply {
                    setScaleVector(Vector3(maxOf(.01f, reveal)))
                    setEulerAngles(EulerAngles(0f, angle, 0f))
                }
                gift?.enabled = reveal < .95f
                gift?.components?.get(TransformComponent::class.java)?.apply {
                    setScaleVector(Vector3(maxOf(.01f, 1f - reveal)))
                    setEulerAngles(EulerAngles(0f, reveal * 120f, 0f))
                }
                lights?.enabled = lit
            },
            attachments = {
                AttachmentPanel(id = "title") {
                    Column(Modifier.width(780.dp).clip(RoundedCornerShape(32.dp)).background(Cream).padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("fuzzy", color = Cocoa, fontWeight = FontWeight.Bold, fontSize = 40.sp)
                        Text("Send your loved ones a 3D card", color = Cocoa, fontSize = 24.sp)
                        Text("CHRISTMAS · V2 OFFLINE PROTOTYPE", color = Cranberry, fontSize = 15.sp)
                    }
                }
                AttachmentPanel(id = "controls") {
                    Column(Modifier.width(960.dp).clip(RoundedCornerShape(36.dp)).background(Cream).padding(28.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        Text(if (opened) "A world made for you." else "Someone is thinking of you.", color = Cocoa, fontSize = 32.sp, fontWeight = FontWeight.Bold)
                        Text(if (opened) "“A little Christmas warmth from me to you. Wherever we are, you have a place in my world.”" else "Unwrap a snowy Christmas village and a note from someone you love.", color = Cocoa, fontSize = 23.sp, textAlign = TextAlign.Center)
                        Text(error ?: if (loading) "Preparing your Christmas world…" else status, color = Cranberry, fontSize = 18.sp, textAlign = TextAlign.Center)
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            when {
                                error != null -> Action("Retry") { error = null; loading = true; greeting = greeting.wrapAgain(); attempt++ }
                                !opened -> {
                                    Action("Unwrap gift", !loading) { greeting = greeting.unwrap(); status = "Light the tree, take a look around, and keep this feeling." }
                                    if (kept) Action("Open keepsake", !loading) { greeting = greeting.openKept(prefs.getBoolean("tree_lit", false)); status = "Welcome back to your Christmas keepsake." }
                                }
                                else -> {
                                    Action(if (lit) "Lights off" else "Light the tree", !saving) { greeting = greeting.toggleLights(); status = if (greeting.lightsOn) "A little brighter. A little closer." else "The snow settles quietly." }
                                    Action(if (turned) "Front view" else "Turn island") { greeting = greeting.turn() }
                                    Action(if (saving) "Saving…" else if (kept) "Kept ♥" else "Keep ♥", !saving && !kept) { saving = true }
                                    Action("Wrap again", !saving) { greeting = greeting.wrapAgain(); status = "A little Christmas warmth, waiting for you." }
                                }
                            }
                        }
                        Text("Prepared world • sample message • saved on this device • no live AI or sending yet", color = Cocoa.copy(alpha = .70f), fontSize = 14.sp, textAlign = TextAlign.Center)
                    }
                }
            }
        )
    }
}

@Composable
private fun Action(label: String, enabled: Boolean = true, onClick: () -> Unit) {
    Button(onClick = onClick, enabled = enabled, modifier = Modifier.height(60.dp), colors = ButtonDefaults.buttonColors(containerColor = Cranberry, contentColor = Color.White)) {
        Text(label, fontSize = 20.sp)
    }
}
