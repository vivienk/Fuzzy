"""Build Fuzzy's animal-free Christmas village and render its actual geometry."""
import bpy, math, random
from pathlib import Path
from mathutils import Vector
random.seed(42)
ROOT=Path(__file__).resolve().parents[1]; ASSETS=ROOT/'app/src/main/assets'; ART=ROOT/'art'
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(n,c,glow=0):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=.8;p.inputs['Emission'].default_value=(*c,1);p.inputs['Emission Strength'].default_value=glow
 return m
snow=mat('Pearl snow',(.91,.95,1));rock=mat('Lavender slate',(.27,.23,.37));wood=mat('Cedar',(.32,.12,.08));pine=mat('Deep pine',(.035,.20,.16));red=mat('Cranberry',(.59,.055,.1));gold=mat('Champagne gold',(.92,.58,.17));dark=mat('Bronze',(.07,.055,.08));light=mat('Amber glow',(1,.66,.25),1.3);mint=mat('Sage',(.24,.49,.39));ice=mat('Glacier blue',(.33,.66,.78));path=mat('Rose sandstone',(.62,.43,.43));roof=mat('Midnight roof',(.07,.12,.2))
def finish(o,n,m):o.name=n;o.data.materials.append(m);return o
def cube(n,loc,s,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=s;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,n,m)
def ico(n,loc,s,m,sub=1):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=1,location=loc);o=bpy.context.object;o.scale=s;return finish(o,n,m)
def cone(n,loc,r1,r2,h,m,v=12):
 bpy.ops.mesh.primitive_cone_add(vertices=v,radius1=r1,radius2=r2,depth=h,location=loc);return finish(bpy.context.object,n,m)
def bar(n,a,b,r,m):
 mid=(Vector(a)+Vector(b))/2;o=cone(n,mid,r,r,(Vector(b)-Vector(a)).length,m,8);o.rotation_euler=(Vector(b)-Vector(a)).to_track_quat('Z','Y').to_euler();return o
def gift(n,loc,s,m):
 x,y,z=loc;cube(n+' box',(x,y,z+s/2),(s,s,s),m);cube(n+' ribbon A',(x,y,z+s/2),(s*.13,s*1.015,s*1.02),gold);cube(n+' ribbon B',(x,y,z+s/2),(s*1.015,s*.13,s*1.02),gold)
 for d in [-1,1]:ico(n+' bow',(x+d*s*.14,y,z+s*1.06),(s*.19,s*.11,s*.10),gold)
def tree(x,y,s=1,festive=False):
 cone('Pine trunk',(x,y,.11+s*.1),.035*s,.03*s,.23*s,wood)
 for z,r in [(.25,.23),(.40,.18),(.55,.125)]:
  cone('Faceted pine',(x,y,.1+z*s),r*s,0,.31*s,pine)
  cone('Snow cap',(x,y,.1+(z+.10)*s),r*.56*s,0,.14*s,snow)
 if festive:
  for i in range(36):
   t=i/35;z=.23+t*.49;r=.23*(1-t)+.02;a=i*2.4
   o=ico('Tree glow %02d'%i,(x+math.cos(a)*r*s,y+math.sin(a)*r*s,.1+z*s),(.012*s,)*3,light);o.parent=lights
  # Five-point star, standing vertically, faces the visitor.
  verts=[]
  for depth in [-.012,.012]:
   for i in range(10):
    a=math.pi/2+i*math.pi/5;r=.073 if i%2==0 else .032;verts.append((x+math.cos(a)*r*s,y+depth*s,.1+.81*s+math.sin(a)*r*s))
  faces=[tuple(range(9,-1,-1)),tuple(range(10,20))]+[(i,(i+1)%10,(i+1)%10+10,i+10) for i in range(10)]
  mesh=bpy.data.meshes.new('Star mesh');mesh.from_pydata(verts,[],faces);ob=bpy.data.objects.new('Golden star',mesh);bpy.context.collection.objects.link(ob);finish(ob,'Golden star',light);ob.parent=lights
  for i in range(12):
   a=i*2.4;r=.15;ico('Ruby bauble',(x+math.cos(a)*r*s,y+math.sin(a)*r*s,.1+(.3+(i%3)*.12)*s),(.022*s,)*3,red,2)
