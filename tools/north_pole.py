"""North Pole diorama details, using the world's GLB primitive helpers."""
import math

def populate(g,box,cone,ball,material,snow,cedar):
 red=material('Santa red',[.48,.07,.07,1]);green=material('Elf evergreen',[.15,.24,.17,1]);gold=material('Workshop brass',[.72,.48,.19,1]);black=material('Boot leather',[.035,.022,.025,1]);white=snow
 skins=[material('Elf skin '+str(i),c) for i,c in enumerate([[.76,.42,.22,1],[.96,.69,.49,1],[.34,.16,.08,1]])]
 fur=material('Reindeer cinnamon',[.38,.17,.07,1])
 # Each moving character is parented around a local pivot; clips are baked into GLB.
 def motion(start,name,pivot,axis='y',amplitude=.12,cycles=1):
  roots=g['scenes'][g.get('scene',0)]['nodes'];children=[i for i in roots if i>=start]
  for i in children:
   t=g['nodes'][i].get('translation',[0,0,0]);g['nodes'][i]['translation']=[t[k]-pivot[k] for k in range(3)]
  idx=len(g['nodes']);g['nodes'].append({'name':name,'translation':list(pivot),'children':children})
  roots[:]=[i for i in roots if i not in children]+[idx]
  g.setdefault('extras',{}).setdefault('lifeTracks',[]).append({'node':idx,'pivot':list(pivot),'axis':axis,'amplitude':amplitude,'cycles':cycles})
  return idx
 # The old spa becomes a gift-making yard; no water or bridge beneath the elves.
 for node in g['nodes']:
  if node.get('name','').startswith(('Frozen pond','Pond snow rim','Bridge','Mineral','Turquoise','Nordic')):node['scale']=[0,0,0]
 soft_palette={'Deep pine':[.035,.20,.075,1],'Sage':[.31,.30,.23,1],'Cranberry':[.48,.07,.07,1],'Cedar':[.34,.22,.14,1],'Champagne gold':[.72,.48,.19,1],'Midnight roof':[.23,.25,.29,1],'Pearl snow':[.92,.93,.95,1],'Lavender slate':[.28,.29,.33,1],'Rose sandstone':[.43,.37,.31,1],'aurora architectural trim':[.31,.32,.23,1],'aurora enchanted accent':[.80,.63,.34,1]}
 for m in g['materials']:
  if m['name'] in soft_palette:
   m['pbrMetallicRoughness']['baseColorFactor']=soft_palette[m['name']]
   if m.get('emissiveFactor'):m['emissiveFactor']=[.15,.10,.035]
 def bar(name,a,b,r,mat):
  delta=[b[i]-a[i] for i in range(3)];length=math.sqrt(sum(v*v for v in delta));box(name,*[(a[i]+b[i])/2 for i in range(3)],r,length,r,mat)
  # Quaternion rotates local +Y to the segment direction.
  v=[d/length for d in delta];q=[v[2],0,-v[0],1+v[1]];n=math.sqrt(sum(x*x for x in q));g['nodes'][-1]['rotation']=[x/n for x in q] if n>1e-8 else [1,0,0,0]
 glyphs={'M':['101','111','111','101','101'],'D':['110','101','101','101','110'],'A':['010','101','111','101','101'],'B':['110','101','110','101','110'],'C':['011','100','100','100','011'],'E':['111','100','110','100','111'],'F':['111','100','110','100','100'],'G':['011','100','101','101','011'],'H':['101','101','111','101','101'],'I':['111','010','010','010','111'],'K':['101','101','110','101','101'],'L':['100','100','100','100','111'],'N':['101','111','111','111','101'],'O':['010','101','101','101','010'],'P':['110','101','110','100','100'],'R':['110','101','110','101','101'],'S':['011','100','010','001','110'],'T':['111','010','010','010','010'],'U':['101','101','101','101','111'],'W':['101','101','111','111','101'],'Y':['101','101','010','010','010'],' ':['000']*5}
 def sign(text,x,y,z,width):
  box(text+' sign board',x,y,z,width,.065,.018,red)
  unit=width/(len(text)*4+2);start=x-len(text)*4*unit/2
  for i,ch in enumerate(text):
   for row,line in enumerate(glyphs[ch]):
    for col,val in enumerate(line):
     if val=='1':box(text+' lettering',start+(i*4+col)*unit,y+(2-row)*unit,z+.011,unit*.85,unit*.85,.003,white)
 def gift(x,y,z,size,wrapped=True):
  box('Gift ready' if wrapped else 'Unwrapped toy box',x,y+size/2,z,size,size,size,red if wrapped else cedar)
  if wrapped:
   box('Golden gift ribbon',x,y+size/2,z,size*.14,size*1.04,size*1.04,gold);box('Gift ribbon cross',x,y+size/2,z,size*1.04,size*1.04,size*.14,gold)
   for dx in [-1,1]:cone('Gift bow',x+dx*size*.15,y+size,z,size*.15,size*.17,gold,5)
 def cane(x,z,h=.29):
  for i in range(10):cone('Candy cane stripe',x,.12+i*h/10,z,.014,h/10,red if i%2 else white,8,.014)
  last=(x,.12+h,z)
  for i in range(1,9):
   a=math.pi*i/8;pt=(x+.04-.04*math.cos(a),.12+h+.04*math.sin(a),z);bar('Candy cane hook',last,pt,.025,red if i%2 else white);last=pt
 # Workshop facade, striped pillars, gable clock and workshop sign.
 sign('SANTA WORKSHOP',-.56,.53,.008,.39)
 for x in [-.77,-.35]:
  for i in range(9):box('Workshop peppermint pillar',x,.14+i*.038,.0,.027,.038,.027,red if i%2 else white)
 cone('Workshop roof brass bell',-.56,.69,-.20,.035,.045,gold,8)
 for x,z in [(-.88,.35),(-.12,.68),(.10,.62),(.91,.12)]:cane(x,z)
 # A striped landmark sign at the front-right corner, readable in 3D.
 for i in range(10):cone('North Pole striped signpost',.75,.12+i*.035,.62,.018,.035,red if i%2 else white,8,.018)
 # Ivory plaque with gold scalloped border, like a traditional North Pole marker.
 ball('North Pole gold plaque',.75,.49,.62,.44,.18,.033,gold)
 ball('North Pole ivory plaque',.75,.49,.643,.41,.155,.025,white)
 for dx in [-.19,.19]:
  for dy in [-.065,.065]:ball('North Pole gold scroll',.75+dx,.49+dy,.65,.05,.05,.025,gold)
 before=len(g['nodes']);sign('NORTH POLE',.75,.49,.659,.34)
 for node in g['nodes'][before:]:
  if node['name']=='NORTH POLE sign board':node['scale']=[0,0,0]
  else:
   for primitive in g['meshes'][node['mesh']]['primitives']:primitive['material']=red
 for dx in [-.025,0,.025]:ball('Sign holly leaf',.75+dx,.545,.675,.04,.025,.008,green)
 ball('Sign holly berry',.75,.541,.681,.014,.014,.01,red)
 cone('North Pole brass base',.75,.12,.62,.055,.035,gold,12,.045)
 ball('North Pole golden finial',.75,.61,.62,.055,.055,.055,gold)
 def elf(x,z,index,pose):
  start=len(g['nodes'])
  skin=skins[index];base=.13
  for dx in [-.024,.024]:
   ball('Elf boots',x+dx,base+.015,z+.012,.029,.03,.055,black);box('Elf leggings',x+dx,base+.06,z,.02,.07,.023,red)
  ball('Elf soft tunic',x,base+.123,z,.105,.095,.075,green)
  box('Elf belt',x,base+.103,z,.085,.015,.062,black);box('Elf buckle',x,base+.103,z+.034,.017,.014,.006,gold)
  ball('Elf rounded face',x,base+.185,z,.078,.068,.066,skin);ball('Elf button nose',x,base+.18,z+.035,.019,.018,.022,skin)
  for dx in [-.04,.04]:cone('Pointed elf ear',x+dx,base+.177,z,.014,.027,skin,4)
  for dx in [-.011,.011]:box('Elf eyes',x+dx,base+.188,z+.03,.005,.005,.004,black)
  cone('Elf hat',x,base+.207,z,.043,.071,green,12);ball('Elf hat pom',x+.012,base+.275,z,.030,.030,.030,gold);ball('Elf hat cuff',x,base+.216,z,.087,.023,.073,gold)
  for side in [-1,1]:
   arm_start=len(g['nodes'])
   shoulder=(x+side*.04,base+.143,z);hand=(x+side*.036,base+(.19 if pose=='carry' else .105),z+.075)
   bar('Elf working arm',shoulder,hand,.019,green);ball('Elf hand',*hand,.021,.021,.021,skin)
   motion(arm_start,'Elf working arm motion',shoulder,'x',.20,2)
  if pose=='carry':gift(x,base+.17,z+.09,.075)
  motion(start,'Elf '+pose+' idle',(x,base,z),'y',.12,1)
 # Stage 1: wooden toy train being assembled.
 for x,z,label in [(.17,.35,'MAKE'),(.46,.51,'WRAP')]:
  box(label+' workbench top',x,.225,z,.22,.025,.13,cedar)
  for dx in [-.085,.085]:
   for dz in [-.04,.04]:box('Workbench leg',x+dx,.175,z+dz,.018,.10,.018,green)
  sign(label,x,.18,z+.075,.15)
 box('Toy train chassis',.17,.255,.35,.12,.025,.04,red);box('Toy train cab',.20,.281,.35,.035,.045,.04,green)
 for x in [.13,.20]:
  for z in [.324,.376]:box('Toy train wheel',x,.245,z,.023,.023,.008,black)
 elf(.16,.25,0,'make')
 # Stage 2: open carton, wrapping paper and finished ribboned present.
 box('Wrapping paper',.46,.241,.51,.17,.003,.10,white);gift(.43,.245,.51,.06,False);gift(.51,.245,.51,.055);elf(.47,.41,1,'wrap')
 # Stage 3: an elf carries a parcel toward the loaded dispatch sleigh.
 elf(-.79,.51,2,'carry');gift(-.67,.23,.33,.07);gift(-.57,.23,.33,.065)
 sign('READY',-.66,.33,.43,.17)
 # Extra elves spread across the expanded island: courier, greeter, and caretaker.
 elf(-1.00,1.00,1,'carry');elf(1.45,.12,2,'greet');elf(-.40,-1.07,0,'carry')
 # Permanent reindeer pair with antlers and red harnesses, beyond the work yard.
 for x,z in [(.71,-.08),(.89,-.06)]:
  animal_start=len(g['nodes'])
  for dx in [-.027,.027]:
   for dz in [-.05,.05]:box('Reindeer leg',x+dx,.175,z+dz,.014,.10,.016,fur)
  box('Reindeer body',x,.245,z,.08,.075,.15,fur);box('Reindeer neck',x,.30,z+.055,.04,.10,.04,fur);box('Reindeer head',x,.35,z+.07,.065,.05,.08,fur)
  box('Reindeer red nose',x,.35,z+.114,.016,.016,.012,red);box('Reindeer harness',x,.25,z,.084,.015,.155,red)
  for side in [-1,1]:
   box('Reindeer ear',x+side*.045,.37,z+.05,.035,.015,.02,fur)
   bar('Reindeer antler',(x+side*.02,.37,z+.05),(x+side*.04,.46,z+.035),.009,gold)
   bar('Reindeer antler tine',(x+side*.03,.42,z+.04),(x+side*.065,.44,z+.045),.007,gold)
   box('Reindeer eye',x+side*.025,.359,z+.112,.007,.007,.003,black)
  motion(animal_start,'Reindeer look around',(x,.14,z),'y',.16,1)

 # Puffy snow along the workshop eaves softens its storybook silhouette.
 for x,z,k in [(-.56,-.20,1.13),(.43,-.49,.80),(-.08,-.62,.66)]:
  for dx in [-.23,.23]:
   for j in range(5):ball('Soft snowy cottage eave',x+dx*k,.12+.36*k,z+(-.17+j*.085)*k,.10*k,.065*k,.115*k,white)
 # Three igloos on the newly expanded snowfield, made from curved courses of blocks.
 ice=material('Igloo pale blue ice',[.60,.77,.86,1]);brick=material('Igloo pearl blocks',[.81,.88,.92,1])
 for x,z,r in [(-1.35,.87,.36),(1.30,.91,.39),(.96,-.93,.34)]:
  ball('Igloo continuous ice dome',x,.11,z,r*1.94,r*1.94,r*1.94,ice)
  for row in range(5):
   latitude=(row+.4)/5*math.pi/2;rr=r*math.cos(latitude);count=max(5,round(16*math.cos(latitude)))
   for j in range(count):
    a=j*math.tau/count+(row%2)*math.pi/count
    if row<2 and abs(math.sin(a)-1)<.16:continue
    box('Igloo snow brick',x+rr*math.cos(a),.11+r*math.sin(latitude),z+rr*math.sin(a),rr*math.tau/count*.90,r*.27,.065,brick)
    angle=math.pi/2-a;g['nodes'][-1]['rotation']=[0,math.sin(angle/2),0,math.cos(angle/2)]
  ball('Igloo snow crown',x,.11+r,z,.13,.055,.13,white)
  box('Igloo dark doorway',x,.18,z+r+.10,.13,.14,.025,black)
  for side in [-1,1]:box('Igloo tunnel wall',x+side*.085,.17,z+r,.055,.15,.19,white)
  ball('Igloo tunnel roof',x,.26,z+r,.23,.08,.20,white)
 # A pair of broad-antlered moose browsing beside the snowy grove.
 for x,z in [(-1.30,-.36),(-1.55,-.06)]:
  animal_start=len(g['nodes'])
  for dx in [-.055,.055]:
   for dz in [-.09,.09]:ball('Moose leg',x+dx,.21,z+dz,.036,.23,.044,fur)
  ball('Moose round body',x,.35,z,.19,.20,.30,fur);ball('Moose shoulder',x,.41,z+.07,.16,.20,.16,fur)
  ball('Moose head',x,.49,z+.14,.13,.16,.15,fur);ball('Moose muzzle',x,.445,z+.23,.12,.085,.13,fur)
  for side in [-1,1]:
   ball('Moose ear',x+side*.095,.53,z+.10,.10,.035,.05,fur)
   bar('Moose antler stem',(x+side*.045,.55,z+.12),(x+side*.15,.63,z+.10),.02,gold)
   ball('Moose broad antler',x+side*.16,.64,z+.10,.12,.035,.15,gold)
   for j in range(4):cone('Moose antler tine',x+side*(.13+j*.023),.64,z+.04+j*.033,.012,.055,gold,6)
   ball('Moose eye',x+side*.055,.50,z+.20,.012,.012,.008,black)
  motion(animal_start,'Moose gentle sway',(x,.13,z),'y',.10,1)
 bear_white=material('Polar bear warm ivory',[.86,.84,.78,1])
 # A gentle polar bear and cub on the front snowbank.
 for x,z,k in [(.31,1.14,1),(.66,1.20,.60)]:
  animal_start=len(g['nodes'])
  for dx in [-.07,.07]:
   for dz in [-.10,.10]:ball('Polar bear paw',x+dx*k,.17,z+dz*k,.09*k,.13*k,.11*k,bear_white)
  ball('Polar bear body',x,.22+.07*k,z,.26*k,.24*k,.39*k,bear_white)
  ball('Polar bear head',x,.22+.13*k,z+.22*k,.23*k,.21*k,.21*k,bear_white)
  ball('Polar bear muzzle',x,.22+.10*k,z+.31*k,.12*k,.08*k,.10*k,bear_white)
  ball('Polar bear nose',x,.22+.11*k,z+.365*k,.045*k,.033*k,.025*k,black)
  for side in [-1,1]:
   ball('Polar bear ear',x+side*.065*k,.22+.215*k,z+.19*k,.055*k,.055*k,.035*k,bear_white)
   ball('Polar bear eye',x+side*.055*k,.22+.15*k,z+.30*k,.018*k,.018*k,.012*k,black)
   ball('Polar bear rosy cheek',x+side*.077*k,.22+.12*k,z+.302*k,.027*k,.018*k,.012*k,skins[1])
  # Soft red Santa hat with white cuff and a pompom.
  cone('Polar bear Santa hat',x,.22+.22*k,z+.22*k,.105*k,.17*k,red,16)
  ball('Polar bear fluffy hat cuff',x,.22+.23*k,z+.22*k,.23*k,.047*k,.21*k,white)
  ball('Polar bear hat pompom',x+.025*k,.22+.39*k,z+.22*k,.063*k,.063*k,.063*k,white)
  motion(animal_start,'Polar bear happy bob',(x,.13,z),'bob',.012*k,2)
 # A quiet stepping-stone trail connects the expanded island instead of enlarging props.
 for i in range(17):
  a=.2+i*math.pi/12
  ball('Outer snowy path',math.cos(a)*1.1,.135,math.sin(a)*.83,.085,.018,.075,cedar)
