const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 let pages;for(let i=0;i<40;i++){try{pages=await fetch('http://127.0.0.1:9231/json').then(r=>r.json());break}catch{await new Promise(r=>setTimeout(r,250))}}
 const page=pages.find(p=>p.url.includes('UHC.html')),ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method+' timeout')),20000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(Error(m.error.message)):resolve(m.result)});ws.send(JSON.stringify({id:n,method,params}))});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1200,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#rankings-players'});
 for(let i=0;i<40;i++){if(await evaluate('!!document.querySelector(".pr-row")'))break;await new Promise(r=>setTimeout(r,250))}
 assert.equal(await evaluate('document.querySelectorAll(".pr-row").length'),31);
 assert(await evaluate(`Array.from(document.querySelectorAll('.pr-row .pr-value-line')).every(line=>{const value=line.querySelector('.pr-stat-value').getBoundingClientRect(),badge=line.querySelector('.pr-mini-tier').getBoundingClientRect();return badge.left-value.right>=0&&badge.left-value.right<=8&&Math.abs((badge.top+badge.bottom)/2-(value.top+value.bottom)/2)<4;})`));
 assert(await evaluate(`document.querySelector('.pr-leaderboard-head').textContent.includes('DEFENSE')&&!!document.querySelector('.pr-durability-history')`));
 assert.equal(await evaluate('document.querySelectorAll("[data-ranking-mode]").length'),2);
 assert(await evaluate(`document.querySelector('#team-rankings-panel').hidden&&!document.querySelector('#player-rankings-panel').hidden`));
 assert(await evaluate(`document.querySelector('#pr-search').value='arecue';renderPlayerRankings();document.querySelectorAll('.pr-row').length===1&&document.querySelector('.pr-row').textContent.includes('Happy_Guy555')`));
 await evaluate(`document.querySelector('#pr-search').value='';renderPlayerRankings();document.querySelector('.pr-row').open=true`);
 assert(await evaluate(`const target=document.querySelector('.pr-row .pr-stat');target.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:400,clientY:700}));!document.querySelector('#chart-tooltip').hidden&&document.querySelector('#chart-tooltip').textContent.includes('Score contribution')`));
 await evaluate(`hideChartTooltip();document.querySelector('.pr-row').open=false;window.scrollTo(0,0)`);
 let shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('player-rankings-preview.png',Buffer.from(shot.data,'base64'));
 await evaluate(`location.hash='#rank-player-Enzo_'`);await new Promise(r=>setTimeout(r,100));
 assert(await evaluate(`document.querySelector('#rank-player-Enzo_').open`));
 await evaluate(`document.querySelector('[data-ranking-mode="teams"]').click()`);await new Promise(r=>setTimeout(r,100));
 assert(await evaluate(`!document.querySelector('#team-rankings-panel').hidden&&document.querySelector('#player-rankings-panel').hidden&&document.querySelectorAll('.team-ranking-card').length===17`));
 await evaluate(`document.querySelector('[data-ranking-mode="players"]').click()`);await new Promise(r=>setTimeout(r,100));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await evaluate(`window.scrollTo(0,0)`);
 assert(await evaluate(`document.documentElement.scrollWidth<=window.innerWidth`));
 shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('player-rankings-mobile.png',Buffer.from(shot.data,'base64'));
 await evaluate(`document.querySelector('.pr-row').scrollIntoView();document.querySelector('.pr-row').open=true`);
 assert(await evaluate(`document.documentElement.scrollWidth<=window.innerWidth`));
 shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('player-rankings-mobile-row.png',Buffer.from(shot.data,'base64'));
 console.log('Passed browser checks: 31 rows, two mode toggles, alias search, tooltips, expanded score, player anchor, intact 17 team histories and mobile layout.');await send('Browser.close');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
