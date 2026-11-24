package com.fuzzy.christmas.content

import com.fuzzy.christmas.model.*
import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.annotation.MainThread
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
import kotlin.math.*

private val Cream = Color(0xFFFFF6EB)
private val Cocoa = Color(0xFF50392E)
private val Cranberry = Color(0xFFAC5144)
private data class NativeEffect(val entity: Entity, val kind: String, val position: Vector3, val phase: Float, val tree: Boolean, val size: Float, val opacity: OpacityControllerComponent)
private fun Entity.transform() = components[TransformComponent::class.java]

private const val TAG = "FuzzyWorlds"
private const val SOUNDTRACK_TAG = "FuzzySoundtrack"

private fun createSoundtrack(context: Context): MediaPlayer? = runCatching {
    val descriptor = context.assets.openFd("toymakers-workshop.mp3")
    MediaPlayer().apply {
        setAudioAttributes(
            AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build(),
        )
        setDataSource(descriptor.fileDescriptor, descriptor.startOffset, descriptor.length)
        descriptor.close()
        isLooping = true
        setVolume(1f, 1f)
        prepare()
    }
}.onFailure { android.util.Log.e(SOUNDTRACK_TAG, "Could not prepare Toymaker's Workshop", it) }
    .getOrNull()

private enum class WinterWorld(
    val title: String,
    val asset: String,
    val mailbox: Vector3,
    val position: Vector3,
    val scale: Float,
    val viewYaw: Float,
    val animation: String? = null,
) {
    Village(
        "North Pole – Santa Village",
        "north-pole.glb",
        Vector3(0f, .28f, 0f),
        Vector3(-.372f, -.008f, .008f),
        .05173221f,
        -18f,
        "Santa flight",
    ),
    Academy(
        "Wizardry Magic Christmas",
        "academy.glb",
        Vector3(0f, .28f, 0f),
        Vector3(-.354f, -.131f, 0f),
        .06728761f,
        -30f,
        "Winter post",
    ),
    Candy(
        "Funky Candy Land",
        "candy.glb",
        Vector3(0f, .28f, 0f),
        Vector3(-.363f, -.115f, -.004f),
        .06753891f,
        -30f,
        "Candy village greetings",
    ),
}

/**
 * Owns every Java wrapper associated with one native world. PICO recycles entities that are not
 * strongly referenced, so retaining only the top-level scene is not sufficient for dynamically
 * loaded children and entities returned by findEntity().
 */
private class WorldScene(
    val island: WinterWorld,
    val world: Entity,
    val gift: Entity,
    val effectsRoot: Entity?,
    val miniaturesRoot: Entity,
    val treeLights: Entity?,
    val effects: List<NativeEffect>,
    val variants: Map<Pair<Int, String>, Entity>,
    val parcelParts: List<List<Entity>>,
    val carrier: Entity?,
    @Suppress("unused") val retainedEntities: List<Entity>,
) {
    var playback: AnimationPlaybackController? = null

    @MainThread
    fun attachTo(root: Entity) {
        root.addChild(world)
        root.addChild(gift)
        island.animation?.let { animationName ->
            world.getAnimationResources().firstOrNull { it.getName() == animationName }?.let {
                playback = world.playAnimation(it.repeat(Int.MAX_VALUE))
            }
        }
    }

    @MainThread
    fun destroy() {
        playback?.stop()
        playback = null
        (retainedEntities.asReversed() + listOfNotNull(effectsRoot, miniaturesRoot)).forEach { entity ->
            if (entity.valid) {
                entity.removeFromParent()
                entity.destroy()
            }
        }
        listOf(world, gift).forEach { entity ->
            if (entity.valid) {
                entity.removeFromParent()
                entity.destroy()
            }
        }
    }
}

@Composable
fun HomeVolume() {
    val context = LocalContext.current
    val settings = remember { context.getSharedPreferences("fuzzy_worlds", 0) }
    var selected by remember { mutableStateOf(WinterWorld.values().firstOrNull {
        it.name == settings.getString("world", null)
    } ?: WinterWorld.Village) }
    WorldVolume(selected) { next ->
        settings.edit().putString("world", next.name).apply()
        selected = next
    }
}

