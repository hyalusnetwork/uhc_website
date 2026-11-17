(() => {
 const view=document.getElementById('crown-history');
 if(!view)return;
 const byId=id=>document.getElementById(id);
 const rules=byId('crown-rules'),start=byId('crown-history-start'),heading=byId('crown-history-title');
 const progress=byId('crown-history-progress'),title=byId('crown-history-event-title'),reason=byId('crown-history-reason');
 const back=byId('crown-history-rules'),skip=byId('crown-history-skip'),replay=byId('crown-history-replay');
 const viewport=view.querySelector('.crown-history-viewport'),stage=view.querySelector('.crown-history-stage');
 const grid=view.querySelector('.crown-history-grid'),trail=view.querySelector('path'),token=view.querySelector('.crown-history-token');
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const events=[];
 let former=null;
 for(const season of [...window.UHC_DATA].sort((a,b)=>Number(a.id)-Number(b.id))){
  const crown=season.crown;
  if(!crown?.name)continue;
  const changed=crown.name!==former;
  const death=season.players?.find(p=>p.name===former&&p.type==='PVE')?.death;
  let description=crown.method||'No transfer reason was recorded.';
  if(!changed){
   if(/did not play/i.test(description))description='The holder did not play. The Crown stayed with them.';
   else if(/did not die/i.test(description))description='The holder survived. The Crown stayed with them.';
  }else if(death&&/winner/i.test(description)){
   description=`${former} ${death.replace(/[.!]$/,'')}. Awarded to ${crown.name}: ${description}.`;
  }
  events.push({season:season.id,name:crown.name,former,changed,description});
  former=crown.name;
 }
 if(!events.length){start.disabled=true;return}

 let cards=[],visited=0,step=0,timer,flight,playing=false;
 function showEvent(event){
  progress.textContent=`Season ${event.season} of ${events.at(-1).season}`;
  title.textContent=!event.former?`${event.name} claims the first Crown`:event.changed?
   `${event.former} → ${event.name}`:`${event.name} keeps the Crown`;
  reason.textContent=event.description;
 }
 function focusControl(control){
  control.focus({preventScroll:true});
  control.scrollIntoView({block:'nearest',behavior:'instant'});
 }
 function makeCard(event){
  const item=document.createElement('li'),button=document.createElement('button'),face=document.createElement('img');
  const name=document.createElement('strong'),season=document.createElement('span');
  button.type='button';button.disabled=true;button.className='crown-history-card';
  const key=typeof profileIdentity==='function'?profileIdentity(event.name):event.name;
  face.src=window.UHC_FACES[key]||window.UHC_FACES[event.name]||window.UHC_FACES._default;
  face.alt='';face.width=40;face.height=40;
  name.textContent=event.name;season.textContent=`S${String(event.season).padStart(2,'0')}`;
  button.append(face,name,season);
  button.addEventListener('click',()=>showEvent(event));
  item.append(button);grid.append(item);
  return {item,button,face};
 }
 function point(card){
  const face=card.face.getBoundingClientRect(),box=stage.getBoundingClientRect();
  return {x:face.left+face.width/2-box.left,y:face.top+face.height/2-box.top};
 }
 function stop(){
  clearTimeout(timer);
  flight?.cancel();flight=null;
  viewport.scrollTo({top:viewport.scrollTop,behavior:'instant'});
  playing=false;
 }
 function alignTrail(){
  if(!visited)return;
  const points=cards.slice(0,visited).map(point);
  trail.setAttribute('d',points.map(({x,y},i)=>`${i?'L':'M'} ${x} ${y}`).join(' '));
  const target=points.at(-1);
  token.style.left=target.x+'px';token.style.top=(target.y-26)+'px';
 }
 function layout(){
  const columns=viewport.clientWidth<340?3:4;
  grid.style.setProperty('--crown-columns',columns);
  cards.forEach(({item},index)=>{
   const row=Math.floor(index/columns),col=index%columns;
   item.style.gridColumn=row%2?columns-col:col+1;
   item.style.gridRow=row+1;
  });
  alignTrail();
 }
 function reveal(event,animate){
  const old=cards[visited-1],from=old&&point(old),card=makeCard(event);
  if(old){old.item.classList.remove('is-holder');old.item.classList.add('is-former')}
  card.item.classList.add('is-holder');cards.push(card);visited++;
  layout();token.hidden=false;
  const to=point(card);
  if(animate&&from&&!motion.matches){
   flight?.cancel();
   const x=from.x-to.x,y=from.y-to.y;
   flight=token.animate([
    {transform:`translate(${x}px,${y}px) scale(.95)`},
    {transform:`translate(${x*.5}px,${y*.5-24}px) scale(1.32)`,offset:.48},
    {transform:'translate(0,0) scale(1)'}
   ],{duration:650,easing:'cubic-bezier(.2,.7,.25,1)'});
  }
  if(animate){
   const rowBottom=card.item.getBoundingClientRect().bottom-viewport.getBoundingClientRect().bottom;
   if(rowBottom>0)viewport.scrollBy({top:rowBottom+10,behavior:motion.matches?'instant':'smooth'});
  }
 }
 function finish(){
  const moveFocus=document.activeElement===skip;
  stop();skip.hidden=true;replay.hidden=false;
  for(const {button} of cards)button.disabled=false;
  title.parentElement.setAttribute('aria-live','polite');
  if(moveFocus)replay.focus({preventScroll:true});
 }
 function tick(){
  if(!playing)return;
  const event=events[step++];
  showEvent(event);
  if(event.changed)reveal(event,true);
  timer=setTimeout(step<events.length?tick:finish,event.changed?1700:1000);
 }
 function run(){
  stop();rules.hidden=true;view.hidden=false;replay.hidden=true;skip.hidden=false;
  title.parentElement.setAttribute('aria-live','off');
  grid.replaceChildren();trail.removeAttribute('d');token.hidden=true;
  cards=[];visited=0;step=0;viewport.scrollTop=0;
  focusControl(heading);playing=true;tick();
 }
 start.addEventListener('click',run);replay.addEventListener('click',run);
 back.addEventListener('click',()=>{
  stop();view.hidden=true;rules.hidden=false;focusControl(start);
 });
 skip.addEventListener('click',()=>{
  stop();
  for(const event of events.slice(step))if(event.changed)reveal(event,false);
  showEvent(events.at(-1));viewport.scrollTop=viewport.scrollHeight;
  finish();replay.focus({preventScroll:true});
 });
 if(typeof ResizeObserver==='function')new ResizeObserver(()=>{if(!view.hidden)layout()}).observe(viewport);
})();
