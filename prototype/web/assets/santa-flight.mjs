// Add the flight as native glTF nodes so orbit, zoom and animation share one camera.
export async function animateVillage(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Village model unavailable');
  const file = await response.arrayBuffer();
  const header = new DataView(file);
  const jsonSize = header.getUint32(12, true);
  const model = JSON.parse(new TextDecoder().decode(new Uint8Array(file, 20, jsonSize)));
  const binStart = 28 + jsonSize;
  const scene = model.scenes[model.scene || 0];
  const low = [Infinity, Infinity, Infinity], high = low.map(() => -Infinity);
  function measure(index, parent) {
    const n = model.nodes[index];
    let matrix = n.matrix ? new DOMMatrix(n.matrix) : new DOMMatrix();
    if (!n.matrix) {
      matrix.translateSelf(...(n.translation || [0,0,0]));
      const [x,y,z,w] = n.rotation || [0,0,0,1];
      if (Math.hypot(x,y,z) > 0) matrix.rotateAxisAngleSelf(x,y,z,2*Math.acos(Math.max(-1,Math.min(1,w)))*180/Math.PI);
      matrix.scaleSelf(...(n.scale || [1,1,1]));
    }
    matrix = parent.multiply(matrix);
    for (const prim of model.meshes?.[n.mesh]?.primitives || []) {
      const a = model.accessors[prim.attributes.POSITION];
      for (let k=0;k<8;k++) {
        const p = matrix.transformPoint(new DOMPoint(...low.map((_,i)=>(k & (1<<i) ? a.max : a.min)[i])));
        [p.x,p.y,p.z].forEach((v,i)=>{low[i]=Math.min(low[i],v);high[i]=Math.max(high[i],v);});
      }
    }
    for (const child of n.children || []) measure(child,matrix);
  }
  scene.nodes.forEach(i=>measure(i,new DOMMatrix()));
  const chunks = [new Uint8Array(file,binStart,header.getUint32(binStart-8,true))];
  let bytes = chunks[0].length;
  function floats(values, type, bounds={}) {
    const data = new Float32Array(values.flat());
    const view = model.bufferViews.push({buffer:0,byteOffset:bytes,byteLength:data.byteLength})-1;
    chunks.push(data); bytes += data.byteLength;
    return model.accessors.push({bufferView:view,componentType:5126,count:values.length,type,...bounds})-1;
  }
  const nodes = model.nodes;
  function node(name, parent, props={}) {
    const id = nodes.push({name,...props})-1;
    parent.push(id); return id;
  }
  const palette = {};
  for (const [name,rgb] of Object.entries({berry:[.39,.035,.035],oak:[.30,.135,.054],cream:[.91,.77,.57],gold:[.72,.45,.14],hoof:[.076,.044,.035],pine:[.07,.22,.14]}))
    palette[name] = model.materials.push({name,pbrMetallicRoughness:{baseColorFactor:[...rgb,1],metallicFactor:0,roughnessFactor:1},doubleSided:true})-1;
  // An elongated faceted solid is reused for carving, runners, limbs and antlers.
  const positions=[], normals=[];
  function vertex(i,j) {
    const v=Math.PI*i/6,u=Math.PI*j/5;
    return [Math.sin(v)*Math.cos(u),Math.cos(v),Math.sin(v)*Math.sin(u)];
  }
  for(let i=0;i<6;i++) for(let j=0;j<10;j++){
    const a=vertex(i,j),b=vertex(i+1,j),c=vertex(i+1,j+1),d=vertex(i,j+1);
    for(const tri of [[a,c,b],[a,d,c]]){
      const u=tri[1].map((v,k)=>v-tri[0][k]),v=tri[2].map((p,k)=>p-tri[0][k]);
      const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      const len=Math.hypot(...n); if(len<1e-7)continue;
      positions.push(...tri); normals.push(...tri.map(()=>n.map(p=>p/len)));
    }
  }
  const attrs={POSITION:floats(positions,'VEC3',{min:[-1,-1,-1],max:[1,1,1]}),NORMAL:floats(normals,'VEC3')};
  const meshes=Object.fromEntries(Object.entries(palette).map(([name,material])=>[name,model.meshes.push({primitives:[{attributes:attrs,material}]})-1]));
  const width=Math.max(high[0]-low[0],high[2]-low[2]);
  const scale=width*.055, children=[];
  const flight=node('Santa and reindeer flight',scene.nodes,{scale:[scale,scale,scale],children});
  function part(name,color,x,y,z,sx,sy,sz,angle=0,parent=children) {
    return node(name,parent,{mesh:meshes[color],translation:[x,y,z],scale:[sx,sy,sz],rotation:[0,0,Math.sin(angle/2),Math.cos(angle/2)]});
  }
  function rod(name,color,a,b,r,parent=children) {
    const d=b.map((p,i)=>p-a[i]), len=Math.hypot(...d);
    const axis=[d[2]/len,0,-d[0]/len], w=1+d[1]/len, mag=Math.hypot(...axis,w);
    node(name,parent,{mesh:meshes[color],translation:a.map((p,i)=>(p+b[i])/2),scale:[r,len/2+r*.45,r],rotation:mag<1e-6?[1,0,0,0]:[...axis,w].map(v=>v/mag)});
  }
  part('Carved sleigh','berry',-1.65,.15,0,.94,.34,.43);
  part('High back','berry',-2.38,.42,0,.18,.48,.42,.25);
  for(const side of [-.32,.32]) {
    rod('Brass runner','gold',[-2.56,-.36,side],[-.65,-.36,side],.065);
    rod('Curled toe','gold',[-.70,-.36,side],[-.43,-.06,side],.06);
    for(const x of [-2.19,-1.10])rod('Runner brace','gold',[x,-.34,side],[x+.12,.13,side],.045);
  }
  part('Santa coat','berry',-1.42,.62,0,.23,.34,.25);
  part('Face','cream',-1.39,.99,0,.185,.20,.18);
  part('Beard','cream',-1.27,.91,0,.16,.18,.16);
  part('Cap','berry',-1.47,1.15,0,.20,.20,.19,.42);
  part('Pom','cream',-1.62,1.25,0,.085,.085,.085);
  part('Gift sack','pine',-2.02,.53,0,.32,.34,.31);
  const legs=[];
  for(const [deer,x] of [.55,2.02].entries()) {
    part('Reindeer torso','oak',x,.21,0,.47,.23,.18);
    part('Neck','oak',x+.30,.44,0,.16,.31,.14,-.39);
    part('Muzzle','oak',x+.45,.66,0,.24,.13,.13);
    part('Nose','hoof',x+.65,.66,0,.065,.075,.085);
    part('Harness','berry',x+.17,.24,0,.075,.23,.18);
    for(const z of [-.115,.115]){
      for(const s of [-1,1]){
        const upper=[],lower=[];
        const hip=node('Reindeer hip',children,{translation:[x+s*.27,.16,z],children:upper});
        const kneeOffset=[s*.095,-.235,0],hoofOffset=[-s*.065,-.215,0];
        rod('Upper leg','oak',[0,0,0],kneeOffset,.052,upper);
        const knee=node('Reindeer knee',upper,{translation:kneeOffset,children:lower});
        rod('Lower leg','oak',[0,0,0],hoofOffset,.041,lower);
        part('Hoof','hoof',...hoofOffset,.069,.045,.052,0,lower);
        legs.push({hip,knee,front:s===1,phase:deer*1.18+(z>0?.54:0)+(s<0?Math.PI:0)});
      }
      const tip=[x+.12,1.13,z*1.8];
      rod('Antler','gold',[x+.32,.74,z],tip,.035);
      rod('Antler tine','gold',[x+.23,.94,z*1.5],[x+.33,1.08,z*2.4],.022);
      rod('Rein','gold',[x-.97,.32,z],[x+.18,.38,z],.014);
    }
  }
  const times=[], path=[],rot=[];
  for(let i=0;i<=64;i++) {
    const t=i*2*Math.PI/64; times.push(i*.375);
    path.push([(low[0]+high[0])/2+Math.sin(t)*width*.37, high[1]+width*(.044+.024*Math.sin(t*2)),(low[2]+high[2])/2+Math.cos(t)*width*.20]);
    const yaw=Math.atan2(Math.sin(t)*.20,Math.cos(t)*.37)+(t>Math.PI?2*Math.PI:0);
    rot.push([0,Math.sin(yaw/2),0,Math.cos(yaw/2)]);
  }
  nodes[flight].translation=path[0];
  const input=floats(times,'SCALAR',{min:[0],max:[24]});
  (model.animations ||= []).push({name:'Santa flight',samplers:[{input,output:floats(path,'VEC3')},{input,output:floats(rot,'VEC4')}],channels:[{sampler:0,target:{node:flight,path:'translation'}},{sampler:1,target:{node:flight,path:'rotation'}}]});
  const clip=model.animations.at(-1);
  const strideTimes=Array.from({length:385},(_,i)=>i/16);
  const strideInput=floats(strideTimes,'SCALAR',{min:[0],max:[24]});
  for(const leg of legs){
    for(const joint of ["hip","knee"]){
      const keys=strideTimes.map(t=>{
        const phase=t*2*Math.PI+leg.phase;
        const angle=joint==="hip"?.83*Math.sin(phase): (leg.front?-1:1)*(.15+.92*(.5+.5*Math.cos(phase)));
        return [0,0,Math.sin(angle/2),Math.cos(angle/2)];
      });
      const sampler=clip.samplers.push({input:strideInput,output:floats(keys,'VEC4')})-1;
      clip.channels.push({sampler,target:{node:leg[joint],path:"rotation"}});
    }
  }
  const workshop = model.animations.find(clip => clip.name === "Workshop and chimney loops");
  if (workshop) {
    const flightClip = model.animations.at(-1);
    const offset = flightClip.samplers.length;
    flightClip.samplers.push(...workshop.samplers);
    flightClip.channels.push(...workshop.channels.map(channel => ({...channel, sampler:channel.sampler+offset})));
    model.animations = model.animations.filter(clip => clip !== workshop);
  }
  model.buffers[0].byteLength=bytes;
  const json=new TextEncoder().encode(JSON.stringify(model)), padded=(json.length+3)&~3;
  const head=new ArrayBuffer(20), h=new DataView(head);
  [0x46546c67,2,28+padded+bytes,padded,0x4e4f534a].forEach((v,i)=>h.setUint32(i*4,v,true));
  return URL.createObjectURL(new Blob([head,json,new Uint8Array(padded-json.length).fill(32),new Uint32Array([bytes,0x004e4942]),...chunks],{type:'model/gltf-binary'}));
}
