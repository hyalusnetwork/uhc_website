const fs=require('node:fs');let s=fs.readFileSync('qa-about-browser.cjs','utf8');s=s.slice(0,s.indexOf("await send('Emulation.setDeviceMetricsOverride'"))+`
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html#seasons'});await send('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,700));
console.log(JSON.stringify(await evaluate(\`({width:innerWidth,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>400&&!e.closest('table')}).slice(0,22).map(e=>({tag:e.tagName,cls:e.className,width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right}))})\`),null,2));ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
`;fs.writeFileSync('qa-mobile-overflow.cjs',s);
