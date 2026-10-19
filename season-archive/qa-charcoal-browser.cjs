const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
let pages;for(let i=0;i<40;i++){try{pages=await fetch('http://127.0.0.1:9231/json').then(r=>r.json());break}catch{await new Promise(r=>setTimeout(r,250))}}
const page=pages.find(p=>p.url.includes('UHC.html')),ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method+' timeout')),20000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(Error(m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1400,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#season-36'});
for(let i=0;i<40;i++){if(await evaluate('!!document.querySelector(".team-color-label")'))break;await new Promise(r=>setTimeout(r,250))}
assert.equal(await evaluate('getComputedStyle(document.body).backgroundColor'),'rgb(18, 19, 22)');
assert.equal(await evaluate('document.querySelectorAll(".season-card .team-color-label").length'),515);
assert(await evaluate(`Array.from(document.querySelectorAll('#season-36 .team-color-label')).some(e=>e.textContent==='Orange')&&Array.from(document.querySelectorAll('#season-36 .team-color-label')).some(e=>e.textContent==='Yellow')`));
assert(await evaluate(`const labels=Array.from(document.querySelectorAll('#season-36 .team-color-label'));getComputedStyle(labels.find(e=>e.textContent==='Orange').querySelector('i')).backgroundColor!==getComputedStyle(labels.find(e=>e.textContent==='Yellow').querySelector('i')).backgroundColor`));
await evaluate(`document.querySelector('#season-36').scrollIntoView()`);
const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('charcoal-seasons-preview.png',Buffer.from(shot.data,'base64'));
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert(await evaluate(`document.documentElement.scrollWidth<=window.innerWidth`));
console.log('Passed: charcoal background, 515 labeled team colors, distinct Orange/Yellow swatches and mobile overflow.');await send('Browser.close');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
