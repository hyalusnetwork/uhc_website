const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
let pages;for(let i=0;i<40;i++){try{pages=await fetch('http://127.0.0.1:9240/json').then(r=>r.json());break}catch{await new Promise(r=>setTimeout(r,250))}}
const page=pages.find(p=>p.url.includes('UHC.html')),ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method+' timeout')),20000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(Error(method+": "+m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression:'(()=>eval('+JSON.stringify(expression)+'))()',returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};









await send('Page.enable');await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#seasons'});await new Promise(r=>setTimeout(r,500));await send('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,600));
for(const width of [1440,1256,390]){
await send('Emulation.setDeviceMetricsOverride',{width,height:1050,deviceScaleFactor:1,mobile:width<500});await new Promise(r=>setTimeout(r,150));
const result=await evaluate("(()=>{const hero=document.querySelector('.hero'),archive=document.querySelector('.archive'),copy=hero.querySelector('.hero-copy'),frame=hero.querySelector('.hero-photo-window'),a=archive.getBoundingClientRect(),style=getComputedStyle(archive),f=frame.getBoundingClientRect();const before=copy.getBoundingClientRect();hero.querySelectorAll('.hero-photo-window,.hero-photo-shade,.hero-copy-glass').forEach(e=>e.style.visibility='hidden');const after=copy.getBoundingClientRect();hero.querySelectorAll('.hero-photo-window,.hero-photo-shade,.hero-copy-glass').forEach(e=>e.style.visibility='');return {left:f.left,expectedLeft:a.left+parseFloat(style.paddingLeft),right:f.right,expectedRight:a.right-parseFloat(style.paddingRight),copyLeft:before.left,copyUnchanged:before.left===after.left&&before.top===after.top,pauseRight:hero.querySelector('.hero-motion-toggle').getBoundingClientRect().right,scroll:document.documentElement.scrollWidth,width:innerWidth}})()");
assert(Math.abs(result.left-result.expectedLeft)<1);assert(Math.abs(result.right-result.expectedRight)<1);assert(result.copyUnchanged);assert(result.pauseRight<result.right);console.log(result);
}
ws.close();
})().catch(e=>{console.error(e);process.exitCode=1});
