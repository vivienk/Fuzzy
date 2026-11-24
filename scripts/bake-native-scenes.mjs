// Export the same decorated islands used by the editor as offline PICO assets.
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stationWorld } from "../prototype/web/assets/world-gift-stations.mjs";
import { villageGeometry } from "../prototype/web/assets/gingerbread-village.mjs";
import { animateVillage } from "../prototype/web/assets/santa-flight.mjs";

// The browser scene generator uses DOM geometry helpers while extracting a few reusable props.
// Keep the native build dependency-free by providing the small subset needed by that generator.
if (!globalThis.DOMPoint) {
  globalThis.DOMPoint = class DOMPoint {
    constructor(x = 0, y = 0, z = 0, w = 1) {
      Object.assign(this, { x, y, z, w });
    }
  };
}
if (!globalThis.DOMMatrix) {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor(values) {
      this.values = values ? Array.from(values) : [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
      ];
    }
    multiply(other) {
      const a = this.values, b = other.values, out = Array(16).fill(0);
      for (let column = 0; column < 4; column++) {
        for (let row = 0; row < 4; row++) {
          for (let k = 0; k < 4; k++) out[column * 4 + row] += a[k * 4 + row] * b[column * 4 + k];
        }
      }
      return new DOMMatrix(out);
    }
    apply(values) {
      this.values = this.multiply(new DOMMatrix(values)).values;
      return this;
    }
    translateSelf(x = 0, y = 0, z = 0) {
      return this.apply([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]);
    }
    scaleSelf(x = 1, y = x, z = x) {
      return this.apply([x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1]);
    }
    rotateAxisAngleSelf(x, y, z, degrees) {
      const length = Math.hypot(x, y, z) || 1;
      x /= length; y /= length; z /= length;
      const radians = degrees * Math.PI / 180, c = Math.cos(radians), s = Math.sin(radians), t = 1 - c;
      return this.apply([
        t*x*x+c, t*x*y+s*z, t*x*z-s*y, 0,
        t*x*y-s*z, t*y*y+c, t*y*z+s*x, 0,
        t*x*z+s*y, t*y*z-s*x, t*z*z+c, 0,
        0, 0, 0, 1,
      ]);
    }
    transformPoint(point) {
      const m = this.values, { x, y, z, w = 1 } = point;
      return new DOMPoint(
        m[0]*x + m[4]*y + m[8]*z + m[12]*w,
        m[1]*x + m[5]*y + m[9]*z + m[13]*w,
        m[2]*x + m[6]*y + m[10]*z + m[14]*w,
        m[3]*x + m[7]*y + m[11]*z + m[15]*w,
      );
    }
  };
}

const output = resolve(process.argv[2]);
await mkdir(output, { recursive: true });
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, options) => {
  if (input instanceof URL && input.protocol === "file:") {
    return new Response(await readFile(fileURLToPath(input)));
  }
  return originalFetch(input, options);
};

function nodeMatrix(node) {
  if (node.matrix) return new DOMMatrix(node.matrix);
  const matrix = new DOMMatrix().translateSelf(...(node.translation || [0, 0, 0]));
  const [x, y, z, w] = node.rotation || [0, 0, 0, 1];
  if (Math.hypot(x, y, z) > 1e-8) {
    matrix.rotateAxisAngleSelf(x, y, z, 2 * Math.acos(Math.max(-1, Math.min(1, w))) * 180 / Math.PI);
  }
  return matrix.scaleSelf(...(node.scale || [1, 1, 1]));
}

function sceneBounds(model) {
  const low = [Infinity, Infinity, Infinity], high = [-Infinity, -Infinity, -Infinity];
  function visit(index, parent) {
    const node = model.nodes[index];
    const matrix = parent.multiply(nodeMatrix(node));
    for (const primitive of model.meshes?.[node.mesh]?.primitives || []) {
      const accessor = model.accessors[primitive.attributes.POSITION];
      if (!accessor?.min || !accessor?.max) continue;
      for (let corner = 0; corner < 8; corner++) {
        const source = accessor.min.map((value, axis) => corner & (1 << axis) ? accessor.max[axis] : value);
        const point = matrix.transformPoint(new DOMPoint(...source));
        [point.x, point.y, point.z].forEach((value, axis) => {
          low[axis] = Math.min(low[axis], value);
          high[axis] = Math.max(high[axis], value);
        });
      }
    }
    for (const child of node.children || []) visit(child, matrix);
  }
  const scene = model.scenes[model.scene ?? 0];
  scene.nodes.forEach(index => visit(index, new DOMMatrix()));
  return { low, high, size: high.map((value, axis) => value - low[axis]) };
}

const presentation = {
  village: { orbit: 18, fieldOfView: 30 },
  academy: { orbit: 30, fieldOfView: 25.17 },
  candy: { orbit: 30, fieldOfView: 25.17 },
};

function normalizedScene(data, kind) {
  const end = 20 + data.readUInt32LE(12);
  const model = JSON.parse(data.toString("utf8", 20, end));
  const scene = model.scenes[model.scene ?? 0];
  const bounds = sceneBounds(model);
  const radians = presentation[kind].orbit * Math.PI / 180;
  const projectedWidth = Math.abs(bounds.size[0] * Math.cos(radians)) + Math.abs(bounds.size[2] * Math.sin(radians));
  // The Vercel model-viewer fills a 2.76:1 scene at 30°/25.17° FOV. Fit every
  // native island into the same 1.28 m × .62 m frame instead of guessing a
  // second scale per world after export.
  const scale = Math.min(1.28 / projectedWidth, .62 / bounds.size[1]);
  return {
    // PICO OS 6 ignores TRS on a synthetic top-level glTF wrapper. Keep the exact
    // authored graph and apply this measured presentation scale to the native root.
    data,
    metadata: {
      kind,
      ...presentation[kind],
      rawBounds: bounds,
      projectedWidth,
      scale,
      outputSize: bounds.size.map(value => value * scale),
    },
  };
}

const metadata = [];
const villageSource = URL.createObjectURL(new Blob([await villageGeometry(true)], { type: "model/gltf-binary" }));
let animatedVillage;
try {
  const animatedUrl = await animateVillage(villageSource);
  try { animatedVillage = Buffer.from(await (await fetch(animatedUrl)).arrayBuffer()); }
  finally { URL.revokeObjectURL(animatedUrl); }
} finally {
  URL.revokeObjectURL(villageSource);
}
const village = normalizedScene(animatedVillage, "village");
metadata.push(village.metadata);
await writeFile(join(output, "north-pole.glb"), village.data);

for (const kind of ["academy", "candy"]) {
  const url = await stationWorld(kind);
  const data = Buffer.from(await (await fetch(url)).arrayBuffer());
  URL.revokeObjectURL(url);
  const normalized = normalizedScene(data, kind);
  metadata.push(normalized.metadata);
  await writeFile(join(output, kind + ".glb"), normalized.data);
}

await writeFile(join(output, "world-presentation.json"), JSON.stringify(metadata, null, 2));
await copyFile(
  fileURLToPath(new URL("../prototype/web/assets/toymakers-workshop.mp3", import.meta.url)),
  join(output, "toymakers-workshop.mp3"),
);
