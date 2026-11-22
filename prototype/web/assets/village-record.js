(()=>{
 const byId=id=>document.getElementById(id);
 const picker=byId('christmas-album'),track=byId('village-track'),disc=byId('disc'),host=byId('album-player'),status=byId('album-status'),link=byId('open-album');
 const gift=new URLSearchParams(location.hash.slice(1));
 const storageKey='fuzzy-christmas-album'+(gift.has('draft')?':'+gift.get('draft'):'');
 let controller=null,sdk=null,version=0,playing=false,pending=false;
 const spotifyId=()=>picker.selectedOptions[0].dataset.spotify;
 function display(active){
  playing=active;
  disc.parentElement.classList.toggle('playing',active);
  disc.setAttribute('aria-label',active?'Pause record':'Play record');
  disc.querySelector('.disc-symbol').textContent=active?'Ⅱ':'▶';
 }
 function stop(){
  version++;pending=false;track.pause();controller?.destroy();controller=null;
  host.replaceChildren();host.hidden=true;display(false);
 }
 function select(){
  stop();const id=spotifyId();
  link.hidden=!id;track.hidden=!!id;byId('download-chimes').hidden=!!id;
  if(id)link.href='https://open.spotify.com/album/'+id;
  status.textContent='Tap the record to play.';
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
 async function play(){
  if(pending)return;
  if(playing){if(controller)controller.pause();else track.pause();return;}
  if(controller){controller.resume();return;}
  const ticket=version;
  try{
   if(!spotifyId()){await track.play();return;}
   pending=true;status.textContent='Loading album…';
   const api=await getSDK();if(version!==ticket)return;
   const mount=document.createElement('div');host.hidden=false;host.replaceChildren(mount);
   api.createController(mount,{uri:'spotify:album:'+spotifyId(),height:352,width:'100%'},player=>{
    if(version!==ticket){player.destroy();return;}
    controller=player;
    player.addListener('ready',()=>{if(version!==ticket)return;pending=false;status.textContent='Press Play in Spotify if needed.';player.play();});
    player.addListener('playback_update',({data})=>{if(version===ticket){pending=false;display(!data.isPaused);status.textContent=playing?'Playing in the background.':'Playback paused.';}});
   });
  }catch{if(version===ticket){pending=false;display(false);status.textContent=spotifyId()?'Spotify could not play. Try again or open the album in Spotify.':'Tap the record to try playback again.';}}
 }
 let saved=gift.get('album');
 if(!saved&&!gift.has('parcel'))try{saved=localStorage.getItem(storageKey);}catch{}
 if(Array.from(picker.options).some(o=>o.value===saved))picker.value=saved;
 select();picker.onchange=()=>{select();if(!gift.has('parcel'))try{localStorage.setItem(storageKey,picker.value);}catch{}};
 track.onplaying=()=>{display(true);status.textContent='Playing in the background.';};
 track.onpause=()=>{display(false);status.textContent='Playback paused.';};
 disc.onclick=play;
 window.addEventListener('gift-soundtrack-stop',stop);
 window.addEventListener('gift-soundtrack-start',()=>{if(!playing)play();});
})();