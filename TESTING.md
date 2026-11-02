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
- Prepared low-poly 3D world and fixed sample note.
- Native spatial UI buttons; no direct object grab or gesture tutorial yet.
- Local keepsake storage only; uninstalling/clearing app data removes it.
- No live AI generation, account system, network sending, or cloud synchronization.
- Debug signing for developer sideload review.
- Physical headset testing is required before describing this candidate as verified.

## Submission

The program email requires APK + design document + short video under one minute for V2. Include this source project if helpful for DevRel debugging. Do not label the earlier HTML file as the APK. No email is sent by this build workflow.
