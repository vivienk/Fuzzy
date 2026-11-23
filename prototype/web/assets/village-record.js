(()=>{
 const byId=id=>document.getElementById(id);
 const picker=byId('christmas-album'),disc=byId('disc'),host=byId('album-player'),status=byId('album-status'),link=byId('open-album');
 const gift=new URLSearchParams(location.hash.slice(1));
 let controller=null,sdk=null,version=0,playing=false,pending=false;
 let wantsPlay=false, audio=null;
 const spotifyId=()=>picker.selectedOptions[0].dataset.spotify;
 function display(active){
  playing=active;
  disc.parentElement.classList.toggle('playing',active);
  disc.setAttribute('aria-label',active?'Pause record':'Play record');
  disc.querySelector('.disc-symbol').textContent=active?'Ⅱ':'▶';
 }
 function stop(){
  version++;pending=false;wantsPlay=false;controller?.destroy();controller=null;
  if(audio){audio.pause();audio.removeAttribute("src");audio.load();audio=null;}
  host.replaceChildren();host.hidden=true;display(false);
 }
 function select(){
  stop();const id=spotifyId();
  link.hidden=!id;
  if(id)link.href='https://open.spotify.com/album/'+id;
  status.textContent='Tap the record to play.';
  const src=picker.selectedOptions[0].dataset.audio;
  if(!src){prepareAlbum();return;}
  const player=document.createElement('audio');
  audio=player;
  player.controls=true;player.loop=true;player.preload='metadata';
  player.src=src;player.style.width='100%';
  player.setAttribute('aria-label',picker.selectedOptions[0].textContent);
  for(const event of ['playing','pause','error'])player.addEventListener(event,()=>{
   if(audio!==player)return;
   retryOnGesture=false;
   if(event==='pause')useDefault=false;
   display(event==='playing');
   status.textContent=event==='playing'?'Playing in the background.':event==='pause'?'Playback paused.':'This track could not load.';
  });
  host.hidden=false;host.replaceChildren(player);
 }
 function getSDK(){
  if(!sdk)sdk=new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   const fail=()=>{clearTimeout(timer);sdk=null;script.remove();reject(new Error('Spotify unavailable'));};
   const timer=setTimeout(fail,12000);
   window.onSpotifyIframeApiReady=api=>{clearTimeout(timer);resolve(api);};
   script.onerror=fail;script.src='https://open.spotify.com/embed/iframe-api/v1';document.head.append(script);
  });
  return sdk;
 }
 async function prepareAlbum(){
  if(pending||controller)return;
  const ticket=version;
  pending=true;
  try{
   const api=await getSDK();if(version!==ticket)return;
   const mount=document.createElement('div');host.hidden=false;host.replaceChildren(mount);
   api.createController(mount,{uri:'spotify:album:'+spotifyId(),height:352,width:'100%'},player=>{
    if(version!==ticket){player.destroy();return;}
    controller=player;
    player.addListener('ready',()=>{if(version!==ticket)return;pending=false;if(wantsPlay){status.textContent='Press Play in Spotify if needed.';player.play();}});
    player.addListener('playback_update',({data})=>{if(version===ticket){pending=false;display(!data.isPaused);status.textContent=playing?'Playing in the background.':'Playback paused.';}});
   });
  }catch{if(version===ticket){pending=false;display(false);status.textContent='Spotify could not play. Try again or open the album in Spotify.';}}
 }
 function play(){
  if(audio){const player=audio;if(!player.paused)player.pause();else player.play().catch(()=>{if(audio===player)status.textContent="Tap Play to start the music.";});return;}
  if(playing){controller?.pause();return;}
  wantsPlay=true;
  if(controller&&!pending){controller.play();return;}
  status.textContent='Loading album…';prepareAlbum();
 }
 picker.querySelector('option[value="chimes"]')?.remove();
 const saved=gift.has('parcel')?gift.get('album'):null;
 const explicit=Array.from(picker.options).some(o=>o.value===saved);
 let useDefault=!explicit;
 picker.value=explicit?saved:'toymakers-workshop';
 let retryOnGesture=false;
 function startDefault(){
  if(!useDefault||gift.has('parcel'))return;
  if(!audio)select();
  const player=audio;
  if(!player.paused)return;
  player.play().catch(error=>{
   if(player!==audio||!useDefault)return;
   retryOnGesture=error.name==='NotAllowedError';
   status.textContent=retryOnGesture?'Tap Play or interact with the village to start the music.':'This track could not play.';
  });
 }
 document.addEventListener('click',event=>{
  if(!retryOnGesture||event.target.closest('button#disc,.turntable,#christmas-album,audio'))return;
  retryOnGesture=false;startDefault();
 });
 document.addEventListener('keydown',event=>{
  if(retryOnGesture&&!event.repeat&&!event.target.closest('button,select,input,textarea,audio'))startDefault();
 });
 window.addEventListener('gift-music-enter',startDefault);
 select();picker.onchange=()=>{useDefault=false;retryOnGesture=false;select();play();};
 disc.onclick=()=>{retryOnGesture=false;play();};
 startDefault();
 window.addEventListener('gift-soundtrack-stop',()=>{retryOnGesture=false;stop();});
 window.addEventListener('gift-soundtrack-start',()=>{if(!playing){if(!audio&&!controller&&!pending)select();play();}});
})();