const fs=require('node:fs');
const harness=fs.readFileSync('qa-profile-photos.cjs','utf8').split(' const manifest=JSON.parse')[0];
eval(harness+`
 for(const file of ['dist/index.html','../UHC.html']){
  await send('Page.navigate',{url:pathToFileURL(path.resolve(__dirname,file)).href+'#player-Enzo_'});await pause(800);
  for(const width of [390,1117,1440]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});await pause(250);
   const colors=await evaluate("(()=>{const p=window.UHC_PROFILES.profiles.find(p=>p.name==='Enzo_'),tiles=[...document.querySelectorAll('.team-color-tile')];return {expected:p.teamColors.filter(c=>c.count>0).length,count:tiles.length,static:tiles.every(t=>t.tagName==='SPAN'&&!t.hasAttribute('tabindex')),overflow:document.documentElement.scrollWidth>innerWidth}})()");
   assert.equal(colors.count,colors.expected);assert(colors.static);assert(!colors.overflow);
   const density=await evaluate("(()=>{const key=document.querySelector('.team-color-key');return {columns:getComputedStyle(key).gridTemplateColumns.split(' ').length,overflow:[...key.children].some(t=>t.scrollWidth>t.clientWidth)}})()");
   assert(!density.overflow,'Compact tiles retain all text');if(width===1440)assert(density.columns>=5,'At least five tiles per row on desktop');
   await evaluate("(()=>{const strip=document.querySelector('.profile-photo-strip'),n=strip.querySelectorAll('.profile-photo-card:not(.profile-photo-clone)').length,w=strip.clientWidth;strip.scrollTo({left:n*w,behavior:'instant'});})()");await pause(400);
   const last=await evaluate("document.querySelector('.profile-photo-position').textContent");assert(last.startsWith('11 /'));
   await evaluate("window.photoScrolls=[];document.querySelector('.profile-photo-strip').addEventListener('scroll',()=>window.photoScrolls.push(document.querySelector('.profile-photo-strip').scrollLeft));document.querySelector('[data-carousel-step=\\\"1\\\"]').click()");await pause(1200);
   const loop=await evaluate("(()=>{const s=document.querySelector('.profile-photo-strip'),card=s.querySelector('.profile-photo-card:not(.profile-photo-clone)'),a=s.getBoundingClientRect(),b=card.getBoundingClientRect();return {w:s.clientWidth,left:s.scrollLeft,position:document.querySelector('.profile-photo-position').textContent,scrolls:window.photoScrolls,edge:Math.abs(a.right-b.right),integer:Number.isInteger(a.width)}})()");
   assert(loop.position.startsWith('1 /'));assert.equal(loop.left,loop.w);assert(loop.integer);assert(loop.edge<.1,'No next-image sliver');
   let reset=false;for(let i=1;i<loop.scrolls.length;i++){const delta=loop.scrolls[i]-loop.scrolls[i-1];if(delta<0){assert(Math.abs(loop.scrolls[i]-loop.w)<1&&loop.scrolls[i-1]>=11.9*loop.w,'Only invisible end-cap reset moves backward');reset=true;}}
   assert(reset,'Wrapped through first-photo end cap');
   console.log(file,width,'forward loop, clean photo edges and player-only static color tiles passed');
  }
  await evaluate("document.documentElement.style.scrollBehavior='auto';document.querySelector('.team-color-section').scrollIntoView()");await pause(300);
  const screenshot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('profile-color-tiles.png',Buffer.from(screenshot.data,'base64'));
 }
 }finally{ws?.close();browser.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
`);
