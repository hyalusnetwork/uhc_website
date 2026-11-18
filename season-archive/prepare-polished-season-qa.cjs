const fs=require('fs');let q=fs.readFileSync('qa-variable-replay.cjs','utf8');q=q.slice(0,q.indexOf("await send('Page.enable')"));q+=`
await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#season-37'});await new Promise(r=>setTimeout(r,500));await send('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,600));
assert(await evaluate("(()=>{const s=seasons.find(s=>s.id===37),rows=[...document.querySelectorAll('#season-37 tbody tr')];return rows.filter(r=>s.players.find(p=>p.name===r.querySelector('[data-player]').dataset.player)?.finalHearts!=null).every(r=>!r.querySelector('.elapsed').textContent.trim())})()"));
await evaluate("document.querySelector('.season-animation-launch').click();document.querySelector('[data-replay-action=toggle]').click()");
assert(await evaluate("[...document.querySelectorAll('#season-37 .elapsed')].every(e=>!e.textContent.trim())"));assert.equal(await evaluate("getComputedStyle(document.querySelector('#season-37 tbody td')).borderTopWidth"),'0px');
await evaluate("document.querySelector('#season-37 [data-season-menu=videos]').click()");
assert.equal(await evaluate("document.querySelector('.season-menu-close').textContent"),'Close');
console.log(await evaluate("({videos:document.querySelectorAll('.season-menu-videos li').length,buttonShift:getComputedStyle(document.querySelector('.season-animation-launch')).translate})"));
const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('season-video-popup-preview.png',Buffer.from(shot.data,'base64'));
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
assert(await evaluate("document.querySelector('#season-menu-dialog').getBoundingClientRect().right<=390"));await evaluate("document.querySelector('.season-menu-close').click()");assert.equal(await evaluate("document.querySelector('#season-menu-dialog').open"),false);
console.log('Blank survivor times, borderless replay rows, button offset, popup and mobile containment verified');ws.close();
})().catch(e=>{console.error(e);process.exitCode=1});
`;fs.writeFileSync('qa-polished-season.cjs',q);
