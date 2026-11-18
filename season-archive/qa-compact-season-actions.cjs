const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
let pages;for(let i=0;i<40;i++){try{pages=await fetch('http://127.0.0.1:9240/json').then(r=>r.json());break}catch{await new Promise(r=>setTimeout(r,250))}}
const page=pages.find(p=>p.url.includes('UHC.html')),ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method+' timeout')),20000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(Error(method+": "+m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression:'(()=>eval('+JSON.stringify(expression)+'))()',returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};






await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#season-37'});await new Promise(r=>setTimeout(r,700));await send('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,700));
assert.equal(await evaluate("document.querySelectorAll('.season-video-strip').length"),0);
assert.equal(await evaluate("document.querySelectorAll('#season-37 .season-footer-actions button').length"),2);
await evaluate("document.querySelector('#season-37 [data-season-menu=videos]').click()");assert.equal(await evaluate("document.querySelector('#season-menu-dialog').open"),true);console.log(await evaluate("document.querySelectorAll('#season-menu-dialog .season-menu-videos li').length"));await evaluate("document.querySelector('#season-menu-dialog').close();document.querySelector('#season-37 [data-season-menu=info]').click()");assert(await evaluate("document.querySelector('#season-menu-dialog').textContent.includes('World seed')"));
await evaluate("document.querySelector('#season-menu-dialog').close();document.querySelector('#season-37 .season-animation-launch').click();document.documentElement.style.scrollBehavior='auto';document.querySelector('#season-37').scrollIntoView()");await new Promise(r=>setTimeout(r,400));
assert.equal(await evaluate("document.querySelector('#season-37 .season-replay-controls').inert"),false);
assert.equal(await evaluate("document.querySelectorAll('#season-37 [data-replay-action=start]').length"),0);
console.log(await evaluate("({height:document.querySelector('#season-37 .season-replay-controls').getBoundingClientRect().height,hearts:document.querySelectorAll('#season-37 .replay-heart').length,header:document.querySelector('#season-37 .season-animation-launch').parentElement.className})"));
const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('season-replay-controls-preview.png',Buffer.from(shot.data,'base64'));
await evaluate("document.querySelector('#season-37 [data-replay-action=close]').click()");await new Promise(r=>setTimeout(r,400));assert.equal(await evaluate("document.querySelector('#season-37 .season-replay-controls').getBoundingClientRect().height"),0);
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});console.log(await evaluate("({width:innerWidth,scroll:document.documentElement.scrollWidth})"));console.log('Footer menus, header button, controls, close animation and mobile viewport passed.');ws.close();
})().catch(e=>{console.error(e);process.exitCode=1});
