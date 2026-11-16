(()=>{
 const albums={charlie:{id:'2XnNY3GEkbWHor5kyvXLu4',title:'A Charlie Brown Christmas — Vince Guaraldi Trio'},buble:{id:'3CKVXhODttZebJAzjUs2un',title:'Christmas — Michael Bublé'},mariah:{id:'0cS9prZ8u3fdbc7lmtCaMV',title:'Merry Christmas — Mariah Carey'}};
 const picker=document.getElementById('christmas-album'),host=document.getElementById('album-player'),load=document.getElementById('load-album'),stop=document.getElementById('stop-album'),link=document.getElementById('open-album'),status=document.getElementById('album-status');
 let active=false;
 function selection(){const album=albums[picker.value];link.href='https://open.spotify.com/album/'+album.id;link.textContent='Open '+album.title+' in Spotify';try{localStorage.setItem('fuzzy-christmas-album',picker.value)}catch{}}
 function show(){
  const album=albums[picker.value];const frame=document.createElement('iframe');frame.title=album.title+' album player';frame.src='https://open.spotify.com/embed/album/'+album.id+'?theme=0';frame.width='100%';frame.height='352';frame.allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';frame.style.border='0';frame.style.borderRadius='12px';
  host.replaceChildren(frame);host.hidden=false;active=true;stop.hidden=false;load.hidden=true;status.textContent='Press Play in the album player. Choose tracks from its song list.';
 }
 try{const saved=localStorage.getItem('fuzzy-christmas-album');if(albums[saved])picker.value=saved}catch{}
 selection();picker.addEventListener('change',()=>{selection();if(active)show()});load.addEventListener('click',show);
 stop.addEventListener('click',()=>{host.replaceChildren();host.hidden=true;active=false;stop.hidden=true;load.hidden=false;status.textContent='Album stopped. Winter sound effects have their own control above.'});
})();
