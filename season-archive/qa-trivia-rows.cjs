const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
let pages;for(let i=0;i<40;i++){try{pages=await fetch('http://127.0.0.1:9232/json').then(r=>r.json());break}catch{await new Promise(r=>setTimeout(r,250))}}
const page=pages.find(p=>p.url.includes('UHC.html')),ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method+' timeout')),20000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(Error(m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1150,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#trivia'});
for(let i=0;i<40;i++){if(await evaluate('!!document.querySelector(".trivia-record")'))break;await new Promise(r=>setTimeout(r,250))}

assert.equal(await evaluate('document.querySelectorAll(".trivia-record").length'),38);
assert.equal(await evaluate('document.querySelectorAll(".trivia-fact").length'),41);
assert(await evaluate('document.querySelectorAll(".trivia-subject-group").length===window.UHC_TRIVIA.categories.filter(c=>c.id!=="all"&&[...window.UHC_TRIVIA.records,...window.UHC_TRIVIA.facts].some(e=>e.category===c.id)).length'));
assert(await evaluate('[...document.querySelectorAll(".trivia-category-icon")].every(i=>i.complete&&i.naturalWidth>0)'),'Category icons loaded');
assert(await evaluate('document.querySelectorAll(".trivia-controls select").length===1&&!document.querySelector("#trivia-reset")&&!document.querySelector("#trivia-categories")'));


await evaluate('window.scrollTo(0,document.querySelector(".trivia-subject-group").offsetTop+700)');
await new Promise(r=>setTimeout(r,200));
assert(await evaluate('document.querySelector(".trivia-rail-label").getBoundingClientRect().top>=99'),'Sticky label clears navigation');
await evaluate('document.querySelector(".trivia-group-toggle").click()');
await new Promise(r=>setTimeout(r,1000));
assert(await evaluate('(()=>{const r=document.querySelector(".trivia-subject-group").getBoundingClientRect();return r.top>=document.querySelector(".nav").getBoundingClientRect().bottom&&r.bottom<=innerHeight})()'),'Collapsed summary brought fully into view');
await evaluate('document.querySelector(".trivia-group-toggle").click();window.scrollTo(0,0)');
await evaluate('document.querySelector(".trivia-group-toggle").click()');
assert(await evaluate('document.querySelector(".trivia-group-toggle").getAttribute("aria-expanded")==="false"&&!document.querySelector(".trivia-group-summary").hidden&&document.querySelector(".trivia-group-items").hidden'));
await evaluate('document.querySelector("#trivia-toggle-all").click()');
assert(await evaluate('[...document.querySelectorAll(".trivia-group-items")].every(e=>e.hidden)&&document.querySelector("#trivia-toggle-all").textContent==="Expand all"'));
assert(await evaluate('[...document.querySelectorAll(".is-collapsed .trivia-rail-label")].every(e=>getComputedStyle(e).position==="relative"&&getComputedStyle(e).top==="0px")'),'Collapsed plus is stationary');
await evaluate('document.querySelector("#trivia-toggle-all").click()');
assert(await evaluate('[...document.querySelectorAll(".trivia-group-items")].every(e=>!e.hidden)'));
await evaluate('document.querySelector("#trivia-subject").value="ironman";renderTrivia()');
assert(await evaluate('document.querySelectorAll(".trivia-entry").length>0&&document.querySelectorAll(".trivia-entry").length<79'));
await evaluate('document.querySelector("#trivia-subject").value="all";document.querySelector("#trivia-search").value="unmatched-search-987";renderTrivia()');
assert(await evaluate('!document.querySelector("#trivia-empty").hidden'));
await evaluate('document.querySelector("#trivia-search").value="";renderTrivia()');
for(const width of [1440,1050,768,390,320]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<600});
 await new Promise(r=>setTimeout(r,150));
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Overflow '+width);
 assert(await evaluate('(()=>{const grid=document.querySelector("#trivia-grid").getBoundingClientRect();return [...document.querySelectorAll(".trivia-entry article")].every(e=>{const r=e.getBoundingClientRect();return r.left>grid.left&&Math.abs(r.right-grid.right)<2})})()'),'Inset left and fixed right edge '+width);
 assert(await evaluate('(()=>{const r=[...document.querySelectorAll(".trivia-entry")].map(e=>e.getBoundingClientRect());return r.every((a,i)=>!i||a.top>=r[i-1].bottom)})()'),'Rows overlap '+width);
 if(width===1440||width===390){const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('trivia-rows-'+width+'.png',Buffer.from(shot.data,'base64'));}
}
console.log('Passed: 79 entries, single subject dropdown, subject filter, search, empty state, full-width rows and no overflow from 320 to 1440px.');
await send('Browser.close');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
