"""Derive three interactive low-poly worlds without changing mailbox/effect anchors."""
import json,struct,math,random,copy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'prototype/web/assets/worlds'; OUT.mkdir(exist_ok=True)
PALETTES={
 'forest':{'Deep pine':[.32,.29,.60,1],'Cedar':[.23,.12,.24,1],'Sage':[.36,.28,.49,1],'Cranberry':[.54,.16,.38,1],'Lavender slate':[.23,.14,.36,1],'Pearl snow':[.87,.86,1,1],'Glacier blue':[.48,.55,.95,1],'Rose sandstone':[.48,.36,.60,1]},
 'aurora':{'Deep pine':[.04,.33,.30,1],'Cedar':[.30,.16,.10,1],'Sage':[.10,.42,.35,1],'Lavender slate':[.12,.24,.30,1],'Glacier blue':[.06,.73,.64,1],'Pearl snow':[.84,.98,.97,1]},
 'alpine':{'Deep pine':[.05,.18,.27,1],'Cedar':[.42,.19,.10,1],'Sage':[.35,.22,.17,1],'Lavender slate':[.18,.23,.36,1],'Glacier blue':[.24,.50,.79,1],'Pearl snow':[.94,.97,1,1]}}
def read(path):
 b=path.read_bytes();n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);return g,bytearray(b[28+n:])
def write(path,g,b):
 g['buffers'][0]['byteLength']=len(b);j=json.dumps(g,separators=(',',':')).encode();j+=b' '*((-len(j))%4)
 path.write_bytes(struct.pack('<III',0x46546c67,2,28+len(j)+len(b))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(b),0x004e4942)+b)
