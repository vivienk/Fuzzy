(()=>{
 const byId=id=>document.getElementById(id);
 const picker=byId('christmas-album'),disc=byId('disc'),host=byId('album-player'),status=byId('album-status'),link=byId('open-album');
 const gift=new URLSearchParams(location.hash.slice(1));
 const storageKey='fuzzy-christmas-album'+(gift.has('draft')?':'+gift.get('draft'):'');
 let controller=null,sdk=null,version=0,playing=false,pending=false;
 let wantsPlay=false;
 const spotifyId=()=>picker.selectedOptions[0].dataset.spotify;
 function display(active){
  playing=active;
  disc.parentElement.classList.toggle('playing',active);
  disc.setAttribute('aria-label',active?'Pause record':'Play record');
  disc.querySelector('.disc-symbol').textContent=active?'Ⅱ':'▶';
 }
 function stop(){
  version++;pending=false;wantsPlay=false;controller?.destroy();controller=null;
  host.replaceChildren();host.hidden=true;display(false);
 }
 function select(){
  stop();const id=spotifyId();
  link.hidden=!id;
  if(id)link.href='https://open.spotify.com/album/'+id;
  status.textContent='Tap the record to play.';
  prepareAlbum();
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
  if(playing){controller?.pause();return;}
  wantsPlay=true;
  if(controller&&!pending){controller.play();return;}
  status.textContent='Loading album…';prepareAlbum();
 }
 picker.querySelector('option[value="chimes"]')?.remove();
 let saved=gift.get('album');
 if(!saved&&!gift.has('parcel'))try{saved=localStorage.getItem(storageKey);}catch{}
 if(Array.from(picker.options).some(o=>o.value===saved))picker.value=saved;
 select();picker.onchange=()=>{select();if(!gift.has('parcel'))try{localStorage.setItem(storageKey,picker.value);}catch{}};
 disc.onclick=play;
 window.addEventListener('gift-soundtrack-stop',stop);
 window.addEventListener('gift-soundtrack-start',()=>{if(!playing)play();});
})();