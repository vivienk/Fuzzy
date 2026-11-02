# Fuzzy V2 — verification and submission checklist

## Automated checks

The final build report records compilation, unit-test, package, and signature results. These do not replace runtime testing on a compatible PICO headset.

## Runtime test script (about 45 seconds)

0–5 s: Launch **Fuzzy Christmas**. Show the wrapped gift.
5–12 s: Select **Unwrap gift**. Show the island reveal and message.
12–22 s: Select **Light the tree**, then **Turn island** and **Front view**.
22–30 s: Select **Keep** and wait for the saved confirmation.
30–40 s: Close and relaunch the app, then select **Open keepsake**.
40–45 s: Show the saved world and message.

Record only actual device output for a runtime demo. The V1 video and Blender model preview are concept/asset previews and must not be described as headset capture.

## Known V2 boundaries

- PICO OS 6, ARM64, Android API 35; not a confirmed PICO 4 / OS 5 build.
- Prepared low-poly 3D world, editable note, and selectable miniature assets.
- Native spatial UI buttons; no direct object grab or gesture tutorial yet.
- Local keepsake storage only; uninstalling/clearing app data removes it.
- No live AI generation, account system, network sending, or cloud synchronization.
- Debug signing for developer sideload review.
- Physical headset testing is required before describing this candidate as verified.

## Submission

The program email requires APK + design document + short video under one minute for V2. Include this source project if helpful for DevRel debugging. Do not label the earlier HTML file as the APK. No email is sent by this build workflow.

## V2.2 device acceptance checks

1. Launch: starry background visible behind the gift; title and right editor fit inside the volume.
2. Unwrap: three cottages, tree, bridge/hot spring, and mailbox appear with no capybara.
3. Check all lights: windows, lanterns, garland, and tree glow; tree toggle also hides its glow/sparkles. Check alpha edges and depth from both sides.
4. Observe three chimney smoke streams and slow spring mist. Pause freezes effects; resume continues without a jump. Backgrounding the app should stop its animation clock.
5. Tap the envelope alert; the original exact greeting appears in a cursive letter. Close it and confirm the read indicator.
6. Enter a custom note with the PICO keyboard, save, and reopen the mailbox. Verify 500-character limit and blank-note rejection.
7. Generate a reindeer, gift, and snowman. Check height against the mailbox, reserved positions, three-slot limit, and undo.
8. Keep, close/relaunch, and reopen. Note text and decoration order persist. Restart the device and repeat.
9. Rotate with effects and mailbox visible; confirm the envelope follows the mailbox and controls remain usable. Replay should not lose saved data.
10. Measure runtime performance and comfort on the actual target; reduce effects if needed before submission.

Suggested <60-second recording: launch/unwrap (0–8s), lights and steam (8–16s), mailbox letter (16–23s), edit/save note (23–36s), add reindeer (36–44s), Keep and relaunch (44–57s).
