# Fuzzy V2.2 build verification — November 2, 2026

- Android APK compilation: successful.
- Unit tests: 14 passed, zero failures/errors. Includes recipient flow, note limits and persistence round trips, decoration limits/migration, and finite animation frames/cycle boundaries.
- Package: com.fuzzy.christmas, version 0.2.2, versionCode 4.
- PICO Spatial SDK 6.1.9; min/target Android API 35; arm64-v8a.
- Debug APK signature: valid v2 signature, one signer.
- APK size: 32,921,405 bytes.
- SHA-256: 0bda6f5ec8ccdab411d6cf45b6d5d000305c37d46956ffea45eea8257b20a3e0
- All five bundled GLBs match source bytes and pass container/buffer bounds checks.
- Native assets: existing 8,436-triangle village; 76-triangle gift; 482-triangle starry backdrop; 138 animated glow/spark/smoke/mist nodes with shared meshes; nine miniature variant groups across three reserved slots.
- Generated miniature heights: gift 0.128 m, reindeer 0.214 m, snowman 0.194 m; all below the 0.2775 m mailbox height.
- Native editor, mailbox alert/letter, effects pause, local persistence, and miniature selection are compiled into this APK. It is not a browser wrapper.
- ADB device inventory: no headset or emulator connected on November 2, 2026.

Headset rendering, depth/layout, system keyboard entry, transparency/lighting, runtime frame rate, and persistence after a real app/device restart remain unverified. A successful build and unit tests are not runtime certification. See TESTING.md before submission.
