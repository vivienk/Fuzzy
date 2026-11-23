// Export the same decorated islands used by the editor as offline PICO assets.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stationWorld } from "../prototype/web/assets/world-gift-stations.mjs";

const output = resolve(process.argv[2]);
await mkdir(output, { recursive: true });
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, options) => {
  if (input instanceof URL && input.protocol === "file:") {
    return new Response(await readFile(fileURLToPath(input)));
  }
  return originalFetch(input, options);
};
for (const kind of ["academy", "candy"]) {
  const url = await stationWorld(kind);
  const data = Buffer.from(await (await fetch(url)).arrayBuffer());
  URL.revokeObjectURL(url);
  const end = 20 + data.readUInt32LE(12);
  const model = JSON.parse(data.toString("utf8", 20, end));
  const scene = model.scenes[model.scene ?? 0];
  // Normalize the meter scale under a parent so native decorations and controls
  // keep the same physical size on all islands. Preserve animation node indices.
  const scale = .19;
  const root = model.nodes.push({ name: "Island terrain", children: scene.nodes,
    scale: [scale, scale, scale] }) - 1;
  scene.nodes = [root];
  const json = Buffer.from(JSON.stringify(model));
  const padded = Buffer.alloc((json.length + 3) & ~3, 32);
  json.copy(padded);
  const header = Buffer.from(data.subarray(0, 20));
  header.writeUInt32LE(20 + padded.length + data.length - end, 8);
  header.writeUInt32LE(padded.length, 12);
  await writeFile(join(output, kind + ".glb"), Buffer.concat([header, padded, data.subarray(end)]));
}
