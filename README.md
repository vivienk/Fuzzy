# Fuzzy

**Send your loved ones a 3D card.**

Messages don't disappear into a chat history. They become playful, persistent parts of a world you build together.

## Native PICO V3 · Christmas Worlds

**APK 0.3.0 (build 5)** brings three 3D islands into the PICO volumetric window. Switch between **North Pole – Santa Village**, **Wizardry Magic Christmas**, and **Funky Candy Land**, pause or resume animations, and keep a separate keepsake on the device for each world.

The V3 source is on [the native Christmas Worlds branch](https://github.com/vivienk/Fuzzy/tree/feat/native-christmas-worlds-v3). [Pull request #5](https://github.com/vivienk/Fuzzy/pull/5) tracks its integration into the Christmas island feature branch.

### Try V3 on the Swan emulator

1. With JDK 21 and Android SDK 35 installed, run the following from a clean clone to build the reviewed APK:

   ```sh
   git fetch origin feat/native-christmas-worlds-v3
   git switch --detach 92bb40d375a4eaa1f4f12b22ec795f69891fdf3f
   ./gradlew :app:assembleDebug :app:testDebugUnitTest
   ```

2. In Android Studio, open **Tools → Device Manager** and start a clean **Swan** emulator. V2.2 and V3 use different debug signing keys, so use a separate emulator to preserve existing V2.2 keepsakes.
3. Drag `app/build/outputs/apk/debug/app-debug.apk` onto the running emulator and open **Fuzzy Christmas**. Switch through all three islands, pause and resume animation, then save a keepsake and reopen the app to check it persists.

**Verification at this commit.** All 14 JVM tests passed. APK inspection confirmed ARM64, Android API 35, all three scene assets, and a valid signature. Native rendering, scale, input, and save/relaunch behavior still need a runtime check.

## Start here — Fuzzy V3

Fuzzy V3 is the current **native PICO Christmas Worlds** candidate. Explore three miniature 3D islands, write a letter, place decorations, and save a keepsake locally.

| Get started | What to expect |
| --- | --- |
| **[V3 release status](https://github.com/vivienk/Fuzzy/releases)** | V3.0 APK is uploaded to a **draft release**; it is **not publicly downloadable** until the release is published. |
| **[V3 source code](https://github.com/vivienk/Fuzzy/tree/feat/native-christmas-worlds-v3)** | Native Android/Kotlin PICO OS 6 project, including Santa Village, Wizardry Magic Christmas, and Funky Candy Land. |
| **[Build and run V3](#build-and-test)** | Build with JDK 21 and Android SDK 35; use a clean PICO OS 6 Swan emulator for testing. |
| **[Browser prototype](prototype/web/)** | Explore the separate browser prototype. Browser behavior does **not** verify the native APK. |
| **[Test checklist](TESTING.md)** and **[build verification](BUILD-VERIFICATION.md)** | Reference testing documents; see the V3 verification note above for the actual V3 status. |
| **[Submission materials (Google Drive)](https://drive.google.com/drive/folders/1CRVMRI06iP5BajKrthzkdanl4s72C9_m)** | Supporting materials; access and contents should be confirmed before sharing with judges. |

**V3 verification:** At source commit `92bb40d375a4eaa1f4f12b22ec795f69891fdf3f`, 14 JVM tests passed and the APK's signature, architecture, and three packaged scenes were inspected. **Native runtime rendering, interactions, and save/relaunch still require emulator/headset validation.** V2.2 uses a different signing key; install V3 on a clean emulator rather than over an older installation.

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

