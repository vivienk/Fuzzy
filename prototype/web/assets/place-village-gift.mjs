export const presets=new Map([
  ["preset:hot-cocoa","Hot cocoa"],["preset:bicycle","Bicycle"],["preset:gift","Wrapped gift"],["preset:reindeer","Reindeer"],
  ["preset:snowman","Snowman"],["preset:lantern","Lantern"],["preset:igloo","Igloo"],
  ["preset:candy-cane","Candy cane"]
]);
const giftFiles=new Map();
export function giftURL(id){
  if(id==="preset:bicycle")return Promise.resolve(new URL("./presets/bicycle.glb",import.meta.url).href);
  if(!giftFiles.has(id)){
    if(presets.has(id)){
      giftFiles.set(id,Promise.resolve(window.FuzzyDecorations.preset(id.slice(7))));
      return giftFiles.get(id);
    }
    const request=(window.fetchGiftAPI || (query=>fetch("/api/tripo"+query)))("?download=1&asset=object&taskId="+encodeURIComponent(id)).then(async response=>{
      if(!response.ok)throw Error("Could not download the gift.");
      return URL.createObjectURL(await response.blob());
    }).catch(error=>{giftFiles.delete(id);throw error;});
    giftFiles.set(id,request);
  }
  return giftFiles.get(id);
}
async function readGLB(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not load the 3D model.");
  const bytes = await response.arrayBuffer(), view = new DataView(bytes);
  if (view.getUint32(0,true) !== 0x46546c67) throw new Error("Expected a GLB model.");
  const end = 20 + view.getUint32(12,true);
  const model = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,end-20)));
  return {model, bin:new Uint8Array(bytes,end+8,view.getUint32(end,true))};
}

export function giftBounds(model, roots) {
  const min=[Infinity,Infinity,Infinity], max=[-Infinity,-Infinity,-Infinity];
  function visit(index,parent) {
    const node=model.nodes[index];
    let matrix=new DOMMatrix(node.matrix);
    if (!node.matrix) {
      matrix.translateSelf(...(node.translation || [0,0,0]));
      const [x,y,z,w]=node.rotation || [0,0,0,1];
      if (Math.hypot(x,y,z)) matrix.rotateAxisAngleSelf(x,y,z,2*Math.acos(Math.max(-1,Math.min(1,w)))*180/Math.PI);
      matrix.scaleSelf(...(node.scale || [1,1,1]));
    }
    matrix=parent.multiply(matrix);
    for (const primitive of model.meshes?.[node.mesh]?.primitives || []) {
      const bounds=model.accessors[primitive.attributes.POSITION];
      for (let mask=0;mask<8;mask++) {
        const xyz=min.map((_,i)=>(mask & (1<<i) ? bounds.max : bounds.min)[i]);
        const point=matrix.transformPoint(new DOMPoint(...xyz));
        [point.x,point.y,point.z].forEach((v,i)=>{min[i]=Math.min(min[i],v);max[i]=Math.max(max[i],v);});
      }
    }
    for (const child of node.children || []) visit(child,matrix);
  }
  roots.forEach(i=>visit(i,new DOMMatrix()));
  return {min,max};
}