@MainThread
private suspend fun loadWorldScene(island: WinterWorld): WorldScene {
    val loadedRoots = mutableListOf<Entity>()

    suspend fun load(asset: String): Entity {
        android.util.Log.i(TAG, "Loading asset $asset")
        // PICO's loader suspends while native I/O runs. Starting it from Dispatchers.IO can leave
        // the native entity lifecycle on that worker and stalls large scenes on the OS 6 emulator.
        val entity = Entity.loadSuspend(uriString = "asset://$asset")
        loadedRoots += entity
        android.util.Log.i(
            TAG,
            "Loaded asset $asset; main=${android.os.Looper.myLooper() == android.os.Looper.getMainLooper()}",
        )
        return entity
    }

    try {
        android.util.Log.i(TAG, "Loading ${island.name}")
        val scene = load(island.asset)
        val treeLights = scene.findEntity("TreeLights")?.also { it.enabled = false }

        // The current North Pole includes its workshop/character loop in the authored GLB.
        // The legacy effect layer targeted the retired village coordinates and must not be mixed in.
        val effectsRoot: Entity? = null
        val effects = emptyList<NativeEffect>()

        val miniaturesRoot = load("village-decorations.glb")
        scene.addChild(miniaturesRoot)
        val boxes = (0..2).map { scene.findEntity("Gift box $it") }
        val parcelParts = boxes.mapIndexed { slot, box ->
            listOfNotNull(box, scene.findEntity("Gift lid $slot"))
        }
        val variants = buildMap {
            for (slot in 0..2) {
                for (kind in DECORATION_TYPES) {
                    val item = miniaturesRoot.findEntity("Decor_${slot}_${kind}") ?: continue
                    boxes[slot]?.let { box ->
                        item.transform()?.setPosition(box.convertPositionTo(Vector3(0f), miniaturesRoot))
                    }
                    item.enabled = false
                    put(slot to kind, item)
                }
            }
        }

        val carrier = when (island) {
            WinterWorld.Village -> scene.findEntity("Christmas mailbox")
            WinterWorld.Academy -> scene.findEntity("Letter delivery owl")
            WinterWorld.Candy -> scene.findEntity("Gingerbread postman")
        }
        val lanterns = listOf(
            "Lantern glass",
            "Lantern glass.001",
            "Lantern glass.002",
            "Lantern glass.003",
        ).mapNotNull { name ->
            scene.findEntity(name)?.also {
                it.components.set(PointLightComponent(Color4(1f, .67f, .30f, 1f), 8f, .40f))
            }
        }
        val present = load("christmas-gift.glb")

        val retainedEntities = buildList {
            treeLights?.let(::add)
            addAll(effects.map { it.entity })
            addAll(variants.values)
            addAll(parcelParts.flatten())
            carrier?.let(::add)
            addAll(lanterns)
        }
        android.util.Log.i(TAG, "Loaded ${island.name}")
        return WorldScene(
            island = island,
            world = scene,
            gift = present,
            effectsRoot = effectsRoot,
            miniaturesRoot = miniaturesRoot,
            treeLights = treeLights,
            effects = effects,
            variants = variants,
            parcelParts = parcelParts,
            carrier = carrier,
            retainedEntities = retainedEntities,
        )
    } catch (failure: Throwable) {
        // Loading may fail after some roots were created. Explicit cleanup prevents PICO's weak
        // reference recycler from releasing those roots later on a background GC thread.
        loadedRoots.asReversed().forEach { entity ->
            if (entity.valid) {
                entity.removeFromParent()
                entity.destroy()
            }
        }
        throw failure
    }
}

