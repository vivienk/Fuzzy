// Each placed object is a named glTF node. Objects of the same design share a mesh.
import {propsV1} from "./north-pole-props.mjs";
export const villageEffects=[];
const walks=[[-.85,1.96,.64,.20],[2.10,.92,.30,.52],[-5.27,1.24,.37,.66],[.52,-1.45,.49,.20]];
export function walkingElfPosition(i,t){
  const [cx,cz,rx,rz]=walks[i],phase=t*2*Math.PI/8+i,step=t*2*Math.PI+i;
  return [cx+rx*Math.cos(phase),.025+.021*Math.abs(Math.cos(step)),cz+rz*Math.sin(phase)];
}
export const walkingElfCount=walks.length;
export async function villageGeometry() {
  const original=await propsV1();
  villageEffects.length=0;
  const model = {asset:{version:"2.0"},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:[],buffers:[],bufferViews:[],accessors:[]};
  const parts=[], designs=new Map();
  let data, bytes=0;
  const tau=Math.PI*2;
  const palette={snowShadow:"e2eaf0",rock:"655f56",rockBlue:"4c5663",snow:"fff5ed",ice:"93bfd1",deep:"658ba9",cliff:"807581",shale:"a59aa2",path:"dcc8b9",wood:"a76a45",dark:"603e35",cookie:"d89c65",red:"b9504c",tile:"c7685a",white:"fff0d3",gold:"e6b35e",lit:"ffce76",pine:"527966",spruce:"3c6055",mint:"81a18a",skin:"efbc97",fur:"8e604c",antler:"c39976",black:"3d3534",blush:"d98074"};
  const names=Object.keys(palette);
  for(const [name,hex] of Object.entries(palette)){
    const rgb=hex.match(/../g).map(c=>Math.pow(parseInt(c,16)/255,2.2));
    model.materials.push({name,pbrMetallicRoughness:{baseColorFactor:[...rgb,1],metallicFactor:0,roughnessFactor:.95},doubleSided:true,...(name==="lit"?{emissiveFactor:[.6,.27,.06]}:{})});
  }
  original.materials.forEach(m=>{names.push("Original "+m.name);model.materials.push(m);});
  function prop(name,key,x,z,height,yaw=0){
    place(name,"North Pole v1 "+key,()=>original[key].draw(tri),x,0,z,height,yaw);
    if(original[key].chimney){const [dx,y,dz]=original[key].chimney;villageEffects.push({kind:"smoke",position:[x+dx*height,y*height,z+dz*height]});}
  }
  function accessor(array,bounds,type='VEC3'){
    const buf=new Float32Array(array);
    const view=model.bufferViews.push({buffer:0,byteOffset:bytes,byteLength:buf.byteLength})-1;
    parts.push(buf);bytes+=buf.byteLength;
    return model.accessors.push({bufferView:view,componentType:5126,count:array.length/({SCALAR:1,VEC3:3,VEC4:4}[type]),type,...bounds})-1;
  }
  function tri(color,a,b,c){
    const u=b.map((q,i)=>q-a[i]),v=c.map((q,i)=>q-a[i]);
    const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n);
    if(l<1e-8)return;
    const batch=data[color] ||= {p:[],n:[],min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
    for(const point of [a,b,c]){
      batch.p.push(...point);batch.n.push(...n.map(q=>q/l));
      point.forEach((q,i)=>{batch.min[i]=Math.min(q,batch.min[i]);batch.max[i]=Math.max(q,batch.max[i]);});
    }
  }
  function quad(color,a,b,c,d){tri(color,a,b,c);tri(color,a,c,d);}
  function solid(color,x,y,z,layers,n=10){
    const rings=layers.map(([h,rx,rz,dx=0])=>Array.from({length:n},(_,i)=>[x+dx+rx*Math.cos(tau*i/n),y+h,z+rz*Math.sin(tau*i/n)]));
    for(let k=1;k<rings.length;k++)for(let i=0;i<n;i++){const j=(i+1)%n;quad(color,rings[k-1][i],rings[k][i],rings[k][j],rings[k-1][j]);}
    for(let i=1;i<n-1;i++){tri(color,rings[0][0],rings[0][i],rings[0][i+1]);tri(color,rings.at(-1)[0],rings.at(-1)[i+1],rings.at(-1)[i]);}
  }
  function ball(c,x,y,z,a,b,d,n=10){
    solid(c,x,y,z,[-1,-.72,-.28,.28,.72,1].map(t=>[t*b,a*Math.sqrt(1-t*t),d*Math.sqrt(1-t*t)]),n);
  }
  function box(c,x,y,z,a,b,d){
    const ring=h=>[[-a,h,-d],[a,h,-d],[a,h,d],[-a,h,d]].map(([i,j,k])=>[x+i,y+j,z+k]);
    const p=ring(-b),q=ring(b);
    for(let i=0;i<4;i++){const j=(i+1)%4;quad(c,p[i],q[i],q[j],p[j]);}quad(c,...p);quad(c,...q.reverse());
  }
  function rod(c,a,b,r){
    const d=b.map((q,i)=>q-a[i]),len=Math.hypot(...d); if(!len)return;
    const v=d.map(q=>q/len),u=Math.abs(v[1])>.95?[1,0,0]:[v[2],0,-v[0]],ul=Math.hypot(...u);
    u.forEach((q,i)=>u[i]=q/ul);
    const w=[v[1]*u[2]-v[2]*u[1],v[2]*u[0]-v[0]*u[2],v[0]*u[1]-v[1]*u[0]];
    const pt=(p,i)=>p.map((q,j)=>q+r*(u[j]*Math.cos(i*tau/7)+w[j]*Math.sin(i*tau/7)));
    for(let i=0;i<7;i++)quad(c,pt(a,i),pt(a,i+1),pt(b,i+1),pt(b,i));
  }
  function place(name,design,draw,x=0,y=0,z=0,scale=1,yaw=0){
    if(!designs.has(design)){
      data={};draw();
      const primitives=Object.entries(data).map(([c,b])=>({attributes:{POSITION:accessor(b.p,{min:b.min,max:b.max}),NORMAL:accessor(b.n)},material:names.indexOf(c)}));
      designs.set(design,model.meshes.push({name:design,primitives})-1);
    }
    model.scenes[0].nodes.push(model.nodes.push({name,mesh:designs.get(design),translation:[x,y,z],scale:[scale,scale,scale],rotation:[0,Math.sin(yaw/2),0,Math.cos(yaw/2)]})-1);
  }
  place("Floating island","Faceted snow shelf",()=>{
    const bands=[[0,1],[-.22,1.015],[-.98,.92],[-1.82,.73],[-2.65,.49],[-3.43,.20]];
    const rings=bands.map(([h,s],k)=>Array.from({length:36},(_,i)=>{
      const t=i*tau/36,f=1+.028*Math.cos(t*5)+.027*Math.sin(t*7);
      return [8*s*f*Math.cos(t)+k*.07,1.27*h+(k?.18*Math.sin(t*5+k):0),6.07*s*f*Math.sin(t)-k*.055];
    }));
    const top=rings[0].map(([x,y,z],i)=>[x*.78,.014+.026*Math.sin(i*2.3),z*.78]);
    for(let i=0;i<36;i++){const j=(i+1)%36;
      tri(i%5?"snow":"snowShadow",[0,0,0],top[j],top[i]);
      quad(i%4?"snow":"snowShadow",top[i],top[j],rings[0][j],rings[0][i]);
      for(let k=1;k<bands.length;k++){
        const colors=k===1?["snow","snowShadow"]:["rock",i%3?"rockBlue":"shale"];
        tri(colors[0],rings[k][i],rings[k-1][i],rings[k-1][j]);tri(colors[1],rings[k][i],rings[k-1][j],rings[k][j]);}
      tri("rockBlue",[.57,-5.25,-.36],rings.at(-1)[i],rings.at(-1)[j]);
    }
    for(const [x,y,z,h] of [[-4.2,-.90,4.45,1.78],[-4.5,-.90,4.28,.83],[3.65,-1.26,3.66,1.25],[5.36,-.94,-2.29,1.13]])
      solid("ice",x,y,z,[[-h,.018,.018],[0,.15,.18]],5);
  });
  function peak(){
    const n=11;
    const levels=[[0,1,0],[.43,.68,.05],[.65,.43,-.09],[.84,.24,-.14],[1,.015,-.21]];
    const rim=levels.map(([y,r,dx],k)=>Array.from({length:n},(_,i)=>{
      const a=tau*i/n,noise=1+.12*Math.cos(3*a+.4);
      return [dx+r*noise*Math.cos(a),1.65*(y+(k>0&&k<4?.085*Math.sin(5*a+k):0)),r*.36*noise*Math.sin(a)];
    }));
    for(let k=1;k<rim.length;k++)for(let i=0;i<n;i++){
      const j=(i+1)%n,shade=k<2?(i%3?"rockBlue":"rock"):(i%3?"snow":"ice");
      tri(shade,rim[k-1][i],rim[k][i],rim[k][j]);tri(k>=2&&i%2?"snowShadow":shade,rim[k-1][i],rim[k][j],rim[k-1][j]);
    }
  }
  place("Glacier summit","Folded alpine peak",peak,-1.34,0,-4.10,2.75,.08);
  place("Glacier shoulder","Folded alpine peak",peak,1.12,0,-4.02,1.84,.6);
  place("Packed snow around the square","Village paths",()=>{
    const curve=t=>[2.8*Math.cos(t),.011,1.70*Math.sin(t)];
    for(let i=0;i<60;i++){
      const t=i*tau/60,u=(i+1)*tau/60;
      const edge=(t,r)=>{const [x,y,z]=curve(t);return [x+r*Math.cos(t),y,z+r*Math.sin(t)];};
      quad("path",edge(t,-.12),edge(u,-.12),edge(u,.12),edge(t,.12));
    }
  });
  place("Frozen inlet","Ice floes",()=>{
    const shore=[[4.79,.014,.91],[5.85,.014,.36],[6.18,.014,1.10],[5.83,.014,1.86],[5.30,.014,2.50],[4.7,.014,2.86],[4.55,.014,2.36]];
    for(let i=0;i<shore.length;i++)tri(i%3?"ice":"deep",[5.2,.02,1.6],shore[(i+1)%shore.length],shore[i]);
  });
  function windowAt(x,y,z){
    box("dark",x,y,z,.20,.22,.027);box("lit",x,y,z+.035,.148,.168,.012);
    box("cookie",x,y,z+.052,.015,.17,.012);box("cookie",x,y,z+.052,.15,.017,.012);
    box("white",x,y+.22,z+.04,.23,.035,.05);
  }
  function cottage(){
    box("wood",0,.48,0,.83,.48,.70);
    for(const z of [-.70,.70])tri("cookie",[-.83,.94,z],[.83,.94,z],[0,1.69,z]);
    for(const s of [-1,1]){
      const x=s*.98;
      quad("red",[0,1.74,-.85],[0,1.74,.85],[x,.87,.85],[x,.87,-.85]);
      for(let j=0;j<4;j++)for(let k=0;k<5;k++){
        const t=(k+.44)/5,z=-.68+j*.42;
        ball((j+k)%3?"tile":"red",s*t*.96,1.75-t*.87,z,.115,.060,.24,8);
      }
      rod("white",[0,1.79,.85],[x,.92,.85],.07);
      for(let i=0;i<8;i++)ball("white",x,.89,-.76+i*.216,.09,.085+(i%3)*.024,.12,7);
    }
    box("cookie",0,.10,0,.88,.10,.73);box("dark",0,.37,.722,.215,.36,.04);
    ball("pine",0,.54,.79,.105,.105,.032);ball("gold",.13,.34,.78,.027,.027,.023);
    for(const x of [-.52,.52])windowAt(x,.55,.715);
    windowAt(0,1.21,.71);
    for(const s of [-1,1]){box("lit",s*.836,.55,0,.019,.17,.21);box("dark",s*.855,.55,0,.014,.17,.018);}
    box("wood",.44,1.52,-.38,.13,.36,.14);box("snow",.44,1.90,-.38,.17,.051,.18);
    for(const x of [-.78,.78])for(let i=0;i<6;i++)ball(i%2?"red":"white",x,.20+i*.13,.713,.057,.083,.056,7);
  }
  const homes=[[-3.8,.75,.32],[-2.25,-2.28,.17],[.28,-2.30,-.12],[2.66,-1.98,-.32],[4.17,.36,-.49]];
  homes.forEach(([x,z,r],i)=>place("Gingerbread cottage "+(i+1),"Iced gingerbread gable",cottage,x,0,z,.85+i%2*.10,r));
  function evergreen(decorated){
    solid("wood",0,0,0,[[0,.16,.16],[.70,.17,.17]]);
    for(let i=0;i<4;i++){const y=.35+i*.54,r=1.17-i*.21;
      solid(i%2?"spruce":"pine",0,y,0,[[0,r*.85,r*.85],[.12,r,r],[.33,r*.83,r*.83],[.96,r*.11,r*.11],[1.07,0,0]],13);
      if(!decorated)solid("snow",0,y+.20,0,[[0,r*.92,r*.92],[.14,r*.79,r*.79],[.89,0,0]],13);
      if(decorated){let prev;
        for(let j=0;j<=36;j++){const a=tau*j/36,rr=r*(.89+.05*Math.cos(3*a)),p=[rr*Math.cos(a),y+.23+.079*Math.cos(6*a),rr*Math.sin(a)];
          if(prev)rod("gold",prev,p,.022);prev=p;
          if(j%3===1)ball(j%2?"red":"lit",p[0]*1.02,p[1]-.04,p[2]*1.02,.075,.094,.075,8);
        }
      }
    }
    if(decorated){const ring=Array.from({length:10},(_,i)=>{const a=i*Math.PI/5,r=i%2?.13:.29;return [r*Math.sin(a),3.23+r*Math.cos(a),0];});
      for(let i=0;i<10;i++)for(const z of [-.074,.074])tri("lit",[0,3.23,z],ring[i],ring[(i+1)%10]);}
  }
  place("Christmas tree · star, golden garlands and baubles","Village Christmas tree",()=>evergreen(true),0,0,.05,1.08);
  for(const [i,[x,z,s]] of [[-5,-1.3,.56],[-4.8,-2.4,.7],[4.3,-2.55,.60],[5.2,-1.45,.72],[-1.36,-3.55,.54]].entries())
    place("Snow pine "+(i+1),"Frosted pine",()=>evergreen(false),x,0,z,s);
  place("North Pole clock tower","Timber clock tower",()=>{
    box("wood",0,1,0,.47,1,.44);box("cookie",0,2.14,0,.55,.37,.51);
    for(const s of [-1,1]){box("dark",s*.4,1,.42,.056,1,.05);box("white",0,1.78,0,.57,.05,.53);}
    for(const z of [-.52,.52]){ball("gold",0,2.17,z,.31,.31,.04);ball("white",0,2.17,z*1.06,.254,.254,.02);
      rod("dark",[0,2.17,z*1.11],[.13,2.23,z*1.11],.026);rod("dark",[0,2.17,z*1.11],[0,2.36,z*1.11],.022);}
    solid("red",0,2.51,0,[[0,.82,.82],[.85,.045,.045]],4);solid("snow",0,2.82,0,[[0,.56,.56],[.58,0,0]],4);ball("gold",0,3.44,0,.095,.13,.095);
  },-4.08,0,-1.65,1.07,.15);
  function elf(coat,working=false,walking=false){
    if(!walking)for(const s of [-1,1]){ball("dark",s*.13,.09,.045,.115,.085,.17);ball("white",s*.12,.195,0,.074,.13,.075);}
    solid(coat,0,.19,0,[[0,.245,.18],[.15,.235,.17],[.35,.16,.14]],11);
    box("dark",0,.33,.142,.20,.036,.033);box("gold",0,.33,.184,.043,.032,.016);
    for(const s of [-1,1]){if(!working){rod(coat,[s*.16,.47,0],[s*.31,.33,.09],.077);ball("skin",s*.31,.33,.09,.078,.074,.078);}
      ball("skin",s*.232,.70,0,.085,.09,.05);}
    ball("skin",0,.71,0,.24,.24,.216,12);for(const x of [-.086,.086])ball("black",x,.73,.194,.028,.036,.021);
    ball("skin",0,.674,.219,.055,.043,.046);solid("red",0,.875,0,[[0,.245,.22],[.09,.23,.20],[.23,.14,.12,-.055],[.34,.04,.04,-.16]],11);
    ball("white",-.18,1.20,0,.064,.063,.061);solid("white",0,.86,0,[[0,.25,.22],[.072,.246,.219]],11);
  }
  function moose(){
    for(const s of [-1,1])for(const end of [-1,1]){
      const x=end*.40,z=s*.17;rod("fur",[x,.80,z],[x+end*.065,.15,z],.089);ball("dark",x+end*.065,.09,z,.125,.09,.107);
    }
    ball("fur",0,.83,0,.61,.33,.255);ball("fur",.33,1.02,0,.30,.39,.24);ball("fur",.59,1.24,0,.27,.28,.20);
    ball("wood",.80,1.16,0,.26,.17,.18);ball("dark",.98,1.19,0,.065,.075,.15);
    for(const s of [-1,1]){ball("black",.68,1.32,s*.18,.036,.038,.024);
      ball("fur",.46,1.46,s*.19,.10,.11,.063);
      rod("antler",[.52,1.43,s*.13],[.36,1.59,s*.35],.048);
      ball("antler",.32,1.63,s*.39,.23,.09,.12);
      for(let i=0;i<4;i++){const x=.14+i*.108;rod("antler",[x,1.64,s*.40],[x-.04,1.78+.05*Math.sin(i),s*.50],.032);}
    }
    ball("fur",-.59,.95,0,.105,.09,.088);
  }
  place("Adult moose","Moose with palmate antlers",moose,2.84,0,2.67,1.03,-1.07);
  place("Moose calf","Moose with palmate antlers",moose,4.06,0,2.10,.73,-.78);
  for(const [i,[x,z]] of [[-1.1,.69],[.99,.72],[.65,1.02]].entries())place("Wrapped gift "+(i+1),"Ribbon parcel "+i,()=>{
    box(i%2?"mint":"red",0,.15,0,.22,.15,.17);box("gold",0,.155,0,.043,.156,.174);box("gold",0,.31,0,.22,.014,.04);
  },x,.002,z,.88,i*.6);
  // Open-front toy shop on the near side gives the workbench a clear sightline.
  const shopX=-2.20,shopZ=2.96;
  prop("Santa's workshop","workshop",shopX,shopZ-.40,2.5625);
  prop("North Pole entrance sign","sign",1.46,3.65,1.43,.28);
  [[-3.52,2.76],[-.81,2.72],[1.50,-1.35],[3.16,.18]].forEach(([x,z],i)=>prop("Peppermint cane "+(i+1),"cane",x,z,.90,.16));
  place("Gift wrapping bench","Ribbon cutting table",()=>{
    box("cookie",0,.45,0,.84,.055,.19);
    for(const x of [-.73,.73])for(const z of [-.14,.14])box("dark",x,.28,z,.043,.19,.042);
    box("mint",.02,.51,0,.16,.01,.13);
  },shopX,.025,shopZ+.84);
  prop("Ice igloo by the inlet","igloo",5.61,-.65,1.23,.26);
  prop("Little ice igloo","igloo",.05,3.64,1.14,.52);
  const animation={name:"Workshop and chimney loops",channels:[],samplers:[]};
  function motion(node,path,times,values){
    const input=accessor(times,{min:[times[0]],max:[times.at(-1)]},"SCALAR");
    const sampler=animation.samplers.push({input,output:accessor(values.flat(),{},path==="rotation"?"VEC4":"VEC3"),interpolation:"LINEAR"})-1;
    animation.channels.push({sampler,target:{node,path}});
  }
  // Sample each action across the existing 24-second village loop.
  const frames=Array.from({length:193},(_,k)=>k/8);
  const pitch=a=>[Math.sin(a/2),0,0,Math.cos(a/2)];
  const roll=a=>[0,0,Math.sin(a/2),Math.cos(a/2)];
  function track(id,path,sample){motion(id,path,frames,frames.map(sample));}
  walks.forEach(([cx,cz,rx,rz],i)=>{
    const coat=i%2?"red":"pine",phase=t=>t*tau/8+i,step=t=>t*tau+i;
    place("Walking elf "+(i+1),"Walker "+coat,()=>elf(coat,true,true),cx,0,cz,.79);
    const body=model.nodes.length-1;
    model.nodes[body].children=[];
    track(body,"translation",t=>walkingElfPosition(i,t));
    let previous;
    track(body,"rotation",t=>{
      const a=Math.atan2(-rx*Math.sin(phase(t)),rz*Math.cos(phase(t)));
      let q=[0,Math.sin(a/2),0,Math.cos(a/2)];
      if(previous&&previous[1]*q[1]+previous[3]*q[3]<0)q=q.map(v=>-v);
      previous=q;return q;
    });
    for(const side of [-1,1]){
      place("Walking boot","Boot and stocking",()=>{
        ball("white",0,-.066,0,.074,.13,.075);
        ball("dark",0,-.17,.045,.115,.085,.17);
      },side*.13,.26,0);
      const leg=model.scenes[0].nodes.pop();model.nodes[body].children.push(leg);
      track(leg,"rotation",t=>pitch(side*.66*Math.sin(step(t))));
      place("Swinging arm","Swinging sleeve "+coat+side,()=>{
        rod(coat,[0,0,0],[side*.11,-.16,.065],.077);
        ball("skin",side*.11,-.16,.065,.078,.074,.078);
      },side*.16,.47,0);
      const arm=model.scenes[0].nodes.pop();model.nodes[body].children.push(arm);
      track(arm,"rotation",t=>pitch(-side*.52*Math.sin(step(t))));
    }
  });
  for(const [i,offset] of [-.46,.44].entries()){
    const x=shopX+offset,z=shopZ+.49,parcelZ=shopZ+.84;
    const paper=i?"pine":"red";
    const cycle=t=>(t+i*3)%8;
    const ease=(v)=>{const u=Math.max(0,Math.min(1,v));return u*u*(3-2*u);};
    const fold=(t,delay)=>ease((cycle(t)-delay)/1.35)*(1-ease((cycle(t)-6.8)/1.2));
    place("Gift maker "+(i+1),"Seated gift maker "+i,()=>elf(paper,true),x,.14,z,.77);
    place("Parcel to wrap "+(i+1),"Paper parcel "+paper,()=>{
      box(paper,0,.075,0,.115,.075,.109);
      box("cookie",0,.153,0,.109,.005,.103);
    },x,.535,parcelZ);
    for(const side of [-1,1]){
      const delay=side<0?.6:2.15;
      place("Wrapping paper flap","Paper flap "+paper+side,()=>{
        box(paper,side*.062,0,0,.062,.006,.111);
      },x+side*.115,.699+(side>0?.01:0),parcelZ);
      track(model.nodes.length-1,"rotation",t=>roll(side*Math.PI*fold(t,delay)));
      const start=[x+side*.14,.50,z+.035];
      place("Gift maker wrapping sleeve","Wrapping sleeve "+i+" "+side,()=>{
        rod(paper,[0,0,0],[0,0,.215],.060);
        ball("skin",0,0,.24,.062,.06,.06);
      },...start);
      const arm=model.nodes.length-1;
      function reach(t){
        const f=fold(t,delay),angle=f*Math.PI;
        return [x+side*(.115+.082*Math.cos(angle))-start[0],.70+.082*Math.sin(angle)-start[1],parcelZ+.023*f-start[2]];
      }
      track(arm,"rotation",t=>{
        const [dx,dy,dz]=reach(t),w=Math.hypot(dx,dy,dz)+dz,n=Math.hypot(dx,dy,w);
        return [-dy/n,dx/n,0,w/n];
      });
      track(arm,"scale",t=>[1,1,Math.hypot(...reach(t))/.24]);
    }
    place("Finishing ribbon","Gold bow",()=>{
      box("gold",0,0,0,.025,.008,.112);
      for(const side of [-1,1])ball("gold",side*.044,.029,0,.051,.026,.027);
    },x,.725,parcelZ);
    track(model.nodes.length-1,"scale",t=>{const v=Math.max(.001,fold(t,4));return [v,v,v];});
  }
  const rx=7.18,rz=5.44;
  function railPoint(t,side=0){
    const c=Math.cos(t),v=Math.sin(t),n=Math.hypot(rz*c,rx*v);
    return [rx*c+side*rz*c/n,.099,rz*v+side*rx*v/n];
  }
  place("Perimeter railway","Snowbound railway tracks",()=>{
    for(let i=0;i<144;i++){
      const t=tau*i/144,u=tau*(i+1)/144;
      for(const side of [-.19,.19])rod("rockBlue",railPoint(t,side),railPoint(u,side),.032);
      if(i%2===0){const a=railPoint(t,-.31),b=railPoint(t,.31);a[1]=b[1]=.065;rod("wood",a,b,.054);}
    }
  });
  function rollingStock(engine){
    box("dark",0,.30,0,.65,.09,.29);
    for(const x of [-.43,.43])for(const z of [-.24,.24]){
      ball("black",x,.205,z,.15,.15,.072);
      ball("gold",x,.205,z*1.24,.065,.065,.025);
    }
    if(engine){
      ball("red",.16,.63,0,.49,.255,.245);
      solid("dark",.40,.77,0,[[0,.078,.078],[.26,.09,.09],[.36,.135,.135]],9);
      box("red",-.38,.70,0,.235,.30,.25);
      for(const side of [-1,1])box("lit",-.38,.81,side*.253,.14,.12,.012);
      box("spruce",-.38,1.04,0,.31,.055,.31);
      ball("lit",.62,.67,0,.079,.086,.083);
    }else{
      box("red",0,.62,0,.61,.26,.255);
      box("spruce",0,.925,0,.665,.056,.303);
      box("snow",0,.985,0,.60,.025,.28);
      for(const side of [-1,1]){
        for(const x of [-.40,0,.40])box("lit",x,.698,side*.26,.115,.105,.012);
        for(let i=0;i<16;i++)ball("pine",-.55+i*.073,.535-.035*Math.cos(i*tau/8),side*.274,.063,.048,.037,7);
        for(const x of [-.40,.40]){
          ball("red",x-.044,.55,side*.303,.070,.043,.024);ball("red",x+.044,.55,side*.303,.070,.043,.024);
          ball("gold",x,.55,side*.32,.035,.032,.018);
        }
      }
    }
  }
  for(let car=0;car<3;car++){
    const shift=car*1.44;
    // Partition the oval by arc length to keep the couplers at a constant spacing.
    const samples=360,dist=[0];
    for(let i=1;i<=samples;i++){const a=railPoint((i-1)*tau/samples),b=railPoint(i*tau/samples);dist.push(dist[i-1]+Math.hypot(b[0]-a[0],b[2]-a[2]));}
    const length=dist.at(-1),times=[],points=[],turns=[];
    let prev;
    for(let i=0;i<=120;i++){
      const d=((.18+i/120)*length-shift+length)%length;
      let k=1;while(k<samples&&dist[k]<d)k++;
      const t=(k-1+(d-dist[k-1])/(dist[k]-dist[k-1]))*tau/samples;
      const p=railPoint(t);p[1]=.09;
      const yaw=Math.atan2(-rz*Math.cos(t),-rx*Math.sin(t));
      let q=[0,Math.sin(yaw/2),0,Math.cos(yaw/2)];
      if(prev&&q[1]*prev[1]+q[3]*prev[3]<0)q=q.map(v=>-v);
      times.push(i/5);points.push(p);turns.push(q);prev=q;
    }
    place(car?"Christmas carriage "+car:"Christmas locomotive",car?"Garland carriage":"Peppermint engine",()=>rollingStock(!car),...points[0]);
    const id=model.nodes.length-1;model.nodes[id].rotation=turns[0];
    motion(id,"translation",times,points);
    const input=accessor(times,{min:[0],max:[24]},"SCALAR"),output=accessor(turns.flat(),{},"VEC4");
    const sampler=animation.samplers.push({input,output,interpolation:"LINEAR"})-1;
    animation.channels.push({sampler,target:{node:id,path:"rotation"}});
  }
  const chimneys=homes.map(([x,z,r],i)=>{
    const s=.85+i%2*.10;
    return [x+s*(.44*Math.cos(r)-.38*Math.sin(r)),1.95*s,z+s*(-.44*Math.sin(r)-.38*Math.cos(r))];
  });
  chimneys.forEach(position=>villageEffects.push({kind:"smoke",position}));
  homes.forEach(([x,z,r],i)=>{
    const s=.85+i%2*.10;
    for(const dx of [-.52,.52])villageEffects.push({kind:"window",position:[x+s*(dx*Math.cos(r)+.77*Math.sin(r)),.55*s,z+s*(-dx*Math.sin(r)+.77*Math.cos(r))],normal:[Math.sin(r),0,Math.cos(r)]});
  });
  villageEffects.push({kind:"star",position:[0,3.49,.05]});
  model.animations=[animation];
  model.buffers.push({byteLength:bytes});
  const json=new TextEncoder().encode(JSON.stringify(model)),size=(json.length+3)&~3,out=new Uint8Array(28+size+bytes);
  const view=new DataView(out.buffer);[0x46546c67,2,out.length,size,0x4e4f534a].forEach((v,i)=>view.setUint32(i*4,v,true));
  out.fill(32,20,20+size);out.set(json,20);view.setUint32(20+size,bytes,true);view.setUint32(24+size,0x004e4942,true);
  let offset=28+size;for(const batch of parts){out.set(new Uint8Array(batch.buffer),offset);offset+=batch.byteLength;}
  return out.buffer;
}
