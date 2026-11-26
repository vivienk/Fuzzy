"""Rebuild native sky cards from the shipped web artwork. Requires Inkscape."""
import json
import math
import re
import struct
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "app/src/main/assets"
NS = "{http://www.w3.org/2000/svg}"


def bake(world, source):
    svg = ET.parse(ROOT / "prototype/web/assets/worlds" / source).getroot()
    _, _, width, height = map(float, svg.get("viewBox").split())
    binary = bytearray()
    doc = dict(asset={"version": "2.0"}, scene=0, scenes=[{"nodes": []}], nodes=[], meshes=[],
               buffers=[{}], bufferViews=[], accessors=[], textures=[], images=[], materials=[],
               extensionsUsed=["KHR_materials_unlit"])

    def append(key, item):
        doc[key].append(item)
        return len(doc[key]) - 1

    def view(data):
        binary.extend(bytes(-len(binary) % 4))
        index = append("bufferViews", dict(buffer=0, byteOffset=len(binary), byteLength=len(data)))
        binary.extend(data)
        return index

    def floats(rows, kind):
        data = [x for row in rows for x in row]
        return append("accessors", dict(bufferView=view(struct.pack(f"<{len(data)}f", *data)),
                      componentType=5126, count=len(rows), type=kind,
                      min=list(map(min, zip(*rows))), max=list(map(max, zip(*rows)))))

    def node(name, mesh, xyz):
        index = append("nodes", dict(name=name, mesh=mesh, translation=xyz))
        doc["scenes"][0]["nodes"].append(index)
        return index

    def material(pbr, mode):
        return append("materials", dict(doubleSided=True, alphaMode=mode,
                      extensions={"KHR_materials_unlit": {}}, pbrMetallicRoughness=pbr))

    quad = floats([(-1.2,-.62,0),(1.2,-.62,0),(-1.2,.62,0),(1.2,.62,0)], "VEC3")
    uv = floats([(0,1),(1,1),(0,0),(1,0)], "VEC2")
    stars = []
    layers = {}
    for child in list(svg):
        cls = child.get("class")
        nested = child.find(f"{NS}path[@class='twinkle']")
        if cls in ("skyStar", "twinkle") or nested is not None:
            star = nested if nested is not None else child
            circle = child.find(NS+"circle") if cls == "skyStar" else child
            if nested is not None:
                x, y = map(float, re.findall(r"[\d.]+", child.get("transform")))
                radius = 4
            else:
                x, y, radius = (float(circle.get(attr)) for attr in ("cx", "cy", "r"))
                if child.find(NS+"path") is not None:
                    radius = max(3, radius)
            css = dict(pair.split(":") for pair in star.get("style").split(";") if pair)
            stars.append((x, y, radius, float(css["--period"][:-1]), -float(css["--offset"][:-1])))
            svg.remove(child)
        elif cls in ("teal-aurora", "violet-aurora"):
            layers[cls] = child
            svg.remove(child)

    def card(name, image_svg, z):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp)/"layer.svg"
            ET.ElementTree(image_svg).write(path, encoding="utf-8")
            png = path.with_suffix(".png")
            subprocess.run(["inkscape", str(path), "-w", "1200", "-o", str(png)], check=True)
            image = append("images", dict(mimeType="image/png", bufferView=view(png.read_bytes())))
        texture = append("textures", dict(source=image))
        mat = material(dict(baseColorTexture=dict(index=texture), metallicFactor=0), "BLEND" if z else "OPAQUE")
        mesh = append("meshes", dict(primitives=[dict(attributes=dict(POSITION=quad,TEXCOORD_0=uv), material=mat, mode=5)]))
        node(name, mesh, [0,0,z])

    card("Sky", svg, 0)
    for i, (name, path) in enumerate(layers.items()):
        layer = ET.Element(svg.tag, svg.attrib)
        layer.append(svg.find(NS+"defs"))
        path.set("opacity", "1")
        layer.append(path)
        card(name, layer, (i+1)*.001)

    color = [.80,.83,1,1] if world == "village" else [1,.90,.69,1]
    mat = material(dict(baseColorFactor=color, metallicFactor=0), "OPAQUE")
    vertices = floats([(0,1,0),(-1,0,0),(0,-1,0),(0,1,0),(0,-1,0),(1,0,0)], "VEC3")
    mesh = append("meshes", dict(primitives=[dict(attributes=dict(POSITION=vertices), material=mat)]))
    clip = dict(name="Starlight", channels=[], samplers=[])
    # Round each period to a whole number of cycles per minute for a seamless shared loop.
    times = [(i/8,) for i in range(481)]
    time = floats(times, "SCALAR")
    for i, (x,y,r,period,offset) in enumerate(stars):
        n = node(f"Star {i}", mesh, [(x/width-.5)*2.4,(.5-y/height)*1.24,.004])
        sx, sy = r*2.4/width, r*1.24/height
        doc["nodes"][n]["scale"] = [sx,sy,1]
        cycles = round(60/period)
        sizes = []
        for (t,) in times:
            pulse = .5-.5*math.cos(math.tau*(t+offset)*cycles/60)
            size = .48+.82*pulse
            sizes.append((sx*size,sy*size,1))
        clip["samplers"].append(dict(input=time,output=floats(sizes,"VEC3"),interpolation="LINEAR"))
        clip["channels"].append(dict(sampler=i,target=dict(node=n,path="scale")))
    doc["animations"] = [clip]
    binary.extend(bytes(-len(binary)%4))
    doc["buffers"][0]["byteLength"] = len(binary)
    header = json.dumps(doc,separators=(",",":")).encode()
    header += b" "*(-len(header)%4)
    output = ROOT / "art/skies" if world == "village" else ASSETS
    (output/f"{world}-sky.glb").write_bytes(struct.pack("<4sIIII",b"glTF",2,28+len(header)+len(binary),len(header),0x4e4f534a)
        +header+struct.pack("<II",len(binary),0x004e4942)+binary)


if __name__ == "__main__":
    bake("village","santa-dawn.svg")
    bake("academy","academy-blue-hour.svg")
