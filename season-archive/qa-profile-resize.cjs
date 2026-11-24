const fs=require('fs');const harness=fs.readFileSync('qa-profile-photos.cjs','utf8').split(' const manifest=JSON.parse')[0].replace('.mobile-scrollbar-grid-qa','.cache/profile-resize-qa');
eval(harness+`
 for(const file of ['dist/index.html','../UHC.html']){
 await send('Page.navigate',{url:pathToFileURL(path.resolve(__dirname,file)).href+'#player-coleam'});await pause(600);
 for(const width of [1920,1600,1440,1200,1080,900,850,800,600,580,390,320,580,850,1080,1440,1920]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await pause(180);
 const layout=await evaluate("(()=>{const primary=document.querySelector('.profile-primary').getBoundingClientRect(),follow=document.querySelector('.profile-followup').getBoundingClientRect(),trivia=document.querySelector('.profile-trivia').getBoundingClientRect();return {width:innerWidth,page:document.documentElement.scrollWidth,primaryRight:primary.right,followRight:follow.right,triviaRight:trivia.right,sections:[...document.querySelector('.profile-followup').children].map(e=>({right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width}))}})()");
 console.log(file,width,JSON.stringify(layout));
 assert(layout.page<=width,'No page overflow after resizing to '+width);
 assert(Math.abs(layout.followRight-layout.primaryRight)<1,'Lower row aligns with upper row');
 assert(layout.sections.every(e=>e.right<=layout.primaryRight+1),'Every lower panel fits upper row');
 }
 }
 }finally{ws?.close();browser.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
`);
