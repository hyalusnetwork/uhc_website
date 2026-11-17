const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const pages=await fetch('http://127.0.0.1:9232/json').then(r=>r.json()),page=pages.find(p=>p.type==='page');
 const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map(),errors=[];
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,m=>m.error?reject(Error(m.error.message)):resolve(m.result));ws.send(JSON.stringify({id:key,method,params}))});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
 await send('Runtime.enable');await send('Page.navigate',{url:`file:///E:/Games/Minecraft/UHC/Website/UHC.html?qa=${Date.now()}#about`});
 for(let i=0;i<80;i++){if(await evaluate('!!document.querySelector(".about-outro") && !document.querySelector("#about-view").hidden'))break;await new Promise(r=>setTimeout(r,100))}
 await evaluate('document.documentElement.style.scrollBehavior="auto"');
 for(const width of [1440,768,390,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===1440?1150:844,deviceScaleFactor:1,mobile:width<600});
  await evaluate('location.hash="#about";window.scrollTo(0,0)');await new Promise(r=>setTimeout(r,160));
  assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),`Overflow at ${width}`);
  assert(await evaluate('Array.from(document.querySelectorAll("#about-view img")).every(i=>i.complete&&i.naturalWidth>0)'),`Images at ${width}`);
  for(const anchor of ['game','crown','dragon','modes']){
   await evaluate(`location.hash='#about-${anchor}'`);await new Promise(r=>setTimeout(r,90));
   assert(await evaluate(`(()=>{const nav=document.querySelector('.about-index').getBoundingClientRect(),header=document.querySelector('header.nav').getBoundingClientRect(),section=document.querySelector('#about-${anchor}').getBoundingClientRect();return Math.abs(nav.top-header.bottom)<2&&section.top>=nav.bottom+8})()`),`Sticky navigation and anchor ${anchor} at ${width}`);
  }
  await evaluate('location.hash="#about";window.scrollTo(0,0)');await new Promise(r=>setTimeout(r,120));
  if(width===1440||width===390){const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(width===1440?'about-revamp-desktop.png':'about-revamp-mobile.png',Buffer.from(shot.data,'base64'))}
 }
 await evaluate('location.hash="#about-game"');await new Promise(r=>setTimeout(r,120));
 assert(await evaluate(`new Set([...document.querySelectorAll('.about-index a')].map(a=>getComputedStyle(a).backgroundColor)).size===3`));
 assert(await evaluate(`[...document.querySelectorAll('.about-index a')].every(a=>getComputedStyle(a,'::before').backgroundImage.startsWith('linear-gradient')&&a.offsetHeight===48)`));
 assert(await evaluate(`!document.querySelector('.about-gallery-controls')`));
 assert(await evaluate(`document.querySelector('.about-game-intro .about-section-title > span').textContent==='01 /'`));
 assert(await evaluate(`[...document.querySelectorAll('.about-index a')].map(a=>a.childNodes[1].textContent).join('|')==='The Essentials|The Crown|Special Gamemodes'`));
 const slate=()=>evaluate(`document.querySelector('.about-slate:not([inert]) h3').textContent`);
 assert.equal(await slate(),'Healing');
 await new Promise(r=>setTimeout(r,7500));assert.equal(await slate(),'World Border');
 await evaluate(`document.querySelector('.about-slate-prev').click()`);
 assert.equal(await slate(),'Healing');
 assert(await evaluate(`[...document.querySelectorAll('.about-slate')].every(panel=>getComputedStyle(panel).display==='flex')&&getComputedStyle(document.querySelector('.about-game-intro'),'::before').backdropFilter==='blur(5px)'`));
 await new Promise(r=>setTimeout(r,420));
 assert(await evaluate(`getComputedStyle(document.querySelector('.about-slate[inert]')).visibility==='hidden'`));
 assert(await evaluate(`(()=>{
  const slides=[...document.querySelectorAll('.about-gallery-scenes img')].slice(1);
  const animations=slides.flatMap(slide=>slide.getAnimations());
  if(!animations.every(a=>a?.effect.getTiming().iterations===Infinity))return false;
  const sample=f=>{animations.forEach(a=>{a.pause();a.currentTime=27000*f});return slides.map(slide=>{const css=getComputedStyle(slide);return [parseFloat(css.translate),Number(css.opacity)]});};
  const early=sample(.39)[0],late=sample(.54)[0],last=sample(.8)[1];
  return animations.length===4&&early[1]===1&&late[1]===1&&early[0]>late[0]&&early[0]-late[0]<5&&last[1]===1&&sample(1.1).every(([,opacity])=>opacity===0);
 })()`));
 await new Promise(r=>setTimeout(r,7500));assert.equal(await slate(),'Healing');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await new Promise(r=>setTimeout(r,100));
 assert(await evaluate(`document.querySelector('.about-gallery').getAnimations({subtree:true}).length===0`));
 await evaluate('location.hash="#seasons"');await new Promise(r=>setTimeout(r,100));assert(await evaluate('!document.querySelector("#seasons-view").hidden'));
 await evaluate('document.querySelector(".crown-link").click()');await new Promise(r=>setTimeout(r,100));assert(await evaluate('location.hash==="#about-crown"&&!document.querySelector("#about-view").hidden'));
 assert(await evaluate('!!document.querySelector("#about-modes #about-dragon") && document.querySelector(".about-heart-art").textContent.trim()==="" && document.querySelectorAll(".about-index a").length===3'));
 assert(await evaluate(`document.querySelector('.about-hero h1').textContent==='About Hyalus UHC.'&&getComputedStyle(document.querySelector('.about-index')).backgroundColor==='rgba(0, 0, 0, 0)'&&getComputedStyle(document.querySelector('.about-game-intro .about-section-title > span')).color==='rgb(242, 127, 133)'&&document.querySelector('#about-modes').textContent.includes('Mystery Teams')`));
 await evaluate(`window.crownOriginalTimeout=window.setTimeout;window.setTimeout=(fn,ms,...args)=>window.crownOriginalTimeout(fn,['tick','finish'].includes(fn.name)?18:ms,...args);document.querySelector('#crown-history-start').click()`);
 await new Promise(r=>setTimeout(r,950));
 assert(await evaluate(`(()=>{
  const nodes=[...document.querySelectorAll('.crown-history-grid li')];
  const records=window.UHC_DATA.filter(s=>s.crown?.name);
  const transfers=records.filter((s,i)=>!i||records[i-1].crown.name!==s.crown.name);
  return nodes.length===transfers.length&&nodes.slice(0,-1).every(n=>n.classList.contains('is-former'))&&nodes.at(-1).classList.contains('is-holder')&&document.querySelector('#crown-history-progress').textContent==='Season '+records.at(-1).id+' of '+records.at(-1).id&&!document.querySelector('#crown-history-replay').hidden&&document.documentElement.scrollWidth<=innerWidth;
 })()`));
 assert(await evaluate(`(()=>{
  [...document.querySelectorAll('.crown-history-card')].find(b=>b.textContent.endsWith('S21')).click();
  const nodes=[...document.querySelectorAll('.crown-history-grid li')];
  return document.querySelector('#crown-history-reason').textContent.includes('shot by Skeleton')&&nodes[0].style.gridColumn==='1'&&nodes[3].style.gridColumn==='3'&&nodes[4].style.gridColumn==='2';
 })()`));
 await evaluate(`window.setTimeout=window.crownOriginalTimeout;document.querySelector('#crown-history-replay').click()`);
 assert(await evaluate(`document.querySelectorAll('.crown-history-grid li').length===1`));
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await new Promise(r=>setTimeout(r,1850));
 assert(await evaluate(`document.querySelector('.crown-history-token').getAnimations().length===1&&document.querySelectorAll('.crown-history-grid .is-former').length===1`));
 await evaluate(`document.querySelector('#crown-history-skip').click()`);
 assert(await evaluate(`!document.querySelector('#crown-history-replay').hidden`));
 assert(await evaluate(`(()=>{
  const viewport=document.querySelector('.crown-history-viewport');
  const thumb=getComputedStyle(viewport,'::-webkit-scrollbar-thumb');
  return viewport.scrollHeight>viewport.clientHeight&&viewport.scrollTop>0&&thumb.backgroundColor==='rgb(145, 114, 62)'&&thumb.borderRadius==='0px'&&getComputedStyle(viewport,'::-webkit-scrollbar').width==='8px';
 })()`),'Crown history uses the gold OreUI scrollbar while remaining scrollable');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1150,deviceScaleFactor:1,mobile:false});
 await evaluate(`document.querySelector('#about-crown').scrollIntoView();document.querySelector('.crown-history-viewport').scrollTop=0`);
 await new Promise(r=>setTimeout(r,150));
 const historyShot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('about-crown-preview.png',Buffer.from(historyShot.data,'base64'));
 await evaluate(`document.querySelector('#crown-history-rules').click()`);
 assert(await evaluate(`document.querySelector('#crown-history').hidden&&!document.querySelector('#crown-rules').hidden&&document.activeElement.id==='crown-history-start'`));
 assert.deepEqual(errors,[]);console.log('Passed: Dragon grouped inside gamemodes; hero heart captions removed; images loaded; no overflow at 1440, 768, 390, 320; section anchors and Crown entry; no runtime errors.');await send('Browser.close');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
