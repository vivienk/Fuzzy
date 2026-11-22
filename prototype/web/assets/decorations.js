/* Small procedural GLB additions. Dimensions are metres in the existing scene. */
window.FuzzyDecorations=(()=>{
 const slots=[[-.68,.135,.55],[-.46,.135,.58],[-.08,.135,.40]];
 const maxHeight=.24; // Mailbox rises .2775 m above its .10 m base.
 const cache=new Map();
 function styleTextureUri(st const WORLD_MATERIAL_PALETTES={
  forest:{
   'Pearl snow':[.73,.75,.81],'Lavender slate':[.31,.27,.43],'Cedar':[.41,.32,.38],
   'Deep pine':[.22,.29,.30],'Cranberry':[.45,.34,.40],'Champagne gold':[.62,.51,.37],
   'Bronze':[.20,.17,.23],'Amber glow':[.80,.57,.34],'Sage':[.31,.39,.37],
   'Glacier blue':[.37,.44,.57],'Rose sandstone':[.44,.35,.43],'Midnight roof':[.18,.15,.30],
   'Luminous frost crystals':[.48,.40,.62],'Spring stone':[.31,.38,.40],
   'forest architectural trim':[.24,.20,.34],'forest enchanted accent':[.80,.57,.34],
   'Moonlit snow blanket':[.68,.71,.78]
  },
  aurora:{
   'Pearl snow':[.82,.82,.85],'Lavender slate':[.48,.45,.53],'Cedar':[.47,.37,.32],
   'Deep pine':[.31,.37,.33],'Cranberry':[.51,.38,.38],'Champagne gold':[.73,.62,.47],
   'Bronze':[.31,.27,.28],'Amber glow':[.88,.65,.42],'Sage':[.48,.53,.46],
   'Glacier blue':[.57,.65,.75],'Rose sandstone':[.66,.52,.51],'Midnight roof':[.35,.34,.40],
   'Luminous frost crystals':[.74,.74,.80],'Spring stone':[.49,.53,.56],
   'aurora architectural trim':[.49,.40,.37],'aurora enchanted accent':[.82,.66,.47],
   'Moonlit snow blanket':[.80,.80,.84]
  },
  alpine:{
   'Pearl snow':[.87,.86,.83],'Lavender slate':[.64,.59,.67],'Cedar':[.62,.47,.41],
   'Deep pine':[.42,.50,.46],'Cranberry':[.61,.45,.47],'Champagne gold':[.80,.68,.49],
   'Bronze':[.39,.35,.36],'Amber glow':[.90,.72,.49],'Sage':[.56,.63,.55],
   'Glacier blue':[.64,.71,.78],'Rose sandstone':[.71,.57,.56],'Midnight roof':[.44,.41,.48],
   'Luminous frost crystals':[.79,.77,.82],'Spring stone':[.58,.63,.63],
   'alpine architectural trim':[.62,.48,.43],'alpine enchanted accent':[.86,.71,.50],
   'Moonlit snow blanket':[.85,.84,.81]
  }
 };
(!cache.has(url))cache.set(url,fetch(url+'?v=gentle-walk-1').then(r=>{if(!r.ok)throw Error('World unavailable');return r.arrayBuffer()}));return cache.get(url)}
 function triangles(kind,world){
  const pieces=[];const add=(verts,color)=>pieces.push({verts,color});
  function box(x,y,z,w,h,d,color){const p=[[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y+h,z-d/2],[x-w/2,y+h,z-d/2],[x-w/2,y,z+d/2],[x+w/2,y,z+d/2],[x+w/2,y+h,z+d/2],[x-w/2,y+h,z+d/2]];add([...[0,3,2,0,2,1,4,5,6,4,6,7,0,4,7,0,7,3,1,2,6,1,6,5,3,7,6,3,6,2,0,1,5,0,5,4].map(i=>p[i])],color)}
  function cone(x,y,z,r,h,color){let v=[];for(let i=0;i<10;i++){let a=i*Math.PI/5,b=(i+1)*Math.PI/5;v.push([x+r*Math.cos(a),y,z+r*Math.sin(a)],[x,y+h,z],[x+r*Math.cos(b),y,z+r*Math.sin(b)])}add(v,color)}
  function ball(x,y,z,r,color){let v=[];const p=(a,b)=>[x+r*Math.sin(a)*Math.cos(b),y+r*Math.cos(a),z+r*Math.sin(a)*Math.sin(b)];for(let i=0;i<6;i++)for(let j=0;j<10;j++){let a=i*Math.PI/6,b=j*Math.PI/5,c=(i+1)*Math.PI/6,d=(j+1)*Math.PI/5;v.push(p(a,b),p(c,b),p(c,d),p(a,b),p(c,d),p(a,d))}add(v,color)}
  const palette={forest:{white:[.88,.87,.92,1],red:[.43,.31,.44,1],gold:[.60,.51,.68,1],fur:[.51,.47,.58,1],antler:[.66,.59,.72,1]},aurora:{white:[.91,.90,.88,1],red:[.55,.34,.34,1],gold:[.70,.55,.37,1],fur:[.47,.38,.31,1],antler:[.63,.65,.59,1]},alpine:{white:[.93,.91,.86,1],red:[.57,.36,.37,1],gold:[.78,.62,.42,1],fur:[.46,.34,.27,1],antler:[.64,.52,.38,1]}}[world||'alpine'];
  const {white,red,gold}=palette;
  if(kind==='reindeer'){
   const {fur,antler}=palette,cream=white,hoof=[.17,.10,.08,1];
   box(0,.052,0,.066,.052,.10,fur);
   for(const x of [-.022,.022])for(const z of [-.032,.032]){box(x,0,z,.012,.058,.012,fur);box(x,0,z,.015,.013,.017,hoof)}
   box(0,.095,.033,.03,.036,.03,fur);ball(0,.142,.042,.026,fur);
   box(0,.127,.066,.032,.022,.026,cream);ball(0,.141,.081,.007,red);
   for(const x of [-1,1]){ball(x*.019,.148,.06,.004,hoof);box(x*.03,.149,.036,.022,.009,.014,fur);box(x*.015,.162,.036,.005,.052,.005,antler);box(x*.022,.181,.036,.019,.005,.005,antler);box(x*.03,.181,.036,.005,.019,.005,antler);box(x*.011,.199,.036,.014,.005,.005,antler)}
   box(0,.10,.037,.035,.009,.037,red);ball(0,.101,.058,.005,gold);box(0,.08,-.057,.02,.016,.021,cream);
  }
  else if(kind==='lantern'){box(0,0,0,.10,.025,.10,gold);box(0,.025,0,.06,.09,.06,[1,.72,.25,1]);for(const x of [-.04,.04])for(const z of [-.04,.04])box(x,.025,z,.012,.11,.012,gold);cone(0,.135,0,.07,.055,red)}
  else if(kind==='igloo'){ball(0,.085,0,.085,white);box(0,0,.075,.045,.06,.035,[.12,.17,.23,1]);box(-.03,0,.08,.018,.07,.05,white);box(.03,0,.08,.018,.07,.05,white);box(0,.06,.08,.075,.02,.05,white)}
  else if(kind==='candy-cane'){for(let i=0;i<8;i++)box(0,i*.02,0,.018,.02,.018,i%2?white:red);for(let i=0;i<8;i++){const a=i*Math.PI/7;ball(.025-.025*Math.cos(a),.16+.025*Math.sin(a),0,.011,i%2?white:red)}}
  else if(kind==='snowman'){ball(0,.055,0,.055,white);ball(0,.13,0,.037,white);box(0,.155,0,.085,.012,.07,red);box(0,.167,0,.047,.027,.045,red);box(0,.1,.028,.065,.012,.012,red);ball(-.013,.137,.033,.004,[.1,.08,.12,1]);ball(.013,.137,.033,.004,[.1,.08,.12,1])}
  else{box(0,0,0,.11,.10,.10,red);box(0,0,0,.018,.103,.104,gold);box(0,0,0,.114,.103,.018,gold);ball(-.018,.11,0,.018,gold);ball(.018,.11,0,.018,gold)}
  if(world==='forest'){
   if(kind==='gift')cone(0,.11,0,.022,.075,gold);
   if(kind==='snowman')cone(0,.178,0,.031,.05,gold);
   if(kind==='reindeer')cone(0,.091,.063,.009,.025,gold);
  }else if(world==='aurora'){
   if(kind==='gift'){box(0,.104,0,.055,.012,.055,white);cone(0,.116,0,.017,.025,gold)}
   if(kind==='snowman')cone(0,.185,0,.027,.035,red);
   if(kind==='reindeer')box(.02,.072,.04,.014,.036,.014,red);
  }else{
   if(kind==='gift')box(0,.035,.052,.112,.012,.004,white);
   if(kind==='snowman'){box(0,.175,0,.049,.006,.047,white);ball(0,.209,0,.012,white)}
   if(kind==='reindeer')box(0,.096,.058,.032,.006,.006,white);
  }
  for(const p of pieces)for(const v of p.verts)if(v[1]>maxHeight||v[1]<-.001)throw Error('Decoration exceeds mailbox height');return pieces;
 }
 async function build(lit,items,world,wrapped=false,sceneStyle='needle-felt'){
  const source=await base(wrapped?'assets/gift.glb':['forest','aurora','alpine'].includes(world)?`assets/worlds/${world}${lit?'-lit':''}.glb`:(lit?'assets/world.glb':'assets/world-unlit.glb')),view=new DataView(source),jl=view.getUint32(12,true),g=JSON.parse(new TextDecoder().decode(new Uint8Array(source,20,jl))),binStart=20+jl+8,bl=view.getUint32(20+jl,true);
  const palette=WORLD_MATERIAL_PALETTES[world||'alpine']||{};
  for(const material of g.materials||[]){
   const color=palette[material.name];if(!color)continue;
   const pbr=material.pbrMetallicRoughness||(material.pbrMetallicRoughness={});
   const alpha=pbr.baseColorFactor?.[3]??1;
   pbr.baseColorFactor=[...color,alpha];
  }
  const chunks=[new Uint8Array(source,binStart,bl)];let length=bl;
  function accessor(values,type){const data=new Float32Array(values);const idx=g.bufferViews.length;g.bufferViews.push({buffer:0,byteOffset:length,byteLength:data.byteLength,target:34962});chunks.push(new Uint8Array(data.buffer));length+=data.byteLength;const dim=3,min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<values.length;i++){min[i%dim]=Math.min(min[i%dim],values[i]);max[i%dim]=Math.max(max[i%dim],values[i])}g.accessors.push({bufferView:idx,componentType:5126,count:values.length/3,type,min,max});return g.accessors.length-1}
  items.slice(0,slots.length).forEach((kind,slot)=>triangles(kind,world).forEach(piece=>{
   const pos=[],norm=[],uv=[];for(let i=0;i<piece.verts.length;i+=3){const [a,b,c]=piece.verts.slice(i,i+3),u=b.map((v,j)=>v-a[j]),v=c.map((x,j)=>x-a[j]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n)||1,axis=Math.abs(n[0])>Math.abs(n[1])&&Math.abs(n[0])>Math.abs(n[2])?[1,2]:Math.abs(n[1])>Math.abs(n[2])?[0,2]:[0,1];for(const p of [a,b,c]){pos.push(...p);norm.push(...n.map(x=>x/l));uv.push(p[axis[0]]*4,p[axis[1]]*4)}}
   function uvAccessor(values){const data=new Float32Array(values),idx=g.bufferViews.length;g.bufferViews.push({buffer:0,byteOffset:length,byteLength:data.byteLength,target:34962});chunks.push(new Uint8Array(data.buffer));length+=data.byteLength;const min=[Infinity,Infinity],max=[-Infinity,-Infinity];for(let i=0;i<values.length;i++){const axis=i%2;min[axis]=Math.min(min[axis],values[i]);max[axis]=Math.max(max[axis],values[i])}g.accessors.push({bufferView:idx,componentType:5126,count:values.length/2,type:'VEC2',min,max});return g.accessors.length-1}
   const material=g.materials.length;g.materials.push({name:'Mini '+kind,pbrMetallicRoughness:{baseColorFactor:piece.color,metallicFactor:0,roughnessFactor:.8},doubleSided:true});
   const mesh=g.meshes.length;g.meshes.push({primitives:[{attributes:{POSITION:accessor(pos,'VEC3'),NORMAL:accessor(norm,'VEC3'),TEXCOORD_0:uvAccessor(uv)},material}]});const node=g.nodes.length;g.nodes.push({name:'Added '+kind,mesh,translation:slots[slot]});g.scenes[g.scene||0].nodes.push(node);
  }));
  // Keep the imported meshes and transforms, but use flat, solid materials.
  // Strip every standard glTF texture binding from each material.
  for(const material of g.materials||[]){
   const pbr=material.pbrMetallicRoughness;
   if(pbr){delete pbr.baseColorTexture;delete pbr.metallicRoughnessTexture}
   delete material.normalTexture;
   delete material.occlusionTexture;
   delete material.emissiveTexture;
  }
  g.buffers[0].byteLength=length;let json=new TextEncoder().encode(JSON.stringify(g));const padded=Math.ceil(json.length/4)*4,output=new ArrayBuffer(12+8+padded+8+length),out=new DataView(output),bytes=new Uint8Array(output);out.setUint32(0,0x46546c67,true);out.setUint32(4,2,true);out.setUint32(8,output.byteLength,true);out.setUint32(12,padded,true);out.setUint32(16,0x4e4f534a,true);bytes.fill(32,20,20+padded);bytes.set(json,20);out.setUint32(20+padded,length,true);out.setUint32(24+padded,0x004e4942,true);let cursor=28+padded;for(const chunk of chunks){bytes.set(chunk,cursor);cursor+=chunk.length}return URL.createObjectURL(new Blob([output],{type:'model/gltf-binary'}));
 }
 return {build,maxHeight,slots,triangles};
})();
