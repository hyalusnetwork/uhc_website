// Keep the document's normal scrolling, but draw its scrollbar over the viewport.
(()=>{
 const root=document.documentElement;
 const rail=document.createElement('div');
 rail.className='page-overlay-scrollbar';rail.hidden=true;
 rail.setAttribute('role','scrollbar');rail.setAttribute('aria-label','Scroll page');
 rail.setAttribute('aria-orientation','vertical');rail.setAttribute('aria-valuemin','0');
 const content=document.querySelector('main')||document.body;
 if(!content.id)content.id='page-scroll-content';
 rail.setAttribute('aria-controls',content.id);
 rail.tabIndex=0;
 const thumb=document.createElement('div');thumb.className='page-overlay-scrollbar-thumb';
 rail.appendChild(thumb);document.body.appendChild(rail);
 root.classList.add('overlay-page-scrollbars');
 let frame=0,drag=null;
 const metrics=()=>{
  const viewport=root.clientHeight,max=Math.max(0,root.scrollHeight-viewport);
  const height=Math.min(viewport,Math.max(44,viewport*viewport/Math.max(1,root.scrollHeight)));
  return {viewport,max,height,travel:viewport-height};
 };
 const update=()=>{
  frame=0;const m=metrics();rail.hidden=m.max<=1;
  rail.setAttribute('aria-valuemax',String(m.max));
  rail.setAttribute('aria-valuenow',String(Math.round(Math.max(0,Math.min(m.max,window.scrollY)))));
  thumb.style.height=m.height+'px';
  thumb.style.transform=`translateY(${m.max?Math.max(0,Math.min(m.max,window.scrollY))/m.max*m.travel:0}px)`;
 };
 const schedule=()=>{if(!frame)frame=setTimeout(update,0);};
 const go=top=>window.scrollTo({top,behavior:'instant'});
 rail.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;event.preventDefault();
  const m=metrics();if(!m.max||!m.travel)return;
  rail.focus({preventScroll:true});
  if(event.target!==thumb)go(Math.max(0,Math.min(m.max,(event.clientY-m.height/2)/m.travel*m.max)));
  drag={y:event.clientY,top:window.scrollY};rail.setPointerCapture(event.pointerId);
  rail.classList.add('dragging');
 });
 rail.addEventListener('pointermove',event=>{
  if(!drag)return;const m=metrics();
  if(m.travel)go(Math.max(0,Math.min(m.max,drag.top+(event.clientY-drag.y)*m.max/m.travel)));
 });
 const stop=()=>{drag=null;rail.classList.remove('dragging');};
 rail.addEventListener('pointerup',stop);rail.addEventListener('pointercancel',stop);rail.addEventListener('lostpointercapture',stop);
 rail.addEventListener('keydown',event=>{
  const m=metrics(),steps={ArrowDown:40,ArrowUp:-40,PageDown:m.viewport*.9,PageUp:-m.viewport*.9,' ':m.viewport*.9*(event.shiftKey?-1:1)};
  if(event.key==='Home'||event.key==='End'){event.preventDefault();go(event.key==='Home'?0:m.max);}
  else if(Object.hasOwn(steps,event.key)){event.preventDefault();go(Math.max(0,Math.min(m.max,window.scrollY+steps[event.key])));}
 });
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',update);
 if(typeof ResizeObserver==='function'){
  const observer=new ResizeObserver(update);observer.observe(document.body);observer.observe(root);
 }
 // Route changes, expanded details, and inline layout changes may alter the
 // scroll range without changing the viewport. Ignore our own thumb updates.
 new MutationObserver(records=>{
  if(records.some(record=>record.target!==rail&&!rail.contains(record.target)))schedule();
 }).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','open','style']});
 update();
})();
