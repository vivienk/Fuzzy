"""Export world-space anchors for decorative browser light halos from the GLB."""
from pathlib import Path
import json, struct, math
root=Path(__file__).resolve().parents[1]
b=(root/'prototype/web/assets/world.glb').read_bytes();g=json.loads(b[20:20+struct.unpack_from('<I',b,12)[0]])
def mul(a,b):return [[sum(a[i][k]*b[k][j] for k in range(4)) for j in range(4)] for i in range(4)]
identity=[[int(i==j) for j in range(4)] for i in range(4)]
def matrix(n):
 if 'matrix' in n:return [[n['matrix'][j*4+i] for j in range(4)] for i in range(4)]
 x,y,z,w=n.get('rotation',[0,0,0,1]);s=n.get('scale',[1,1,1]);t=n.get('translation',[0,0,0])
 r=[[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]]
 return [[r[i][j]*s[j] for j in range(3)]+[t[i]] for i in range(3)]+[[0,0,0,1]]
lights=[];atmosphere=[]
def walk(i,parent,tree=False):
 n=g['nodes'][i];m=mul(parent,matrix(n));name=n.get('name','');tree=tree or name=='TreeLights'
 if any(name.startswith(v) for v in ['Tree glow','Golden star','Window glow','Lantern glass','Arch light','Chimney snow','Frozen pond']):
  acc=[g['accessors'][p['attributes']['POSITION']] for p in g['meshes'][n['mesh']]['primitives']]
  center=[(min(a['min'][j] for a in acc)+max(a['max'][j] for a in acc))/2 for j in range(3)]+[1]
  pos=[sum(m[j][k]*center[k] for k in range(4)) for j in range(3)]
  if name.startswith(('Chimney snow','Frozen pond')):
   pos[1]+=.018
   atmosphere.append(dict(name=name,position=pos,kind='smoke' if name.startswith('Chimney') else 'steam'))
  normal=[pos[0],.25,pos[2]];l=math.sqrt(sum(v*v for v in normal));normal=[v/l for v in normal]
  if name.startswith('Window'):normal=[0,0,1]
  if not name.startswith(('Chimney snow','Frozen pond')):lights.append(dict(name=name,position=pos,normal=normal,tree=tree,kind='star' if name=='Golden star' else 'window' if name.startswith('Window') else 'lantern' if name.startswith('Lantern') else 'bulb'))
 for c in n.get('children',[]):walk(c,m,tree)
for i in g['scenes'][g.get('scene',0)]['nodes']:walk(i,identity)
(root/'prototype/web/assets/light-anchors.js').write_text('window.FUZZY_LIGHTS='+json.dumps(lights,separators=(',',':'))+';\nwindow.FUZZY_ATMOSPHERE='+json.dumps(atmosphere,separators=(',',':'))+';\n')
print(f'{len(lights)} anchored light effects')
