const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
let pages;for(let i=0;i<40;i++){try{pages=await fetch('http://127.0.0.1:9240/json').then(r=>r.json());break}catch{await new Promise(r=>setTimeout(r,250))}}
const page=pages.find(p=>p.url.includes('UHC.html')),ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method+' timeout')),20000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(Error(method+": "+m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression:'(()=>eval('+JSON.stringify(expression)+'))()',returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};








await send('Page.enable');
await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#seasons'});await new Promise(r=>setTimeout(r,500));await send('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,900));

await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});
const result=await evaluate(`(async()=>{
 const hero=document.querySelector('.hero-with-photos');
 const images=[...hero.querySelectorAll('.hero-photo-window img')];
 await Promise.all(images.map(img=>img.decode()));
 const tracks=[...hero.querySelectorAll('.hero-photo-track')];
 const groups=tracks[0].querySelectorAll('.hero-photo-group');
 const unique=new Set([...groups[0].querySelectorAll('img')].map(img=>img.src)).size;
 const gap=groups[1].getBoundingClientRect().left-groups[0].getBoundingClientRect().right;
 const same=groups[0].innerHTML===groups[1].innerHTML;
 const duration=parseFloat(getComputedStyle(tracks[0]).animationDuration);
 const speed=groups[0].getBoundingClientRect().width/duration;
 const animations=tracks.map(track=>track.getAnimations()[0]);
 animations.forEach(animation=>animation.currentTime=duration*1000-10);
 const nearEnd=tracks.map(track=>getComputedStyle(track).transform);
 document.querySelector('.hero-motion-toggle').click();
 const paused=tracks.every(track=>getComputedStyle(track).animationPlayState==='paused');
 return {unique,decoded:images.length,groupsMatch:same,gap,duration,pixelsPerSecond:speed,paused,synchronized:nearEnd[0]===nearEnd[1],scroll:document.documentElement.scrollWidth};
})()`);
assert.equal(result.unique,25);assert.equal(result.decoded,100);assert(result.groupsMatch);assert(Math.abs(result.gap)<1);assert(result.paused);assert(result.synchronized);assert(Math.abs(result.duration/25-152.777778/5)<.0001);console.log(result);
ws.close();
})().catch(e=>{console.error(e);process.exitCode=1});