// Append a standalone gift without flattening its materials or scene hierarchy.
export async function composeGiftBoxes(villageUrl,opened,{nativeVariants=false}={}) {
  const {model:m,bin}=await readGLB(villageUrl);
  const chunks=[bin];let bytes=bin.length;
  function append(data){
    const pad=(4-bytes%4)%4;chunks.push(new Uint8Array(pad),data);
    bytes+=pad;const offset=bytes;bytes+=data.byteLength;return offset;
  }
  function floats(values,type){
    const data=new Float32Array(values.flat()),offset=append(data);
    const view=m.bufferViews.push({buffer:0,byteOffset:offset,byteLength:data.byteLength})-1;
    return m.accessors.push({bufferView:view,componentType:5126,count:values.length,type,...(type==="SCALAR"?{min:[0],max:[1]}:{})})-1;
  }
  for(const {slot,id} of opened){
    const {model:g,bin:gb}=await readGLB(await giftURL(id));
    const roots=g.scenes[g.scene||0].nodes;
    const {min,max}=giftBounds(g,roots),extent=Math.max(...max.map((v,i)=>v-min[i]));
    if(!(extent>0 && Number.isFinite(extent)))throw Error("Gift has no visible geometry");
    const box=m.nodes.find(n=>n.name==="Gift box "+slot),lid=m.nodes.find(n=>n.name==="Gift lid "+slot);
    const [x,y,z]=box.translation;
    const closedScale=[...(box.scale||[1,1,1])];
    const boxBounds=giftBounds(m,[m.nodes.indexOf(box),m.nodes.indexOf(lid)]);
    const size=boxBounds.max.map((value,axis)=>value-boxBounds.min[axis]);
    const scale=Math.min(...size.map((value,axis)=>
      max[axis]>min[axis] ? value/(max[axis]-min[axis]) : Infinity));
    if (!(scale>0 && Number.isFinite(scale))) throw Error("Gift box has no visible geometry");
    const base={};for(const k of ["nodes","meshes","accessors","bufferViews","skins","textures","images","samplers","materials"])base[k]=(m[k]||=[]).length;
    const offset=append(gb);
    for(const v of g.bufferViews){v.byteOffset=(v.byteOffset||0)+offset;const ext=v.extensions?.EXT_meshopt_compression;if(ext)ext.byteOffset=(ext.byteOffset||0)+offset;}
    for(const a of g.accessors){if(a.bufferView!=null)a.bufferView+=base.bufferViews;if(a.sparse){a.sparse.indices.bufferView+=base.bufferViews;a.sparse.values.bufferView+=base.bufferViews;}}
    for(const image of g.images||[])if(image.bufferView!=null)image.bufferView+=base.bufferViews;
    for(const t of g.textures||[]){if(t.source!=null)t.source+=base.images;if(t.sampler!=null)t.sampler+=base.samplers;for(const ext of Object.values(t.extensions||{}))if(ext.source!=null)ext.source+=base.images;}
    function rebaseTextureInfo(obj){for(const [key,v] of Object.entries(obj)){if(v && typeof v==="object"){if(/texture$/i.test(key)&&Number.isInteger(v.index))v.index+=base.textures;else rebaseTextureInfo(v);}}}
    for(const material of g.materials||[])rebaseTextureInfo(material);
    const attrs=a=>{for(const k of Object.keys(a))a[k]+=base.accessors;};
    for(const mesh of g.meshes)for(const p of mesh.primitives){attrs(p.attributes);(p.targets||[]).forEach(attrs);if(p.indices!=null)p.indices+=base.accessors;if(p.material!=null)p.material+=base.materials;const draco=p.extensions?.KHR_draco_mesh_compression;if(draco)draco.bufferView+=base.bufferViews;}
    for(const skin of g.skins||[]){skin.joints=skin.joints.map(i=>i+base.nodes);if(skin.skeleton!=null)skin.skeleton+=base.nodes;if(skin.inverseBindMatrices!=null)skin.inverseBindMatrices+=base.accessors;}
    for(const n of g.nodes){if(n.mesh!=null)n.mesh+=base.meshes;if(n.skin!=null)n.skin+=base.skins;if(n.children)n.children=n.children.map(i=>i+base.nodes);delete n.camera;}
    for(const k of Object.keys(base))for(const item of g[k]||[])m[k].push(item);
    for(const k of ["extensionsUsed","extensionsRequired"])if(g[k])m[k]=[...new Set([...(m[k]||[]),...g[k]])];
    const gift=m.nodes.push({name:"Unwrapped gift "+slot,children:roots.map(i=>i+base.nodes),translation:[-scale*(min[0]+max[0])/2,-scale*min[1],-scale*(min[2]+max[2])/2],scale:[scale,scale,scale]})-1;
    const boxScale=box.scale?.[1]??1;
    const final=[(boxBounds.min[0]+boxBounds.max[0])/2,boxBounds.min[1],(boxBounds.min[2]+boxBounds.max[2])/2],start=[final[0],final[1]+.22*boxScale,final[2]];
    const display=m.nodes.push({name:nativeVariants ? "Decor_"+slot+"_"+id.slice(7) : "Gift reveal "+slot,translation:final,children:[gift]})-1;
    m.scenes[m.scene||0].nodes.push(display);
    if(nativeVariants)continue;
    const closed=[...lid.translation],aside=[x,y+.18*boxScale,z-.56*boxScale],lidNode=m.nodes.indexOf(lid);
    const gone=[0,0,0];
    lid.translation=aside;lid.rotation=[-.38,0,0,.925];box.scale=gone;lid.scale=gone;
    const times=floats([0,.35,1],"SCALAR"),clip={name:"Unwrap box "+slot,samplers:[],channels:[]};
    function track(node,path,values,type){const sampler=clip.samplers.push({input:times,output:floats(values,type),interpolation:"LINEAR"})-1;clip.channels.push({sampler,target:{node,path}});}
    track(lidNode,"translation",[closed,[x,y+.95*boxScale,z-.13*boxScale],aside],"VEC3");
    track(lidNode,"rotation",[[0,0,0,1],[-.2,0,0,.979796],lid.rotation],"VEC4");
    track(m.nodes.indexOf(box),"scale",[closedScale,closedScale,gone],"VEC3");
    track(lidNode,"scale",[closedScale,closedScale,gone],"VEC3");
    track(display,"translation",[start,start,final],"VEC3");
    track(display,"scale",[[.001,.001,.001],[.01,.01,.01],[1,1,1]],"VEC3");
    (m.animations ||= []).push(clip);
  }
  const endPad=(4-bytes%4)%4;chunks.push(new Uint8Array(endPad));bytes+=endPad;
  for(const key of ["skins","textures","images","samplers"])if(!m[key]?.length)delete m[key];
  m.buffers[0].byteLength=bytes;
  return worldGLB(m,chunks,bytes);
}

export function worldGLB(m,chunks,bytes){
  const json=new TextEncoder().encode(JSON.stringify(m)), padded=(json.length+3)&~3;
  return URL.createObjectURL(new Blob([new Uint32Array([0x46546c67,2,28+padded+bytes,padded,0x4e4f534a]),json,new Uint8Array(padded-json.length).fill(32),new Uint32Array([bytes,0x004e4942]),...chunks],{type:"model/gltf-binary"}));
}
