"""Derive three interactive low-poly worlds without changing mailbox/effect anchors."""
import json,struct,math,random,copy
from north_pole import populate
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'prototype/web/assets/worlds'; OUT.mkdir(exist_ok=True)
PALETTES={
 'forest':{'Deep pine':[.32,.29,.60,1],'Cedar':[.23,.12,.24,1],'Sage':[.36,.28,.49,1],'Cranberry':[.54,.16,.38,1],'Lavender slate':[.23,.14,.36,1],'Pearl snow':[.87,.86,1,1],'Glacier blue':[.48,.55,.95,1],'Rose sandstone':[.48,.36,.60,1]},
 'aurora':{'Deep pine':[.04,.33,.30,1],'Cedar':[.30,.16,.10,1],'Sage':[.10,.42,.35,1],'Lavender slate':[.12,.24,.30,1],'Glacier blue':[.06,.73,.64,1],'Pearl snow':[.84,.98,.97,1]},
 'alpine':{'Deep pine':[.05,.18,.27,1],'Cedar':[.42,.19,.10,1],'Sage':[.35,.22,.17,1],'Lavender slate':[.18,.23,.36,1],'Glacier blue':[.24,.50,.79,1],'Pearl snow':[.94,.97,1,1]}}
PALETTES['forest'].update({'Champagne gold':[.75,.64,.94,1],'Bronze':[.16,.09,.25,1],'Midnight roof':[.25,.14,.42,1]})
PALETTES['aurora'].update({'Cranberry':[.045,.42,.38,1],'Champagne gold':[.72,.85,.72,1],'Bronze':[.06,.19,.20,1],'Midnight roof':[.05,.23,.25,1],'Rose sandstone':[.28,.43,.42,1]})
PALETTES['alpine'].update({'Cranberry':[.64,.045,.08,1],'Champagne gold':[.96,.58,.18,1],'Bronze':[.14,.09,.07,1],'Midnight roof':[.13,.20,.32,1],'Rose sandstone':[.52,.37,.30,1]})
def read(path):
 b=path.read_bytes();n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);return g,bytearray(b[28+n:])
def write(path,g,b):
 g['buffers'][0]['byteLength']=len(b);j=json.dumps(g,separators=(',',':')).encode();j+=b' '*((-len(j))%4)
 path.write_bytes(struct.pack('<III',0x46546c67,2,28+len(j)+len(b))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(b),0x004e4942)+b)
