# Fuzzy

**Send your loved ones a 3D card.**

Messages don't disappear into a chat history. They become playful, persistent parts of a world you build together.

## Start here

- [V2 APK and submission materials](https://github.com/vivienk/Fuzzy/releases/tag/v0.2.2)
- [V2 design and scope](docs/V2-DESIGN.md)
- [Build and install instructions](docs/android-build.md)
- [Test checklist](TESTING.md) and [verified build results](BUILD-VERIFICATION.md)
- [V1 concept and longer-term AI vision](docs/V1-CONCEPT.md)
- [Google Drive submission folder](https://drive.google.com/drive/folders/1CRVMRI06iP5BajKrthzkdanl4s72C9_m)

## Current status — V2 candidate

Native Android/Kotlin with PICO Spatial SDK 6.1.9, ARM64, Android API 35, PICO OS 6. The APK compiled, 14 flow/editor/effect tests passed, and the debug signature was verified. **Headset/emulator runtime testing remains pending.** This is not a confirmed build for PICO 4 or older firmware.

The Christmas recipient flow includes unwrap, message reveal, tree lights, island rotation, local keep, and reopening a saved keepsake. It uses prepared low-poly assets, an editable locally saved note, and small selectable decorations. Live AI generation and delivery are not implemented. The V1 design describes broader aspirations, not current capabilities.

![Christmas model preview — not headset capture](art/Fuzzy-V2-Christmas-World0001.png)

## Repository map

| Path | Contents |
| --- | --- |
| `app/`, `gradle/`, build files | Native PICO project and tests |
| `Christmas-World.blend` | Editable 3D scene |
| `app/src/main/assets/` | Bundled Christmas GLB models |
| `docs/` | V1 and V2 document snapshots and build instructions |
| `art/` | Current village model preview |
| `prototype/web/` | Interactive preview using the current village GLBs |
| `tools/` | Model generator and archived concept scripts; see tools/README.md |

## Downloadable artifacts

The latest release contains the updated APK, source ZIP, model preview, and browser preview. Version 0.2.2 removes the capybara and expands the island into a Christmas village with three cottages, a pond and bridge, sleigh, mailbox, lanterns, and a decorated tree.

Version 0.2.2 brings the recent preview features into the native APK: a bounded starry night backdrop, 56 glowing/sparkling light sources, drifting chimney smoke, hot-spring mist, pause/resume, a right-side note editor using PICO text input, a mailbox alert opening a handwritten-style letter, and three miniature slots for gifts, reindeer, or snowmen. Notes and miniature selections save on the device. This is native Spatial SDK code, not a WebView wrapper.

The sky is a backdrop inside the app volume, not a replacement for the entire PICO home environment. The tallest miniature is 0.214 m, below the mailbox height of 0.2775 m. Live AI generation and recipient delivery remain future work. Headset validation is pending.

Serve `prototype/web` with a local static server to try the browser preview. It uses the same village model as the APK, but does not validate native PICO behavior.

The old v0.2.0 concept PDFs and videos are superseded and retained only as history. They contain the retired character direction and must not be presented as the current design or runtime footage.

## Build and test

Install JDK 21 and Android SDK platform 35 / build-tools 35.0.0. Configure your own `local.properties` with `sdk.dir` (not committed), then run:

```sh
./gradlew :app:assembleDebug :app:testDebugUnitTest
```

The PICO OS 6 Emulator requires a supported Apple Silicon Mac or Windows PC; Intel Macs cannot run that emulator. Check [PICO's current requirements](https://developer.picoxr.com/document/spatial-toolkit/install-pico-emulator/) before setup. See TESTING.md for the actual-device recording script.

## Milestones

- V2: November 1, 2026 — APK, design document, short video.
- V3: November 8, 2026 — updated APK and supporting materials.
- V4 / final: November 15, 2026 — final submission including this GitHub repo.

## Credits and access

Capy Post is inspiration only; no ownership or affiliation is claimed. [Repository](https://github.com/chinesepowered/hack-tripothon) · [reference demo](https://github.com/chinesepowered/hack-tripothon/blob/main/submission/capy-post-demo-day.mp4). Native scaffolding follows PICO's official CLI/templates. No Capy Post application code was copied into this project.

This repository is private. Reviewers need repository access to use GitHub links; the existing Drive materials are a separate sharing route. No signing keys, credentials, machine-specific SDK paths, or build caches are committed.

The miniature generator offers a ribbon-wrapped gift, little reindeer, or snowman. Existing saved miniature pines migrate to reindeer. The village evergreen trees are unchanged.

### Three winter worlds (website, November 2)

The browser preview now offers North Pole, Moonlit Alpine Village, and
Enchanted Frost Forest. Frost Forest is the first-visit default; the selected
world is remembered locally. Each has a distinct GLB scene and starry sky;
notes, mailbox state, decorations, lights, and atmosphere survive switching.
The picker thumbnails are concept artwork, not exact screenshots of the models.
Regenerate the six lit/unlit GLBs and SVG skies with
`python3 tools/build_winter_worlds.py`.

Verified locally: all three scenes render, selection updates, and existing
notes/decorations remain visible across switching. The v0.2.2 APK still contains
the original Christmas village; these three styles are website-only.

World elements now follow the selected style: crystal-roof fairy cottages and
silver/lilac decorations in Frost Forest, cedar-log cabins and mineral/mint
accents in North Pole, and timber-frame chalets with shutters in Alpine.
Mailbox trims, bridge finials, tree ornaments, wrapped gifts, note paper and
added miniatures also change with the theme. Miniature height checks passed for
all nine style/type combinations (maximum 0.228 m, below the mailbox).
Browser-checked world switching, generation, and wrapping; APK remains unchanged.

North Pole workshop update: Santa workshop facade, candy canes, three elves at make/wrap/dispatch stations, two permanent reindeer and a 3D North Pole sign. The spa was replaced with a snowy work yard. Both GLBs structurally checked and rendered in Blender; browser interaction QA unavailable during this update. Website-only; native APK unchanged.

November 15: All browser islands now have twice the terrain width and depth
(four times the footprint), while props retain their scale. North Pole uses a
muted timber/ivory/pine palette, rounded elf faces and tunics, snowy cottage
eaves, an ivory-and-brass landmark sign, three igloos, two moose, and a polar
bear with cub. The workshop and gift-making stages remain. All six GLBs passed
terrain-scale and structure checks; a direct Blender render verifies the model
composition. This change does not update the native APK.

North Pole character polish: natural evergreen trees, six elves scattered around
the island, three larger blue-shadow igloos with dark entrances, and rounder
polar bears wearing Santa hats. The embedded eight-second animation loop adds
elf arm gestures and idle movement to elves, moose, reindeer and bears. Playback
respects Pause effects, reduced-motion preference and background tabs. Both
GLBs passed animation/hierarchy checks. Local Chrome verified scene rendering,
visible igloos and hats, and pause/resume controls with no console errors.
The picker uses a fresh render of the actual model. Native APK unchanged.

Clarity, music and house-size update: the browser keeps full render resolution
and uses smaller light halos. Houses in all three worlds are 35% larger with
matching architecture, window glow and smoke anchors; shifted outward for room.
Christmas music is an original Web Audio music-box loop (no external recordings),
started by an explicit play button, with volume and automatic background pause.
Syntax, six-model hierarchy/size checks, and mocked audio scheduling/start/stop/
background pause checks passed. Music controls were visible in Chrome, but the
browser connection dropped before audible playback could be verified. Native
APK is unchanged.

November 16 sound update: removed the music-box score. Opt-in winter ambience
now layers soft filtered wind, occasional light sleigh-bell shakes and short
clusters of snow-crunch footsteps, with a shared volume slider. It pauses in
background tabs and releases sound sources when switched off. These are
procedural sound effects, not character-footfall synchronization. Website only.

November 16 snowy-world update: a continuous 4.96 m by 3.96 m snow blanket
covers the enlarged terrain, with cooler snow materials and browser exposure
0.72. A light, pointer-transparent snowfall layer respects reduced motion and
the effects pause control. Six North Pole animals follow alternating-direction
32-second looping perimeter routes, with leg motion. This is procedural node
animation, not Tripo skeletal rigging or collision-aware navigation.
The generator now supports gift, reindeer, snowman, lantern, igloo and candy
cane; all 18 world/type combinations pass the mailbox-height check. Live AI
generation remains unavailable until a Tripo key and server integration exist.
All six GLBs passed snow coverage checks, and six animal paths have matching
loop endpoints. Inline JavaScript parses. Browser preview connection timed out;
interactive acceptance remains unverified. Website-only; APK unchanged.

Gentle walking and Christmas albums: the six North Pole animals now complete
individual laps in 80, 96, 120, 160, 192 and 240 seconds (previously all 32).
Leg cadence scales with travel speed and uses smaller strides. Elf gesture
speed is retained. All tracks share a seamless 960-second master loop.
An opt-in Spotify album selector offers A Charlie Brown Christmas, Christmas
by Michael Buble, and Merry Christmas by Mariah Carey. One iframe is replaced
on selection to prevent overlapping albums; Stop removes it. Spotify controls
track availability and preview/sign-in limits. Winter ambience stays separate.

Validation: both North Pole GLBs passed extracted-keyframe speed and loop
checks. Album opt-in, switch and stop behavior passed a mock DOM test.
Live Spotify playback and in-browser motion remain unverified.
