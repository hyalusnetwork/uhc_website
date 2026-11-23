const fs=require('node:fs');
const harness=fs.readFileSync('qa-profile-photos.cjs','utf8').split(' const manifest=JSON.parse')[0].replace('.mobile-scrollbar-grid-qa','.deploy-check-browser');
eval(harness+`
 const errors=[];
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});
 await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'https://hyalusnetwork.github.io/uhc_website/players.html#player-Enzo_'});
 let loaded=false;
 for(let i=0;i<60;i++){await pause(500);loaded=await evaluate("!!document.querySelector('#full-profile .trophy-tile')");if(loaded)break;}
 const state=await evaluate("(()=>{const p=window.UHC_PROFILES?.profiles.find(p=>p.name==='Enzo_');return {url:location.href,title:document.title,ready:document.readyState,profile:!!p,trophies:[...document.querySelectorAll('.trophy-tile strong')].map(e=>e.textContent),photos:!!document.querySelector('.profile-photos'),colorTiles:document.querySelectorAll('.team-color-tile').length,firstKillTrivia:p?.trivia.filter(t=>t.startsWith('Got the first recorded')),scripts:[...document.scripts].filter(s=>s.src).map(s=>new URL(s.src).pathname.split('/').pop())}})()");
 console.log(JSON.stringify({loaded,errors,state},null,2));
 const screenshot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('published-player-bio.png',Buffer.from(screenshot.data,'base64'));
 assert(loaded,'Live player bio loads');assert.equal(errors.length,0,'No runtime errors');assert(state.trophies.includes('Hot Start'));assert(state.trophies.includes('Monarch'));assert(state.photos);assert(state.colorTiles>0);
 }finally{ws?.close();browser.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
`);
