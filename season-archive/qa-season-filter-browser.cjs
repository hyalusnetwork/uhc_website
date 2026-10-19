const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
let pages;for(let i=0;i<40;i++){try{pages=await fetch('http://127.0.0.1:9232/json').then(r=>r.json());break}catch{await new Promise(r=>setTimeout(r,250))}}
const page=pages.find(p=>p.url.includes('UHC.html')),ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method+' timeout')),20000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(Error(m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression:'(()=>eval('+JSON.stringify(expression)+'))()',returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1150,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#trivia'});
for(let i=0;i<40;i++){if(await evaluate('!!document.querySelector(".trivia-record")'))break;await new Promise(r=>setTimeout(r,250))}


await evaluate(`document.documentElement.style.scrollBehavior='auto';location.hash='#seasons';document.querySelector('#reset').click();`);
const sizes=await evaluate(`(()=>{const c=document.querySelector('#season-filter-category'),ids=['year','order','reset'],measure=()=>ids.map(id=>document.getElementById(id).getBoundingClientRect().width);const before=measure();c.parentElement.hidden=true;const searchBefore=document.querySelector('.toolbar .search').getBoundingClientRect().width;c.parentElement.hidden=false;return {before,after:measure(),category:c.getBoundingClientRect().width,searchBefore,searchAfter:document.querySelector('.toolbar .search').getBoundingClientRect().width}})()`);
assert.deepEqual(sizes.before,sizes.after);assert(sizes.category<=sizes.before[0]+.1&&sizes.category<=sizes.before[1]+.1);assert(sizes.searchBefore>sizes.searchAfter);
for(const [category,value] of [['year','2024'],['size','1'],['mode','Find Your Team'],['version','1.10']]){
 const result=await evaluate(`(()=>{const category=document.querySelector('#season-filter-category');category.value=${JSON.stringify(category)};category.dispatchEvent(new Event('change'));const value=document.querySelector('#year');value.value=${JSON.stringify(value)};value.dispatchEvent(new Event('change'));return {count:document.querySelectorAll('.season-card').length,ids:Array.from(document.querySelectorAll('.season-card'),n=>Number(n.id.slice(7))),widths:['year','order','reset'].map(id=>document.getElementById(id).getBoundingClientRect().width)}})()`);
 assert(result.count>0);assert.deepEqual(result.widths,sizes.before);if(category==='size')assert.deepEqual(result.ids,[9,19]);if(category==='version')assert.deepEqual(result.ids,[22]);
}
assert(await evaluate(`document.querySelector('#reset').click();document.querySelector('#season-filter-category').value==='year'&&document.querySelector('#year').value===''&&document.querySelectorAll('.season-card').length===36`));
await evaluate(`const toolbar=document.querySelector('.toolbar');window.scrollTo(0,window.scrollY+toolbar.getBoundingClientRect().top-160)`);
await new Promise(r=>setTimeout(r,100));let shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('season-filter-preview.png',Buffer.from(shot.data,'base64'));
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'));await evaluate(`const toolbar=document.querySelector('.toolbar');window.scrollTo(0,window.scrollY+toolbar.getBoundingClientRect().top-130)`);shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('season-filter-mobile.png',Buffer.from(shot.data,'base64'));
console.log('Passed browser checks: four filter categories, correct options/results, preserved dropdown/sort/reset widths, compact category, shorter search, reset and mobile containment.');await send('Browser.close');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
