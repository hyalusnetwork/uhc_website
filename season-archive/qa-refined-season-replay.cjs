const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
let pages;for(let i=0;i<40;i++){try{pages=await fetch('http://127.0.0.1:9240/json').then(r=>r.json());break}catch{await new Promise(r=>setTimeout(r,250))}}
const page=pages.find(p=>p.url.includes('UHC.html')),ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method+' timeout')),20000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(Error(method+": "+m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression:'(()=>eval('+JSON.stringify(expression)+'))()',returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};






await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#season-37'});await new Promise(r=>setTimeout(r,600));await send('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,700));
const footer=await evaluate("(()=>{const f=document.querySelector('#season-37 .season-bottom'),icons=f.querySelector('.season-footer-actions'),height=f.getBoundingClientRect().height;icons.style.display='none';const original=f.getBoundingClientRect().height;icons.style.display='';return {height,original}})()");assert.equal(footer.height,footer.original);console.log(footer);
await evaluate("document.querySelector('#season-37 .season-animation-launch').click()");await new Promise(r=>setTimeout(r,400));assert(await evaluate("UHC_REPLAY_API.states.get(37).playing && UHC_REPLAY_API.states.get(37).time>0"));assert.equal(await evaluate("document.querySelector('.season-animation-launch').textContent"),'Show Final Results');assert.equal(await evaluate("document.querySelectorAll('.season-replay-tools [data-replay-action=close]').length"),0);
await evaluate("const el=document.querySelector('[data-replay-seek]');el.value=10730;el.dispatchEvent(new Event('input',{bubbles:true}));");
assert(await evaluate("(()=>{const rows=[...document.querySelectorAll('#season-37 tbody tr')];return rows.slice(0,9).every(r=>r.classList.contains('replay-dead'))&&rows.slice(9).every(r=>!r.classList.contains('replay-dead'));})()"));
await evaluate("const select=document.querySelector('[data-replay-order]');select.value='health';select.dispatchEvent(new Event('change',{bubbles:true}));");
assert(await evaluate("(()=>{const model=UHC_REPLAY_API.snapshot(37,10730),names=[...document.querySelectorAll('#season-37 tbody tr:not(.replay-dead) [data-player]')].map(n=>n.dataset.player),values=names.map(n=>model.get(n).health+model.get(n).abs);return values.every((v,i)=>!i||v>=values[i-1]);})()"));
await evaluate("document.querySelector('#season-37 .season-animation-launch').click()");assert.equal(await evaluate("document.querySelector('.season-animation-launch').textContent"),'Season Animation');assert.equal(await evaluate("UHC_REPLAY_API.states.size"),0);
console.log('Original footer height, autoplay, single final-results control, deaths at top, health ordering and restoration verified.');ws.close();
})().catch(e=>{console.error(e);process.exitCode=1});
