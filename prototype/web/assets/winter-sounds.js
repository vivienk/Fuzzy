// Procedural winter ambience: airy wind, sparse sleigh bells and snowy footsteps.
// No melody, chords, external recordings or automatic playback.
(()=>{
 const button=document.getElementById('winter-sound'),volume=document.getElementById('sound-volume');
 let ctx,master,noise,timer,playing=false,nextBell=0,nextSteps=0,epoch=0;
 const sources=new Set();
 const random=(a,b)=>a+Math.random()*(b-a);
 function track(source,nodes){
  sources.add(source);source.onended=()=>{sources.delete(source);source.disconnect();nodes.forEach(n=>n.disconnect())};
 }
 function envelope(time,peak,attack,duration){
  const gain=ctx.createGain();gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(peak,time+attack);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);return gain;
 }
 function hiss(time,duration,peak,frequency,type='bandpass',pan=0){
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=envelope(time,peak,.025,duration),stereo=ctx.createStereoPanner();
  source.buffer=noise;filter.type=type;filter.frequency.value=frequency;filter.Q.value=.55;stereo.pan.value=pan;
  source.connect(filter);filter.connect(gain);gain.connect(stereo);stereo.connect(master);track(source,[filter,gain,stereo]);source.start(time,random(0,1));source.stop(time+duration);
 }
 function bells(time){
  // Inharmonic partials make a tiny shaken bell, not a pitched song.
  for(let shake=0;shake<3;shake++)for(const [frequency,level] of [[1900,.022],[2873,.014],[4181,.009]]){
   const source=ctx.createOscillator(),start=time+shake*.13,gain=envelope(start,level,.004,.45);
   source.frequency.value=frequency*random(.97,1.03);source.connect(gain);gain.connect(master);track(source,[gain]);source.start(start);source.stop(start+.48);
  }
 }
 function footsteps(time){
  for(let i=0;i<4;i++){
   const start=time+i*random(.60,.68),pan=i%2? .18:-.18;
   hiss(start,.29,.12,1400,'bandpass',pan); // granular snow crunch
   hiss(start+.07,.20,.07,300,'lowpass',pan); // soft compacting snow
  }
 }
 function beginWind(){
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
  source.buffer=noise;source.loop=true;filter.type='lowpass';filter.frequency.value=650;gain.gain.value=.075;
  source.connect(filter);filter.connect(gain);gain.connect(master);track(source,[filter,gain]);source.start();
 }
 function schedule(){
  if(!playing||document.hidden)return;
  const now=ctx.currentTime;
  if(now+.2>=nextBell){bells(Math.max(now+.02,nextBell));nextBell=now+random(9,15)}
  if(now+.2>=nextSteps){footsteps(Math.max(now+.02,nextSteps));nextSteps=now+random(13,20)}
 }
 function stop(){
  clearInterval(timer);for(const source of [...sources]){try{source.stop()}catch{}}sources.clear();
 }
 async function start(){
  const ticket=++epoch;await ctx.resume();if(ticket!==epoch||!playing||document.hidden)return;
  stop();master.gain.setValueAtTime(0,ctx.currentTime);master.gain.linearRampToValueAtTime(Number(volume.value)/100,ctx.currentTime+.7);
  beginWind();nextBell=ctx.currentTime+.6;nextSteps=ctx.currentTime+3;schedule();timer=setInterval(schedule,100);
 }
 function label(){button.textContent=playing?'❄ Winter sounds on':'❄ Play winter sounds';button.setAttribute('aria-pressed',String(playing))}
 function fail(){playing=false;++epoch;stop();button.textContent='Sounds unavailable — try again';button.setAttribute('aria-pressed','false')}
 button.addEventListener('click',async()=>{
  button.disabled=true;
  try{
   if(!ctx){ctx=new(window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.connect(ctx.destination);
    noise=ctx.createBuffer(1,ctx.sampleRate*8,ctx.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
   }
   playing=!playing;
   if(playing)await start();else{++epoch;stop();await ctx.suspend()}
   label();
  }catch{fail()}finally{button.disabled=false}
 });
 volume.addEventListener('input',()=>{if(master)master.gain.setTargetAtTime(Number(volume.value)/100,ctx.currentTime,.1)});
 document.addEventListener('visibilitychange',()=>{
  if(!ctx||!playing)return;
  if(document.hidden){++epoch;stop();ctx.suspend().catch(fail)}else start().catch(fail);
 });
 window.addEventListener('pagehide',()=>{playing=false;++epoch;stop();if(ctx)ctx.suspend().catch(()=>{})});
})();
