const fs=require('fs');let q=fs.readFileSync('qa-stable-replay-rows.cjs','utf8');q=q.slice(0,q.indexOf("await send('Page.enable')"));q+=`
await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#seasons'});await new Promise(r=>setTimeout(r,500));await send('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,900));
await evaluate("document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0)");
console.log(await evaluate("({images:[...document.querySelectorAll('.hero-photo-group img')].map(i=>({loaded:i.complete&&i.naturalWidth>0,embedded:i.src.startsWith('data:')})),height:document.querySelector('.hero').getBoundingClientRect().height,blur:getComputedStyle(document.querySelector('.hero-copy-glass')).backdropFilter,direction:getComputedStyle(document.querySelector('.hero-photo-track')).animationName})"));
assert(await evaluate("[...document.querySelectorAll('.hero-photo-group img')].every(i=>i.complete&&i.naturalWidth>0&&i.src.startsWith('data:'))"));
await evaluate("document.querySelector('.hero-motion-toggle').click()");assert.equal(await evaluate("getComputedStyle(document.querySelector('.hero-photo-track')).animationPlayState"),'paused');
let shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('hero-carousel-preview.png',Buffer.from(shot.data,'base64'));
assert(await evaluate("(()=>{const groups=[...document.querySelectorAll('.hero-photo-group')];return Math.abs(groups[0].getBoundingClientRect().right-groups[1].getBoundingClientRect().left)<.1})()"));
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert.equal(await evaluate("document.documentElement.scrollWidth"),390);await evaluate("window.scrollTo(0,0)");
shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('hero-carousel-mobile.png',Buffer.from(shot.data,'base64'));
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});assert.equal(await evaluate("getComputedStyle(document.querySelector('.hero-photo-track')).animationName"),'none');
console.log('Embedded images, seamless groups, pause control, mobile containment and reduced motion verified.');ws.close();
})().catch(e=>{console.error(e);process.exitCode=1});
`;fs.writeFileSync('qa-hero-carousel.cjs',q);