@Composable
private fun WorldVolume(island: WinterWorld, select: (WinterWorld) -> Unit) {
    val context = LocalContext.current
    val prefs = remember(island) { context.getSharedPreferences(if (island == WinterWorld.Village) "fuzzy_keepsakes_v2" else "fuzzy_keepsakes_${island.name}", 0) }
    val scope = rememberCoroutineScope()
    var greeting by remember(island) { mutableStateOf(GreetingState(opened = true, lightsOn = prefs.getBoolean("tree_lit", false), kept = prefs.getBoolean("christmas_kept", false))) }
    var editor by remember(island) { mutableStateOf(EditorState.restore(prefs.getString("message", null), prefs.getString("decorations", null), prefs.getBoolean("mail_read", false))) }
    var draft by remember(island) { mutableStateOf(editor.note) }
    var selectedDecoration by remember(island) { mutableStateOf("reindeer") }
    var saving by remember(island) { mutableStateOf(false) }
    var showLetter by remember(island) { mutableStateOf(false) }
    var paused by remember { mutableStateOf(android.provider.Settings.Global.getFloat(context.contentResolver, android.provider.Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f) }
    var musicEnabled by remember { mutableStateOf(true) }
    val soundtrack = remember(context) { createSoundtrack(context.applicationContext) }
    var loading by remember(island) { mutableStateOf(true) }
    var error by remember(island) { mutableStateOf<String?>(null) }
    var status by remember(island) { mutableStateOf("A little Christmas warmth, waiting for you.") }
    var carrierOffset by remember(island) { mutableStateOf<Vector3?>(null) }
    var attempt by remember(island) { mutableIntStateOf(0) }
    var clock by remember(island) { mutableFloatStateOf(0f) }
    val sceneRoot = remember { Entity() }
    val attachmentEntities = remember { mutableMapOf<String, Entity>() }
    var currentScene by remember { mutableStateOf<WorldScene?>(null) }
    var pendingScene by remember { mutableStateOf<WorldScene?>(null) }
    val opened = greeting.opened
    val lit = greeting.lightsOn
    val reveal by animateFloatAsState(if (opened) 1f else 0f, tween(if (paused) 0 else 900), label = "unwrap")
    val angle by animateFloatAsState(if (greeting.turned) 180f else 0f, tween(if (paused) 0 else 1000), label = "turn")
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    var active by remember { mutableStateOf(lifecycle.currentState.isAtLeast(Lifecycle.State.STARTED)) }
    DisposableEffect(lifecycle) {
        val observer = LifecycleEventObserver { _, _ -> active = lifecycle.currentState.isAtLeast(Lifecycle.State.STARTED) }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer) }
    }
    DisposableEffect(soundtrack) {
        onDispose {
            runCatching { soundtrack?.stop() }
            soundtrack?.release()
        }
    }
    LaunchedEffect(soundtrack, musicEnabled, active) {
        soundtrack ?: return@LaunchedEffect
        runCatching {
            if (musicEnabled && active) {
                soundtrack.start()
                android.util.Log.i(SOUNDTRACK_TAG, "Playing Toymaker's Workshop")
            } else if (soundtrack.isPlaying) {
                soundtrack.pause()
            }
        }.onFailure { android.util.Log.e(SOUNDTRACK_TAG, "Could not update soundtrack playback", it) }
    }
    DisposableEffect(sceneRoot) {
        onDispose {
            currentScene?.destroy()
            pendingScene?.destroy()
            attachmentEntities.values.forEach { entity ->
                if (entity.valid) {
                    entity.removeFromParent()
                    entity.destroy()
                }
            }
            attachmentEntities.clear()
            if (sceneRoot.valid) sceneRoot.destroy()
        }
    }
    LaunchedEffect(island, attempt) {
        loading = true
        error = null
        try {
            pendingScene = loadWorldScene(island)
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Throwable) {
            android.util.Log.e(TAG, "Failed to load ${island.name}", failure)
            error = "${island.title} could not load. Select Retry."
            loading = false
        }
    }
    LaunchedEffect(currentScene, island, opened, paused, active) {
        currentScene?.playback?.let {
            if (currentScene?.island == island && opened && !paused && active) it.resume()
            else it.pause()
        }
    }
    LaunchedEffect(currentScene, island, opened, paused, loading, active) {
        if (opened && !paused && !loading && active) {
            val scene = currentScene?.takeIf { it.island == island } ?: return@LaunchedEffect
            var last = withFrameNanos { it }
            while (isActive) {
                withFrameNanos { now ->
                    val delta = (now - last) / 1_000_000_000f
                    if (delta >= 1f / 30f) {
                        clock += delta.coerceAtMost(.1f)
                        carrierOffset = scene.carrier?.convertPositionTo(Vector3(0f), scene.world)
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
    SpatialView(
        initial = { content, attachments ->
            content.addEntity(sceneRoot)
            attachments.entity("backdrop")?.let {
                attachmentEntities["backdrop"] = it
                it.transform()?.setPosition(Vector3(-.36f, .18f, -.38f))
                content.addEntity(it)
            }
            attachments.entity("controls")?.let {
                attachmentEntities["controls"] = it
                // Keep the complete editor inside the default PICO emulator/headset view.
                // At x=1.0m the attachment's interactive half was outside the right edge.
                it.transform()?.setPosition(Vector3(.68f, .18f, .42f))
                content.addEntity(it)
            }
            attachments.entity("title")?.let {
                attachmentEntities["title"] = it
                it.transform()?.setPosition(Vector3(-.45f, .82f, .10f))
                content.addEntity(it)
            }
            attachments.entity("mailbox")?.let {
                attachmentEntities["mailbox"] = it
                it.enabled = false
                content.addEntity(it)
            }
            attachments.entity("letter")?.let {
                attachmentEntities["letter"] = it
                it.enabled = false
                it.transform()?.setPosition(Vector3(-.40f, .22f, 1.0f))
                content.addEntity(it)
            }
        },
        update = { _, _ ->
            var scene = currentScene
            pendingScene?.let { incoming ->
                if (incoming.island == island) {
                    scene?.destroy()
                    incoming.attachTo(sceneRoot)
                    currentScene = incoming
                    scene = incoming
                    carrierOffset = null
                    loading = false
                    android.util.Log.i(TAG, "Attached ${island.name}")
                } else {
                    incoming.destroy()
                }
                pendingScene = null
            }

            val activeScene = scene?.takeIf { it.island == island }
            scene?.world?.enabled = activeScene != null && reveal > .15f
            scene?.gift?.enabled = activeScene != null && reveal < .95f
            activeScene?.let { activeWorld ->
                activeWorld.world.transform()?.apply {
                    setPosition(island.position)
                    setScaleVector(Vector3(maxOf(.01f, reveal * island.scale)))
                    setEulerAngles(EulerAngles(0f, island.viewYaw + angle, 0f))
                }
                activeWorld.gift.transform()?.apply {
                    setPosition(Vector3(-.60f, .15f, 0f))
                    setScaleVector(Vector3(maxOf(.01f, 1f - reveal)))
                    setEulerAngles(EulerAngles(0f, reveal * 120f, 0f))
                }
                activeWorld.treeLights?.enabled = lit
                activeWorld.parcelParts.forEachIndexed { slot, parts ->
                    parts.forEach { it.enabled = slot >= editor.decorations.size }
                }
                for ((key, node) in activeWorld.variants) {
                    node.enabled = editor.decorations.getOrNull(key.first) == key.second
                }
                for (fx in activeWorld.effects) {
                    fx.entity.enabled = !fx.tree || lit
                    if (!fx.entity.enabled) continue
                    val frame = effectFrame(fx.kind, clock, fx.phase, fx.size)
                    fx.entity.transform()?.apply {
                        setPosition(Vector3(fx.position.x + frame.dx, fx.position.y + frame.dy, fx.position.z))
                        setScaleVector(Vector3(frame.scale))
                    }
                    fx.opacity.opacity = frame.opacity
                }
            }

            // The alert follows the mailbox, while facing the reader for a reliable tap target.
            attachmentEntities["mailbox"]?.let { alert ->
                alert.enabled = activeScene != null && opened && !loading && error == null && !showLetter
                val radians = (island.viewYaw + angle) * PI.toFloat() / 180f
                val anchor = carrierOffset
                val x = anchor?.x ?: island.mailbox.x
                val z = anchor?.z ?: island.mailbox.z
                val y = anchor?.let { it.y + .17f } ?: island.mailbox.y
                val scale = island.scale * reveal
                alert.transform()?.setPosition(
                    Vector3(
                        island.position.x + scale * (x * cos(radians) + z * sin(radians)),
                        island.position.y + scale * y,
                        island.position.z + scale * (-x * sin(radians) + z * cos(radians)) + .04f,
                    )
                )
            }
            attachmentEntities["letter"]?.enabled = activeScene != null && showLetter && opened
        },
        attachments = {
                AttachmentPanel(id = "backdrop") {
                    WorldBackdrop(island, clock, paused)
                }
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
                                for (kind in DECORATION_TYPES) Action((if (selectedDecoration == kind) "✓ " else "") + kind.replaceFirstChar { it.uppercase() }, !saving) { selectedDecoration = kind }
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Action("Generate & add", !saving && editor.decorations.size < 3) { save(editor.add(selectedDecoration), "Miniature added to the snow.") }
                                Action("Undo last", !saving && editor.decorations.isNotEmpty()) { save(editor.undo(), "Last miniature removed.") }
                            }
                            Text("${editor.decorations.size} / 3 spots filled · Small procedural shapes", color = Cocoa, fontSize = 15.sp)
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                if (island == WinterWorld.Village) Action(if (lit) "Lights off" else "Light the tree", !saving) { greeting = greeting.toggleLights() }
                                Action(if (greeting.turned) "Front view" else "Turn island") { greeting = greeting.turn() }
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Action(if (paused) "Resume effects" else "Pause effects") { paused = !paused }
                                Action(if (musicEnabled) "Pause music" else "Play music", soundtrack != null) { musicEnabled = !musicEnabled }
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

@Composable
private fun WorldBackdrop(island: WinterWorld, clock: Float, paused: Boolean) {
    val motion = if (paused) 0f else clock
    Canvas(Modifier.width(2700.dp).height(1500.dp)) {
        val sky = when (island) {
            WinterWorld.Village -> listOf(Color(0xFF101A35), Color(0xFF202C49), Color(0xFF41465D), Color(0xFF806370))
            WinterWorld.Academy -> listOf(Color(0xFF303451), Color(0xFF8986A7), Color(0xFFBBB2C6))
            WinterWorld.Candy -> listOf(Color(0xFF83B6D6), Color(0xFFA7C7DC), Color(0xFFC6CBDC), Color(0xFFD9CFCF))
        }
        drawRect(Brush.verticalGradient(sky))

        if (island == WinterWorld.Village) {
            val drift = sin(motion * .18f) * size.width * .025f
            val cyan = Path().apply {
                moveTo(-size.width * .05f + drift, size.height * .40f)
                cubicTo(size.width * .24f, size.height * .15f, size.width * .48f, size.height * .42f, size.width * 1.06f, size.height * .20f)
            }
            val violet = Path().apply {
                moveTo(-size.width * .05f - drift, size.height * .27f)
                cubicTo(size.width * .31f, size.height * .48f, size.width * .60f, size.height * .08f, size.width * 1.06f, size.height * .34f)
            }
            drawPath(cyan, Color(0x553CFFE4), style = Stroke(size.height * .11f))
            drawPath(violet, Color(0x446F77FF), style = Stroke(size.height * .09f))
        }

        if (island == WinterWorld.Candy) {
            repeat(9) { index ->
                val x = size.width * ((index * 29 % 97) / 100f)
                val y = size.height * (.14f + (index % 4) * .12f)
                drawCircle(Color.White.copy(alpha = .30f), size.width * (.035f + (index % 3) * .012f), Offset(x, y))
            }
        } else {
            repeat(58) { index ->
                val x = size.width * ((index * 37 % 101) / 100f)
                val baseY = size.height * ((index * 53 % 91) / 100f)
                val snow = (baseY + motion * (18f + index % 9) + index * 11f) % size.height
                val radius = if (index % 7 == 0) 4.5f else 2.5f
                drawCircle(Color.White.copy(alpha = if (index % 5 == 0) .85f else .58f), radius, Offset(x, snow))
            }
        }

        if (island == WinterWorld.Academy) {
            val ridge = Path().apply {
                moveTo(0f, size.height)
                lineTo(0f, size.height * .72f)
                lineTo(size.width * .18f, size.height * .49f)
                lineTo(size.width * .32f, size.height * .71f)
                lineTo(size.width * .53f, size.height * .43f)
                lineTo(size.width * .72f, size.height * .70f)
                lineTo(size.width, size.height * .47f)
                lineTo(size.width, size.height)
                close()
            }
            drawPath(ridge, Color(0x55303451))
        }
    }
}

@Composable
private fun Action(label: String, enabled: Boolean = true, onClick: () -> Unit) {
    Button(onClick = onClick, enabled = enabled, modifier = Modifier.height(58.dp), colors = ButtonDefaults.buttonColors(containerColor = Cranberry, contentColor = Color.White)) {
        Text(label, fontSize = 19.sp)
    }
}
