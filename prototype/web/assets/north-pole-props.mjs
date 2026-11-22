export async function propsV1() {
  const response=await fetch(new URL("./worlds/aurora-lit.glb",import.meta.url));
  if(!response.ok)throw new Error("Original North Pole props unavailable");
  const file=await response.arrayBuffer(),size=new DataView(file).getUint32(12,true);
  const src=JSON.parse(new TextDecoder().decode(new Uint8Array(file,20,size)));
  function read(id){
    const a=src.accessors[id],v=src.bufferViews[a.bufferView],Type=({5126:Float32Array,5121:Uint8Array,5123:Uint16Array,5125:Uint32Array})[a.componentType];
    return new Type(file,28+size+(v.byteOffset||0)+(a.byteOffset||0),a.count*(a.type==="VEC3"?3:1));
  }
  const ns=src.nodes;
  function range(start,end){const a=ns.findIndex(n=>n.name===start),b=ns.findIndex((n,i)=>i>=a&&n.name===end);return ns.slice(a,b+1);}
  const cane=ns.findIndex(n=>n.name==="Candy cane stripe"),hook=ns.findIndex((n,i)=>i>cane&&n.name==="Candy cane hook"),next=ns.findIndex((n,i)=>i>hook&&n.name!=="Candy cane hook");
  const groups={igloo:range("Igloo continuous ice dome","Igloo tunnel roof"),cane:ns.slice(cane,next),sign:range("North Pole striped signpost","North Pole golden finial"),workshop:ns.find(n=>n.children?.some(i=>ns[i].name==="SANTA WORKSHOP sign board")).children.map(i=>ns[i])};
  const result={materials:src.materials};
  for(const [key,group] of Object.entries(groups)){
    const low=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity],faces=[];let chimney;
    for(const n of group){
      if(n.mesh===undefined)continue;
      const mat=new DOMMatrix();mat.translateSelf(...(n.translation||[0,0,0]));
      if(n.rotation){const [x,y,z,w]=n.rotation;if(Math.hypot(x,y,z))mat.rotateAxisAngleSelf(x,y,z,Math.acos(Math.min(1,Math.max(-1,w)))*360/Math.PI);}
      mat.scaleSelf(...(n.scale||[1,1,1]));
      for(const p of src.meshes[n.mesh].primitives){
        const xyz=read(p.attributes.POSITION),indices=p.indices===undefined?null:read(p.indices),pts=[];
        for(let k=0;k<xyz.length;k+=3){
          const v=mat.transformPoint(new DOMPoint(xyz[k],xyz[k+1],xyz[k+2])),point=[v.x,v.y,v.z];pts.push(point);
          point.forEach((v,i)=>{low[i]=Math.min(low[i],v);hi[i]=Math.max(hi[i],v);});
        }
        if(n.name.startsWith("Chimney snow"))chimney=[n.translation[0],Math.max(...pts.map(p=>p[1])),n.translation[2]];
        for(let k=0;k<(indices?.length||pts.length);k+=3)faces.push([p.material,...[k,k+1,k+2].map(i=>pts[indices?indices[i]:i])]);
      }
    }
    const origin=[(hi[0]+low[0])/2,low[1],(hi[2]+low[2])/2],height=hi[1]-low[1];
    const local=p=>p.map((v,i)=>(v-origin[i])/height);
    result[key]={draw(tri){for(const [m,a,b,c] of faces)tri("Original "+src.materials[m].name,local(a),local(b),local(c));},chimney:chimney&&local(chimney)};
  }
  return result;
}