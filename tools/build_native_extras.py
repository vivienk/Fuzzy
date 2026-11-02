"""Create native sky, anchored translucent effects, and bounded miniature meshes.
Uses the checked-in browser geometry generators as the source of truth.
"""
from pathlib import Path
import json, struct, math, random, io, subprocess
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'app/src/main/assets';WORK=ROOT.parent/'work'
class GLB:
 def __init__(self):
  self.g={'asset':{'version':'2.0','generator':'Fuzzy native extras'},'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'materials':[],'bufferViews':[],'accessors':[],'buffers':[{}]};self.b=bytearray()
 def view(self,data):
  while len(self.b)%4:self.b.append(0)
  i=len(self.g['bufferViews']);self.g['bufferViews'].append({'buffer':0,'byteOffset':len(self.b),'byteLength':len(data)});self.b.extend(data);return i
 def acc(self,v,dim):
  vals=[n for p in v for n in p];a={'bufferView':self.view(struct.pack('<'+'f'*len(vals),*vals)),'componentType':5126,'count':len(v),'type':'VEC'+str(dim),'min':[min(p[i] for p in v) for i in range(dim)],'max':[max(p[i] for p in v) for i in range(dim)]};self.g['accessors'].append(a);return len(self.g['accessors'])-1
 def mat(self,color,texture=None,unlit=False):
  m={'doubleSided':True,'pbrMetallicRoughness':{'baseColorFactor':color,'roughnessFactor':.8,'metallicFactor':0}}
  if texture is not None:
   image=Image.new('RGBA',(64,64));pix=image.load()
   for y in range(64):
    for x in range(64):
     u=(x-31.5)/31.5;v=(y-31.5)/31.5;r=math.sqrt(u*u+v*v);alpha=max(0,1-r)**2
     if texture=='spark':alpha=max(0,1-abs(u)*16)*max(0,1-abs(v))**2+max(0,1-abs(v)*16)*max(0,1-abs(u))**2
     pix[x,y]=(255,255,255,int(min(1,alpha)*255))
   f=io.BytesIO();image.save(f,format='PNG');iv=self.view(f.getvalue());images=self.g.setdefault('images',[]);images.append({'bufferView':iv,'mimeType':'image/png'});textures=self.g.setdefault('textures',[]);textures.append({'source':len(images)-1});m['pbrMetallicRoughness']['baseColorTexture']={'index':len(textures)-1};m['alphaMode']='BLEND'
  if unlit:
   m['extensions']={'KHR_materials_unlit':{}};self.g['extensionsUsed']=['KHR_materials_unlit']
  self.g['materials'].append(m);return len(self.g['materials'])-1
 def mesh(self,verts,material,uv=None):
  normals=[]
  for i in range(0,len(verts),3):
   a,b,c=verts[i:i+3];u=[b[j]-a[j] for j in range(3)];v=[c[j]-a[j] for j in range(3)];n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];l=math.sqrt(sum(t*t for t in n)) or 1;normals.extend([[t/l for t in n]]*3)
  attrs={'POSITION':self.acc(verts,3),'NORMAL':self.acc(normals,3)}
  if uv:attrs['TEXCOORD_0']=self.acc(uv,2)
  self.g['meshes'].append({'primitives':[{'attributes':attrs,'material':material}]});return len(self.g['meshes'])-1
 def node(self,name,mesh=None,pos=None,parent=None):
  n={'name':name};i=len(self.g['nodes'])
  if mesh is not None:n['mesh']=mesh
  if pos is not None:n['translation']=pos
  self.g['nodes'].append(n)
  if parent is None:self.g['scenes'][0]['nodes'].append(i)
  else:self.g['nodes'][parent].setdefault('children',[]).append(i)
  return i
 def save(self,name):
  while len(self.b)%4:self.b.append(0)
  self.g['buffers'][0]['byteLength']=len(self.b);j=json.dumps(self.g,separators=(',',':')).encode();j+=b' '*((-len(j))%4);total=28+len(j)+len(self.b);(OUT/name).write_bytes(struct.pack('<III',0x46546c67,2,total)+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(self.b),0x004e4942)+self.b)