def cabin(x,y,s=1,m=wood):
 z=.12;cube('Cottage walls',(x,y,z+.18*s),(.38*s,.32*s,.36*s),m)
 for d in [-1,1]:
  o=cube('Slate roof',(x+d*.113*s,y,z+.41*s),(.30*s,.42*s,.035*s),roof);o.rotation_euler[1]=d*math.radians(38)
  o=cube('Roof snow',(x+d*.113*s,y,z+.434*s),(.30*s,.43*s,.024*s),snow);o.rotation_euler[1]=d*math.radians(38)
 cube('Chimney',(x-.12*s,y+.05*s,z+.52*s),(.065*s,.065*s,.20*s),wood)
 cube('Chimney snow',(x-.12*s,y+.05*s,z+.63*s),(.085*s,.085*s,.018*s),snow)
 cube('Door',(x,y-.164*s,z+.11*s),(.09*s,.015*s,.22*s),dark)
 ico('Door handle',(x+.026*s,y-.177*s,z+.10*s),(.008*s,)*3,gold,2)
 for d in [-1,1]:
  wx=x+d*.125*s;wy=y-.168*s;wz=z+.23*s
  cube('Window frame',(wx,wy,wz),(.09*s,.02*s,.105*s),gold);cube('Window glow',(wx,wy-.012*s,wz),(.074*s,.012*s,.087*s),light)
  cube('Window mullion',(wx,wy-.02*s,wz),(.008*s,.015*s,.09*s),wood);cube('Window sill',(wx,wy-.025*s,wz-.06*s),(.11*s,.055*s,.018*s),snow)
 for i in range(3):cube('Porch step',(x,y-.2*s-i*.045*s,z-.012-i*.022*s),(.15*s,.07*s,.045*s),path)
 # Small wreath over the door.
 for i in range(12):
  a=i*math.pi/6;ico('Wreath leaf',(x+math.cos(a)*.045*s,y-.18*s,z+.30*s+math.sin(a)*.045*s),(.017*s,)*3,pine)
 ico('Wreath bow',(x,y-.20*s,z+.257*s),(.028*s,.012*s,.014*s),red)
def lantern(x,y):
 cone('Lantern base',(x,y,.14),.055,.04,.06,dark);bar('Lantern post',(x,y,.14),(x,y,.41),.012,dark)
 cube('Lantern glass',(x,y,.435),(.045,.045,.07),light);cone('Lantern roof',(x,y,.49),.05,0,.055,dark,4)
 for dx in [-.027,.027]:
  for dy in [-.027,.027]:bar('Lantern frame',(x+dx,y+dy,.39),(x+dx,y+dy,.48),.004,gold)
def export(n,objects):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(ASSETS/n),export_format='GLB',use_selection=True,export_yup=True)
# A much wider island, with a terraced rock underside and snowy rim.
cone('Floating island lower',(0,0,-.28),.24,1.02,.62,rock,11)
cone('Floating island terrace',(0,0,-.04),1.02,1.14,.19,rock,13)
ico('Snow plateau',(0,0,.035),(1.16,.94,.115),snow,2)
for i in range(15):
 a=i*math.tau/15;ico('Snow edge',(math.cos(a)*1.00,math.sin(a)*.80,.08),(.17,.13,.06),snow)
lights=bpy.data.objects.new('TreeLights',None);bpy.context.collection.objects.link(lights)
# Three distinct cottages surround the central celebration tree.
cabin(-.56,.20,1.13);cabin(.43,.49,.80,mint);cabin(-.08,.62,.66,red)
tree(.20,.07,1.15,True)
for x,y,s in [(-.88,.07,.60),(-.78,.48,.70),(-.48,.66,.53),(.79,.25,.66),(.72,-.27,.52),(.11,.77,.44)]:tree(x,y,s)
# Winding stepping-stone path and frozen pond.
for i in range(16):
 t=i/15;x=-.50+.49*t+.08*math.sin(t*5);y=.0-.70*t
 cone('Path paver',(x,y,.125),.047,.05,.014,path,7)
