import {worldGLB} from "./place-village-gift.mjs";

const layouts={
  academy:{file:"owl-post-academy.gltf?v=christmas-car",boxes:[[-2.15,.02,4.22],[-.82,.02,4.42],[.54,.02,4.35]],mail:[3.9,1.1,.9]},
  candy:{file:"funky-candy-land.gltf?v=leaning-candies",boxes:[[-2.55,.24,3.73],[-.88,.28,4.0],[.66,.30,3.92]],mail:[-.15,1.6,-1.82]}
};
const cookieActions={
  "Candy cane greeter":["Twirl the candy cane","Peppermint twirl","One peppermint spin!"],
  "Santa cookie":["Greet the Santa cookie","Santa cookie bow","A tip of my hat to you!"],
  "Wrapped gift courier":["Toss the courier’s present","Present toss","Special delivery!"]
};
let cookieEffects=[];
export function stationEffects(kind){
  const layout=layouts[kind];
  return [...layout.boxes.map(([x,y,z],slot)=>({kind:"gift-station",slot,position:[x,y+.44,z]})),
    {kind:"mail",position:layout.mail},...(kind==="candy"?cookieEffects:[])];
}
const models=new Map();
export function stationWorld(kind){
  if(!models.has(kind))models.set(kind,buildWorld(kind).catch(error=>{models.delete(kind);throw error;}));
  return models.get(kind);
}
async function buildWorld(kind){
  const layout=layouts[kind];
  const response=await fetch(new URL("./worlds/"+layout.file,import.meta.url));
  if(!response.ok)throw Error("Could not load the island.");
  const model=await response.json();
  if(kind==="candy"){
    cookieEffects=model.nodes.filter(node=>Object.hasOwn(cookieActions,node.name)).map(node=>{
      const [x,y,z]=node.translation;
      return {kind:"cookie",position:[x,y+.78,z],action:cookieActions[node.name]};
    });
  }
  const bytes=new Uint8Array(await (await fetch(model.buffers[0].uri)).arrayBuffer());
  delete model.buffers[0].uri;
  const academy=kind==="academy", template=model.meshes[academy?3:4];
  const paints=academy?["berry","pine","Sapphire felt","Antique gold piping"]:["berry","mint","lilac","Vanilla icing"];
  const meshes=paints.map(name=>{
    const material=model.materials.findIndex(m=>m.name===name);
    return model.meshes.push({primitives:template.primitives.map(p=>({...p,material}))})-1;
  });
  function block(parent,mesh,x,y,z,w,h,d){
    // Academy's prism is one unit tall and grounded. Candy's cube is centered.
    const scale=academy?[w/Math.SQRT2,h,d/Math.SQRT2]:[w/2,h/2,d/2];
    parent.children.push(model.nodes.push({mesh,translation:[x,academy?y-h/2:y,z],scale})-1);
  }
  function group(name,position){
    const node={name,translation:position,children:[]};
    model.scenes[model.scene||0].nodes.push(model.nodes.push(node)-1);
    return node;
  }
  layout.boxes.forEach(([x,y,z],slot)=>{
    const body=group("Gift box "+slot,[x,y,z]);
    const lid=group("Gift lid "+slot,[x,y+.39,z]);
    for(const [node,width,height] of [[body,.78,.40],[lid,.844,.14]]){
      block(node,meshes[slot],0,height/2,0,width,height,width);
      block(node,meshes[3],0,height/2,0,.095,height+.004,width+.006);
      block(node,meshes[3],0,height/2,0,width+.006,height+.008,.095);
    }
    for(const side of [-1,1]){
      block(lid,meshes[3],side*.09,.19,0,.17,.075,.085);
      model.nodes.at(-1).rotation=[0,0,side*.18,Math.sqrt(1-.18**2)];
    }
  });
  return worldGLB(model,[bytes],bytes.length);
}
