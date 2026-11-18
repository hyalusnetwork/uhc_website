const fs=require('fs');let s=fs.readFileSync('qa-player-bars.cjs','utf8');s=s.slice(0,s.indexOf("await send('Page.enable')"));s=s.replace('9233','9240');
s+=`
await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#season-37'});await new Promise(r=>setTimeout(r,1200));
console.log(await evaluate("typeof window.UHC_REPLAY_API"));
await evaluate("document.documentElement.style.scrollBehavior='auto';document.querySelector('#season-37 [data-replay-action=toggle]').click();document.querySelector('#season-37 [data-replay-action=start]').click();document.querySelector('#season-37').scrollIntoView()");
let initial=await evaluate("({names:[...document.querySelectorAll('#season-37 tbody .player-name')].map(x=>x.textContent),hearts:document.querySelectorAll('#season-37 .replay-heart').length,dead:document.querySelectorAll('#season-37 .replay-dead').length,time:document.querySelector('#season-37 .time-box strong').textContent})");console.log(initial);assert.equal(initial.hearts,180);assert.equal(initial.dead,0);
console.log(await evaluate("({pecus:UHC_REPLAY_API.snapshot(37,2).get('Pecus').health,dead:[...UHC_REPLAY_API.snapshot(37,2200).values()].filter(p=>p.dead).length})"));
await evaluate("const seek=document.querySelector('[data-replay-seek]');seek.value=10730;seek.dispatchEvent(new Event('input',{bubbles:true}));");
assert.equal(await evaluate("document.querySelectorAll('#season-37 .replay-dead').length"),9);
let shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('season-replay-preview.png',Buffer.from(shot.data,'base64'));
await evaluate("const seek=document.querySelector('[data-replay-seek]');seek.value=seek.max;seek.dispatchEvent(new Event('input',{bubbles:true}));");
assert.equal(await evaluate("document.querySelectorAll('#season-37 .replay-dead').length"),16);
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});console.log(await evaluate("({width:innerWidth,scroll:document.documentElement.scrollWidth})"));
await evaluate("document.querySelector('[data-replay-action=close]').click()");assert.equal(await evaluate("document.querySelectorAll('#season-37 .replay-hearts').length"),0);
console.log('Replay initial hearts, initial-hit exclusion, death timing, seeking, final deaths, mobile width and final-results restore passed');ws.close();
})().catch(e=>{console.error(e);process.exitCode=1});
`;
fs.writeFileSync('qa-season-replay.cjs',s);
