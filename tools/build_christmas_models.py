import bpy, math, random
from pathlib import Path
from mathutils import Vector
random.seed(42)
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'outputs/Fuzzy-V2/app/src/main/assets'
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name,color,glow=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.85
 p.inputs['Emission'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=glow
 return m
snow=mat('Cream snow',(.94,.95,1));rock=mat('Mauve island',(.30,.22,.32));wood=mat('Honey timber',(.45,.23,.12));green=mat('Evergreen',(.08,.28,.19));red=mat('Cranberry',(.65,.12,.17));gold=mat('Golden ribbon',(.98,.65,.21));tan=mat('Capy warm fur',(.57,.34,.18));dark=mat('Cocoa',(.06,.035,.03));light=mat('Warm lights', (1,.65,.19),2.5);pink=mat('Blush gift',(.85,.45,.46));teal=mat('Mint gift',(.25,.58,.46))
def finish(o,name,material):
 o.name=name;o.data.materials.append(material);return o
def cube(name,loc,scale,material):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,name,material)
def ico(name,loc,scale,material,sub=1):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=1,location=loc);o=bpy.context.object;o.scale=scale;return finish(o,name,material)
def cone(name,loc,r1,r2,h,material,verts=10):
 bpy.ops.mesh.primitive_cone_add(vertices=verts,radius1=r1,radius2=r2,depth=h,location=loc);return finish(bpy.context.object,name,material)
def gift(name,loc,s,material):
 x,y,z=loc;cube(name+'Box',(x,y,z+s/2),(s,s,s),material);cube(name+'RibbonA',(x,y,z+s/2),(s*.16,s*1.015,s*1.02),gold);cube(name+'RibbonB',(x,y,z+s/2),(s*1.015,s*.16,s*1.02),gold)
 for dx in [-1,1]:ico(name+'Bow',(x+dx*s*.14,y,z+s*1.06),(s*.19,s*.11,s*.10),gold)
def export(name,objects):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(ASSETS/name),export_format='GLB',use_selection=True,export_yup=True)
cone('Floating island',(0,0,-.20),.13,.58,.47,rock,9)
ico('Snow island',(0,0,.015),(.62,.49,.10),snow,2)
# Cozy cottage at the back left.
cube('Cottage',(-.22,.12,.18),(.28,.24,.29),wood)
for side in [-1,1]:
 o=cube('Snow roof',(-.22+side*.09,.12,.36),(.23,.31,.045),snow);o.rotation_euler[1]=side*math.radians(37)
cube('Chimney',(-.31,.16,.44),(.055,.06,.16),wood)
cube('Door',(-.22,-.006,.135),(.075,.012,.16),dark)
for x in [-.31,-.13]:cube('Golden window',(x,-.008,.23),(.052,.014,.062),light)
# Layered evergreen, snowy tips, and a named light group for interaction.
tx,ty=.24,.12
cone('Tree trunk',(tx,ty,.13),.035,.03,.25,wood)
for z,r in [(.23,.20),(.36,.16),(.48,.115)]:
 cone('Evergreen bough',(tx,ty,z),r,0,.25,green)
 cone('Snow bough',(tx,ty,z+.07),r*.69,0,.14,snow)
lights=bpy.data.objects.new('TreeLights',None);bpy.context.collection.objects.link(lights)
for i in range(21):
 t=i/20;z=.17+t*.39;r=.19*(1-t)+.025;a=i*2.4
 o=ico('Light%02d'%i,(tx+math.cos(a)*r,ty+math.sin(a)*r,z),(.015,.015,.015),light,1);o.parent=lights
star=ico('Star',(tx,ty,.66),(.055,.025,.065),light);star.parent=lights
# A low-poly capybara sits facing the visitor.
ico('Capy body',(.0,-.20,.13),(.12,.15,.12),tan,2)
ico('Capy head',(.0,-.29,.23),(.105,.105,.09),tan,2)
ico('Capy muzzle',(.0,-.365,.205),(.082,.045,.048),tan,2)
for x in [-.065,.065]:
 ico('Capy ear',(x,-.27,.31),(.025,.024,.035),tan,1)
 ico('Capy eye',(x,-.365,.25),(.008,.008,.008),dark,2)
 ico('Capy paw',(x,-.30,.065),(.036,.057,.025),tan,1)
cube('Capy scarf',(0,-.24,.19),(.23,.075,.035),red)
gift('SmallGift',(.40,-.06,.07),.095,red);gift('MintGift',(-.33,-.20,.07),.085,teal)
for i in range(9):ico('Snow stone',(-.24+i*.03,-.11-i*.023,.06),(.025,.025,.013),snow,1)
world=list(bpy.context.scene.objects);export('christmas-world.glb',world)
for o in world:o.hide_render=True
before=set(bpy.context.scene.objects)
gift('Wrapped',(-.0,0,-.12),.30,red)
wrapped=[o for o in bpy.context.scene.objects if o not in before];export('christmas-gift.glb',wrapped)
for o in wrapped:o.hide_render=True
for o in world:o.hide_render=False
# Render a preview from actual model geometry for inspection.
bpy.ops.object.light_add(type='AREA',location=(1,-2,3));bpy.context.object.data.energy=260;bpy.context.object.data.size=4
bpy.ops.object.camera_add(location=(1.2,-2.1,1.25));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.12))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=1.65
scene=bpy.context.scene;scene.camera=cam;scene.render.engine='BLENDER_EEVEE';scene.eevee.use_gtao=True;scene.eevee.gtao_distance=3;scene.eevee.use_soft_shadows=True
scene.world.color=(.5,.4,.5);scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard';scene.view_settings.look='Medium High Contrast';scene.render.filepath=str(ROOT/'outputs/Fuzzy-V2-Christmas-World.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'outputs/Fuzzy-V2/Christmas-World.blend'))
bpy.ops.render.render(write_still=True)
