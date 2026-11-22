(()=>{
 const albums={charlie:{id:'2XnNY3GEkbWHor5kyvXLu4',title:'A Charlie Brown Christmas — Vince Guaraldi Trio'},buble:{id:'3CKVXhODttZebJAzjUs2un',title:'Christmas — Michael Bublé'},mariah:{id:'0cS9prZ8u3fdbc7lmtCaMV',title:'Merry Christmas — Mariah Carey'}};
 const picker=document.getElementById('christmas-album'),host=document.getElementById('album-player'),load=document.getElementById('load-album'),stop=document.getElementById('stop-album'),link=document.getElementById('open-album'),status=document.getElementById('album-status');
 const mute=document.getElementById('village-mute');
 let active=false,muted=false,playing=false,resumeOnUnmute=false,controller=null,sdk=null,version=0;
 function spotifyAPI(){
  if(!sdk)sdk=new Promise((resolve,reject)=>{
   window.onSpotifyIframeApiReady=resolve;
   const script=document.createElement('script');
   script.src='https://open.spotify.com/embed/iframe-api/v1';
   script.onerror=()=>{sdk=null;script.remove();reject(new Error('Album player unavailable.'));};
   document.head.append(script);
  });
  return sdk;
 }
 function clearPlayer(){
  version++;
  controller?.destroy();controller=null;playing=false;resumeOnUnmute=false;
  host.replaceChildren();
 }
 if(mute)mute.onclick=()=>{
  muted=!muted;mute.setAttribute('aria-pressed',String(muted));
  mute.textContent=muted?'Unmute':'Mute';
  if(muted){resumeOnUnmute=playing;controller?.pause();}
  else if(resumeOnUnmute){resumeOnUnmute=false;controller?.resume();}
 };
 async function showVillageAlbum(){
  clearPlayer();
  const request=version,album=albums[picker.value];active=true;
  host.hidden=false;stop.hidden=false;load.hidden=true;status.textContent='Loading album…';
  try{
   const api=await spotifyAPI();if(request!==version)return;
   const mount=document.createElement('div');host.append(mount);
   api.createController(mount,{uri:'spotify:album:'+album.id,width:'100%',height:352},player=>{
    if(request!==version){player.destroy();return;}
    controller=player;status.textContent='Choose a track and press Play.';
    player.addListener('playback_update',({data})=>{
     if(request!==version)return;
     playing=!data.isPaused;
     if(muted&&playing){resumeOnUnmute=true;player.pause();}
    });
   });
  }catch{if(request===version){active=false;load.hidden=false;host.hidden=true;stop.hidden=true;status.textContent='Spotify could not load. Retry or open the album in Spotify.';}}
 }
 function selection(){const album=albums[picker.value];link.href='https://open.spotify.com/album/'+album.id;link.textContent='Open '+album.title+' in Spotify';try{localStorage.setItem('fuzzy-christmas-album',picker.value)}catch{}}
 function show(){
  if(mute){showVillageAlbum();return;}
  const album=albums[picker.value];const frame=document.createElement('iframe');frame.title=album.title+' album player';frame.src='https://open.spotify.com/embed/album/'+album.id+'?theme=0';frame.width='100%';frame.height='352';frame.allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';frame.style.border='0';frame.style.borderRadius='12px';
  host.replaceChildren(frame);host.hidden=false;active=true;stop.hidden=false;load.hidden=true;status.textContent='Press Play in the album player. Choose tracks from its song list.';
 }
 try{const saved=localStorage.getItem('fuzzy-christmas-album');if(albums[saved])picker.value=saved}catch{}
 selection();picker.addEventListener('change',()=>{selection();if(active)show()});load.addEventListener('click',show);
 stop.addEventListener('click',()=>{clearPlayer();host.hidden=true;active=false;stop.hidden=true;load.hidden=false;status.textContent=mute?'Album stopped.':'Album stopped. Winter sound effects have their own control above.'});
})();
