# Asset generation

`build_christmas_models.py` regenerates the current animal-free village, GLBs, editable Blender file, and preview. Run with Blender in background mode; paths resolve relative to this repository. It uses Cycles CPU rendering.

All other scripts and prompts are historical V1 concept tooling. They reference the original workspace and retired artwork, and are not part of the current app or preview. The old character direction is superseded. Do not use those scripts to regenerate current submission materials.

`build_native_extras.py` creates the native night sky, shared glow/steam meshes and metadata, and miniature variants. Requires Python with Pillow and Node.js. It reads the checked-in browser generators, so no original workspace files are needed. Runtime motion is implemented in native Kotlin, not in Blender animation tracks.
