const fs=require('node:fs');let s=fs.readFileSync('qa-mobile-final.cjs','utf8');s=s.slice(0,s.indexOf("await send('Page.enable')"))+`
await send('Page.enable');await send('Page.bringToFront');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:1100,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#stats'});await new Promise(r=>setTimeout(r,600));await send('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,500));
await evaluate("statsMode='all-time';statsTab='pve';renderStats();document.documentElement.style.scrollBehavior='auto';document.querySelector('#stats-content').scrollIntoView();window.scrollBy(0,-95)");
console.log(await evaluate("({bars:document.querySelectorAll('.pve-bar-row').length,singles:document.querySelectorAll('.pve-single').length,total:document.querySelector('.pve-ledger-meta').textContent})"));
const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('pve-bars-preview.png',Buffer.from(shot.data,'base64'));
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});console.log(await evaluate("({width:innerWidth,pageWidth:document.documentElement.scrollWidth})"));ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
`;fs.writeFileSync('qa-pve-bars.cjs',s);
