"""North Pole diorama details, using the world's GLB primitive helpers."""
import math

def populate(g,box,cone,material,snow,cedar):
 red=material('Santa red',[.65,.025,.055,1]);green=material('Elf evergreen',[.035,.25,.12,1]);gold=material('Workshop brass',[.95,.57,.12,1]);black=material('Boot leather',[.035,.022,.025,1]);white=snow
 skins=[material('Elf skin '+str(i),c) for i,c in enumerate([[.76,.42,.22,1],[.96,.69,.49,1],[.34,.16,.08,1]])]
 fur=material('Reindeer cinnamon',[.38,.17,.07,1])
 # The old spa becomes a gift-making yard; no water or bridge beneath the elves.
 for node in g['nodes']:
  if node.get('name','').startswith(('Frozen pond','Pond snow rim','Bridge','Mineral','Turquoise','Nordic')):node['scale']=[0,0,0]
 for m in g['materials']:
  if m['name'] in ['Cranberry','Sage']:m['pbrMetallicRoughness']['baseColorFactor']=[.65,.025,.055,1] if m['name']=='Cranberry' else [.035,.25,.12,1]
  if m['name']=='Champagne gold':m['pbrMetallicRoughness']['baseColorFactor']=[.95,.57,.12,1]
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
 sign('NORTH POLE',.75,.49,.62,.32);cone('North Pole golden finial',.75,.53,.62,.025,.045,gold,8)
 def elf(x,z,index,pose):
  skin=skins[index];base=.13
  for dx in [-.024,.024]:
   box('Elf boots',x+dx,base+.015,z+.012,.029,.03,.055,black);box('Elf leggings',x+dx,base+.06,z,.02,.07,.023,red)
  cone('Elf green tunic',x,base+.085,z,.048,.07,green,6,.035)
  box('Elf belt',x,base+.103,z,.085,.015,.062,black);box('Elf buckle',x,base+.103,z+.034,.017,.014,.006,gold)
  cone('Elf face',x,base+.16,z,.031,.045,skin,8,.029)
  for dx in [-.04,.04]:cone('Pointed elf ear',x+dx,base+.177,z,.014,.027,skin,4)
  for dx in [-.011,.011]:box('Elf eyes',x+dx,base+.188,z+.03,.005,.005,.004,black)
  cone('Elf hat',x,base+.207,z,.038,.071,green,6);cone('Elf hat pom',x,base+.275,z,.013,.019,gold,6)
  for side in [-1,1]:
   shoulder=(x+side*.04,base+.143,z);hand=(x+side*.036,base+(.19 if pose=='carry' else .105),z+.075)
   bar('Elf working arm',shoulder,hand,.019,green);box('Elf hand',*hand,.021,.021,.021,skin)
  if pose=='carry':gift(x,base+.17,z+.09,.075)
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
 # Permanent reindeer pair with antlers and red harnesses, beyond the work yard.
 for x,z in [(.71,-.08),(.89,-.06)]:
  for dx in [-.027,.027]:
   for dz in [-.05,.05]:box('Reindeer leg',x+dx,.175,z+dz,.014,.10,.016,fur)
  box('Reindeer body',x,.245,z,.08,.075,.15,fur);box('Reindeer neck',x,.30,z+.055,.04,.10,.04,fur);box('Reindeer head',x,.35,z+.07,.065,.05,.08,fur)
  box('Reindeer red nose',x,.35,z+.114,.016,.016,.012,red);box('Reindeer harness',x,.25,z,.084,.015,.155,red)
  for side in [-1,1]:
   box('Reindeer ear',x+side*.045,.37,z+.05,.035,.015,.02,fur)
   bar('Reindeer antler',(x+side*.02,.37,z+.05),(x+side*.04,.46,z+.035),.009,gold)
   bar('Reindeer antler tine',(x+side*.03,.42,z+.04),(x+side*.065,.44,z+.045),.007,gold)
   box('Reindeer eye',x+side*.025,.359,z+.112,.007,.007,.003,black)