for i in range(9):
 t=i/8;cone('Village path',(-.40+.80*t,.29+.05*math.sin(t*5),.125),.038,.041,.014,path,7)
ico('Frozen pond',(.45,-.48,.12),(.26,.18,.018),ice,2)
for i in range(11):
 a=i*math.tau/11;ico('Pond snow rim',(.45+math.cos(a)*.27,-.48+math.sin(a)*.18,.125),(.055,.04,.025),snow)
# Bridge across the narrow end of the pond.
for i in range(7):cube('Bridge plank',(.19+i*.04,-.52,.16+math.sin(i/6*math.pi)*.035),(.037,.16,.025),wood)
for y in [-.61,-.43]:
 for x in [.19,.31,.43]:bar('Bridge post',(x,y,.15),(x,y,.27),.009,wood)
 bar('Bridge rail',(.19,y,.26),(.43,y,.26),.007,gold)
for x,y in [(-.65,-.26),(-.21,-.60),(.65,-.15),(.02,.36)]:lantern(x,y)
# Curved entrance gate and festive light garland.
for x in [-.28,.12]:bar('Entrance post',(x,-.74,.10),(x,-.74,.40),.018,wood)
last=None
for i in range(17):
 t=i/16;pt=(-.28+.40*t,-.74,.40+.16*math.sin(math.pi*t))
 if last:bar('Entrance arch',last,pt,.012,pine)
 if i%2==0:ico('Arch light',pt,(.012,)*3,light)
 last=pt
# Gifts, sleigh, and a brass mailbox; no creatures or mascots.
for n,x,y,s,m in [('Ruby',.01,-.13,.11,red),('Sage',.35,-.10,.085,mint),('Gold',.39,.13,.07,gold),('Porch',-.71,-.03,.075,red)]:gift(n,(x,y,.13),s,m)
for y in [-.38,-.28]:bar('Sleigh runner',(-.79,y,.14),(-.49,y,.14),.012,gold)
cube('Sleigh seat',(-.64,-.33,.20),(.26,.16,.045),red);cube('Sleigh back',(-.76,-.33,.26),(.035,.16,.15),red)
bar('Mailbox post',(-.34,-.68,.10),(-.34,-.68,.30),.014,wood);cube('Mailbox',(-.34,-.68,.34),(.11,.08,.075),red);cube('Letter slot',(-.34,-.724,.35),(.055,.008,.009),dark)
for x,y in [(-.93,-.18),(.89,.02),(-.38,.83)]:
 for j in range(3):ico('Ice crystal',(x+j*.035,y,.1+j*.015),(.025,.025,.09),ice)
world=list(bpy.context.scene.objects);export('christmas-world.glb',world)
for o in world:o.hide_render=True
before=set(bpy.context.scene.objects);gift('Wrapped',(0,0,-.12),.34,red)
wrapped=[o for o in bpy.context.scene.objects if o not in before];export('christmas-gift.glb',wrapped)
for o in wrapped:o.hide_render=True
for o in world:o.hide_render=False
# A studio render of the actual scene, not an AI replacement image.
bpy.ops.object.light_add(type='AREA',location=(1,-3,4));bpy.context.object.data.energy=340;bpy.context.object.data.size=5
bpy.ops.object.light_add(type='AREA',location=(-3,1,2));bpy.context.object.data.energy=170;bpy.context.object.data.color=(.64,.74,1);bpy.context.object.data.size=4
bpy.ops.object.camera_add(location=(1.9,-3.3,2.35));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.18))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.85
scene=bpy.context.scene;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=128;scene.view_layers[0].cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.10,.075,.16,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.7
scene.render.resolution_x=1200;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard';scene.view_settings.look='Medium High Contrast';scene.render.filepath=str(ART/'Fuzzy-V2-Christmas-World0001.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Christmas-World.blend'))
bpy.ops.render.render(write_still=True)
