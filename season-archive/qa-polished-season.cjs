const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
let pages;for(let i=0;i<40;i++){try{pages=await fetch('http://127.0.0.1:9240/json').then(r=>r.json());break}catch{await new Promise(r=>setTimeout(r,250))}}
const page=pages.find(p=>p.url.includes('UHC.html')),ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method+' timeout')),20000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(Error(method+": "+m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression:'(()=>eval('+JSON.stringify(expression)+'))()',returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};








await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#season-37'});await new Promise(r=>setTimeout(r,500));await send('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,600));
assert(await evaluate("(()=>{const s=seasons.find(s=>s.id===37),rows=[...document.querySelectorAll('#season-37 tbody tr')];return rows.filter(r=>s.players.find(p=>p.name===r.querySelector('[data-player]').dataset.player)?.finalHearts!=null).every(r=>!r.querySelector('.elapsed').textContent.trim())})()"));
await evaluate("document.querySelector('.season-animation-launch').click();document.querySelector('[data-replay-action=toggle]').click()");
assert(await evaluate("[...document.querySelectorAll('#season-37 .elapsed')].every(e=>!e.textContent.trim())"));assert.equal(await evaluate("getComputedStyle(document.querySelector('#season-37 tbody td')).borderTopWidth"),'0px');
await evaluate("document.querySelector('#season-37 [data-season-menu=videos]').click()");
assert.equal(await evaluate("document.querySelector('.season-menu-close').textContent"),'Close');
console.log(await evaluate("({videos:document.querySelectorAll('.season-menu-videos li').length,buttonShift:getComputedStyle(document.querySelector('.season-animation-launch')).translate})"));
const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('season-video-popup-preview.png',Buffer.from(shot.data,'base64'));
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
assert(await evaluate("document.querySelector('#season-menu-dialog').getBoundingClientRect().right<=390"));await evaluate("document.querySelector('.season-menu-close').click()");assert.equal(await evaluate("document.querySelector('#season-menu-dialog').open"),false);
console.log('Blank survivor times, borderless replay rows, button offset, popup and mobile containment verified');ws.close();
})().catch(e=>{console.error(e);process.exitCode=1});
