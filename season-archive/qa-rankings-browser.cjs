const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 let pages;for(let i=0;i<30;i++){try{pages=await fetch('http://127.0.0.1:9230/json').then(r=>r.json());break}catch{await new Promise(r=>setTimeout(r,250))}}
 const page=pages.find(p=>p.url.includes('UHC.html')),ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method+' timeout')),20000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(Error(m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id:n,method,params}))});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#rankings'});
 for(let i=0;i<40;i++){if(await evaluate('!!document.querySelector(".team-ranking-card")'))break;await new Promise(r=>setTimeout(r,250))}
 assert.equal(await evaluate('document.querySelectorAll(".team-ranking-card").length'),17);
 assert(await evaluate(`document.querySelector('link[rel="icon"]').href.startsWith('data:image/png;base64,')`));
 assert(await evaluate(`document.querySelector('.nav .navbar-heart').complete&&document.querySelector('.nav .navbar-heart').naturalWidth>0`));
 assert(await evaluate(`document.querySelector('#ranking-search').value='Purple';renderRankings();document.querySelectorAll('.team-ranking-card').length===1`));
 assert(await evaluate(`document.querySelector('#ranking-search').value='';document.querySelector('#ranking-filter').value='ranked';renderRankings();document.querySelectorAll('.team-ranking-card').length===9`));
 await evaluate(`document.querySelector('#ranking-filter').value='all';renderRankings();window.scrollTo(0,0)`);
 let shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('rankings-preview.png',Buffer.from(shot.data,'base64'));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 assert(await evaluate(`document.documentElement.scrollWidth<=window.innerWidth`));
 shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('rankings-mobile.png',Buffer.from(shot.data,'base64'));
 console.log('Passed browser checks: 17 histories, 9 qualified colors, search, eligibility filter, PNG favicon/navbar and mobile overflow.');await send('Browser.close');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
