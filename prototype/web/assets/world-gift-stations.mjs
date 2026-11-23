import {worldGLB} from "./place-village-gift.mjs";

const layouts={
  academy:{file:"owl-post-academy.gltf?v=snowy-mail-owl",boxes:[[-2.15,.02,4.22],[-.82,.02,4.42],[.54,.02,4.35]],mail:[3.9,1.1,.9]},
  candy:{file:"funky-candy-land.gltf?v=leaning-candies",boxes:[[-2.55,.24,3.73],[-.88,.28,4.0],[.66,.30,3.92]],mail:[-3.72,.8925,3.27]}
};
const cookieActions={
  "Candy cane greeter":["Twirl the candy cane","Peppermint twirl","One peppermint spin!"],
  "Santa cookie":["Greet the Santa cookie","Santa cookie bow","A tip of my hat to you!"],
  "Wrapped gift courier":["Toss the courier’s present","Present toss","Special delivery!"]
};
const walkTracks=new Map();
const walkDuration=8;
export function cookiePosition(name,time){
  const {positions,height}=walkTracks.get(name);
  const sample=(time%walkDuration)/walkDuration*(positions.length-1);
  const i=Math.floor(sample),mix=sample-i;
  return positions[i].map((v,axis)=>v+(positions[i+1][axis]-v)*mix+(axis===1?height:0));
}
let cookieEffects=[];
let mailFlight;
export function owlMailPosition(time){
  const end=mailFlight.at(-1)[0],t=time%end;
  const i=mailFlight.findIndex(point=>point[0]>t);
  const a=mailFlight[i-1],b=mailFlight[i],mix=(t-a[0])/(b[0]-a[0]);
  return [1,2,3].map(axis=>a[axis]+(b[axis]-a[axis])*mix+(axis===2?.39:0));
}
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
  if(kind==="academy"){
    const owl=model.nodes.find(node=>node.name==="Letter delivery owl");
    owl.scale=owl.scale.map(axis=>axis*.5);
    mailFlight=owl.extras.mailFlight;
  }
  if(kind==="candy"){
    cookieEffects=model.nodes.filter(node=>Object.hasOwn(cookieActions,node.name)).map(node=>{
      const [x,y,z]=node.translation;
      return {kind:"cookie",position:[x,y+.78,z],name:node.name,action:cookieActions[node.name]};
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
  if(kind==="candy"){
    const [x,y,z]=layout.mail;
    const carrier=group("Gingerbread postman",[x,y-.5625,z]);
    carrier.scale=[.69,.69,.69];
    carrier.rotation=[0,Math.sin(.22),0,Math.cos(.22)];
    const cookie=model.nodes.find(node=>node.name==="Wrapped gift courier");
    for(const index of cookie.children){
      const part=model.nodes[index];
      if(part.mesh===undefined||part.name.startsWith("Bow"))continue;
      carrier.children.push(model.nodes.push({...part})-1);
    }
    const meshCache=new Map();
    function detail(name,shape,color,position,scale,angle=0){
      const key=shape+color;
      if(!meshCache.has(key)){
        const source=model.nodes.find(node=>node.name===shape);
        const material=model.materials.findIndex(m=>m.name===color);
        const primitives=model.meshes[source.mesh].primitives.map(p=>({...p,material}));
        meshCache.set(key,model.meshes.push({name:key,primitives})-1);
      }
      carrier.children.push(model.nodes.push({name,mesh:meshCache.get(key),translation:position,
        scale,rotation:[0,0,Math.sin(angle/2),Math.cos(angle/2)]})-1);
    }
    const round="Baked cookie body",flat="cube snow";
    detail("Raised cookie arm",round,"Light biscuit brown",[.37,.91,0],[.145,.31,.14],-.8);
    detail("Postal cap crown",round,"berry",[0,1.48,0],[.39,.18,.22]);
    detail("Cap piping",round,"gold",[0,1.435,.024],[.38,.065,.22]);
    detail("Postman's visor",round,"cocoa",[0,1.415,.12],[.355,.061,.19]);
    detail("Postal badge",round,"gold",[0,1.53,.207],[.063,.065,.022]);
    detail("Leather shoulder strap",flat,"cocoa",[0,.77,.18],[.032,.45,.024],-.61);
    detail("Mint satchel",flat,"mint",[-.30,.46,.17],[.18,.135,.064],-.13);
    detail("Satchel flap",flat,"pine",[-.30,.525,.231],[.18,.056,.024],-.13);
    detail("Brass clasp",round,"gold",[-.30,.492,.258],[.033,.036,.015]);
    detail("Raised letter",flat,"Vanilla icing",[.575,1.19,.10],[.215,.143,.033],-.12);
    detail("Envelope fold",flat,"honey",[.487,1.213,.14],[.112,.013,.009],-.53);
    detail("Envelope fold",flat,"honey",[.672,1.192,.14],[.112,.013,.009],.31);
    detail("Wax seal",round,"berry",[.58,1.17,.15],[.039,.039,.012]);
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
  const chunks=[bytes];
  let length=bytes.length;
  if(kind==="candy"){
    const sweetShop=model.nodes.find(n=>n.name==="Gingerbread sweet shop");
    const walls=sweetShop.children.map(i=>model.nodes[i]).find(n=>n.name.startsWith("gable "));
    const yellow=model.materials.push({name:"Butter yellow",pbrMetallicRoughness:{baseColorFactor:[1,.67,.18,1],roughnessFactor:.82,metallicFactor:0}})-1;
    walls.mesh=model.meshes.push({primitives:model.meshes[walls.mesh].primitives.map(p=>({...p,material:yellow}))})-1;
    const cottage=model.nodes.find(n=>n.name==="Buttercream cottage");
    cottage.name="Chocolate cottage";
    const chocolate=(name,rgb)=>model.materials.push({name,pbrMetallicRoughness:{baseColorFactor:[...rgb,1],roughnessFactor:.62,metallicFactor:0}})-1;
    const milk=chocolate("Milk chocolate",[.27,.108,.047]),dark=chocolate("Dark chocolate",[.115,.044,.026]);
    const variants=new Map();
    for(const index of cottage.children){
      const part=model.nodes[index];
      const wall=part.name.startsWith("gable ");
      const roof=part.name==="cube snow"&&part.scale[0]>.6&&part.scale[2]>.8;
      if(!wall&&!roof)continue;
      const key=part.mesh+":"+roof;
      if(!variants.has(key))variants.set(key,model.meshes.push({primitives:model.meshes[part.mesh].primitives.map(p=>({...p,material:roof?dark:milk}))})-1);
      part.mesh=variants.get(key);
    }
    const clip=model.animations.find(a=>a.name==="Candy village greetings");
    function accessor(rows,type){
      const data=new Float32Array(rows.flat());
      const bufferView=model.bufferViews.push({buffer:0,byteOffset:length,byteLength:data.byteLength})-1;
      chunks.push(data);length+=data.byteLength;
      return model.accessors.push({bufferView,componentType:5126,count:rows.length,type,
        min:rows[0].map((_,i)=>Math.min(...rows.map(r=>r[i]))),max:rows[0].map((_,i)=>Math.max(...rows.map(r=>r[i])))})-1;
    }
    const times=Array.from({length:97},(_,i)=>[i*walkDuration/96]);
    const clock=accessor(times,"SCALAR");
    function animate(node,path,rows){
      const output=accessor(rows,path==="rotation"?"VEC4":"VEC3");
      const sampler=clip.samplers.push({input:clock,output,interpolation:"LINEAR"})-1;
      clip.channels.push({sampler,target:{node,path}});
    }
    const routes=[
      ["Candy cane greeter",-.8,2.68,.73,.39,1],
      ["Santa cookie",.06,.27,.8,1.06,-1],
      ["Wrapped gift courier",2.36,3.42,.81,.43,1],
      ["Gingerbread postman",-3.71,3.25,.53,.43,-1]
    ];
    for(const [name,cx,cz,rx,rz,direction] of routes){
      const index=model.nodes.findIndex(n=>n.name===name),actor=model.nodes[index];
      const positions=[],rotations=[];
      for(const [t] of times){
        const phase=t/walkDuration*Math.PI*2*direction;
        const x=cx+rx*Math.cos(phase),z=cz+rz*Math.sin(phase);
        const ground=-.36+1.06*Math.sqrt(Math.max(.02,1-(x/7.34)**2-(z/5.26)**2));
        positions.push([x,ground+.022*Math.abs(Math.sin(t*Math.PI*2)),z]);
        const yaw=Math.atan2(-direction*rx*Math.sin(phase),direction*rz*Math.cos(phase));
        rotations.push([0,Math.sin(yaw/2),0,Math.cos(yaw/2)]);
      }
      actor.translation=positions[0];actor.rotation=rotations[0];
      walkTracks.set(name,{positions,height:name==="Gingerbread postman"?.5625:.78});
      animate(index,"translation",positions);animate(index,"rotation",rotations);
      for(const id of actor.children){
        const boot=model.nodes[id];
        if(boot.name!=="Rounded boot"&&boot.name!=="Boot icing")continue;
        const [x,y,z]=boot.translation,side=Math.sign(x);
        animate(id,"translation",times.map(([t])=>{
          const stride=side*Math.sin(t*2*Math.PI);
          return [x,y+.064*Math.max(0,stride),z+.105*stride];
        }));
      }
    }
    model.buffers[0].byteLength=length;
  }
  return worldGLB(model,chunks,length);
}
