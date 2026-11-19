const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
let pages;for(let i=0;i<40;i++){try{pages=await fetch('http://127.0.0.1:9240/json').then(r=>r.json());break}catch{await new Promise(r=>setTimeout(r,250))}}
const page=pages.find(p=>p.url.includes('UHC.html')),ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method+' timeout')),20000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(Error(method+": "+m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression:'(()=>eval('+JSON.stringify(expression)+'))()',returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};








await send('Page.enable');
await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#seasons'});await new Promise(r=>setTimeout(r,500));await send('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,900));
for(const width of [1440,390]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:1050,deviceScaleFactor:1,mobile:width<500});
 await evaluate("document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0)");await new Promise(r=>setTimeout(r,250));
 console.log(await evaluate("({width:innerWidth,scroll:document.documentElement.scrollWidth,background:getComputedStyle(document.body).backgroundColor,nav:getComputedStyle(document.querySelector('.nav')).backgroundImage,count:document.querySelector('#result-count').textContent})"));
 const blur=await evaluate("(()=>{const hero=document.querySelector('.hero-with-photos'),glass=hero.querySelector('.hero-copy-glass'),tracks=hero.querySelectorAll('.hero-photo-track');const report=()=>({backdrop:getComputedStyle(glass).backdropFilter,tracks:tracks.length,offset:Math.abs(tracks[0].getAnimations()[0].currentTime-tracks[1].getAnimations()[0].currentTime),blur:getComputedStyle(glass.querySelector('.hero-photo-window')).filter});window.scrollTo(0,180);return report()})()");
 assert.equal(blur.backdrop,'none');assert.equal(blur.tracks,2);assert(blur.offset<20);console.log(blur);
 await evaluate("document.querySelector('.hero-motion-toggle').click()");
 const paused=await evaluate("Array.from(document.querySelectorAll('.hero-photo-track'),e=>getComputedStyle(e).animationPlayState)");assert(paused.every(s=>s==='paused'));
 await evaluate("document.querySelector('.hero-motion-toggle').click();window.scrollTo(0,0)");
 const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('blur-fix-'+width+'.png',Buffer.from(shot.data,'base64'));
}
ws.close();
})().catch(e=>{console.error(e);process.exitCode=1});
