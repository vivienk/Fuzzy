// Original looping music-box score: celesta, soft chords and sleigh bells.
(()=>{
 const button=document.getElementById('music'),volume=document.getElementById('music-volume');
 let ctx,master,timer,next=0,step=0,playing=false;
 const melody=[79,83,86,83,81,79,76,74,76,79,84,83,81,79,78,74,79,83,86,88,86,83,81,79,76,79,81,78,74,78,79,null];
 const chords=[[55,59,62],[52,55,59],[48,52,55],[50,54,57]];
 function tone(note,time,duration,gain,kind='sine'){
  const osc=ctx.createOscillator(),env=ctx.createGain();osc.type=kind;osc.frequency.value=440*2**((note-69)/12);
  env.gain.setValueAtTime(0,time);env.gain.linearRampToValueAtTime(gain,time+.015);env.gain.exponentialRampToValueAtTime(.0001,time+duration);
  osc.connect(env);env.connect(master);osc.start(time);osc.stop(time+duration+.03);osc.onended=()=>{osc.disconnect();env.disconnect()};
 }
 function schedule(){
  if(!playing||document.hidden)return;
  while(next<ctx.currentTime+.2){
   const n=melody[step%32];if(n!==null){tone(n,next,1.8,.20);tone(n+12,next,.7,.035);}
   if(step%8===0)chords[Math.floor(step/8)%4].forEach(n=>tone(n,next,4,.055,'triangle'));
   if(step%2===0)[98,105,110].forEach(n=>tone(n,next,.13,.012));
   next+=.5;step++;
  }
 }
 function label(){button.textContent=playing?'♫ Music on':'♫ Play Christmas music';button.setAttribute('aria-pressed',String(playing));}
 button.addEventListener('click',async()=>{
  button.disabled=true;
  try{
   if(!ctx){ctx=new(window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=Number(volume.value)/100;master.connect(ctx.destination);}
   if(playing){playing=false;clearInterval(timer);await ctx.suspend();}
   else{await ctx.resume();playing=true;next=ctx.currentTime+.05;schedule();timer=setInterval(schedule,100);}
   label();
  }catch(e){playing=false;clearInterval(timer);button.textContent='Music unavailable — try again';button.setAttribute('aria-pressed','false');}
  finally{button.disabled=false;}
 });
 volume.addEventListener('input',()=>{if(master)master.gain.setTargetAtTime(Number(volume.value)/100,ctx.currentTime,.08)});
 document.addEventListener('visibilitychange',()=>{
  if(!ctx||!playing)return;
  if(document.hidden){clearInterval(timer);ctx.suspend();}
  else ctx.resume().then(()=>{next=ctx.currentTime+.05;schedule();clearInterval(timer);timer=setInterval(schedule,100)}).catch(()=>{playing=false;label()});
 });
})();
