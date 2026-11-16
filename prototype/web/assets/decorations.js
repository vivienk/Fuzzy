/* Small procedural GLB additions. Dimensions are metres in the existing scene. */
window.FuzzyDecorations=(()=>{
 const slots=[[-.68,.135,.55],[-.46,.135,.58],[-.08,.135,.40]];
 const maxHeight=.24; // Mailbox rises .2775 m above its .10 m base.
 const cache=new Map();
 async function base(url){if(!cache.has(url))cache.set(url,fetch(url+'?v=snow-walk-1').then(r=>{if(!r.ok)throw Error('World unavailable');return r.arrayBuffer()}));return cache.get(url)}
 function triangles(kind,world){
  const pieces=[];const add=(verts,color)=>pieces.push({verts,color});
  function box(x,y,z,w,h,d,color){const p=[[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y+h,z-d/2],[x-w/2,y+h,z-d/2],[x-w/2,y,z+d/2],[x+w/2,y,z+d/2],[x+w/2,y+h,z+d/2],[x-w/2,y+h,z+d/2]];add([...[0,3,2,0,2,1,4,5,6,4,6,7,0,4,7,0,7,3,1,2,6,1,6,5,3,7,6,3,6,2,0,1,5,0,5,4].map(i=>p[i])],color)}
  function cone(x,y,z,r,h,color){let v=[];for(let i=0;i<10;i++){let a=i*Math.PI/5,b=(i+1)*Math.PI/5;v.push([x+r*Math.cos(a),y,z+r*Math.sin(a)],[x,y+h,z],[x+r*Math.cos(b),y,z+r*Math.sin(b)])}add(v,color)}
  function ball(x,y,z,r,color){let v=[];const p=(a,b)=>[x+r*Math.sin(a)*Math.cos(b),y+r*Math.cos(a),z+r*Math.sin(a)*Math.sin(b)];for(let i=0;i<6;i++)for(let j=0;j<10;j++){let a=i*Math.PI/6,b=j*Math.PI/5,c=(i+1)*Math.PI/6,d=(j+1)*Math.PI/5;v.push(p(a,b),p(c,b),p(c,d),p(a,b),p(c,d),p(a,d))}add(v,color)}
  const palette={forest:{white:[.91,.88,1,1],red:[.48,.23,.65,1],gold:[.78,.65,1,1],fur:[.68,.60,.78,1],antler:[.86,.78,1,1]},aurora:{white:[.94,.93,.89,1],red:[.48,.07,.07,1],gold:[.72,.48,.19,1],fur:[.57,.41,.28,1],antler:[.77,.84,.72,1]},alpine:{white:[.98,.97,.92,1],red:[.72,.07,.12,1],gold:[1,.65,.2,1],fur:[.47,.25,.12,1],antler:[.72,.51,.28,1]}}[world||'alpine'];
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
 async function build(lit,items,world,wrapped=false){
  const source=await base(wrapped?'assets/gift.glb':['forest','aurora','alpine'].includes(world)?`assets/worlds/${world}${lit?'-lit':''}.glb`:(lit?'assets/world.glb':'assets/world-unlit.glb')),view=new DataView(source),jl=view.getUint32(12,true),g=JSON.parse(new TextDecoder().decode(new Uint8Array(source,20,jl))),binStart=20+jl+8,bl=view.getUint32(20+jl,true);
  if(wrapped){
   const colors={forest:[[.48,.23,.65,1],[.78,.65,1,1]],aurora:[[.48,.07,.07,1],[.72,.48,.19,1]],alpine:[[.72,.07,.12,1],[1,.65,.2,1]]}[world||'alpine'];
   for(const material of g.materials){if(material.name==='Cranberry')material.pbrMetallicRoughness.baseColorFactor=colors[0];if(material.name==='Champagne gold')material.pbrMetallicRoughness.baseColorFactor=colors[1]}
  }
  const chunks=[new Uint8Array(source,binStart,bl)];let length=bl;
  function accessor(values,type){const data=new Float32Array(values);const idx=g.bufferViews.length;g.bufferViews.push({buffer:0,byteOffset:length,byteLength:data.byteLength,target:34962});chunks.push(new Uint8Array(data.buffer));length+=data.byteLength;const dim=3,min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<values.length;i++){min[i%dim]=Math.min(min[i%dim],values[i]);max[i%dim]=Math.max(max[i%dim],values[i])}g.accessors.push({bufferView:idx,componentType:5126,count:values.length/3,type,min,max});return g.accessors.length-1}
  items.slice(0,slots.length).forEach((kind,slot)=>triangles(kind,world).forEach(piece=>{
   const pos=[],norm=[];for(let i=0;i<piece.verts.length;i+=3){const [a,b,c]=piece.verts.slice(i,i+3),u=b.map((v,j)=>v-a[j]),v=c.map((x,j)=>x-a[j]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n)||1;for(const p of [a,b,c]){pos.push(...p);norm.push(...n.map(x=>x/l))}}
   const material=g.materials.length;g.materials.push({name:'Mini '+kind,pbrMetallicRoughness:{baseColorFactor:piece.color,metallicFactor:0,roughnessFactor:.8},doubleSided:true});
   const mesh=g.meshes.length;g.meshes.push({primitives:[{attributes:{POSITION:accessor(pos,'VEC3'),NORMAL:accessor(norm,'VEC3')},material}]});const node=g.nodes.length;g.nodes.push({name:'Added '+kind,mesh,translation:slots[slot]});g.scenes[g.scene||0].nodes.push(node);
  }));
  g.buffers[0].byteLength=length;let json=new TextEncoder().encode(JSON.stringify(g));const padded=Math.ceil(json.length/4)*4,output=new ArrayBuffer(12+8+padded+8+length),out=new DataView(output),bytes=new Uint8Array(output);out.setUint32(0,0x46546c67,true);out.setUint32(4,2,true);out.setUint32(8,output.byteLength,true);out.setUint32(12,padded,true);out.setUint32(16,0x4e4f534a,true);bytes.fill(32,20,20+padded);bytes.set(json,20);out.setUint32(20+padded,length,true);out.setUint32(24+padded,0x004e4942,true);let cursor=28+padded;for(const chunk of chunks){bytes.set(chunk,cursor);cursor+=chunk.length}return URL.createObjectURL(new Blob([output],{type:'model/gltf-binary'}));
 }
 return {build,maxHeight,slots,triangles};
})();
