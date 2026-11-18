const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
let pages;for(let i=0;i<40;i++){try{pages=await fetch('http://127.0.0.1:9240/json').then(r=>r.json());break}catch{await new Promise(r=>setTimeout(r,250))}}
const page=pages.find(p=>p.url.includes('UHC.html')),ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method+' timeout')),20000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(Error(method+": "+m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression:'(()=>eval('+JSON.stringify(expression)+'))()',returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};







await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#season-37'});await new Promise(r=>setTimeout(r,500));await send('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,700));
console.log(await evaluate("(()=>{const card=document.querySelector('#season-37'),btn=card.querySelector('.season-animation-launch'),label=card.querySelector('.time-box small');return {button:btn.getBoundingClientRect().right,label:label.getBoundingClientRect().right,margin:getComputedStyle(btn).marginRight,options:[...card.querySelector('[data-replay-speed]').options].map(o=>o.value),default:card.querySelector('[data-replay-speed]').value}})()"));
assert.equal(await evaluate("document.querySelector('[data-replay-speed]').value"),'variable');
console.log(await evaluate("(()=>{const a=UHC_REPLAY_API,e=UHC_REPLAYS[37].events.find(e=>e.name==='Lukeyvonswaggle'&&e.fatal);return {quiet:a.speedAt(37,0),beforeDeath:a.speedAt(37,e.t-30),fixed:a.advance(37,0,1,'90'),boundary:a.advance(37,e.t-46,1,'variable'),windows:a.slowWindows.get(37).length}})()"));
assert.equal(await evaluate("UHC_REPLAY_API.speedAt(37,0)"),300);assert.equal(await evaluate("UHC_REPLAY_API.advance(37,0,1,'150')"),150);
await evaluate("document.querySelector('.season-animation-launch').click()");await new Promise(r=>setTimeout(r,300));assert(await evaluate("UHC_REPLAY_API.states.get(37).playing"));console.log('Variable default, fixed speeds, event-aware timing and playback verified');ws.close();
})().catch(e=>{console.error(e);process.exitCode=1});
