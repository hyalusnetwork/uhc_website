const fs=require('fs');let s=fs.readFileSync('qa-mobile-overflow.cjs','utf8');s=s.slice(0,s.indexOf("await send('Page.navigate'"))+`
for(const width of [320,360,375,390,414,600,720,744,768,800,820,900,1024]){
await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:2,mobile:true});
await send('Page.navigate',{url:'file:///E:/Games/Minecraft/UHC/Website/UHC.html'});await send('Page.reload',{ignoreCache:true});await new Promise(r=>setTimeout(r,250));
for(const hash of ['seasons','players','player-Enzo_','stats','rankings','trivia','about']){
await evaluate('location.hash='+JSON.stringify(hash));await new Promise(r=>setTimeout(r,90));
const result=await evaluate(\`({width:innerWidth,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>document.documentElement.clientWidth+2&&!e.closest('table,svg')}).slice(0,5).map(e=>({tag:e.tagName,cls:e.className,width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right}))})\`);
if(result.scroll>width||result.width>width)console.log(JSON.stringify({preset:width,hash,...result}));
}
}ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
`;fs.writeFileSync('qa-mobile-all-pages.cjs',s);
