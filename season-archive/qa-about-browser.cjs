const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
let pages;for(let i=0;i<40;i++){try{pages=await fetch('http://127.0.0.1:9232/json').then(r=>r.json());break}catch{await new Promise(r=>setTimeout(r,250))}}
const page=pages.find(p=>p.url.includes('UHC.html')),ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method+' timeout')),20000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(Error(m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression:'(()=>eval('+JSON.stringify(expression)+'))()',returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1150,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#trivia'});
await send('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,250));
for(let i=0;i<40;i++){if(await evaluate('!!document.querySelector(".trivia-record")'))break;await new Promise(r=>setTimeout(r,250))}



await evaluate(`document.documentElement.style.scrollBehavior='auto';location.hash='#season-1';document.querySelector('#search').value='';document.querySelector('#year').value='';render();`);
await new Promise(r=>setTimeout(r,100));
assert(await evaluate(`!document.querySelector('[data-tab="links"]')&&document.querySelector('[data-tab="about"]').textContent==='About'`));
await evaluate(`document.querySelector('#season-1 .crown-link').scrollIntoView({block:'center'})`);
const rect=await evaluate(`(()=>{const r=document.querySelector('#season-1 .crown-link').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
await send('Input.dispatchMouseEvent',{type:'mouseMoved',...rect});
assert(await evaluate(`getComputedStyle(document.querySelector('#season-1 .crown .tooltip')).display==='block'`));
await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:10,y:400});
assert(await evaluate(`getComputedStyle(document.querySelector('#season-1 .crown .tooltip')).display==='none'`));
await send('Input.dispatchMouseEvent',{type:'mouseMoved',...rect});await send('Input.dispatchMouseEvent',{type:'mousePressed',...rect,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...rect,button:'left',clickCount:1});
await new Promise(r=>setTimeout(r,100));
assert(await evaluate(`location.hash==='#about-crown'&&!document.querySelector('#about-view').hidden&&document.querySelector('#seasons-view').hidden&&document.querySelectorAll('.crown.open').length===0`));
console.log(await evaluate(`JSON.stringify({top:document.querySelector('#about-crown').getBoundingClientRect().top,scroll:window.scrollY,margin:getComputedStyle(document.querySelector('#about-crown')).scrollMarginTop,padding:getComputedStyle(document.documentElement).scrollPaddingTop})`));
assert(await evaluate(`document.querySelector('#about-crown').getBoundingClientRect().top>=75&&document.querySelector('#about-crown').getBoundingClientRect().top<160`));
let shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('about-crown-preview.png',Buffer.from(shot.data,'base64'));
await evaluate(`location.hash='#season-1'`);await new Promise(r=>setTimeout(r,100));
assert(await evaluate(`const link=document.querySelector('#season-1 .season-team-link');link.getAttribute('href')==='#team-color-Green'`));
await evaluate(`document.querySelector('#season-1 .season-team-link').click()`);await new Promise(r=>setTimeout(r,100));
assert(await evaluate(`location.hash==='#team-color-Green'&&!document.querySelector('#rankings-view').hidden&&!document.querySelector('#team-rankings-panel').hidden&&document.querySelector('#team-color-Green').getBoundingClientRect().top<200`));
await evaluate(`location.hash='#about'`);await new Promise(r=>setTimeout(r,100));
assert(await evaluate(`Array.from(document.querySelectorAll('#about-view img')).every(i=>i.complete&&i.naturalWidth>0)`));
shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('about-preview.png',Buffer.from(shot.data,'base64'));
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'));shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('about-mobile.png',Buffer.from(shot.data,'base64'));
console.log('Passed browser checks: About replaces Links, crown hover ends on exit, crown click navigates to Crown section, team links target correct color, embedded images and mobile layout.');await send('Browser.close');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
