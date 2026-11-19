const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
let pages;for(let i=0;i<40;i++){try{pages=await fetch('http://127.0.0.1:9240/json').then(r=>r.json());break}catch{await new Promise(r=>setTimeout(r,250))}}
const page=pages.find(p=>p.url.includes('UHC.html')),ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method+' timeout')),20000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(Error(method+": "+m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression:'(()=>eval('+JSON.stringify(expression)+'))()',returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};








await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#seasons'});await new Promise(r=>setTimeout(r,500));await send('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,900));
await evaluate("document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0)");
console.log(await evaluate("({images:[...document.querySelectorAll('.hero-photo-group img')].map(i=>({loaded:i.complete&&i.naturalWidth>0,embedded:i.src.startsWith('data:')})),height:document.querySelector('.hero').getBoundingClientRect().height,blur:getComputedStyle(document.querySelector('.hero-copy-glass')).backdropFilter,direction:getComputedStyle(document.querySelector('.hero-photo-track')).animationName})"));
assert(await evaluate("[...document.querySelectorAll('.hero-photo-group img')].every(i=>i.complete&&i.naturalWidth>0&&i.src.startsWith('data:'))"));
await evaluate("document.querySelector('.hero-motion-toggle').click()");assert.equal(await evaluate("getComputedStyle(document.querySelector('.hero-photo-track')).animationPlayState"),'paused');
assert.equal(await evaluate("document.querySelectorAll('.hero-art').length"),0);assert.equal(await evaluate("document.querySelector('.hero-wordmark').getAttribute('aria-label')"),'Hyalus UHC');
let shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('hero-wordmark-preview.png',Buffer.from(shot.data,'base64'));
assert(await evaluate("(()=>{const groups=[...document.querySelectorAll('.hero-photo-group')];return Math.abs(groups[0].getBoundingClientRect().right-groups[1].getBoundingClientRect().left)<.1})()"));
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert.equal(await evaluate("document.documentElement.scrollWidth"),390);await evaluate("window.scrollTo(0,0)");
shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('hero-wordmark-mobile.png',Buffer.from(shot.data,'base64'));
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});assert.equal(await evaluate("getComputedStyle(document.querySelector('.hero-photo-track')).animationName"),'none');
console.log('Embedded images, seamless groups, pause control, mobile containment and reduced motion verified.');ws.close();
})().catch(e=>{console.error(e);process.exitCode=1});
