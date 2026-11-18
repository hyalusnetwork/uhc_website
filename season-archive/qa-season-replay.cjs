const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
let pages;for(let i=0;i<40;i++){try{pages=await fetch('http://127.0.0.1:9240/json').then(r=>r.json());break}catch{await new Promise(r=>setTimeout(r,250))}}
const page=pages.find(p=>p.url.includes('UHC.html')),ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method+' timeout')),20000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(Error(method+": "+m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression:'(()=>eval('+JSON.stringify(expression)+'))()',returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};





await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#season-37'});await new Promise(r=>setTimeout(r,1200));
await send("Page.reload",{ignoreCache:true});await new Promise(r=>setTimeout(r,700));console.log(await evaluate("typeof window.UHC_REPLAY_API"));
await evaluate("document.documentElement.style.scrollBehavior='auto';document.querySelector('#season-37 [data-replay-action=toggle]').click();document.querySelector('#season-37 [data-replay-action=start]').click();document.querySelector('#season-37').scrollIntoView()");
let initial=await evaluate("({names:[...document.querySelectorAll('#season-37 tbody .player-name')].map(x=>x.textContent),hearts:document.querySelectorAll('#season-37 .replay-heart').length,dead:document.querySelectorAll('#season-37 .replay-dead').length,time:document.querySelector('#season-37 .time-box strong').textContent})");console.log(initial);assert.equal(initial.hearts,180);assert(await evaluate("(()=>{const s=seasons.find(s=>s.id===37),actual=[...document.querySelectorAll('#season-37 tbody .player-name')].map(n=>n.textContent),expected=[...s.players].sort((a,b)=>(a.team||a.color||'None').localeCompare(b.team||b.color||'None')||a.name.localeCompare(b.name)).map(p=>p.name);return JSON.stringify(actual)===JSON.stringify(expected)})()"));assert.equal(initial.dead,0);
console.log(await evaluate("({pecus:UHC_REPLAY_API.snapshot(37,2).get('Pecus').health,dead:[...UHC_REPLAY_API.snapshot(37,2200).values()].filter(p=>p.dead).length})"));
await evaluate("const seek=document.querySelector('[data-replay-seek]');seek.value=10730;seek.dispatchEvent(new Event('input',{bubbles:true}));");
assert.equal(await evaluate("document.querySelectorAll('#season-37 .replay-dead').length"),9);
let shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('season-replay-preview.png',Buffer.from(shot.data,'base64'));
await evaluate("const seek=document.querySelector('[data-replay-seek]');seek.value=seek.max;seek.dispatchEvent(new Event('input',{bubbles:true}));");
assert.equal(await evaluate("document.querySelectorAll('#season-37 .replay-dead').length"),16);
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});console.log(await evaluate("({width:innerWidth,scroll:document.documentElement.scrollWidth})"));
await evaluate("document.querySelector('[data-replay-action=close]').click()");assert.equal(await evaluate("document.querySelectorAll('#season-37 .replay-hearts').length"),0);
await evaluate("document.querySelector('[data-replay-action=toggle]').click()");await new Promise(r=>setTimeout(r,500));assert(await evaluate("UHC_REPLAY_API.states.get(37).time>0"));await evaluate("document.querySelector('[data-replay-action=toggle]').click()");console.log('Replay initial hearts, initial-hit exclusion, death timing, seeking, final deaths, mobile width and final-results restore passed');ws.close();
})().catch(e=>{console.error(e);process.exitCode=1});