for style,palette in PALETTES.items():
 for lit in [False,True]:
  g,b=read(ROOT/'prototype/web/assets'/('world.glb' if lit else 'world-unlit.glb'))
  for m in g['materials']:
   if m['name'] in palette:m['pbrMetallicRoughness']['baseColorFactor']=palette[m['name']]
   if m['name']=='Glacier blue' and style!='alpine':m['emissiveFactor']=[.10,.28,.34] if style=='aurora' else [.22,.12,.38]
  def material(name,color,glow=False):
   m={'name':name,'doubleSided':True,'pbrMetallicRoughness':{'baseColorFactor':color,'metallicFactor':0,'roughnessFactor':.75}}
   if glow:m['emissiveFactor']=[c*.65 for c in color[:3]]
   g['materials'].append(m);return len(g['materials'])-1
  snow=next(i for i,m in enumerate(g['materials']) if m['name']=='Pearl snow')
  pine=next(i for i,m in enumerate(g['materials']) if m['name']=='Deep pine')
  crystal=material('Luminous frost crystals',[.61,.40,1,1],True)
  stone=material('Spring stone',[.17,.33,.36,1])
  def cone(name,x,y,z,r,h,mat,n=6,top=0):
   verts=[]
   for i in range(n):
    a=i*math.tau/n;c=(i+1)*math.tau/n
    p=[x+r*math.cos(a),y,z+r*math.sin(a)];q=[x+r*math.cos(c),y,z+r*math.sin(c)]
    t=[x+top*math.cos(a),y+h,z+top*math.sin(a)];u=[x+top*math.cos(c),y+h,z+top*math.sin(c)]
    verts.extend([p,t,q,q,t,u,[x,y,z],p,q])
   norms=[]
   for i in range(0,len(verts),3):
    a,c,d=verts[i:i+3];u=[c[k]-a[k] for k in range(3)];v=[d[k]-a[k] for k in range(3)];nrm=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];l=math.sqrt(sum(v*v for v in nrm)) or 1;norms.extend([[v/l for v in nrm]]*3)
   def attr(data):
    idx=len(g['bufferViews']);raw=struct.pack('<'+'f'*len(data)*3,*[v for p in data for v in p]);g['bufferViews'].append({'buffer':0,'byteOffset':len(b),'byteLength':len(raw),'target':34962});b.extend(raw)
    g['accessors'].append({'bufferView':idx,'componentType':5126,'count':len(data),'type':'VEC3','min':[min(p[k] for p in data) for k in range(3)],'max':[max(p[k] for p in data) for k in range(3)]});return len(g['accessors'])-1
   mesh=len(g['meshes']);g['meshes'].append({'primitives':[{'attributes':{'POSITION':attr(verts),'NORMAL':attr(norms)},'material':mat}]});idx=len(g['nodes']);g['nodes'].append({'name':name,'mesh':mesh});g['scenes'][g.get('scene',0)]['nodes'].append(idx)
  if style=='forest':
   for i,(x,z,h) in enumerate([(-.99,.25,.58),(-.90,-.32,.72),(-.62,-.69,.63),(.34,-.77,.64),(.82,-.46,.72),(.96,.06,.58)]):
    for tier in range(3):cone('Frost forest canopy',x,.11+tier*h*.24,z,.17-tier*.036,h*.55,pine)
    cone('Frost forest snowy tip',x,.11+h*.68,z,.075,h*.35,snow)
   for x,z in [(-.91,.46),(.79,.47),(-.40,-.76),(.98,-.2)]:
    for k in range(3):cone('Glowing crystal garden',x+k*.045,.12,z+k*.025,.035,.16+k*.05,crystal,5)
  elif style=='aurora':
   # Extra mineral terraces frame the original spring without moving the bridge.
   for i in range(10):
    a=i*math.tau/10;cone('Mineral spring terrace',.48+math.cos(a)*.31,.09,.48+math.sin(a)*.23,.07,.065,stone,7,.06)
   for x,z,h in [(-.97,-.20,.4),(.85,-.37,.49),(.42,-.79,.36)]:
    cone('Northern pine',x,.10,z,.16,h,pine);cone('Northern pine snow',x,.10+h*.65,z,.06,h*.37,snow)
  else:
   # Faceted alpine ridge on the rear rim; village remains accessible in front.
   for x,z,r,h in [(-.83,-.55,.23,.56),(-.42,-.79,.25,.77),(.02,-.86,.21,.59),(.50,-.69,.24,.70),(.86,-.42,.18,.48)]:
    cone('Alpine ridge',x,.05,z,r,h,stone,5);cone('Alpine snow peak',x,.05+h*.57,z,r*.43,h*.43,snow,5)
  write(OUT/(style+('-lit' if lit else '')+'.glb'),g,b)
# Matching lightweight star-filled sky artwork.
for style in PALETTES:
 rng=random.Random(42); colors={'forest':('#120e2b','#66517e'),'aurora':('#031722','#104753'),'alpine':('#061028','#263b69')}[style]
 stars=''.join(f'<circle cx="{rng.randrange(1200)}" cy="{rng.randrange(1000)}" r="{rng.uniform(.5,1.7):.1f}" fill="#e5e8ff" opacity="{rng.uniform(.3,.9):.2f}"/>' for _ in range(220))
 special='<circle cx="730" cy="150" r="45" fill="#f2f0dd"/>' if style=='alpine' else '<path d="M730 100a50 50 0 1 0 35 80 44 44 0 0 1-35-80" fill="#eee3ff"/>'
 if style=='aurora':special='<path d="M-100 380 Q180 0 460 260 T1300 100" fill="none" stroke="#52edba" stroke-width="100" opacity=".22" filter="url(#blur)"/><path d="M-100 280 Q180 0 460 200 T1300 50" fill="none" stroke="#9d71e8" stroke-width="55" opacity=".28" filter="url(#blur)"/>'
 (OUT/(style+'-sky.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1000"><defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="{colors[0]}"/><stop offset="1" stop-color="{colors[1]}"/></linearGradient><filter id="blur" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="22"/></filter></defs><path fill="url(#bg)" d="M0 0h1200v1000H0z"/>{special}{stars}</svg>')
print('Generated six world models and three skies.')
