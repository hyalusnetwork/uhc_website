const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const pages=await fetch('http://127.0.0.1:9228/json').then(r=>r.json());const page=pages.find(p=>p.url.includes('hyalus_uhc')||p.url.includes('UHC.html'));
 const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const callbacks=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(callbacks.has(m.id)){callbacks.get(m.id)(m);callbacks.delete(m.id)}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>reject(Error(method+' timed out')),20000);callbacks.set(n,r=>{clearTimeout(timer);r.error?reject(Error(r.error.message)):resolve(r.result)});ws.send(JSON.stringify({id:n,method,params}));});
 const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text+': '+result.exceptionDetails.exception?.description);return result.result.value;};
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#stats'});
 for(let i=0;i<40;i++){if(await evaluate('!!window.UHC_STATS && !!document.querySelector("#stats-content table")'))break;await new Promise(r=>setTimeout(r,250));}
 assert.equal(await evaluate('document.querySelectorAll("[data-stats-tab]").length'),12);
 const tableChecks=await evaluate(`statsData.tables.map(t=>{statsTab=t.id;statsSort.column=null;renderStats();return {id:t.id,rows:document.querySelectorAll('#stats-content tbody tr').length,expected:t.rows.length};})`);
 tableChecks.forEach(c=>assert.equal(c.rows,c.expected,c.id));
 assert(await evaluate(`statsTab='pvp';renderStats();document.querySelector('#stats-search').value='arecue';document.querySelector('#stats-search').dispatchEvent(new Event('input'));document.querySelectorAll('#stats-content tbody tr').length===1`));
 const graphChecks=await evaluate(`document.querySelector('#stats-search').value='';statsMode='graphs';statsData.graphs.map(g=>{statsTab=g.id;renderStats();return {id:g.id,svg:!!document.querySelector('#stats-content svg'),targets:document.querySelectorAll('#stats-content [data-chart-tip]').length,nativeTitles:document.querySelectorAll('#stats-content svg title').length};})`);
 graphChecks.forEach(c=>{assert(c.svg,c.id);assert(c.targets>0,c.id);assert.equal(c.nativeTitles,0,c.id)});
 assert(await evaluate(`const target=document.querySelector('#stats-content [data-chart-tip]');target.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:450,clientY:400}));!document.querySelector('#chart-tooltip').hidden&&document.querySelector('#chart-tooltip').textContent.includes('Season')`));
 await evaluate(`hideChartTooltip();statsTab='death-type';renderStats();window.scrollTo(0,0);`);
 const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('stats-preview.png',Buffer.from(screenshot.data,'base64'));
 await evaluate(`location.hash='#player-Enzo_';`);await new Promise(r=>setTimeout(r,200));
 assert(await evaluate(`document.querySelector('.portrait img').src===window.UHC_FACES.Enzo_`));
 console.log(JSON.stringify({tables:tableChecks.length,graphs:graphChecks.length,search:true,customTooltip:true,playerFace:true,screenshot:'stats-preview.png'}));
 await send('Browser.close');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
