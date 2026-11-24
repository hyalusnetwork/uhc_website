let profilePhotosCleanup=()=>{};
function photosForPlayer(player){return (window.UHC_PROFILE_PHOTOS||[]).filter(photo=>photo.players.some(name=>profileIdentity(name)===player.name));}
function shuffledPhotosForPlayer(player){
 const photos=photosForPlayer(player);
 for(let i=photos.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[photos[i],photos[j]]=[photos[j],photos[i]];}
 return photos;
}
function photoControl(direction,attribute,label,disabled=false,type='button'){
 const path=direction==='close'?'m6 6 12 12M18 6 6 18':direction==='previous'?'m15 5-7 7 7 7':'m9 5 7 7-7 7';
 return `<button type="${type}" class="photo-control" ${attribute} aria-label="${label}" ${disabled?'disabled':''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter"/></svg></button>`;
}
function profilePhotosPanel(player,photos,season='all'){
 if(!photos.length)return '';
 const photoSeasons=[...new Set(photosForPlayer(player).map(photo=>photo.season))].sort((a,b)=>a-b);
 const filter=`<label class="ore-select-bevel photo-season-filter"><span class="sr-only">Filter photos by season</span><select data-photo-season aria-label="Filter photos by season"><option value="all" ${season==='all'?'selected':''}>All seasons</option>${photoSeasons.map(id=>`<option value="${id}" ${String(season)===String(id)?'selected':''}>Season ${id}</option>`).join('')}</select></label>`;
 return `<section class="profile-section profile-photos"><div class="profile-section-title"><div class="profile-photo-heading"><h2>Photos<span>.</span></h2><p class="photo-hint">Select a photo to enlarge.</p></div><div class="profile-photo-controls">${filter}${photoControl('previous','data-carousel-step="-1"','Previous photo',photos.length<2)}<span class="profile-photo-position" aria-live="off">1 / ${photos.length}</span>${photoControl('next','data-carousel-step="1"','Next photo',photos.length<2)}</div></div><div class="profile-photo-strip" role="region" aria-roledescription="carousel" aria-label="Photos of ${escape(player.name)}">${photos.map((photo,i)=>`<button type="button" class="profile-photo-card" data-profile-photo="${i}" aria-label="Enlarge photo ${i+1} of ${photos.length}" aria-haspopup="dialog"><img src="${photo.src}" alt="${escape(photo.players.join(', '))} in UHC" loading="${i?'lazy':'eager'}" decoding="async" draggable="false"></button>`).join('')}</div></section>`;
}
function bindProfilePhotos(root,player,photos,allPhotos=photos){
 profilePhotosCleanup();
 const controller=new AbortController(),{signal}=controller;
 const backdrop=document.createElement('div');
 backdrop.className='ranking-photo-backdrop profile-photo-backdrop';backdrop.setAttribute('aria-hidden','true');
 const frames=[0,1].map(()=>{const img=document.createElement('img');img.alt='';backdrop.append(img);return img;});
 root.prepend(backdrop);
 let backgroundFrame=0,backgroundRequest=0;
 if(photos.length){frames[0].src=photos[0].src;frames[0].classList.add('is-current');}
 const syncBackground=async index=>{
  const request=++backgroundRequest,incoming=frames[1-backgroundFrame];
  incoming.src=photos[index].src;
  try{await incoming.decode();if(signal.aborted||request!==backgroundRequest)return;incoming.classList.add('is-current');frames[backgroundFrame].classList.remove('is-current');backgroundFrame=1-backgroundFrame;}catch{}
 };
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const dialog=document.createElement('dialog');dialog.className='profile-photo-dialog';dialog.tabIndex=-1;
 dialog.setAttribute('aria-label','Player photo');root.append(dialog);
 const panel=root.querySelector('.profile-photos'),strip=panel?.querySelector('.profile-photo-strip');
 const cards=strip?[...strip.querySelectorAll('.profile-photo-card')]:[];
 // End caps let the last slide continue forward into the first one.
 if(cards.length>1){
  for(const [card,prepend] of [[cards.at(-1),true],[cards[0],false]]){
   const clone=card.cloneNode(true);clone.classList.add('profile-photo-clone');clone.tabIndex=-1;clone.setAttribute('aria-hidden','true');
   if(prepend)strip.prepend(clone);else strip.append(clone);
  }
 }
 const hasEndCaps=cards.length>1;
 let slideWidth=0,looping=false;
 let selected=0,carouselIndex=0,hovered=false,lastInteraction=Date.now(),scrollTimer;
 const touches=new Set();
 const setIndex=index=>{
  index=(index+photos.length)%photos.length;
  if(index!==carouselIndex){carouselIndex=index;syncBackground(index);}
  if(panel)panel.querySelector('.profile-photo-position').textContent=`${index+1} / ${photos.length}`;
 };
 const moveCarousel=(index,smooth=true)=>{
  if(!cards.length)return;
  index=(index+cards.length)%cards.length;
  if(looping){strip.scrollTo({left:(carouselIndex+1)*slideWidth,behavior:'instant'});looping=false;}
  let position=index+(hasEndCaps?1:0);
  if(smooth&&!motion.matches&&hasEndCaps){
   if(carouselIndex===cards.length-1&&index===0){position=cards.length+1;looping=true;}
   else if(carouselIndex===0&&index===cards.length-1){position=0;looping=true;}
  }
  setIndex(index);
  strip.scrollTo({left:position*slideWidth,behavior:smooth&&!motion.matches?'smooth':'instant'});
 };
 const render=()=>{
  const photo=photos[selected];
  const people=photo.players.map(name=>{
   const content=playerFace(name)+`<span>${escape(name)}</span>`;
   return profileByName(name)?`<a class="photo-person" href="${profileHref(profileIdentity(name))}">${content}</a>`:`<span class="photo-person">${content}</span>`;
  }).join('<span class="photo-person-divider" aria-hidden="true"> | </span>');
  dialog.innerHTML=`<div class="photo-dialog-toolbar"><span>Photo ${selected+1} of ${photos.length}</span>${photoControl('close','data-photo-close','Close photo')}</div><img class="photo-dialog-image" src="${photo.src}" alt="${escape(photo.players.join(', '))} in UHC"><div class="photo-dialog-bottom">${photoControl('previous','data-photo-step="-1"','Previous photo',photos.length<2)}<div class="photo-people" aria-label="Season and players in this photo"><span class="photo-season-label">Season ${photo.season}</span><span class="photo-person-divider" aria-hidden="true"> | </span>${people}</div>${photoControl('next','data-photo-step="1"','Next photo',photos.length<2)}</div>`;
 };
 if(panel){
  panel.querySelector('[data-photo-season]').addEventListener('change',event=>{
   const season=event.target.value;
   const filtered=allPhotos.filter(photo=>season==='all'||String(photo.season)===season);
   panel.outerHTML=profilePhotosPanel(player,filtered,season);
   bindProfilePhotos(root,player,filtered,allPhotos);
  },{signal});
  panel.addEventListener('pointerover',event=>{if(event.pointerType==='mouse')hovered=true;},{signal});
  panel.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'){hovered=false;lastInteraction=Date.now();}},{signal});
  panel.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse')touches.add(event.pointerId);lastInteraction=Date.now();},{signal});
  for(const type of ['pointerup','pointercancel'])document.addEventListener(type,event=>{if(touches.delete(event.pointerId))lastInteraction=Date.now();},{signal});
  panel.addEventListener('focusout',()=>{lastInteraction=Date.now();},{signal});
  panel.addEventListener('click',event=>{
   const step=event.target.closest('[data-carousel-step]');
   if(step){lastInteraction=Date.now();moveCarousel(carouselIndex+Number(step.dataset.carouselStep));return;}
   const button=event.target.closest('[data-profile-photo]');if(!button)return;
   selected=Number(button.dataset.profilePhoto);render();dialog.showModal();dialog.focus({preventScroll:true});
  },{signal});
  strip.addEventListener('scroll',()=>{
   clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{
    if(signal.aborted)return;
    if(!slideWidth)return;
    const position=Math.round(strip.scrollLeft/slideWidth);
    const nearest=(position-(hasEndCaps?1:0)+cards.length)%cards.length;
    setIndex(nearest);lastInteraction=Date.now();
    if(hasEndCaps&&(position===0||position===cards.length+1))strip.scrollTo({left:(nearest+1)*slideWidth,behavior:'instant'});
    looping=false;
   },160);
  },{signal,passive:true});
 }
 const timer=setInterval(()=>{
  if(!panel||motion.matches||document.hidden||root.hidden||dialog.open||photos.length<2||hovered||touches.size||panel.querySelector(':focus-visible')||Date.now()-lastInteraction<5000)return;
  moveCarousel(carouselIndex+1);lastInteraction=Date.now();
 },250);
 const resize=new ResizeObserver(()=>{
  if(!cards.length)return;
  const style=getComputedStyle(panel);
  // Use whole CSS pixels so the scroll viewport cannot reveal a neighboring edge.
  slideWidth=Math.max(1,Math.floor(panel.getBoundingClientRect().width-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-parseFloat(style.borderLeftWidth)-parseFloat(style.borderRightWidth)));
  strip.style.width=slideWidth+'px';strip.style.setProperty('--photo-slide-width',slideWidth+'px');
  moveCarousel(carouselIndex,false);
 });
 if(panel)resize.observe(panel);
 dialog.addEventListener('click',event=>{
  if(event.target.closest('[data-photo-close],a'))dialog.close();
  const step=event.target.closest('[data-photo-step]');
  if(step){selected=(selected+Number(step.dataset.photoStep)+photos.length)%photos.length;moveCarousel(selected,false);render();dialog.querySelector(`[data-photo-step="${step.dataset.photoStep}"]`).focus();}
  if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}
 },{signal});
 dialog.addEventListener('close',()=>{lastInteraction=Date.now();},{signal});
 dialog.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
  event.preventDefault();selected=(selected+(event.key==='ArrowLeft'?-1:1)+photos.length)%photos.length;moveCarousel(selected,false);render();dialog.focus({preventScroll:true});
 },{signal});
 profilePhotosCleanup=()=>{controller.abort();clearInterval(timer);clearTimeout(scrollTimer);resize.disconnect();dialog.remove();backdrop.remove();};
}
window.addEventListener('hashchange',()=>{if(!location.hash.startsWith('#player-'))profilePhotosCleanup();});
