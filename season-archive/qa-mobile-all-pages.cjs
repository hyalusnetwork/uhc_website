const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
let pages;for(let i=0;i<40;i++){try{pages=await fetch('http://127.0.0.1:9233/json').then(r=>r.json());break}catch{await new Promise(r=>setTimeout(r,250))}}
const page=pages.find(p=>p.url.includes('UHC.html')),ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method+' timeout')),20000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(Error(method+": "+m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression:'(()=>eval('+JSON.stringify(expression)+'))()',returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};



await send('Page.enable');await send('Page.bringToFront');for(const width of [320,360,375,390,414,600,720,744,768,800,820,900,1024]){
await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:2,mobile:true});
await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html'});await new Promise(r=>setTimeout(r,600));await send('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,250));
for(const hash of ['seasons','players','player-Enzo_','stats','rankings','trivia','about']){
await evaluate('location.hash='+JSON.stringify(hash));await new Promise(r=>setTimeout(r,90));
const result=await evaluate(`({width:innerWidth,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>document.documentElement.clientWidth+2&&!e.closest('table,svg')}).slice(0,5).map(e=>({tag:e.tagName,cls:e.className,width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right}))})`);
if(result.scroll>width||result.width>width)console.log(JSON.stringify({preset:width,hash,...result}));
}
}ws.close();
})().catch(e=>{console.error(e);process.exit(1)});




