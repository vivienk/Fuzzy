// Keep the generated GLB's materials, texture indices and extensions intact.
// The procedural village uses only plain meshes, materials and transform animations.
async function readGLB(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not load the 3D model.");
  const bytes = await response.arrayBuffer(), view = new DataView(bytes);
  if (view.getUint32(0,true) !== 0x46546c67) throw new Error("Expected a GLB model.");
  const end = 20 + view.getUint32(12,true);
  const model = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,end-20)));
  return {model, bin:new Uint8Array(bytes,end+8,view.getUint32(end,true))};
}

function giftBounds(model, roots) {
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

export async function placeVillageGift(villageUrl,giftUrl) {
  const [gift,village]=await Promise.all([readGLB(giftUrl),readGLB(villageUrl)]);
  const m=gift.model, v=village.model, scene=m.scenes[m.scene || 0];
  const roots=[...scene.nodes], {min,max}=giftBounds(m,roots);
  const extent=Math.max(...max.map((x,i)=>x-min[i]));
  if (!Number.isFinite(extent) || extent<=0) throw new Error("Gift has no visible geometry.");
  const scale=.85/extent;
  const counter=v.nodes.find(n=>n.name==="Gift making station");
  const [x,y,z]=counter.translation;
  const display=m.nodes.push({name:"Generated village gift",children:roots,scale:[scale,scale,scale],
    translation:[x-scale*(min[0]+max[0])/2,y+.50-scale*min[1],z-scale*(min[2]+max[2])/2]})-1;
  const firstNode=m.nodes.length, firstMesh=m.meshes.length, firstMaterial=(m.materials ||= []).length;
  const firstView=m.bufferViews.length, firstAccessor=m.accessors.length;
  const offset=(gift.bin.length+3)&~3;
  for (const view of v.bufferViews) m.bufferViews.push({...view,byteOffset:offset+(view.byteOffset || 0)});
  for (const acc of v.accessors) m.accessors.push({...acc,bufferView:firstView+acc.bufferView});
  m.materials.push(...v.materials);
  for (const mesh of v.meshes) {
    for (const p of mesh.primitives) {
      for (const attr of Object.keys(p.attributes)) p.attributes[attr]+=firstAccessor;
      if (p.indices!==undefined) p.indices+=firstAccessor;
      if (p.material!==undefined) p.material+=firstMaterial;
    }
    m.meshes.push(mesh);
  }
  for (const node of v.nodes) {
    if (node.mesh!==undefined) node.mesh+=firstMesh;
    if (node.children) node.children=node.children.map(i=>i+firstNode);
    m.nodes.push(node);
  }
  m.animations=v.animations;
  for (const animation of m.animations) {
    for (const s of animation.samplers) {s.input+=firstAccessor;s.output+=firstAccessor;}
    for (const c of animation.channels) c.target.node+=firstNode;
  }
  scene.nodes=[...v.scenes[v.scene || 0].nodes.map(i=>i+firstNode),display];
  const length=offset+village.bin.length;
  m.buffers[0].byteLength=length;
  const json=new TextEncoder().encode(JSON.stringify(m)), padded=(json.length+3)&~3;
  const header=new Uint32Array([0x46546c67,2,28+padded+length,padded,0x4e4f534a]);
  return URL.createObjectURL(new Blob([header,json,new Uint8Array(padded-json.length).fill(32),
    new Uint32Array([length,0x004e4942]),gift.bin,new Uint8Array(offset-gift.bin.length),village.bin],{type:"model/gltf-binary"}));
}
