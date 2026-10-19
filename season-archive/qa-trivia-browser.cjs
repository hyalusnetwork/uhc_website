const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
let pages;for(let i=0;i<40;i++){try{pages=await fetch('http://127.0.0.1:9232/json').then(r=>r.json());break}catch{await new Promise(r=>setTimeout(r,250))}}
const page=pages.find(p=>p.url.includes('UHC.html')),ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method+' timeout')),20000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(Error(m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1150,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#trivia'});
for(let i=0;i<40;i++){if(await evaluate('!!document.querySelector(".trivia-record")'))break;await new Promise(r=>setTimeout(r,250))}
assert.equal(await evaluate('document.querySelectorAll("#trivia-record-grid .trivia-record").length'),38);
assert.equal(await evaluate('document.querySelectorAll(".trivia-fact").length'),await evaluate('window.UHC_TRIVIA.facts.length'));
assert(await evaluate(`document.querySelector('[data-trivia-category="combat"]').click();Array.from(document.querySelectorAll('#trivia-record-grid .trivia-record-bottom>span')).every(s=>s.textContent==='Combat')`));
assert(await evaluate(`document.querySelector('#trivia-reset').click();document.querySelector('#trivia-search').value='half a heart';renderTrivia();document.querySelectorAll('.trivia-fact').length===1&&document.querySelector('.trivia-fact').textContent.includes('Happy_Guy555')`));
assert(await evaluate(`document.querySelector('#trivia-search').value='unmatched-search-987';renderTrivia();!document.querySelector('#trivia-empty').hidden`));
await evaluate(`document.querySelector('#trivia-reset').click();document.querySelector('#trivia-type').value='stories';renderTrivia()`);
assert.equal(await evaluate('document.querySelectorAll(".trivia-archival").length'),9);
await evaluate(`document.querySelector('#trivia-reset').click()`);
assert(await evaluate(`const target=document.querySelector('.trivia-info');target.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:500,clientY:600}));!document.querySelector('#chart-tooltip').hidden&&document.querySelector('#chart-tooltip').textContent.includes('UHC_Data.xlsx')`));
assert(await evaluate(`Array.from(document.querySelectorAll('#trivia-view img')).every(i=>i.complete&&i.naturalWidth>0)`));
await evaluate(`hideChartTooltip();window.scrollTo(0,0)`);await new Promise(r=>setTimeout(r,100));let shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('trivia-preview.png',Buffer.from(shot.data,'base64'));
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert(await evaluate(`document.documentElement.scrollWidth<=window.innerWidth`));
shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('trivia-mobile.png',Buffer.from(shot.data,'base64'));
console.log('Passed browser checks: all record/fact cards, topic filters, search, empty state, historical-story filter, source tooltips, images and mobile layout.');await send('Browser.close');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});

