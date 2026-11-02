Source: https://docs.google.com/document/d/1hh5NGfbJO_NxbJtypNB-LFveUKJAz8GiofLPSrpBtEc

Snapshot: November 1, 2026. 

# Fuzzy — V2 Christmas

Send your loved ones a 3D card

November 1, 2026 · PICO OS 6 · Headset test pending

## Build and review links

Download the V2 APK

Download the editable source project

V1 concept and longer-term vision

## V2 experience

Messages don't disappear into a chat history. They become playful, persistent parts of a world you build together

V2 isolates the recipient’s Christmas experience: open → unwrap → read → play → keep. A small volumetric snowy island contains a timber cottage, capybara, evergreen tree, glowing ornaments, and gifts. The warm cream and cranberry interface supports large native spatial buttons without moving the user through the scene.

## Flow and interactions

1. Open Fuzzy Christmas. A wrapped gift waits in a native volumetric window.

2. Select Unwrap gift. The present turns and shrinks as the island grows into view.

3. Read the sample note: “A little Christmas warmth from me to you. Wherever we are, you have a place in my world.”

4. Select Light the tree to toggle ornaments and the star. Select Turn island / Front view to inspect the world.

5. Select Keep. The app confirms a successful local save. On the next launch, Open keepsake restores the saved greeting and its saved lighting setting.

6. Select Wrap again to replay the greeting while retaining the keepsake.

## Scope and honest boundaries

Implemented in the compiled candidate: native PICO Spatial UI, original low-poly 3D models, reveal and rotation animations, tree-light toggling, persistent local storage, loading/error feedback, retry, and replay.

The AI-generated-world vision remains the product direction. This V2 uses a prepared world and fixed sample note. There is no live AI generation, recipient delivery, account service, cloud sync, direct object grabbing, or multiplayer. The earlier HTML walkthrough and V1 video are concept materials, not evidence of this APK running.

## Platform and build

Native Android/Kotlin with PICO Spatial SDK 6.1.9. Package com.fuzzy.christmas; version 0.2.0 (code 2). ARM64; minimum and target Android API 35. Target: PICO OS 6 / Project Swan. Compatibility with PICO 4 or older firmware is not established. Developer debug signing is used for sideload evaluation.

## Validation completed

The final APK compiled successfully. Six recipient-flow unit tests passed with zero failures: unopened-action guards, complete flow, replay preserving the keepsake, failed-save handling, restored lighting, and reversible toggles. The APK signature is valid; bundled GLB bytes match the reviewed assets. The world has 1,604 triangles and the gift has 76.

Physical headset validation remains pending. No device was detected over USB. Compilation and unit tests do not prove headset rendering, interaction comfort, performance, persistence after a device restart, or compatibility with a particular PICO model.

## Tonight’s headset test and video

Connect a compatible headset, enable USB debugging, approve the connection, and install the APK. Verify the gift, readable note, lights, rotation, successful Keep confirmation, and Open keepsake after closing and reopening the app. Check that exit/re-entry does not duplicate the scene.

Suggested recording, under one minute: 0–5s launch; 5–12s unwrap; 12–22s lights and rotation; 22–30s Keep; 30–40s close/reopen and Open keepsake; 40–45s saved world and message. Record actual headset output. A verified V2 runtime recording has not yet been produced.

## Next milestones

V3 — November 8: prioritize headset feedback and stability, then authoring/personalization and a constrained prompt-to-world pipeline if feasible. V4 / final — November 15: finalize the APK, include the GitHub repository, and complete the required design document and short video. The current deadline extension governs over the older V1 schedule.

## Credits

Capy Post inspired the greeting-world idea and low-poly art direction; no ownership or affiliation is claimed. The V2 geometry was created for Fuzzy in Blender. The native scaffold comes from PICO’s official CLI and SDK patterns.

Capy Post repository

Capy Post reference demo

PICO Spatial SDK samples

## Reference links

- Capy Post: https://github.com/chinesepowered/hack-tripothon
- Reference demo: https://github.com/chinesepowered/hack-tripothon/blob/main/submission/capy-post-demo-day.mp4
- PICO samples: https://github.com/Pico-Developer/PICO-Spatial-SDK-Samples

