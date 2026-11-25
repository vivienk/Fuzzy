package com.fuzzy.christmas.content

import com.fuzzy.christmas.model.*
import android.content.Intent
import android.net.Uri
import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.findRootCoordinates
import com.pico.spatial.ui.foundation.layout.sizeIn3D
import com.pico.spatial.ui.foundation.layout.IntSize3D
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.foundation.clickable
import androidx.compose.ui.semantics.Role
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
private data class SceneAction(val node: String, val label: String, val clip: String? = null)
private fun WinterWorld.actions() = when (this) {
    WinterWorld.Village -> listOf(
        SceneAction("Adult moose neck pivot", "Feed adult moose", "Feed Adult moose"),
        SceneAction("Moose calf neck pivot", "Feed calf", "Feed Moose calf"),
        SceneAction("Walking elf 1", "Greet elf"),
        SceneAction("Walking elf 2", "Greet elf"),
        SceneAction("Walking elf 3", "Greet elf"),
        SceneAction("Walking elf 4", "Greet elf"),
        SceneAction("Ice fishing elf", "Cast line"),
    )
    WinterWorld.Candy -> listOf(
        SceneAction("Cane shoulder", "Twirl", "Peppermint twirl"),
        SceneAction("Cookie waist", "Bow", "Santa cookie bow"),
        SceneAction("Tossed parcel", "Toss", "Present toss"),
    )
    WinterWorld.Academy -> listOf(
        SceneAction("Sapphire academy mage", "Starlight"),
        SceneAction("Bookbinder apprentice", "Page of magic"),
        SceneAction("Owl post broom rider", "Broom ride"),
    )
}
private const val EDITOR_URL = "https://fuzzy-preview-git-fix-native-c-6233bc-viviens-projects-842ec178.vercel.app/receive"
private val giftKinds = listOf("bicycle", "gift", "reindeer", "snowman", "lantern", "igloo", "candy-cane")
private val spotifyAlbums = mapOf("charlie" to "2XnNY3GEkbWHor5kyvXLu4", "buble" to "3CKVXhODttZebJAzjUs2un", "mariah" to "0cS9prZ8u3fdbc7lmtCaMV", "festive-commotion" to "57inreLG2hAF7YYt1W9nnL")
private val albumNames = linkedMapOf(
    "charlie" to "A Charlie Brown Christmas · Vince Guaraldi Trio",
    "buble" to "Christmas · Michael Bublé",
    "mariah" to "Merry Christmas · Mariah Carey",
    "festive-commotion" to "Festive Commotion · Howard Harper-Barnes",
    "toymakers-workshop" to "Toymaker’s Workshop · David Celeste",
)

private val greetings = mapOf(
    "Walking elf 1" to listOf("👋 🎄", "🎁 ✨"),
    "Walking elf 2" to listOf("☃️ ❄️", "🧣 💙"),
    "Walking elf 3" to listOf("🍪 🥛", "🎅 ❤️"),
    "Walking elf 4" to listOf("🚂 🔔", "🦌 ✨"),
    "Sapphire academy mage" to listOf("✨ Starlight!", "🌟 Make a wish!"),
    "Bookbinder apprentice" to listOf("📖 A page of magic!", "🪄 Mischief managed!"),
    "Owl post broom rider" to listOf("🧹 Catch the breeze!", "🌙 See you by moonrise!"),
    "Cane shoulder" to listOf("One peppermint spin!"),
    "Cookie waist" to listOf("A tip of my hat to you!"),
    "Tossed parcel" to listOf("Special delivery!"),
)

