const fs=require('fs');let q=fs.readFileSync('qa-hero-wordmark.cjs','utf8');q=q.slice(0,q.indexOf("await send('Page.enable')"));q+=`
await send('Page.enable');await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#seasons'});await new Promise(r=>setTimeout(r,500));await send('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,600));
for(const width of [1440,1256,390]){
await send('Emulation.setDeviceMetricsOverride',{width,height:1050,deviceScaleFactor:1,mobile:width<500});await new Promise(r=>setTimeout(r,150));
const result=await evaluate("(()=>{const hero=document.querySelector('.hero'),archive=document.querySelector('.archive'),copy=hero.querySelector('.hero-copy'),frame=hero.querySelector('.hero-photo-window'),a=archive.getBoundingClientRect(),style=getComputedStyle(archive),f=frame.getBoundingClientRect();const before=copy.getBoundingClientRect();hero.querySelectorAll('.hero-photo-window,.hero-photo-shade,.hero-copy-glass').forEach(e=>e.style.visibility='hidden');const after=copy.getBoundingClientRect();hero.querySelectorAll('.hero-photo-window,.hero-photo-shade,.hero-copy-glass').forEach(e=>e.style.visibility='');return {left:f.left,expectedLeft:a.left+parseFloat(style.paddingLeft),right:f.right,expectedRight:a.right-parseFloat(style.paddingRight),copyLeft:before.left,copyUnchanged:before.left===after.left&&before.top===after.top,pauseRight:hero.querySelector('.hero-motion-toggle').getBoundingClientRect().right,scroll:document.documentElement.scrollWidth,width:innerWidth}})()");
assert(Math.abs(result.left-result.expectedLeft)<1);assert(Math.abs(result.right-result.expectedRight)<1);assert(result.copyUnchanged);assert(result.pauseRight<result.right);console.log(result);
}
ws.close();
})().catch(e=>{console.error(e);process.exitCode=1});
`;fs.writeFileSync('qa-hero-edge-alignment.cjs',q);
