# Fuzzy V2 build verification — November 1, 2026

- Final build: SUCCESSFUL (:app:assembleDebug).
- Unit tests: 6 passed, 0 failed, 0 skipped (:app:testDebugUnitTest).
- APK signature: valid APK Signature Scheme v2, one signer; debug signing.
- Package: com.fuzzy.christmas, version 0.2.0, versionCode 2.
- Target/minimum Android API: 35. Native ABI: arm64-v8a.
- APK size: 32,797,917 bytes.
- SHA-256: f711bbffdfb74b51f9ddc6140409e1be5c5049add05235870f5f1544194b980a
- Bundled GLB bytes match the reviewed source assets exactly.
- World: 1,604 triangles; gift: 76 triangles. Both binary glTF containers passed structural checks.
- Model preview reviewed from Blender; this is not headset runtime evidence.
- No PICO device detected over ADB. Headset launch, layout, controls, persistence after restart, and runtime video remain unverified.

Tests cover unopened-gift action guards, complete recipient flow, wrapping while preserving the keepsake, failed saves, restored keepsake lighting, and reversible light/rotation toggles. These are state tests, not device integration tests.
