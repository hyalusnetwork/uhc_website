const fs=require('fs');let q=fs.readFileSync('qa-refined-season-replay.cjs','utf8');q=q.slice(0,q.indexOf("await send('Page.enable')"));q+=`
await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#season-37'});await new Promise(r=>setTimeout(r,500));await send('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,700));
await evaluate("document.querySelector('.season-animation-launch').click();document.querySelector('[data-replay-action=toggle]').click()");
const metrics=await evaluate("(()=>{const rows=[...document.querySelectorAll('#season-37 tbody tr')];return {column:rows[0].querySelector('.death').getBoundingClientRect().left,heights:rows.map(r=>r.getBoundingClientRect().height),shift:getComputedStyle(document.querySelector('.season-animation-launch')).translate}})()");
assert(metrics.heights.every(h=>h===64));assert.equal(metrics.shift,'4px');
await evaluate("const seek=document.querySelector('[data-replay-seek]');seek.value=6510;seek.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-replay-action=next]').click()");
const after=await evaluate("(()=>{const rows=[...document.querySelectorAll('#season-37 tbody tr')],rects=rows.map(r=>r.getBoundingClientRect());return {column:rows[0].querySelector('.death').getBoundingClientRect().left,gaps:rects.slice(1).map((r,i)=>r.top-rects[i].bottom),rowTransforms:rows.map(r=>getComputedStyle(r).transform),dead:rows.filter(r=>r.classList.contains('replay-dead')).length}})()");
assert.equal(after.column,metrics.column);assert(after.gaps.every(g=>Math.abs(g)<0.01));assert(after.rowTransforms.every(t=>t==='none'));console.log({columnStable:true,gaps:after.gaps,shift:metrics.shift,dead:after.dead});
await evaluate("const seek=document.querySelector('[data-replay-seek]');seek.value=seek.max;seek.dispatchEvent(new Event('input',{bubbles:true}));");
assert.equal(await evaluate("document.querySelectorAll('#season-37 .replay-dead').length"),16);
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert.equal(await evaluate("document.documentElement.scrollWidth"),390);
await evaluate("document.querySelector('.season-animation-launch').click()");assert.equal(await evaluate("document.querySelectorAll('.replay-cell-content').length"),0);
console.log('Stable columns, seamless backgrounds during death movement, final state, mobile containment and restoration passed.');ws.close();
})().catch(e=>{console.error(e);process.exitCode=1});
`;fs.writeFileSync('qa-stable-replay-rows.cjs',q);