private class WorldScene(
    val island: WinterWorld,
    val world: Entity,
    val sky: Entity,
    val auroras: List<Entity?>,
    val gift: Entity,
    val effectsRoot: Entity?,
    val actionNodes: List<Entity?>,
    val treeLights: Entity?,
    val effects: List<NativeEffect>,
    val variants: MutableMap<Pair<Int, String>, Entity>,
    val boxBounds: List<Pair<Vector3,Vector3>>,
    val parcelParts: List<List<Entity>>,
    val carrier: Entity?,
    val carrots: List<Entity?>,
    @Suppress("unused") val retainedEntities: List<Entity>,
) {
    private data class MountedGift(val id: String, val anchor: Entity, val fit: Entity, val model: Entity)
    private val generated = mutableMapOf<Int, MountedGift>()

    fun removeGenerated(slot: Int) {
        val gift = generated.remove(slot) ?: return
        variants.remove(slot to gift.id)
        for (entity in listOf(gift.model, gift.fit, gift.anchor)) {
            entity.removeFromParent()
            entity.destroy()
        }
    }

    fun hasGenerated(slot: Int, id: String) = generated[slot]?.id == id

    fun attachGenerated(slot: Int, id: String, model: Entity) {
        val anchor = Entity()
        val fit = Entity()
        try {
            anchor.enabled = false
            world.addChild(anchor)
            anchor.addChild(fit)
            fit.addChild(model)
            // Include the imported root's rotation, scale and origin in the measurement.
            val bounds = model.getVisualBounds(fit)
            val (low, high) = boxBounds[slot]
            val extent = bounds.size
            fun ratio(room: Float, dimension: Float) =
                if (dimension > 0f) room / dimension else Float.POSITIVE_INFINITY
            val scale = minOf(ratio(high.x - low.x, extent.x), ratio(high.y - low.y, extent.y),
                ratio(high.z - low.z, extent.z))
            require(scale.isFinite() && scale > 0f) { "Gift has no visible geometry." }
            anchor.transform()?.setPosition(Vector3((low.x + high.x) / 2, low.y, (low.z + high.z) / 2))
            fit.transform()?.setScaleVector(Vector3(scale))
            fit.transform()?.setPosition(Vector3(-scale * bounds.center.x, -scale * bounds.min.y, -scale * bounds.center.z))
            removeGenerated(slot)
            generated[slot] = MountedGift(id, anchor, fit, model)
            variants[slot to id] = anchor
        } catch (e: Exception) {
            model.removeFromParent()
            fit.removeFromParent()
            fit.destroy()
            anchor.removeFromParent()
            anchor.destroy()
            throw e
        }
    }
    var actionPlayback: AnimationPlaybackController? = null
    var playback: AnimationPlaybackController? = null

    @MainThread
    fun attachTo(root: Entity) {
        root.addChild(sky)
        sky.transform()?.setPosition(Vector3(-.36f,.23f,-.64f))
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
        generated.keys.toList().forEach(::removeGenerated)
        actionPlayback?.stop()
        playback?.stop()
        playback = null
        (retainedEntities.asReversed() + listOfNotNull(effectsRoot)).forEach { entity ->
            if (entity.valid) {
                entity.removeFromParent()
                entity.destroy()
            }
        }
        listOf(world, gift, sky).forEach { entity ->
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
    var session by androidx.compose.runtime.saveable.rememberSaveable { mutableStateOf(java.util.UUID.randomUUID().toString()) }
    WorldVolume(selected, session, newSession = { session = java.util.UUID.randomUUID().toString() }) { next ->
        settings.edit().putString("world", next.name).apply()
        selected = next
    }
}

@MainThread
private suspend fun loadWorldScene(context: Context, island: WinterWorld): WorldScene {
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

        val effectName = "world-effects/" + island.name.lowercase() + "-effects"
        val effectsRoot = load("$effectName.glb").also { scene.addChild(it) }
        val effects = run {
            val entries = context.assets.open("$effectName.json").bufferedReader().use { org.json.JSONArray(it.readText()) }
            List(entries.length()) { i ->
                val effect = entries.getJSONObject(i)
                val node = requireNotNull(effectsRoot.findEntity("Atmosphere $i"))
                val p = effect.getJSONArray("position")
                val opacity = OpacityControllerComponent(.7f)
                node.components.set(opacity)
                NativeEffect(node, effect.getString("kind"), Vector3(p.getDouble(0).toFloat(), p.getDouble(1).toFloat(), p.getDouble(2).toFloat()), effect.getDouble("phase").toFloat(), false, 1f, opacity)
            }
        }

        val parcelParts = (0..2).map { slot ->
            listOfNotNull(scene.findEntity("Gift box $slot"), scene.findEntity("Gift lid $slot"))
        }
        val variants = buildMap {
            for (slot in 0..2) for (kind in giftKinds) {
                val item = requireNotNull(scene.findEntity("Decor_${slot}_${kind}"))
                item.enabled = false
                put(slot to kind, item)
            }
        }
        val actionNodes = island.actions().map { scene.findEntity(it.node) }

        val carrier = when (island) {
            WinterWorld.Village -> scene.findEntity("Christmas mailbox")
            WinterWorld.Academy -> scene.findEntity("Letter delivery owl")
            WinterWorld.Candy -> scene.findEntity("Gingerbread postman")
        }
        val carrots = listOf("Adult moose carrot", "Moose calf carrot").map { scene.findEntity(it)?.apply { enabled = false } }
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
        val sky = load(island.name.lowercase()+"-sky.glb")
        val auroras = listOf("teal-aurora","violet-aurora").map { sky.findEntity(it) }
        val present = load("christmas-gift.glb")

        val retainedEntities = buildList {
            treeLights?.let(::add)
            addAll(effects.map { it.entity })
            addAll(auroras.filterNotNull())
            addAll(carrots.filterNotNull())
            addAll(variants.values)
            addAll(parcelParts.flatten())
            carrier?.let(::add)
            addAll(lanterns)
            addAll(actionNodes.filterNotNull())
        }
        android.util.Log.i(TAG, "Loaded ${island.name}")
        return WorldScene(
            island = island,
            world = scene,
            sky = sky, auroras = auroras,
            gift = present,
            effectsRoot = effectsRoot,
            actionNodes = actionNodes,
            treeLights = treeLights,
            effects = effects,
            variants = mutableStateMapOf<Pair<Int, String>, Entity>().apply { putAll(variants) },
            boxBounds = context.assets.open(island.name.lowercase()+"-boxes.json").bufferedReader().use { reader ->
                val all = org.json.JSONArray(reader.readText())
                List(3) { i ->
                    fun corner(key:String): Vector3 {
                        val pos = all.getJSONObject(i).getJSONArray(key)
                        return Vector3(pos.getDouble(0).toFloat(),pos.getDouble(1).toFloat(),pos.getDouble(2).toFloat())
                    }
                    corner("min") to corner("max")
                }
            },
            parcelParts = parcelParts,
            carrier = carrier, carrots = carrots,
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
private fun WorldVolume(island: WinterWorld, session: String, newSession: () -> Unit, select: (WinterWorld) -> Unit) {
    val context = LocalContext.current
    val prefs = remember(island) { context.getSharedPreferences(if (island == WinterWorld.Village) "fuzzy_keepsakes_v2" else "fuzzy_keepsakes_${island.name}", 0) }
    val scope = rememberCoroutineScope()
    var greeting by remember(island) { mutableStateOf(GreetingState(opened = true, lightsOn = prefs.getBoolean("tree_lit", true), kept = prefs.getBoolean("christmas_kept", false))) }
    var editor by remember(island) { mutableStateOf(EditorState.restore(prefs.getString("message", null), prefs.getString("decorations", null), prefs.getBoolean("mail_read", false))) }
    var draft by remember(island) { mutableStateOf(prefs.getString("note_draft", editor.note) ?: editor.note) }
    val actions = remember(island) { island.actions() }
    var slots by remember(island) { mutableStateOf(
        prefs.getString("gift_slots", null)?.split("|")?.takeIf { it.size == 3 }
            ?: List(3) { editor.decorations.getOrNull(it).orEmpty() }
    ) }
    var openedMask by remember(island, session) { mutableIntStateOf(
        if (prefs.getString("reveal_session", null) == session) prefs.getInt("unwrapped_slots", 0) else 0
    ) }
    var giftPrompt by remember(island) { mutableStateOf("") }
    var pendingIds by remember(island) { mutableStateOf(List(3) { prefs.getString("task_$it", "").orEmpty() }) }


    var startingTask by remember(island) { mutableStateOf(false) }
    fun pending(slot: Int, id: String) {
        pendingIds = pendingIds.toMutableList().also { it[slot] = id }
        prefs.edit().putString("task_$slot",id).apply()
    }
    var entryError by remember(island) { mutableStateOf("") }
    var editingSlot by remember(island) { mutableIntStateOf(-1) }
    var inspectionAngle by remember(island) { mutableFloatStateOf(0f) }
    var inspecting by remember(island) { mutableIntStateOf(-1) }
    var revealing by remember(island) { mutableIntStateOf(-1) }
    var reaction by remember(island) { mutableIntStateOf(-1) }
    val feedStarts = remember(island) { mutableStateMapOf<Int, Float>() }
    var fishing by remember(island) { mutableStateOf("Cast line") }
    LaunchedEffect(fishing) {
        if (fishing == "Waiting…") { delay(2400); fishing = "Reel in!" }
        else if (fishing == "Reel in!") { delay(2400); fishing = "Missed · cast again" }
    }
    var bubble by remember(island) { mutableStateOf("") }
    val visits = remember(island) { IntArray(actions.size) }
    var recipient by androidx.compose.runtime.saveable.rememberSaveable(island.name) { mutableStateOf("") }
    var chooseAlbum by remember { mutableStateOf(false) }
    var activityEpoch by remember(island) { mutableIntStateOf(0) }
    var packing by androidx.compose.runtime.saveable.rememberSaveable(island.name) { mutableStateOf(false) }
    var sender by remember(island) { mutableStateOf(prefs.getString("sender", "").orEmpty()) }
    var paper by remember(island) { mutableStateOf(prefs.getString("paper", "pine") ?: "pine") }
    val musicPrefs = remember { context.getSharedPreferences("fuzzy_worlds", 0) }
    var album by remember { mutableStateOf(musicPrefs.getString("album", prefs.getString("album", "toymakers-workshop")) ?: "toymakers-workshop") }

    val failures = remember(island) { mutableStateMapOf<Int,String>() }
    val progress = remember(island) { mutableStateMapOf<Int,Int>() }
    val retries = remember(island) { mutableStateMapOf<Int,Int>() }
    fun persistGifts() {
        prefs.edit().putString("gift_slots", slots.joinToString("|"))
            .putString("reveal_session", session).putInt("unwrapped_slots", openedMask).apply()
    }
    var currentScene by remember { mutableStateOf<WorldScene?>(null) }
    fun activateSlot(slot: Int) {
        if (startingTask || editingSlot >= 0) return
        entryError = ""
        if (slot in failures) {
            failures.remove(slot)
            retries[slot] = (retries[slot] ?: 0) + 1
        } else if (pendingIds[slot].isNotEmpty() || slots[slot].isEmpty()) editingSlot = slot
        else if (currentScene?.takeIf { it.island == island }?.variants?.containsKey(slot to slots[slot]) != true) return
        else if ((openedMask and (1 shl slot)) == 0) {
            revealing = slot
            openedMask = openedMask or (1 shl slot)
            persistGifts()
        } else { inspecting = slot; inspectionAngle = 0f }
    }
    val revealProgress = remember(island, revealing) { androidx.compose.animation.core.Animatable(0f) }
    LaunchedEffect(island, revealing) {
        if (revealing >= 0) {
            revealProgress.animateTo(1f, tween(650))
            revealing = -1
        }
    }
    LaunchedEffect(island, activityEpoch) {
        if (reaction >= 0) {
            delay(when (island) {
                WinterWorld.Village -> 3200L
                WinterWorld.Academy -> 2600L
                WinterWorld.Candy -> 1900L
            })
            reaction = -1
            bubble = ""
        }
    }
    fun parcelUrl(preview: Boolean): String {
        val fields = mutableListOf("parcel" to "1", "world" to island.name.lowercase(), "paper" to paper, "album" to album, "sender" to sender.trim(), "note" to draft.trim())
        slots.forEach { fields.add("gift" to if (it in giftKinds) "preset:$it" else it) }
        if (preview) fields.add("preview" to "1")
        return EDITOR_URL + "#" + fields.joinToString("&") { (k,v) -> k + "=" + Uri.encode(v) }
    }
    var saving by remember(island) { mutableStateOf(false) }
    var showLetter by remember(island) { mutableStateOf(false) }
    var paused by remember { mutableStateOf(android.provider.Settings.Global.getFloat(context.contentResolver, android.provider.Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f) }
    var musicEnabled by remember { mutableStateOf(true) }
    val soundtrack = remember(context) { createSoundtrack(context.applicationContext) }
    var loading by remember(island) { mutableStateOf(true) }
    var error by remember(island) { mutableStateOf<String?>(null) }
    var status by remember(island) { mutableStateOf("A little Christmas warmth, waiting for you.") }

    var attempt by remember(island) { mutableIntStateOf(0) }
    var clock by remember(island) { mutableFloatStateOf(0f) }
    val sceneRoot = remember { Entity() }
    val attachmentEntities = remember { mutableMapOf<String, Entity>() }

    var pendingScene by remember { mutableStateOf<WorldScene?>(null) }
    val islandScope = key(island) { rememberCoroutineScope() }
    for (slot in 0..2) {
        val taskId = pendingIds[slot]
        LaunchedEffect(island,slot,taskId,retries[slot]) {
            if (taskId.isEmpty()) return@LaunchedEffect
            try {
                failures.remove(slot)
                progress.remove(slot)
                awaitGift(taskId) { value -> if (value != null) progress[slot] = value }
                giftFile(context,taskId)
                if (pendingIds[slot] != taskId) return@LaunchedEffect
                slots = slots.toMutableList().also { it[slot] = taskId }
                openedMask = openedMask and (1 shl slot).inv()
                persistGifts()
                pending(slot,"")
                status = "Box ${slot+1} is ready to unwrap."
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { failures[slot] = e.message ?: "Check your connection and retry." }
        }
        val id = slots[slot]
        val scene = currentScene
        LaunchedEffect(island,slot,id,scene,retries[slot]) {
            if (scene == null || scene.island != island) return@LaunchedEffect
            if (id.isEmpty() || id in giftKinds) { scene.removeGenerated(slot); return@LaunchedEffect }
            if (scene.hasGenerated(slot,id)) return@LaunchedEffect
            try {
                failures.remove(slot)
                val file = giftFile(context,id)
                val model = try { Entity.loadSuspend(file) } catch (e: CancellationException) { throw e }
                    catch (e: Exception) { file.delete(); throw e }
                try { scene.attachGenerated(slot,id,model) } catch(e: Exception) { if(model.valid) model.destroy(); throw e }
                status = "Gift loaded."
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { failures[slot] = e.message ?: "Could not load gift. Retry download." }
        }
    }
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
    var playing by remember { mutableStateOf(false) }
    LaunchedEffect(soundtrack, musicEnabled, active, album) {
        soundtrack ?: return@LaunchedEffect
        runCatching {
            if (musicEnabled && active && album == "toymakers-workshop") {
                soundtrack.start()
                android.util.Log.i(SOUNDTRACK_TAG, "Playing Toymaker's Workshop")
            } else if (soundtrack.isPlaying) {
                soundtrack.pause()
            }
            playing = soundtrack.isPlaying
        }.onFailure { playing = false; android.util.Log.e(SOUNDTRACK_TAG, "Could not update soundtrack playback", it) }
    }
    LaunchedEffect(soundtrack, active, musicEnabled, album) {
        if (soundtrack != null && active && musicEnabled && album == "toymakers-workshop") {
            while (isActive) {
                playing = runCatching { soundtrack.isPlaying }.getOrDefault(false)
                delay(200)
            }
        }
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
            pendingScene = loadWorldScene(context, island)
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
            if (currentScene?.island != island) return@LaunchedEffect
            var last = withFrameNanos { it }
            while (isActive) {
                withFrameNanos { now ->
                    val delta = (now - last) / 1_000_000_000f
                    if (delta >= 1f / 30f) {
                        clock += delta.coerceAtMost(.1f)

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
    fun openLink(url: String) {
        runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }
            .onFailure { status = "A browser is needed to open this link." }
    }
    val soundtrackPicker: @Composable () -> Unit = {
        Text("Background music", color = Cocoa, fontSize = 20.sp)
        Action("Choose album · ${albumNames[album]}") { chooseAlbum = !chooseAlbum }
        if (chooseAlbum) for ((id,label) in albumNames) Action((if (album == id) "✓ " else "") + label) {
            chooseAlbum = false
            album = id
            musicEnabled = true
            musicPrefs.edit().putString("album", id).apply()
        }
        val spotifyId = spotifyAlbums[album]
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            val label = if (spotifyId != null) "Open in Spotify" else if (playing) "Pause record" else "Play record"
            val play = {
                if (spotifyId != null) openLink("https://open.spotify.com/album/$spotifyId")
                else musicEnabled = !playing
            }
            Box(Modifier.clickable(role = Role.Button, onClickLabel = label, onClick = play)) { Record(playing && !paused) }
            Action(label, spotifyId != null || soundtrack != null, onClick = play)
        }
    }
    fun readMail() {
        showLetter = true
        if (!editor.read) save(editor.copy(read = true), "Your note is open.")
    }
    var volumePixels by remember { mutableStateOf(IntSize3D.Zero) }
    val cueLights = remember { mutableMapOf<String, PointLightComponent>() }
    SpatialView(
        modifier = Modifier.fillMaxSize().onGloballyPositioned {
            volumePixels = it.findRootCoordinates().sizeIn3D
        },
        initial = { content, attachments ->
            content.addEntity(sceneRoot)
            attachments.entity("controls")?.let {
                attachmentEntities["controls"] = it
                it.transform()?.setPosition(Vector3(.68f, .18f, -.04f))
                sceneRoot.addChild(it)
            }
            attachments.entity("title")?.let {
                attachmentEntities["title"] = it
                it.transform()?.setPosition(Vector3(-.45f, .82f, island.position.z))
                sceneRoot.addChild(it)
            }
            fun addCue(id: String, target: Entity) {
                val light = PointLightComponent(Color4(1f, .88f, .66f, 1f), 0f, .075f)
                target.components.set(light)
                cueLights[id] = light
            }
            attachments.entity("mailbox")?.let {
                addCue("mailbox", it)
                attachmentEntities["mailbox"] = it
                it.enabled = false
                sceneRoot.addChild(it)
            }
            for (id in (0..2).map { "box$it" } + (0..6).map { "actor$it" }) {
                attachments.entity(id)?.let { entity ->
                    addCue(id, entity)
                    attachmentEntities[id] = entity
                    entity.enabled = false
                    sceneRoot.addChild(entity)
                }
            }
            for (id in listOf("giftEntry", "speech", "packing")) {
                attachments.entity(id)?.let { entity ->
                    attachmentEntities[id] = entity
                    entity.enabled = false
                    sceneRoot.addChild(entity)
                }
            }
            attachmentEntities["giftEntry"]?.transform()?.setPosition(Vector3(-.28f, .22f, .29f))
            attachmentEntities["packing"]?.transform()?.setPosition(Vector3(-.28f, .22f, .29f))
            attachments.entity("letter")?.let {
                attachmentEntities["letter"] = it
                it.enabled = false
                it.transform()?.setPosition(Vector3(-.40f, .22f, island.position.z + .06f))
                sceneRoot.addChild(it)
            }
        },
        update = { content, _ ->
            val physical = content.convertSize(
                Vector3(volumePixels.width.toFloat(), volumePixels.height.toFloat(), volumePixels.depth.toFloat()),
                ViewCoordinateSpace.Local, content.localSpatialCoordinateSpace)
            val fit = minOf(physical.x / 2.4f, physical.y / 1.95f,
                if (physical.z > 0f) physical.z / 1.4f else Float.POSITIVE_INFINITY)
            if (fit.isFinite() && fit > 0f) sceneRoot.transform()?.setScaleVector(Vector3(fit))

            var scene = currentScene
            pendingScene?.let { incoming ->
                if (incoming.island == island) {
                    scene?.destroy()
                    incoming.attachTo(sceneRoot)
                    currentScene = incoming
                    scene = incoming

                    loading = false
                    android.util.Log.i(TAG, "Attached ${island.name}")
                } else {
                    incoming.destroy()
                }
                pendingScene = null
            }

            val activeScene = scene?.takeIf { it.island == island }
            scene?.world?.enabled = activeScene != null && reveal > .15f
            scene?.sky?.enabled = activeScene != null
            if (activeScene != null && fit > 0f && fit.isFinite()) {
                activeScene.sky.transform()?.apply {
                    setPosition(Vector3(0f, 0f, -.64f))
                    setScaleVector(Vector3(physical.x / (2.4f * fit), physical.y / (1.24f * fit), 1f))
                }
            }
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
                activeWorld.auroras.forEachIndexed { index, layer ->
                    val phase = clock * (2f * PI.toFloat() / if (index == 0) 9f else 13f) + index
                    layer?.transform()?.setPosition(Vector3(.045f * sin(phase), .012f * cos(phase), .001f * (index + 1)))
                }
                activeWorld.carrots.forEachIndexed { index, carrot ->
                    val start = feedStarts[index]
                    if (carrot != null && start != null) {
                        val elapsed = clock - start
                        val (angle, size) = mooseFeedFrame(elapsed)
                        carrot.enabled = size > 0f
                        carrot.transform()?.setScaleVector(Vector3(size * 1.65f))
                        activeWorld.actionNodes[index]?.transform()?.setEulerAngles(EulerAngles(0f, 0f, angle))
                    }
                }
                activeWorld.treeLights?.enabled = lit
                activeWorld.parcelParts.forEachIndexed { slot, parts ->
                    parts.forEach { it.enabled = (openedMask and (1 shl slot)) == 0 || (slot to slots[slot]) !in activeWorld.variants }
                }
                for ((key, node) in activeWorld.variants) {
                    node.enabled = slots[key.first] == key.second && (openedMask and (1 shl key.first)) != 0
                    if (node.enabled) {
                        val progress = if (revealing == key.first && !paused) revealProgress.value.coerceAtLeast(.01f) else 1f
                        node.transform()?.setScaleVector(Vector3(progress))
                        node.transform()?.setEulerAngles(EulerAngles(0f, if (inspecting == key.first) inspectionAngle else 0f, 0f))
                    }
                }
                for (fx in activeWorld.effects) {
                    fx.entity.enabled = !fx.tree || lit
                    if (!fx.entity.enabled) continue
                    val frame = effectFrame(fx.kind, clock, fx.phase, fx.size)
                    fx.entity.transform()?.apply {
                        setPosition(Vector3(fx.position.x + 8f * frame.dx, fx.position.y + 8f * frame.dy, fx.position.z))
                        setScaleVector(Vector3(8f * frame.scale))
                    }
                    fx.opacity.opacity = frame.opacity
                }
            }

            for (slot in 0..6) {
                fun place(id: String, node: Entity?, lift: Float, cue: Float) {
                    attachmentEntities[id]?.let { target ->
                        target.enabled = node != null && activeScene != null && opened && !loading && !showLetter && editingSlot < 0 && !packing
                        if (target.enabled && node != null) {
                            val pos = node.convertPositionTo(Vector3(0f), sceneRoot)
                            target.transform()?.setPosition(Vector3(pos.x, pos.y + lift, pos.z + .032f))
                            cueLights[id]?.intensity = cue * 3f
                        }
                    }
                }
                val boxPulse = if ((openedMask and (1 shl slot)) == 0) cueStrength(slot, clock, paused) else 0f
                place("box$slot", activeScene?.parcelParts?.getOrNull(slot)?.firstOrNull(), .012f, boxPulse)
                place("actor$slot", activeScene?.actionNodes?.getOrNull(slot), .007f, if (reaction == slot) .8f else cueStrength(slot+3, clock, paused))
            }
            attachmentEntities["mailbox"]?.let { target ->
                val carrier = activeScene?.carrier
                target.enabled = carrier != null && opened && !loading && !showLetter && editingSlot < 0 && !packing
                if (carrier != null && target.enabled) {
                    val position = carrier.convertPositionTo(Vector3(0f, .25f, 0f), sceneRoot)
                    target.transform()?.setPosition(Vector3(position.x, position.y, position.z + .035f))
                    cueLights["mailbox"]?.intensity = 3f * cueStrength(11, clock, paused)
                }
            }
            attachmentEntities["giftEntry"]?.enabled = activeScene != null && editingSlot >= 0 && opened
            attachmentEntities["controls"]?.enabled = editingSlot < 0 && !packing
            attachmentEntities["packing"]?.enabled = activeScene != null && packing
            attachmentEntities["speech"]?.let { target ->
                val actor = activeScene?.actionNodes?.getOrNull(reaction)
                target.enabled = actor != null && bubble.isNotEmpty() && opened && !showLetter && editingSlot < 0 && !packing
                if (actor != null && target.enabled) {
                    val anchor = actor.convertPositionTo(Vector3(0f), sceneRoot)
                    target.transform()?.setPosition(Vector3(anchor.x, anchor.y + .085f, anchor.z + .038f))
                }
            }
            attachmentEntities["letter"]?.enabled = activeScene != null && showLetter && opened
        },
        attachments = {
                for (slot in 0..6) {
                    if (slot < 3) AttachmentPanel(id = "box$slot") {
                        ObjectTarget("Box ${slot + 1}", slot, clock, paused, revealing < 0, cue = (openedMask and (1 shl slot)) == 0) { activateSlot(slot) }
                    }
                    AttachmentPanel(id = "actor$slot") {
                        val action = actions.getOrNull(slot)
                        if (action != null) ObjectTarget(action.label, slot+3, clock, paused, true, responding = reaction == slot) {
                            if (action.node == "Ice fishing elf") fishing = when (fishing) {
                                "Waiting…" -> "Too soon · cast again"
                                "Reel in!" -> "Caught one! · cast again"
                                else -> "Waiting…"
                            }
                            val scene = currentScene
                            val clip = scene?.world?.getAnimationResources()?.firstOrNull { it.getName() == action.clip }
                            if (island == WinterWorld.Village && slot in 0..1) {
                                if (paused) feedStarts.remove(slot) else feedStarts[slot] = clock
                                if (paused) {
                                    scene?.carrots?.get(slot)?.apply { enabled = true; transform()?.setScaleVector(Vector3(1.65f)) }
                                    islandScope.launch {
                                        delay(900)
                                        if (scene?.world?.valid == true) scene.carrots[slot]?.enabled = false
                                    }
                                }
                            } else if (clip != null && !paused) {
                                scene.actionPlayback?.stop()
                                scene.actionPlayback = scene.world.playAnimation(clip)
                            }
                            val lines = greetings[action.node]
                            bubble = if (lines != null) lines[visits[slot]++ % lines.size]
                                else if (action.node == "Ice fishing elf") fishing else ""
                            reaction = slot
                            activityEpoch++
                        }
                    }
                }
                AttachmentPanel(id = "packing") {
                    if (packing) Column(Modifier.width(660.dp).heightIn(max = 1000.dp)
                        .background(Cream, RoundedCornerShape(28.dp)).verticalScroll(rememberScrollState())
                        .padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Wrap their world", color = Cocoa, fontSize = 26.sp)
                        TextField(value = sender, onValueChange = { sender = it.take(60); prefs.edit().putString("sender", sender).apply() })
                        Text("From · ${sender.ifBlank { "Your name (optional)" }}", color = Cocoa)
                        for ((id,label) in listOf("pine" to "Pine sprigs", "berry" to "Cranberry stripes", "frost" to "Frost stars")) {
                            Action((if (paper == id) "✓ " else "") + label) { paper = id; prefs.edit().putString("paper", id).apply() }
                        }
                        soundtrackPicker()
                        Action("Preview as recipient") { openLink(parcelUrl(true)) }
                        Action("Copy gift link") {
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                            clipboard.setPrimaryClip(android.content.ClipData.newPlainText("Fuzzy winter world", parcelUrl(false)))
                            status = "Gift link copied."
                        }
                        Text("Recipient email", color = Cocoa)
                        TextField(value = recipient, onValueChange = { recipient = it.take(254) }, singleLine = true)
                        Action("Send by email", android.util.Patterns.EMAIL_ADDRESS.matcher(recipient.trim()).matches()) {
                            val url = parcelEmail(recipient.trim(), parcelUrl(false))
                            runCatching {
                                context.startActivity(Intent(Intent.ACTION_SENDTO, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                            }.onFailure { status = "Email is unavailable here. Use Copy gift link to send your parcel." }
                        }
                        Action("Start another wrapped world") {
                            newSession()
                            packing = false
                            inspecting = -1
                            revealing = -1
                        }
                        Action("Share wrapped world") {
                            val send = Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_SUBJECT, "A winter world for you").putExtra(Intent.EXTRA_TEXT, parcelUrl(false))
                            runCatching { context.startActivity(Intent.createChooser(send, "Share your world").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }
                                .onFailure { status = "Use Copy gift link to share your parcel." }
                        }
                        Text(status, color = Cocoa)
                        Action("Back to island") { packing = false }
                    }
                }
                AttachmentPanel(id = "speech") {
                    if (bubble.isNotEmpty()) Text(bubble, color = Cocoa, fontSize = 20.sp,
                        modifier = Modifier.background(Cream, RoundedCornerShape(16.dp)).padding(horizontal = 14.dp, vertical = 8.dp))
                }
                AttachmentPanel(id = "giftEntry") {
                    if (editingSlot in slots.indices) {
                        Column(Modifier.width(660.dp).heightIn(max = 900.dp).background(Cream, RoundedCornerShape(28.dp)).verticalScroll(rememberScrollState()).padding(24.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text("Choose a gift for box ${editingSlot + 1}", color = Cocoa)
                            TextField(value = giftPrompt, onValueChange = { giftPrompt = it.take(500) }, modifier = Modifier.fillMaxWidth())
                            if (pendingIds[editingSlot].isEmpty()) {
                                Action("Generate custom gift", !startingTask && giftPrompt.trim().length >= 3) {
                                    if (startingTask) return@Action
                                    val slot = editingSlot
                                    val prompt = giftPrompt
                                    startingTask = true
                                    islandScope.launch {
                                        try { pending(slot,startGift(prompt)); editingSlot = -1; giftPrompt = "" }
                                        catch(e: CancellationException) { throw e }
                                        catch(e: Exception) { entryError = e.message ?: "Could not start generation." }
                                        finally { startingTask = false }
                                    }
                                }
                            } else {
                                Action("Check this gift again") { retries[editingSlot] = (retries[editingSlot] ?: 0) + 1 }
                                Action("Discard pending gift") { pending(editingSlot,"") }
                            }
                            giftKinds.chunked(2).forEach { row ->
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    for (kind in row) Action(kind.replace('-', ' ').replaceFirstChar { it.uppercase() }, !startingTask) {
                                        failures.remove(editingSlot)
                                        pending(editingSlot,"")
                                        slots = slots.toMutableList().also { it[editingSlot] = kind }
                                        openedMask = openedMask and (1 shl editingSlot).inv()
                                        persistGifts()
                                        editingSlot = -1
                                        inspecting = -1
                                    }
                                }
                            }
                            if (entryError.isNotEmpty()) Text(entryError, color = Cranberry)
                            Action("Close gift choices", !startingTask) { editingSlot = -1 }
                        }
                    }
                }
                AttachmentPanel(id = "title") {
                    Column(Modifier.width(850.dp).clip(RoundedCornerShape(28.dp)).background(Cream).padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("fuzzy", color = Cocoa, fontWeight = FontWeight.Bold, fontSize = 38.sp)
                        Text(island.title, color = Cocoa, fontSize = 23.sp)
                    }
                }
                AttachmentPanel(id = "mailbox") {
                    ObjectTarget(if (island == WinterWorld.Academy) "Read the owl’s letter" else "Read mailbox", 11, clock, paused, !saving) { readMail() }
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
                        Text(if (opened) "Where would you like to take them?" else "Someone is thinking of you.", color = Cocoa, fontSize = 30.sp, fontWeight = FontWeight.Bold)
                        for (choice in WinterWorld.values()) {
                            Action((if (choice == island) "✓ " else "") + choice.title, enabled = choice != island && !saving && !loading && !startingTask) { select(choice) }
                        }
                        if (opened && error == null) {
                            val readySlot = slots.indices.firstOrNull { slots[it].isNotEmpty() && pendingIds[it].isEmpty() && (openedMask and (1 shl it)) == 0 && currentScene?.variants?.containsKey(it to slots[it]) == true }
                            Text(when {
                                pendingIds.any { it.isNotEmpty() } -> "Your gift is taking shape."
                                readySlot != null -> "Your gift is ready to unwrap."
                                else -> "Make a gift for someone you love."
                            }, color = Cocoa, fontSize = 24.sp)
                            if (pendingIds.any { it.isNotEmpty() }) Text("Write them a note or explore the island while you wait.", color = Cocoa)
                            else if (readySlot != null) Text("Tap box ${readySlot + 1} on the island to open it.", color = Cocoa)
                            for (slot in slots.indices) {
                                val name = when {
                                    slot in failures -> "Retry · ${failures[slot]}"
                                    pendingIds[slot].isNotEmpty() -> progress[slot]?.let { "Generating $it%" } ?: "Generating…"
                                    slots[slot].isEmpty() -> "Choose gift"
                                    (openedMask and (1 shl slot)) == 0 -> "Unwrap"
                                    else -> "Inspect"
                                }
                                Action("Box ${slot + 1} · $name", revealing < 0) { activateSlot(slot) }
                                if (pendingIds[slot].isNotEmpty() && slot !in failures) {
                                    GiftProgress(slot, progress[slot], clock, paused)
                                }
                            }
                            if (inspecting >= 0) {
                                Text("Box ${inspecting + 1} · ${slots[inspecting]}", color = Cocoa)
                                Action("Rotate gift") { inspectionAngle = (inspectionAngle + 45f) % 360f }
                                Action("Replace gift") { editingSlot = inspecting; inspecting = -1 }
                                Action("Done inspecting") { inspecting = -1 }
                            }
                            Text("A note for someone you love", color = Cocoa, fontSize = 20.sp)
                            TextField(value = draft, onValueChange = { draft = it.take(500); prefs.edit().putString("note_draft", draft).apply() }, modifier = Modifier.fillMaxWidth(), enabled = !saving,
                                singleLine = false, minLines = 3, maxLines = 5, textStyle = TextStyle(color = Cocoa, fontSize = 22.sp))
                            Text("${draft.length} / 500", color = Cocoa, fontSize = 15.sp)
                            Action("Add note to mailbox", !saving && draft.isNotBlank()) {
                                editor.withNote(draft)?.let { save(it, "Your note is in the mailbox. Tap the letter carrier.") }
                            }
                            if (slots.all { it.isNotEmpty() } && pendingIds.all { it.isEmpty() } && !startingTask && failures.isEmpty() && slots.indices.all { currentScene?.variants?.containsKey(it to slots[it]) == true }) Action("Wrap their world") { packing = !packing }
                            soundtrackPicker()
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
                            if (greeting.kept) Action("Open keepsake", !loading) { greeting = greeting.openKept(prefs.getBoolean("tree_lit", true)) }
                        }
                        if (error != null) Action("Retry") { error = null; loading = true; greeting = greeting.wrapAgain(); showLetter = false; attempt++ }
                        Text(error ?: if (loading) "Preparing your Christmas village…" else if (saving) "Saving on this device…" else status, color = Cranberry, fontSize = 18.sp)
                        Text("Your world saves on this device. Shared parcels open in a browser.", color = Cocoa.copy(alpha = .7f), fontSize = 14.sp)
                    }
                }
            }
        )
}

private fun cueStrength(index: Int, clock: Float, paused: Boolean): Float {
    if (paused) return .17f
    val phase = (clock + index * 1.37f) % 5.6f
    return if (phase < 1.7f) .38f * sin(PI.toFloat() * phase / 1.7f).pow(2) else 0f
}

@Composable
private fun ObjectTarget(label: String, index: Int, clock: Float, paused: Boolean, enabled: Boolean,
                         cue: Boolean = true, responding: Boolean = false, onClick: () -> Unit) {
    val alpha = when {
        responding -> .62f
        !cue -> 0f
        else -> cueStrength(index, clock, paused)
    }
    Box(Modifier.size(92.dp).semantics { contentDescription = label }
        .clickable(enabled = enabled, role = Role.Button, onClickLabel = label, onClick = onClick),
        contentAlignment = Alignment.Center) {
        Canvas(Modifier.size(70.dp)) {
            drawCircle(Brush.radialGradient(listOf(Color.White.copy(alpha = alpha),
                Color(0xFFFFDCA4).copy(alpha = alpha * .58f), Color.Transparent), radius = size.minDimension / 2))
        }
    }
}

@Composable
private fun GiftProgress(slot: Int, percent: Int?, clock: Float, paused: Boolean) {
    Canvas(Modifier.fillMaxWidth().height(8.dp).semantics {
        contentDescription = "Box ${slot + 1}: " + (percent?.let { "$it percent" } ?: "Preparing gift")
    }) {
        drawRect(Cocoa.copy(alpha = .18f))
        val fraction = percent?.div(100f) ?: .22f
        val offset = if (percent == null && !paused) (.5f - .5f * cos(clock * 2f)) * (1f - fraction) else 0f
        drawRect(Cranberry, Offset(size.width * offset, 0f), androidx.compose.ui.geometry.Size(size.width * fraction, size.height))
    }
}

@Composable
private fun Record(playing: Boolean) {
    var angle by remember { mutableFloatStateOf(0f) }
    LaunchedEffect(playing) {
        if (playing) {
            var last = withFrameNanos { it }
            while (isActive) withFrameNanos { now ->
                angle = (angle + (now-last) / 1_000_000_000f * 120f) % 360f
                last = now
            }
        }
    }
    Canvas(Modifier.size(66.dp).rotate(angle)) {
        drawCircle(Color(0xFF302D36))
        for (i in 1..3) drawCircle(Color.DarkGray, size.minDimension * (.24f+.06f*i), style = Stroke(1.dp.toPx()))
        drawCircle(Cranberry, size.minDimension * .19f)
        drawCircle(Cream, size.minDimension * .035f, Offset(center.x, center.y-size.height*.12f))
    }
}

@Composable
private fun Action(label: String, enabled: Boolean = true, onClick: () -> Unit) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val focused by interaction.collectIsFocusedAsState()
    val shape = RoundedCornerShape(18.dp)
    val tint = if (pressed) Color(0xEF543B43) else Color(0xCE563D49)
    Box(Modifier.heightIn(min = 56.dp).clip(shape)
        .background(Brush.verticalGradient(listOf(if (enabled) Color(0xD978606B) else Color(0xD4767276), tint)))
        .border(if (focused) 3.dp else 1.dp, Color.White.copy(alpha = if (focused) 1f else .60f), shape)
        .clickable(interactionSource = interaction, indication = null, enabled = enabled, role = Role.Button, onClick = onClick)
        .padding(horizontal = 18.dp, vertical = 10.dp), contentAlignment = Alignment.Center) {
        Text(label, color = if (enabled) Color.White else Color(0xFFE8DFE3), fontSize = 19.sp)
    }
}