def quad(w,h):return [(-w/2,-h/2,0),(w/2,-h/2,0),(w/2,h/2,0),(-w/2,-h/2,0),(w/2,h/2,0),(-w/2,h/2,0)]
uv=[(0,1),(1,1),(1,0),(0,1),(1,0),(0,0)]
# World-space background stays fixed while the village rotates.
g=GLB();sky=g.mat([.014,.027,.065,1],unlit=True);g.node('Midnight sky',g.mesh(quad(3.8,2.55),sky),[0,.20,-1.13]);star=g.mat([.7,.84,1,1],unlit=True);verts=[];rng=random.Random(73)
for i in range(240):
 x=rng.uniform(-1.87,1.87);y=rng.uniform(-1.05,1.44);r=rng.uniform(.0016,.0045);verts += [(x,y+r,-1.12),(x-r,y,-1.12),(x,y-r,-1.12),(x,y+r,-1.12),(x,y-r,-1.12),(x+r,y,-1.12)]
g.node('Sky stars',g.mesh(verts,star));g.save('night-sky.glb')
# Crossed transparent billboards maintain volume when viewed from either side.
g=GLB();glow=g.mat([1,.70,.27,.65],'glow',True);spark=g.mat([1,.94,.72,.9],'spark',True);smoke=g.mat([.78,.84,.94,.4],'smoke',True);mist=g.mat([.82,1,.94,.32],'mist',True)
def sprite(w,h,mat):
 a=quad(w,h);b=[(z,y,x) for x,y,z in a];return g.mesh(a+b,mat,uv+uv)
meshes={'glow':sprite(.10,.10,glow),'spark':sprite(.035,.035,spark),'smoke':sprite(.075,.09,smoke),'steam':sprite(.20,.10,mist)}
anchor_source="const fs=require('fs'),vm=require('vm');global.window={};vm.runInThisContext(fs.readFileSync('prototype/web/assets/light-anchors.js','utf8'));console.log(JSON.stringify({lights:window.FUZZY_LIGHTS,atmosphere:window.FUZZY_ATMOSPHERE}));"
anchors=json.loads(subprocess.check_output(['node','-e',anchor_source],cwd=ROOT));effects=[]
for i,light in enumerate(anchors['lights']):
 for kind in ['glow','spark']:
  name=f'{kind}_{i}';g.node(name,meshes[kind],light['position']);effects.append(dict(name=name,kind=kind,position=light['position'],phase=i*.37,tree=light['tree'],size=1.6 if light['kind'] in ['window','lantern'] else 2 if light['kind']=='star' else 1))
for i,a in enumerate(anchors['atmosphere']):
 count=6 if a['kind']=='smoke' else 8
 for j in range(count):
  pos=a['position'].copy()
  if a['kind']=='steam':pos[0]+=(j%3-1)*.055
  name=f'{a["kind"]}_{i}_{j}';g.node(name,meshes[a['kind']],pos);effects.append(dict(name=name,kind=a['kind'],position=pos,phase=j/count,tree=False,size=1))
g.save('village-effects.glb');(OUT/'village-effects.json').write_text(json.dumps(effects))
# The same low-poly geometry as the browser, ready for native selection/undo.
g=GLB();decor=json.loads(subprocess.check_output(['node','-e',"const fs=require('fs'),vm=require('vm');global.window={};vm.runInThisContext(fs.readFileSync('prototype/web/assets/decorations.js','utf8'));console.log(JSON.stringify(Object.fromEntries(['gift','reindeer','snowman'].map(k=>[k,window.FuzzyDecorations.triangles(k)]))));"],cwd=ROOT));slots=[[-.68,.135,.55],[-.46,.135,.58],[-.08,.135,.40]];materials={}
for kind,pieces in decor.items():
 meshes=[];height=max(v[1] for p in pieces for v in p['verts']);assert height<.2775
 for p in pieces:
  key=tuple(p['color'])
  if key not in materials:materials[key]=g.mat(p['color'])
  meshes.append(g.mesh(p['verts'],materials[key]))
 for slot,pos in enumerate(slots):
  parent=g.node(f'Decor_{slot}_{kind}',pos=pos)
  for i,mesh in enumerate(meshes):g.node(f'{kind}_{slot}_{i}',mesh,parent=parent)
g.save('village-decorations.glb');print('Created sky,',len(effects),'animated effects, and 9 decoration groups')
