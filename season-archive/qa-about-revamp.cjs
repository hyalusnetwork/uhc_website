const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const pages=await fetch('http://127.0.0.1:9232/json').then(r=>r.json()),page=pages.find(p=>p.type==='page');
 const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map(),errors=[];
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,m=>m.error?reject(Error(m.error.message)):resolve(m.result));ws.send(JSON.stringify({id:key,method,params}))});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
 await send('Runtime.enable');await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#about'});
 for(let i=0;i<80;i++){if(await evaluate('!!document.querySelector(".about-outro") && !document.querySelector("#about-view").hidden'))break;await new Promise(r=>setTimeout(r,100))}
 await evaluate('document.documentElement.style.scrollBehavior="auto"');
 for(const width of [1440,768,390,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===1440?1150:844,deviceScaleFactor:1,mobile:width<600});
  await evaluate('location.hash="#about";window.scrollTo(0,0)');await new Promise(r=>setTimeout(r,160));
  assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),`Overflow at ${width}`);
  assert(await evaluate('Array.from(document.querySelectorAll("#about-view img")).every(i=>i.complete&&i.naturalWidth>0)'),`Images at ${width}`);
  for(const anchor of ['game','crown','dragon','modes']){
   await evaluate(`location.hash='#about-${anchor}'`);await new Promise(r=>setTimeout(r,90));
   assert(await evaluate(`!document.querySelector('#about-view').hidden&&document.querySelector('#about-${anchor}').getBoundingClientRect().top>=65`),`Anchor ${anchor} at ${width}`);
  }
  await evaluate('location.hash="#about";window.scrollTo(0,0)');await new Promise(r=>setTimeout(r,120));
  if(width===1440||width===390){const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(width===1440?'about-revamp-desktop.png':'about-revamp-mobile.png',Buffer.from(shot.data,'base64'))}
 }
 await evaluate('location.hash="#seasons"');await new Promise(r=>setTimeout(r,100));assert(await evaluate('!document.querySelector("#seasons-view").hidden'));
 await evaluate('document.querySelector(".crown-link").click()');await new Promise(r=>setTimeout(r,100));assert(await evaluate('location.hash==="#about-crown"&&!document.querySelector("#about-view").hidden'));
 assert(await evaluate('!!document.querySelector("#about-modes #about-dragon") && document.querySelector(".about-heart-art").textContent.trim()==="" && document.querySelectorAll(".about-index a").length===3'));
 assert.deepEqual(errors,[]);console.log('Passed: Dragon grouped inside gamemodes; hero heart captions removed; images loaded; no overflow at 1440, 768, 390, 320; section anchors and Crown entry; no runtime errors.');await send('Browser.close');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