for style,palette in PALETTES.items():
 for lit in [False,True]:
  g,b=read(ROOT/'prototype/web/assets'/('world.glb' if lit else 'world-unlit.glb'))
  # Double the terrain width/depth only, retaining the scale of buildings and props.
  for node in g['nodes']:
   if node.get('name','').startswith(('Floating island','Snow plateau','Snow edge')):
    scale=node.get('scale',[1,1,1]);node['scale']=[scale[0]*2,scale[1],scale[2]*2]
    t=node.get('translation',[0,0,0]);node['translation']=[t[0]*2,t[1],t[2]*2]
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
  # World-specific architecture, mailbox trims, railings and festive ornaments.
  trim=material(style+' architectural trim',{'forest':[.68,.49,.87,1],'aurora':[.19,.59,.51,1],'alpine':[.21,.10,.055,1]}[style])
  accent=material(style+' enchanted accent',{'forest':[.74,.48,1,1],'aurora':[.26,.94,.80,1],'alpine':[1,.67,.24,1]}[style],True)
  cedar=next(i for i,m in enumerate(g['materials']) if m['name']=='Cedar')
  # Reuse a unit cube mesh with scale derived from its real accessor bounds.
  template=next(n for n in g['nodes'] if n.get('name')=='Cottage walls')
  source_mesh=g['meshes'][template['mesh']]
  bounds=g['accessors'][source_mesh['primitives'][0]['attributes']['POSITION']]
  dimensions=[hi-lo for lo,hi in zip(bounds['min'],bounds['max'])]
  def box(name,x,y,z,w,h,d,mat):
   mesh=copy.deepcopy(source_mesh)
   for primitive in mesh['primitives']:primitive['material']=mat
   mesh_id=len(g['meshes']);g['meshes'].append(mesh)
   idx=len(g['nodes']);g['nodes'].append({'name':name,'mesh':mesh_id,'translation':[x,y,z],'scale':[w/dimensions[0],h/dimensions[1],d/dimensions[2]]});g['scenes'][g.get('scene',0)]['nodes'].append(idx)
  # Shared rounded geometry for storybook characters, snow and sign trim.
  positions=[];normals=[]
  def point(i,j):
   a=i*math.pi/10;c=j*math.tau/16
   return [math.sin(a)*math.cos(c),math.cos(a),math.sin(a)*math.sin(c)]
  for i in range(10):
   for j in range(16):
    for v in [point(i,j),point(i+1,j+1),point(i+1,j),point(i,j),point(i,j+1),point(i+1,j+1)]:positions.extend(v);normals.extend(v)
  def sphere_attr(values):
   raw=struct.pack('<'+'f'*len(values),*values);view=len(g['bufferViews']);g['bufferViews'].append({'buffer':0,'byteOffset':len(b),'byteLength':len(raw),'target':34962});b.extend(raw)
   g['accessors'].append({'bufferView':view,'componentType':5126,'count':len(values)//3,'type':'VEC3','min':[-1,-1,-1],'max':[1,1,1]});return len(g['accessors'])-1
  sphere_mesh={'primitives':[{'attributes':{'POSITION':sphere_attr(positions),'NORMAL':sphere_attr(normals)},'material':snow}]};sphere_dims=[2,2,2]
  def ball(name,x,y,z,w,h,d,mat):
   mesh=copy.deepcopy(sphere_mesh)
   for primitive in mesh['primitives']:primitive['material']=mat
   idx=len(g['meshes']);g['meshes'].append(mesh);node=len(g['nodes'])
   g['nodes'].append({'name':name,'mesh':idx,'translation':[x,y,z],'scale':[w/sphere_dims[0],h/sphere_dims[1],d/sphere_dims[2]]});g['scenes'][g.get('scene',0)]['nodes'].append(node)
  # Surrounding snowbanks and a ring of trees make the expanded terrain explorable.
  for i in range(18):
   a=i*math.tau/18;ball('Outer soft snowbank',math.cos(a)*1.90,.07,math.sin(a)*1.50,.32,.14,.23,snow)
  for x,z,k in [(-1.65,-.55,.80),(-1.20,-1.18,.72),(-.53,-1.30,.62),(.37,-1.32,.85),(1.12,-1.05,.75),(1.72,-.50,.65),(-1.75,.39,.60),(1.75,.38,.60)]:
   if style=='aurora' and x==1.12:continue
   for tier in range(3):
    cone('Outer winter pine',x,.12+tier*.19*k,z,(.23-tier*.045)*k,.37*k,pine)
    cone('Outer thick snow cap',x,.12+(tier*.19+.16)*k,z,(.17-tier*.035)*k,.22*k,snow)
  cabins=[(-.56,-.20,1.13),(.43,-.49,.80),(-.08,-.62,.66)]
  if style=='forest':
   # Replace the ordinary pitched roofs with pointed fairy-cottage crystal roofs.
   for node in g['nodes']:
    if node.get('name','').startswith(('Slate roof','Roof snow')):node['scale']=[0,0,0]
   for x,z,k in cabins:
    cone('Fairy cottage crystal roof',x,.12+.34*k,z,.30*k,.32*k,trim,6)
    cone('Fairy cottage frosted crown',x,.12+.56*k,z,.095*k,.12*k,snow,6)
    cone('Cottage crystal finial',x,.12+.68*k,z,.025*k,.075*k,accent,5)
    # Small glowing crystals beside each doorway.
    for dx in [-.10,.10]:cone('Doorway wishing crystal',x+dx*k,.12,z+.22*k,.021*k,.10*k,accent,5)
   cone('Crystal mailbox canopy',-.34,.378,.68,.085,.075,trim,6)
   cone('Mailbox crystal seal',-.34,.337,.728,.019,.037,accent,5)
   for x in [.19,.31,.43]:cone('Crystal bridge finial',x,.27,.61,.014,.065,accent,5)
  elif style=='aurora':
   # Cedar log fronts and side walls give the cabins a Nordic spa character.
   for x,z,k in cabins:
    for row in range(6):
     y=.15+row*.05*k
     for dx in [-.15,.15]:box('Nordic cedar front log',x+dx*k,y,z+.164*k,.065*k,.017*k,.025*k,cedar)
     box('Nordic cedar side log',x+.195*k,y,z,.022*k,.017*k,.32*k,cedar)
    box('Nordic turquoise lintel',x,.12+.345*k,z+.175*k,.39*k,.025*k,.03*k,trim)
   box('Cedar mailbox lid',-.34,.385,.68,.14,.022,.11,cedar)
   box('Turquoise mailbox stripe',-.34,.34,.724,.09,.014,.008,accent)
   for x in [.19,.31,.43]:cone('Mineral bridge lantern',x,.27,.61,.019,.047,accent,6,.016)
  else:
   # Chalet beams, window shutters and balconies, with traditional red/gold trim.
   for x,z,k in cabins:
    for dx in [-.18,0,.18]:box('Chalet timber upright',x+dx*k,.12+.19*k,z+.168*k,.017*k,.36*k,.025*k,trim)
    for y in [.14,.42]:box('Chalet timber crossbeam',x,y*k+.04,z+.17*k,.39*k,.02*k,.026*k,trim)
    for dx in [-.125,.125]:
     for side in [-1,1]:box('Alpine window shutter',x+(dx+side*.055)*k,.12+.23*k,z+.185*k,.025*k,.10*k,.022*k,trim)
    box('Chalet balcony ledge',x,.15,z+.24*k,.35*k,.025*k,.12*k,cedar)
   box('Alpine mailbox snow cap',-.34,.39,.68,.15,.028,.12,snow)
   for dx in [-.038,.038]:box('Alpine mailbox brass trim',-.34+dx,.34,.724,.009,.065,.008,accent)
   for x in [.19,.31,.43]:cone('Brass bridge finial',x,.27,.61,.017,.035,accent,8)
  # Individual hanging ornaments and gift seals adopt the world motif.
  for i in range(12):
   a=i*2.4;r=.15*1.15;y=.1+(.3+(i%3)*.12)*1.15
   x=.20+math.cos(a)*r;z=-.07-math.sin(a)*r
   cone(style+' tree ornament',x,y-.025,z,.021,.05,accent,5 if style=='forest' else 8)
  for x,z,size in [(.01,.13,.11),(.35,.10,.085),(.39,-.13,.07),(-.71,.03,.075)]:
   cone(style+' gift seal',x,.13+size*1.14,z,size*.16,size*.27,accent,5 if style=='forest' else 8)
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
  if style=='aurora':populate(g,box,cone,ball,material,snow,cedar)
  # A continuous low-poly snow blanket covers the full enlarged terrain.
  blanket=material('Moonlit snow blanket',[.58,.65,.74,1])
  cone('Full island snow blanket',0,.025,0,1,.085,blanket,64,1)
  g['nodes'][-1]['scale']=[2.48,1,1.98]
  cone('Continuous snow surface',0,.112,0,1,0,blanket,64)
  g['nodes'][-1]['scale']=[2.48,1,1.98]
  for m in g['materials']:
   if m['name']=='Pearl snow':m['pbrMetallicRoughness']['baseColorFactor']=[.68,.73,.81,1]

  # Enlarge complete houses around their ground pivots, including themed trim.
  house_prefixes=('Wreath','Porch','Cottage','Slate roof','Roof snow','Chimney','Door','Window','Fairy cottage','Nordic cedar','Nordic turquoise lintel','Chalet','Alpine window','Soft snowy cottage','Workshop peppermint','Workshop roof','SANTA WORKSHOP')
  roots=g['scenes'][g.get('scene',0)]['nodes']; groups=[[],[],[]]
  pivots=[[-.56,.12,-.20],[.43,.12,-.49],[-.08,.12,-.62]]
  shifts=[[-.12,0,-.10],[.12,0,-.10],[0,0,-.20]]
  for idx in list(roots):
   node=g['nodes'][idx]
   if not node.get('name','').startswith(house_prefixes):continue
   pos=node.get('translation')
   if pos is None:
    acc=g['accessors'][g['meshes'][node['mesh']]['primitives'][0]['attributes']['POSITION']]
    pos=[(a+b)/2 for a,b in zip(acc['min'],acc['max'])]
   j=min(range(3),key=lambda j:(pos[0]-pivots[j][0])**2+(pos[2]-pivots[j][2])**2)
   t=node.get('translation',[0,0,0]);node['translation']=[t[k]-pivots[j][k] for k in range(3)];groups[j].append(idx)
  for j,children in enumerate(groups):
   idx=len(g['nodes']);g['nodes'].append({'name':'Enlarged house '+str(j),'translation':[pivots[j][k]+shifts[j][k] for k in range(3)],'scale':[1.35]*3,'children':children})
   roots[:]=[i for i in roots if i not in children]+[idx]
  tracks=g.get('extras',{}).pop('lifeTracks',[])
  animal_names=('Reindeer look around','Moose gentle sway','Polar bear happy bob')
  animals=[(i,n) for i,n in enumerate(g['nodes']) if n.get('name') in animal_names]
  tracks=[t for t in tracks if t['node'] not in {i for i,n in animals}]
  for track in tracks:track['cycles']*=30  # Preserve elf gesture pace over the 960-second shared loop.
  for j,(idx,node) in enumerate(animals):
   laps=[12,10,8,6,5,4][j]  # Individual laps take 80, 96, 120, 160, 192, 240 seconds.
   tracks.append({'node':idx,'axis':'route','laps':laps,'offset':j*math.tau/6,'direction':1 if j%2==0 else -1,'pivot':[0,.13,0]})
   legs=[c for c in node['children'] if g['nodes'][c].get('name') in ('Reindeer leg','Moose leg','Polar bear paw')]
   for k,leg in enumerate(legs):tracks.append({'node':leg,'axis':'x','pivot':[0,0,0],'amplitude':.32,'cycles':24*laps,'phase':math.pi if k in (1,2) else 0})
  if tracks:
   def animation_accessor(values,dimension):
    flat=[v for row in values for v in row];raw=struct.pack('<'+'f'*len(flat),*flat);view=len(g['bufferViews'])
    g['bufferViews'].append({'buffer':0,'byteOffset':len(b),'byteLength':len(raw)});b.extend(raw)
    item={'bufferView':view,'componentType':5126,'count':len(values),'type':{1:'SCALAR',3:'VEC3',4:'VEC4'}[dimension]}
    if dimension==1:item.update(min=[min(flat)],max=[max(flat)])
    g['accessors'].append(item);return len(g['accessors'])-1
   times=animation_accessor([[i/4] for i in range(3841)],1);clip={'name':'North Pole life','samplers':[],'channels':[]}
   for track in tracks:
    if track['axis']=='route':
     positions=[];rotations=[]
     for i in range(3841):
      a=track['offset']+track['direction']*i/3840*math.tau*track['laps']
      positions.append([2.04*math.cos(a),.13,1.60*math.sin(a)])
      yaw=math.atan2(-2.04*math.sin(a)*track['direction'],1.60*math.cos(a)*track['direction'])
      q=[0,math.sin(yaw/2),0,math.cos(yaw/2)]
      if rotations and sum(x*y for x,y in zip(q,rotations[-1]))<0:q=[-v for v in q]
      rotations.append(q)
     g['nodes'][track['node']]['translation']=positions[0];g['nodes'][track['node']]['rotation']=rotations[0]
     for values,channel,dimension in [(positions,'translation',3),(rotations,'rotation',4)]:
      sampler=len(clip['samplers']);clip['samplers'].append({'input':times,'output':animation_accessor(values,dimension),'interpolation':'LINEAR'});clip['channels'].append({'sampler':sampler,'target':{'node':track['node'],'path':channel}})
     continue
    values=[]
    for i in range(3841):
     angle=track['amplitude']*math.sin(i/3840*math.tau*track['cycles']+track.get('phase',0))
     if track['axis']=='bob':values.append([track['pivot'][0],track['pivot'][1]+abs(angle),track['pivot'][2]])
     else:
      q=[0,0,0,math.cos(angle/2)];q[{'x':0,'y':1,'z':2}[track['axis']]]=math.sin(angle/2);values.append(q)
    channel='translation' if track['axis']=='bob' else 'rotation'
    sampler=len(clip['samplers']);clip['samplers'].append({'input':times,'output':animation_accessor(values,3 if channel=='translation' else 4),'interpolation':'LINEAR'})
    clip['channels'].append({'sampler':sampler,'target':{'node':track['node'],'path':channel}})
   g['animations']=[clip]
  write(OUT/(style+('-lit' if lit else '')+'.glb'),g,b)
# Matching lightweight star-filled sky artwork.
for style in PALETTES:
 rng=random.Random(42); colors={'forest':('#120e2b','#66517e'),'aurora':('#031722','#104753'),'alpine':('#061028','#263b69')}[style]
 stars=''.join(f'<circle cx="{rng.randrange(1200)}" cy="{rng.randrange(1000)}" r="{rng.uniform(.5,1.7):.1f}" fill="#e5e8ff" opacity="{rng.uniform(.3,.9):.2f}"/>' for _ in range(220))
 special='<circle cx="730" cy="150" r="45" fill="#f2f0dd"/>' if style=='alpine' else '<path d="M730 100a50 50 0 1 0 35 80 44 44 0 0 1-35-80" fill="#eee3ff"/>'
 if style=='aurora':special='<path d="M-100 380 Q180 0 460 260 T1300 100" fill="none" stroke="#52edba" stroke-width="100" opacity=".22" filter="url(#blur)"/><path d="M-100 280 Q180 0 460 200 T1300 50" fill="none" stroke="#9d71e8" stroke-width="55" opacity=".28" filter="url(#blur)"/>'
 (OUT/(style+'-sky.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1000"><defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="{colors[0]}"/><stop offset="1" stop-color="{colors[1]}"/></linearGradient><filter id="blur" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="22"/></filter></defs><path fill="url(#bg)" d="M0 0h1200v1000H0z"/>{special}{stars}</svg>')
print('Generated six world models and three skies.')
