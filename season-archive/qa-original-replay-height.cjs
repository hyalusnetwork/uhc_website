const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
let pages;for(let i=0;i<40;i++){try{pages=await fetch('http://127.0.0.1:9240/json').then(r=>r.json());break}catch{await new Promise(r=>setTimeout(r,250))}}
const page=pages.find(p=>p.url.includes('UHC.html')),ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method+' timeout')),20000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(Error(method+": "+m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression:'(()=>eval('+JSON.stringify(expression)+'))()',returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};







await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#season-37'});await new Promise(r=>setTimeout(r,500));await send('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,700));
const originalHeight=await evaluate("Math.min(...[...document.querySelectorAll('#season-37 tbody tr')].map(r=>r.getBoundingClientRect().height))");await evaluate("document.querySelector('.season-animation-launch').click();document.querySelector('[data-replay-action=toggle]').click()");
const metrics=await evaluate("(()=>{const rows=[...document.querySelectorAll('#season-37 tbody tr')];return {column:rows[0].querySelector('.death').getBoundingClientRect().left,heights:rows.map(r=>r.getBoundingClientRect().height),shift:getComputedStyle(document.querySelector('.season-animation-launch')).translate}})()");
assert(metrics.heights.every(h=>Math.abs(h-originalHeight)<0.1));assert.equal(metrics.shift,'4px');
await evaluate("const seek=document.querySelector('[data-replay-seek]');seek.value=6510;seek.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-replay-action=next]').click()");
const after=await evaluate("(()=>{const rows=[...document.querySelectorAll('#season-37 tbody tr')],rects=rows.map(r=>r.getBoundingClientRect());return {column:rows[0].querySelector('.death').getBoundingClientRect().left,gaps:rects.slice(1).map((r,i)=>r.top-rects[i].bottom),rowTransforms:rows.map(r=>getComputedStyle(r).transform),dead:rows.filter(r=>r.classList.contains('replay-dead')).length}})()");
assert.equal(after.column,metrics.column);assert(after.gaps.every(g=>Math.abs(g)<0.01));assert(after.rowTransforms.every(t=>t==='none'));console.log({originalHeight,playbackHeight:metrics.heights[0],columnStable:true,gaps:after.gaps,shift:metrics.shift,dead:after.dead});
await evaluate("const seek=document.querySelector('[data-replay-seek]');seek.value=seek.max;seek.dispatchEvent(new Event('input',{bubbles:true}));");
assert.equal(await evaluate("document.querySelectorAll('#season-37 .replay-dead').length"),16);
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert.equal(await evaluate("document.documentElement.scrollWidth"),390);
await evaluate("document.querySelector('.season-animation-launch').click()");assert.equal(await evaluate("document.querySelectorAll('.replay-cell-content').length"),0);
console.log('Stable columns, seamless backgrounds during death movement, final state, mobile containment and restoration passed.');ws.close();
})().catch(e=>{console.error(e);process.exitCode=1});
