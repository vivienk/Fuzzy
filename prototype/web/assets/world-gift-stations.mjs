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
// Bake each confection into one colored mesh so the small sweets share a draw call.
function decorateCandyTrees(model,accessor){
  const red=[.81,.028,.048],green=[.055,.48,.12],cream=[1,.91,.72],gold=[1,.59,.07];
  const rainbow=[red,gold,[.98,.25,.06],green,[.52,.12,.68],[.99,.37,.54]];
  const material=model.materials.push({name:"Sugar candy",doubleSided:true,
    pbrMetallicRoughness:{metallicFactor:0,roughnessFactor:.48}})-1;
  const trees=model.nodes.filter(n=>n.name==="Cotton candy tree");
  const names=["Rainbow gumdrop fir","Spearmint pinwheel fir","Ribbon candy fir","Cherry bonbon fir"];
  const tau=2*Math.PI;
  trees.forEach((tree,style)=>{
    const positions=[],normals=[],colors=[];
    function triangle(a,b,c,color){
      const u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]);
      const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      const length=Math.hypot(...normal);
      if(length<1e-8)return;
      const unit=normal.map(n=>n/length);
      positions.push(a,b,c);normals.push(unit,unit,unit);colors.push(color,color,color);
    }
    function sweet(x,y,z,size,angle,paint,mint){
      const sides=mint?16:8,rings=6;
      function point(i,j){
        const lat=Math.PI*(j/rings-.5),lon=tau*i/sides+(mint?.34*Math.sin(lat):0);
        const a=Math.cos(lat)*Math.cos(lon)*size,b=Math.sin(lat)*size,c=Math.cos(lat)*Math.sin(lon)*size;
        if(!mint)return [x+a,y+b,z+c];
        const depth=b*.42;
        return [x+depth*Math.cos(angle)-a*Math.sin(angle),y+c,z+depth*Math.sin(angle)+a*Math.cos(angle)];
      }
      for(let i=0;i<sides;i++)for(let j=0;j<rings;j++){
        const color=mint&&i%2?cream:paint;
        const a=point(i,j),b=point(i,j+1),c=point(i+1,j+1),d=point(i+1,j);
        triangle(a,b,c,color);triangle(a,c,d,color);
      }
    }
    for(let row=0;row<7;row++){
      const radius=.91*(1-row/7),y=.31+row*.48;
      if(style===2){
        const folds=48,paint=row%2?red:green;
        function ribbon(i,top){
          const angle=tau*i/folds+row*.26;
          const r=top?radius*.65:(radius+.16)*(1+.1*Math.cos(angle*8));
          return [r*Math.cos(angle),top?y+.52:y-.24+.075*Math.cos(angle*8),r*Math.sin(angle)];
        }
        for(let i=0;i<folds;i++){
          triangle(ribbon(i,0),ribbon(i,1),ribbon(i+1,1),paint);
          triangle(ribbon(i,0),ribbon(i+1,1),ribbon(i+1,0),paint);
        }
      }else{
        const count=Math.max(3,Math.round(tau*radius/.53));
        for(let i=0;i<count;i++){
          const angle=tau*(i+row*.47)/count;
          const paint=style===0?rainbow[(i+row*2)%rainbow.length]:style===1?green:red;
          sweet(radius*Math.cos(angle),y,radius*Math.sin(angle),.32,angle,paint,style===1);
        }
      }
    }
    const top=style===2?green:gold;
    for(let i=0;i<10;i++){
      const tip=j=>{const a=Math.PI/2+tau*j/10,r=j%2?.135:.31;return [r*Math.cos(a),3.77+r*Math.sin(a),0];};
      triangle([0,3.77,.12],tip(i),tip(i+1),top);
      triangle([0,3.77,-.12],tip(i+1),tip(i),top);
    }
    tree.name=names[style];delete tree.children;
    tree.mesh=model.meshes.push({name:tree.name,primitives:[{material,attributes:{
      POSITION:accessor(positions,"VEC3"),NORMAL:accessor(normals,"VEC3"),COLOR_0:accessor(colors,"VEC3")}}]})-1;
  });
}
function addCottonCandy(model,accessor){
  const positions=[],normals=[],colors=[];
  const tau=Math.PI*2;
  function face(a,b,c,color){
    const u=b.map((p,i)=>p-a[i]),v=c.map((p,i)=>p-a[i]);
    const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const length=Math.hypot(...n);
    if(length<1e-8)return;
    const normal=n.map(p=>p/length);
    positions.push(a,b,c);normals.push(normal,normal,normal);colors.push(color,color,color);
  }
  function shell(t,angle){
    const shape=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.52)*(.81-.26*t);
    const radius=shape*(1+.058*Math.sin(44*t+angle)+.037*Math.cos(3*angle-17*t)+.026*Math.sin(7*angle+26*t));
    return [radius*Math.cos(angle),.75+2*t,radius*Math.sin(angle)];
  }
  const blue=[.075,.56,.90],pink=[.98,.19,.51];
  for(let row=0;row<40;row++){
    const t=row/40,next=(row+1)/40;
    for(let i=0;i<36;i++){
      const angle=tau*i/36,end=tau*(i+1)/36;
      const mix=Math.max(0,Math.min(1,(t-.38+.025*Math.sin(angle))*4.2));
      const color=blue.map((v,k)=>v*(1-mix)+pink[k]*mix);
      const a=shell(t,angle),b=shell(next,angle),c=shell(next,end),d=shell(t,end);
      face(a,b,c,color);face(a,c,d,color);
    }
  }
  for(let row=0;row<9;row++){
    function stick(i,h){
      const a=tau*i/12+h*.55,r=.032+.004*h;
      return [r*Math.cos(a),h*.09,r*Math.sin(a)];
    }
    for(let i=0;i<12;i++){
      const color=i%6<3?pink:[1,.71,.12];
      face(stick(i,row),stick(i,row+1),stick(i+1,row+1),color);
      face(stick(i,row),stick(i+1,row+1),stick(i+1,row),color);
    }
  }
  for(let i=0;i<22;i++){
    const angle=i*2.4,center=shell(.16+.68*(i+.5)/22,angle);
    center[0]+=.023*Math.cos(angle);center[2]+=.023*Math.sin(angle);
    function point(j){
      const a=Math.PI/2+tau*j/10,r=j%2?.043:.094;
      return [center[0]-r*Math.cos(a)*Math.sin(angle),center[1]+r*Math.sin(a),center[2]+r*Math.cos(a)*Math.cos(angle)];
    }
    for(let j=0;j<10;j++)face(center,point(j+1),point(j),i%3?[1,.91,.55]:[.98,.96,.91]);
  }
  const material=model.materials.push({name:"Spun sugar",doubleSided:true,pbrMetallicRoughness:{roughnessFactor:1,metallicFactor:0}})-1;
  const mesh=model.meshes.push({name:"Star-sprinkled cotton candy",primitives:[{material,attributes:{
    POSITION:accessor(positions,"VEC3"),NORMAL:accessor(normals,"VEC3"),COLOR_0:accessor(colors,"VEC3")}}]})-1;
  model.scenes[model.scene||0].nodes.push(model.nodes.push({name:"Cotton candy on a striped stick",mesh,translation:[-5.65,.10,2.12]})-1);
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
    const sphere=model.meshes[model.nodes.find(node=>node.name==="round snow").mesh];
    const parts=[
      ["Belly",[0,.42,0],[.30,.35,.23]],["Head",[0,.83,0],[.30,.27,.22]],
      ["Snout",[0,.78,.19],[.15,.10,.09]]
    ];
    for(const side of [-1,1]){
      parts.push(["Ear",[side*.21,1.04,0],[.13,.14,.11]],
        ["Arm",[side*.28,.50,.045],[.12,.19,.12]],
        ["Foot",[side*.16,.14,.09],[.15,.15,.20]]);
    }
    function gummyMesh(name,color){
      const material=model.materials.push({name,alphaMode:"BLEND",pbrMetallicRoughness:{
        baseColorFactor:[...color,.5],metallicFactor:0,roughnessFactor:.22}})-1;
      return model.meshes.push({primitives:sphere.primitives.map(p=>({...p,material}))})-1;
    }
    const eyes=gummyMesh("Dark berry eyes",[.12,.035,.045]);
    for(const [name,color,x,z,yaw] of [
      ["Raspberry",[.86,.055,.18],4.4,2.55,.28],
      ["Lime",[.38,.76,.09],-5.25,.10,.65],
      ["Tangerine",[1,.34,.035],1.05,-1.65,.38]
    ]){
      const ground=-.36+1.06*Math.sqrt(1-(x/7.34)**2-(z/5.26)**2);
      const bear=group(name+" gummy bear",[x,ground,z]);
      bear.scale=[.5,.5,.5];
      bear.rotation=[0,Math.sin(yaw/2),0,Math.cos(yaw/2)];
      const mesh=gummyMesh(name+" jelly",color);
      for(const [name,translation,scale] of parts){
        bear.children.push(model.nodes.push({name,mesh,translation,scale})-1);
      }
      for(const side of [-1,1]){
        bear.children.push(model.nodes.push({name:"Eye",mesh:eyes,
          translation:[side*.11,.88,.20],scale:[.031,.039,.026]})-1);
      }
    }
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
    decorateCandyTrees(model,accessor);
    addCottonCandy(model,accessor);
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

