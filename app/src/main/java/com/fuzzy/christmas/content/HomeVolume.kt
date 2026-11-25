package com.fuzzy.christmas.content

import com.fuzzy.christmas.model.*
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.pico.spatial.core.ecs.*
import com.pico.spatial.core.ecs.animation.AnimationPlaybackController
import com.pico.spatial.core.math.EulerAngles
import com.pico.spatial.core.math.Vector3
import com.pico.spatial.core.math.Color4
import com.pico.spatial.ui.design.Button
import com.pico.spatial.ui.design.ButtonDefaults
import com.pico.spatial.ui.design.Text
import com.pico.spatial.ui.design.TextField
import com.pico.spatial.ui.foundation.content.SpatialView
import kotlinx.coroutines.*
import org.json.JSONArray
import kotlin.math.*

private val Cream = Color(0xFFFFF6EB)
private val Cocoa = Color(0xFF50392E)
private val Cranberry = Color(0xFFAC5144)
private data class NativeEffect(val entity: Entity, val kind: String, val position: Vector3, val phase: Float, val tree: Boolean, val size: Float, val opacity: OpacityControllerComponent)
private fun Entity.transform() = components[TransformComponent::class.java]

private enum class WinterWorld(val title: String, val asset: String, val mailbox: Vector3) {
    Village("North Pole – Santa Village", "christmas-world.glb", Vector3(-.34f, .46f, .68f)),
    Academy("Wizardry Magic Christmas", "academy.glb", Vector3(.74f, .30f, .17f)),
    Candy("Funky Candy Land", "candy.glb", Vector3(-.71f, .24f, .62f))
}

@Composable
fun HomeVolume() {
    val context = LocalContext.current
    val settings = remember { context.getSharedPreferences("fuzzy_worlds", 0) }
    var selected by remember { mutableStateOf(WinterWorld.values().firstOrNull {
        it.name == settings.getString("world", null)
    } ?: WinterWorld.Village) }
    key(selected) {
        WorldVolume(selected) { next ->
            settings.edit().putString("world", next.name).apply()
            selected = next
        }
    }
}

