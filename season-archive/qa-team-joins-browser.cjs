const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
let pages;for(let i=0;i<40;i++){try{pages=await fetch('http://127.0.0.1:9232/json').then(r=>r.json());break}catch{await new Promise(r=>setTimeout(r,250))}}
const page=pages.find(p=>p.url.includes('UHC.html')),ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method+' timeout')),20000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(Error(m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression:'(()=>eval('+JSON.stringify(expression)+'))()',returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1150,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#trivia'});
for(let i=0;i<40;i++){if(await evaluate('!!document.querySelector(".trivia-record")'))break;await new Promise(r=>setTimeout(r,250))}

await evaluate(`document.documentElement.style.scrollBehavior='auto';location.hash='#seasons';document.querySelector('#search').value='';document.querySelector('#year').value='';render();`);
assert.equal(await evaluate('document.querySelectorAll(".team-join-row").length'),35);
assert.equal(await evaluate('document.querySelectorAll(".team-join-person").length'),56);
assert.equal(await evaluate('document.querySelectorAll(".season-roamer-flag").length'),7);
assert.equal(await evaluate('document.querySelectorAll("#season-15 .team-join-row").length'),7);
assert(await evaluate(`document.querySelector('#season-24 .team-join-time').textContent==='1:07:09'`));
assert(await evaluate(`const rows=Array.from(document.querySelectorAll('#season-24 tbody tr'));const i=rows.findIndex(r=>r.classList.contains('team-join-row'));rows[i-1].textContent.includes('BWRE_of_Kappus')&&rows[i+1].textContent.includes('Misrok')`));
assert(await evaluate(`document.querySelector('#season-22 .metadata').textContent.includes('v1.10')`));
for(const season of [15,24]){
 await evaluate(`var node=document.querySelector('#season-${season}');window.scrollTo(0,window.scrollY+node.getBoundingClientRect().top-100)`);
 await new Promise(r=>setTimeout(r,150));const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('team-joins-season-'+season+'.png',Buffer.from(shot.data,'base64'));
}
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await evaluate(`var node=document.querySelector('#season-15');window.scrollTo(0,window.scrollY+node.getBoundingClientRect().top-80)`);
assert(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'));
const mobile=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('team-joins-mobile.png',Buffer.from(mobile.data,'base64'));
console.log('Passed browser checks: 35 chronological join rows, 56 player joins, seven roamer flags, simultaneous joining groups, S24 event order, version labels and mobile containment.');
await send('Browser.close');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});

