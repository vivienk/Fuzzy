# Fuzzy

**Send your loved ones a 3D card.**

Messages don't disappear into a chat history. They become playful, persistent parts of a world you build together.

## Start here — Fuzzy V3

**Christmas Worlds for PICO · build 19 (0.3.14)**

Open a wrapped island, read its letter, and tap the little boxes to discover the gifts inside. You can also create a world for someone else and preview what they’ll see.

| Get started | What to do |
| --- | --- |
| [Download the build 19 APK ZIP](https://github.com/vivienk/Fuzzy/actions/runs/45727514769/artifacts/15074803372) | Sign in to GitHub and extract `Fuzzy-V3-Christmas-Worlds.apk`. |
| [Install and try build 19 on PICO](https://github.com/vivienk/Fuzzy/blob/727e68ee7198312546855893200344d1fd71c087/README.md#start-here) | Follow the emulator instructions and try the gift boxes, recipient preview, and fishing. |
| [Build 19 source](https://github.com/vivienk/Fuzzy/tree/6e1efca531130516ea2aaef3a9f1334cb1d87903) · [PR #8](https://github.com/vivienk/Fuzzy/pull/8) | Browse the source used for the APK or follow ongoing changes. |
| [Build and unit-test results](https://github.com/vivienk/Fuzzy/actions/runs/45727514769) | The APK built successfully and launched on the PICO emulator. Hands-on checks for clipping and resizing remain open. |
| [Open Santa Village in the browser](https://fuzzy-preview-git-feat-tripo-w-af628c-viviens-projects-842ec178.vercel.app/tripo-island.html#santa-village) · [Prototype source](prototype/web/) | Explore the companion web prototype. |
| [Submission materials](https://drive.google.com/drive/folders/1CRVMRI06iP5BajKrthzkdanl4s72C9_m) | Supporting materials for reviewers. |

## Previous versions & archive

These are historical references, **not** the current V3 download or submission entry point.

- [V2.2 APK and archived release materials](https://github.com/vivienk/Fuzzy/releases/tag/v0.2.2)
- [V2 design and scope](docs/V2-DESIGN.md)
- [Historical Android build instructions](docs/android-build.md)
- [V1 concept and longer-term AI vision](docs/V1-CONCEPT.md)

## Earlier build notes

V2.2 was an earlier native Christmas village prototype with local keepsakes and editor effects. Its release is retained for historical reference only. Live AI generation and remote recipient delivery should not be inferred from the native APK.

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

## Build and test

Install JDK 21 and Android SDK platform 35 / build-tools 35.0.0. Configure your own `local.properties` with `sdk.dir` (not committed), then run:

```sh
./gradlew :app:assembleDebug :app:testDebugUnitTest
```

The PICO OS 6 Emulator requires a supported Apple Silicon Mac or Windows PC; Intel Macs cannot run that emulator. Check [PICO's current requirements](https://developer.picoxr.com/document/spatial-toolkit/install-pico-emulator/) before setup. See TESTING.md for the actual-device recording script.

## Credits and access

Capy Post is inspiration only; no ownership or affiliation is claimed. [Repository](https://github.com/chinesepowered/hack-tripothon) · [reference demo](https://github.com/chinesepowered/hack-tripothon/blob/main/submission/capy-post-demo-day.mp4). Native scaffolding follows PICO's official CLI/templates. No Capy Post application code was copied into this project.

This repository is public. The linked Drive folder holds additional submission materials. No signing keys, credentials, machine-specific SDK paths, or build caches are committed.

The miniature generator offers a ribbon-wrapped gift, little reindeer, or snowman. Existing saved miniature pines migrate to reindeer. The village evergreen trees are unchanged.

## Development history

The V1/V2 design documents and earlier [V2.2 release](https://github.com/vivienk/Fuzzy/releases/tag/v0.2.2) preserve previous milestones. Work on the companion browser prototype (including different seasonal worlds, animations, and experimental integrations) does not imply those features are present in the native V3 APK.