@Composable
private fun WorldVolume(island: WinterWorld, select: (WinterWorld) -> Unit) {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences(if (island == WinterWorld.Village) "fuzzy_keepsakes_v2" else "fuzzy_keepsakes_${island.name}", 0) }
    val scope = rememberCoroutineScope()
    var greeting by remember { mutableStateOf(GreetingState(opened = true, lightsOn = prefs.getBoolean("tree_lit", false), kept = prefs.getBoolean("christmas_kept", false))) }
    var editor by remember { mutableStateOf(EditorState.restore(prefs.getString("message", null), prefs.getString("decorations", null), prefs.getBoolean("mail_read", false))) }
    var draft by remember { mutableStateOf(editor.note) }
    var selected by remember { mutableStateOf("reindeer") }
    var saving by remember { mutableStateOf(false) }
    var showLetter by remember { mutableStateOf(false) }
    var paused by remember { mutableStateOf(android.provider.Settings.Global.getFloat(context.contentResolver, android.provider.Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var status by remember { mutableStateOf("A little Christmas warmth, waiting for you.") }
    var world by remember { mutableStateOf<Entity?>(null) }
    var gift by remember { mutableStateOf<Entity?>(null) }
    var sky by remember { mutableStateOf<Entity?>(null) }
    var treeLights by remember { mutableStateOf<Entity?>(null) }
    var effects by remember { mutableStateOf(emptyList<NativeEffect>()) }
    var variants by remember { mutableStateOf(emptyMap<Pair<Int, String>, Entity>()) }
    var parcelParts by remember { mutableStateOf(emptyList<List<Entity>>()) }
    var carrier by remember { mutableStateOf<Entity?>(null) }
    var carrierOffset by remember { mutableStateOf<Vector3?>(null) }
    var playback by remember { mutableStateOf<AnimationPlaybackController?>(null) }
    var attempt by remember { mutableIntStateOf(0) }
    var clock by remember { mutableFloatStateOf(0f) }
    val opened = greeting.opened
    val lit = greeting.lightsOn
    val reveal by animateFloatAsState(if (opened) 1f else 0f, tween(if (paused) 0 else 900), label = "unwrap")
    val angle by animateFloatAsState(if (greeting.turned) 155f else 0f, tween(if (paused) 0 else 1000), label = "turn")
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    var active by remember { mutableStateOf(lifecycle.currentState.isAtLeast(Lifecycle.State.STARTED)) }
    DisposableEffect(lifecycle) {
        val observer = LifecycleEventObserver { _, _ -> active = lifecycle.currentState.isAtLeast(Lifecycle.State.STARTED) }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer) }
    }
    LaunchedEffect(playback, opened, paused, active) {
        playback?.let { if (opened && !paused && active) it.resume() else it.pause() }
    }
    LaunchedEffect(opened, paused, loading, active) {
        if (opened && !paused && !loading && active) {
            var last = withFrameNanos { it }
            while (isActive) {
                withFrameNanos { now ->
                    val delta = (now - last) / 1_000_000_000f
                    if (delta >= 1f / 30f) {
                        if (island == WinterWorld.Village) clock += delta.coerceAtMost(.1f)
                        else carrierOffset = carrier?.convertPositionTo(Vector3(0f), world)
                        last = now
                    }
                }
            }
        }
    }
    fun save(candidate: EditorState, message: String, keep: Boolean = false) {
        if (saving) return
        saving = true
        scope.launch {
            val succeeded = withContext(Dispatchers.IO) {
                prefs.edit().putString("message", candidate.note).putString("decorations", candidate.decorations.joinToString(","))
                    .putBoolean("mail_read", candidate.read).putBoolean("christmas_kept", greeting.kept || keep)
                    .putBoolean("tree_lit", lit).commit()
            }
            if (succeeded) { editor = candidate; if (keep) greeting = greeting.saveResult(true); status = message }
            else status = "Could not save on this device. Please try again."
            saving = false
        }
    }
    fun readMail() {
        showLetter = true
        if (!editor.read) save(editor.copy(read = true), "Your note is open.")
    }
    key(attempt) {
        DisposableEffect(Unit) {
            onDispose {
                playback?.stop(); playback = null; carrier = null; carrierOffset = null; parcelParts = emptyList()
                listOf(world, gift, sky).forEach { it?.let { e -> if (e.valid) { e.removeFromParent(); e.destroy() } } }
                world = null; gift = null; sky = null; treeLights = null; effects = emptyList(); variants = emptyMap()
            }
        }
        SpatialView(
            initial = { content, attachments ->
                try {
                    val background = Entity.loadSuspend(uriString = "asset://night-sky.glb"); sky = background; content.addEntity(background)
                    val scene = Entity.loadSuspend(uriString = "asset://${island.asset}"); world = scene
                    scene.transform()?.setPosition(Vector3(-.60f, -.10f, 0f)); scene.enabled = false; content.addEntity(scene)
                    treeLights = scene.findEntity("TreeLights"); treeLights?.enabled = false
                    if (island == WinterWorld.Village) {
                        val fx = Entity.loadSuspend(uriString = "asset://village-effects.glb"); scene.addChild(fx)
                        val json = JSONArray(context.assets.open("village-effects.json").bufferedReader().use { it.readText() })
                        effects = (0 until json.length()).mapNotNull { i ->
                            val item = json.getJSONObject(i); val node = fx.findEntity(item.getString("name")) ?: return@mapNotNull null
                            val p = item.getJSONArray("position"); val opacity = OpacityControllerComponent(.7f); node.components.set(opacity)
                            NativeEffect(node, item.getString("kind"), Vector3(p.getDouble(0).toFloat(), p.getDouble(1).toFloat(), p.getDouble(2).toFloat()), item.getDouble("phase").toFloat(), item.getBoolean("tree"), item.getDouble("size").toFloat(), opacity)
                        }
                    }
                    val miniatures = Entity.loadSuspend(uriString = "asset://village-decorations.glb"); scene.addChild(miniatures)
                    val boxes = (0..2).map { scene.findEntity("Gift box $it") }
                    parcelParts = boxes.mapIndexed { slot, box -> listOfNotNull(box, scene.findEntity("Gift lid $slot")) }
                    variants = buildMap {
                        for (slot in 0..2) for (kind in DECORATION_TYPES) {
                            val item = miniatures.findEntity("Decor_${slot}_${kind}") ?: continue
                            boxes[slot]?.let { box ->
                                item.transform()?.setPosition(box.convertPositionTo(Vector3(0f), miniatures))
                            }
                            item.enabled = false
                            put(slot to kind, item)
                        }
                    }
                    if (island != WinterWorld.Village) {
                        val academy = island == WinterWorld.Academy
                        carrier = scene.findEntity(if (academy) "Letter delivery owl" else "Gingerbread postman")
                        val name = if (academy) "Winter post" else "Candy village greetings"
                        scene.getAnimationResources().firstOrNull { it.getName() == name }?.let {
                            playback = scene.playAnimation(it.repeat(Int.MAX_VALUE))
                        }
                    }
                    // A few local lights add warmth without dozens of real-time light sources.
                    for (name in listOf("Lantern glass", "Lantern glass.001", "Lantern glass.002", "Lantern glass.003")) {
                        scene.findEntity(name)?.components?.set(PointLightComponent(Color4(1f, .67f, .30f, 1f), 8f, .40f))
                    }
                    val present = Entity.loadSuspend(uriString = "asset://christmas-gift.glb"); gift = present
                    present.transform()?.setPosition(Vector3(-.60f, .15f, 0f)); content.addEntity(present)
                    loading = false
                } catch (cancelled: CancellationException) { throw cancelled }
                catch (failure: Exception) {
                    android.util.Log.e("Fuzzy", "Village loading failed", failure); error = "The village could not load. Select Retry."; loading = false
                }
                attachments.entity("controls")?.let { it.transform()?.setPosition(Vector3(1.0f, .18f, .42f)); content.addEntity(it) }
                attachments.entity("title")?.let { it.transform()?.setPosition(Vector3(-.45f, 1.20f, .10f)); content.addEntity(it) }
                attachments.entity("mailbox")?.let { it.enabled = false; content.addEntity(it) }
                attachments.entity("letter")?.let { it.enabled = false; it.transform()?.setPosition(Vector3(-.40f, .22f, 1.0f)); content.addEntity(it) }
            },
            update = { _, attachments ->
                world?.enabled = reveal > .15f
                world?.transform()?.apply { setScaleVector(Vector3(maxOf(.01f, reveal * .72f))); setEulerAngles(EulerAngles(0f, angle, 0f)) }
                gift?.enabled = reveal < .95f
                gift?.transform()?.apply { setScaleVector(Vector3(maxOf(.01f, 1f - reveal))); setEulerAngles(EulerAngles(0f, reveal * 120f, 0f)) }
                treeLights?.enabled = lit
                parcelParts.forEachIndexed { slot, parts -> parts.forEach { it.enabled = slot >= editor.decorations.size } }
                for ((key, node) in variants) node.enabled = editor.decorations.getOrNull(key.first) == key.second
                for (fx in effects) {
                    fx.entity.enabled = !fx.tree || lit
                    if (!fx.entity.enabled) continue
                    val frame = effectFrame(fx.kind, clock, fx.phase, fx.size)
                    fx.entity.transform()?.apply {
                        setPosition(Vector3(fx.position.x + frame.dx, fx.position.y + frame.dy, fx.position.z))
                        setScaleVector(Vector3(frame.scale))
                    }
                    fx.opacity.opacity = frame.opacity
                }
                // The alert follows the mailbox, while facing the reader for a reliable tap target.
                attachments.entity("mailbox")?.let { alert ->
                    alert.enabled = opened && !loading && error == null && !showLetter
                    val radians = angle * PI.toFloat() / 180f
                    // Sample the animated messenger on the same clock as the native effects.
                    val anchor = carrierOffset
                    val x = anchor?.x ?: island.mailbox.x; val z = anchor?.z ?: island.mailbox.z
                    val y = anchor?.let { it.y + .17f } ?: island.mailbox.y
                    alert.transform()?.setPosition(Vector3(-.60f + .72f * reveal * (x * cos(radians) + z * sin(radians)), -.10f + .72f * reveal * y, .72f * reveal * (-x * sin(radians) + z * cos(radians)) + .04f))
                }
                attachments.entity("letter")?.enabled = showLetter && opened
            },
            attachments = {
                AttachmentPanel(id = "title") {
                    Column(Modifier.width(850.dp).clip(RoundedCornerShape(28.dp)).background(Cream).padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("fuzzy", color = Cocoa, fontWeight = FontWeight.Bold, fontSize = 38.sp)
                        Text(island.title, color = Cocoa, fontSize = 23.sp)
                    }
                }
                AttachmentPanel(id = "mailbox") {
                    Button(onClick = { readMail() }, enabled = !saving, modifier = Modifier.size(100.dp), colors = ButtonDefaults.buttonColors(containerColor = if (editor.read) Cream else Cranberry, contentColor = if (editor.read) Cocoa else Color.White)) {
                        Text(if (editor.read) "✉" else "✉ 1", fontSize = 30.sp)
                    }
                }
                AttachmentPanel(id = "letter") {
                    Column(Modifier.width(700.dp).heightIn(max = 900.dp).clip(RoundedCornerShape(32.dp)).background(Color(0xFFFFF8E8)).padding(32.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(20.dp)) {
                        Text("A LITTLE LETTER, JUST FOR YOU", color = Cranberry, fontSize = 16.sp)
                        Text("From my world to yours", color = Cocoa, fontSize = 28.sp, fontWeight = FontWeight.Bold)
                        Text(editor.note, color = Cocoa, fontFamily = FontFamily.Cursive, fontSize = 32.sp, lineHeight = 46.sp)
                        Text("♡", color = Cranberry, fontSize = 36.sp)
                        Action("Close note") { showLetter = false }
                    }
                }
                AttachmentPanel(id = "controls") {
                    Column(Modifier.width(700.dp).heightIn(max = 1180.dp).clip(RoundedCornerShape(32.dp)).background(Cream).padding(24.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(if (opened) "Make it yours." else "Someone is thinking of you.", color = Cocoa, fontSize = 30.sp, fontWeight = FontWeight.Bold)
                        for (choice in WinterWorld.values()) {
                            Action(choice.title, enabled = choice != island && !saving && !loading) { select(choice) }
                        }
                        if (opened && error == null) {
                            Text("A note for someone you love", color = Cocoa, fontSize = 20.sp)
                            TextField(value = draft, onValueChange = { draft = it.take(500) }, modifier = Modifier.fillMaxWidth(), enabled = !saving,
                                singleLine = false, minLines = 3, maxLines = 5, textStyle = TextStyle(color = Cocoa, fontSize = 22.sp))
                            Text("${draft.length} / 500", color = Cocoa, fontSize = 15.sp)
                            Action("Add note to mailbox", !saving && draft.isNotBlank()) {
                                editor.withNote(draft)?.let { save(it, "Your note is in the mailbox. Tap the envelope.") }
                            }
                            Text("A little more magic", color = Cocoa, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                            Text("Choose a miniature for an empty snow spot. Each stays shorter than the mailbox.", color = Cocoa, fontSize = 18.sp)
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                for (kind in DECORATION_TYPES) Action((if (selected == kind) "✓ " else "") + kind.replaceFirstChar { it.uppercase() }, !saving) { selected = kind }
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Action("Generate & add", !saving && editor.decorations.size < 3) { save(editor.add(selected), "Miniature added to the snow.") }
                                Action("Undo last", !saving && editor.decorations.isNotEmpty()) { save(editor.undo(), "Last miniature removed.") }
                            }
                            Text("${editor.decorations.size} / 3 spots filled · Small procedural shapes", color = Cocoa, fontSize = 15.sp)
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                if (island == WinterWorld.Village) Action(if (lit) "Lights off" else "Light the tree", !saving) { greeting = greeting.toggleLights() }
                                Action(if (greeting.turned) "Front view" else "Turn island") { greeting = greeting.turn() }
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Action(if (paused) "Resume effects" else "Pause effects") { paused = !paused }
                                Action("Read mailbox", !saving) { readMail() }
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Action(if (saving) "Saving…" else if (greeting.kept) "Kept ♥" else "Keep ♥", !saving) { save(editor, "Kept on this device.", keep = true) }
                                Action("Wrap again", !saving) { greeting = greeting.wrapAgain(); showLetter = false }
                            }
                        } else if (error == null) {
                            Text("Unwrap your snowy village, write a note, and add a little Christmas magic.", color = Cocoa, fontSize = 22.sp)
                            Action("Unwrap gift", !loading) { greeting = greeting.unwrap() }
                            if (greeting.kept) Action("Open keepsake", !loading) { greeting = greeting.openKept(prefs.getBoolean("tree_lit", false)) }
                        }
                        if (error != null) Action("Retry") { error = null; loading = true; greeting = greeting.wrapAgain(); showLetter = false; attempt++ }
                        Text(error ?: if (loading) "Preparing your Christmas village…" else if (saving) "Saving on this device…" else status, color = Cranberry, fontSize = 18.sp)
                        Text("Offline prototype · Notes and miniatures save on this device · No live AI or delivery", color = Cocoa.copy(alpha = .7f), fontSize = 14.sp)
                    }
                }
            }
        )
    }
}

@Composable
private fun Action(label: String, enabled: Boolean = true, onClick: () -> Unit) {
    Button(onClick = onClick, enabled = enabled, modifier = Modifier.height(58.dp), colors = ButtonDefaults.buttonColors(containerColor = Cranberry, contentColor = Color.White)) {
        Text(label, fontSize = 19.sp)
    }
}
