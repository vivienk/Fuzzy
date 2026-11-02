# Fuzzy

**Send your loved ones a 3D card.**

Messages don't disappear into a chat history. They become playful, persistent parts of a world you build together.

## Start here

- [V2 APK and submission materials](https://github.com/vivienk/Fuzzy/releases/tag/v0.2.1)
- [V2 design and scope](docs/V2-DESIGN.md)
- [Build and install instructions](docs/android-build.md)
- [Test checklist](TESTING.md) and [verified build results](BUILD-VERIFICATION.md)
- [V1 concept and longer-term AI vision](docs/V1-CONCEPT.md)
- [Google Drive submission folder](https://drive.google.com/drive/folders/1CRVMRI06iP5BajKrthzkdanl4s72C9_m)

## Current status — V2 candidate

Native Android/Kotlin with PICO Spatial SDK 6.1.9, ARM64, Android API 35, PICO OS 6. The APK compiled, six flow tests passed, and the debug signature was verified. **Headset/emulator runtime testing remains pending.** This is not a confirmed build for PICO 4 or older firmware.

The Christmas recipient flow includes unwrap, message reveal, tree lights, island rotation, local keep, and reopening a saved keepsake. It uses prepared low-poly assets and a fixed sample note. Live AI generation and delivery are not implemented. The V1 design describes broader aspirations, not current capabilities.

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

The latest release contains the updated APK, source ZIP, model preview, and browser preview. Version 0.2.1 removes the capybara and expands the island into a Christmas village with three cottages, a pond and bridge, sleigh, mailbox, lanterns, and a decorated tree.

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
