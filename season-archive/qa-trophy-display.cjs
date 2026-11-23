const fs=require('node:fs');
const harness=fs.readFileSync('qa-profile-photos.cjs','utf8').split(' const manifest=JSON.parse')[0];
eval(harness+`
 for(const file of ['dist/index.html','../UHC.html']){
  await send('Page.navigate',{url:pathToFileURL(path.resolve(__dirname,file)).href+'#player-Enzo_'});await pause(700);
  for(const width of [390,1440]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width===390});
   const heading=await evaluate("(()=>{const p=document.querySelector('.profile-photo-heading'),h=p.querySelector('h2').getBoundingClientRect(),s=p.querySelector('.photo-hint').getBoundingClientRect();return {gap:s.top-h.bottom,hints:document.querySelectorAll('.profile-photos .photo-hint').length,trophyHint:document.querySelector('.trophy-hover-hint').textContent}})()");
   assert.equal(heading.gap,5);assert.equal(heading.hints,1);assert.equal(heading.trophyHint,'Click on a trophy for more details.');
   await evaluate("[...document.querySelectorAll('.trophy-tile')].find(b=>b.querySelector('strong').textContent==='Monarch').click()");
   const crown=await evaluate("(()=>{const i=document.querySelector('.trophy-dialog-header img'),s=getComputedStyle(i);return {fit:s.objectFit,shrink:s.flexShrink,width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height}})()");
   assert.equal(crown.fit,'contain');assert.equal(crown.shrink,'0');assert.equal(crown.width,48);assert.equal(crown.height,48);
   await evaluate("document.querySelector('.trophy-dialog-header button').click();[...document.querySelectorAll('.trophy-tile')].find(b=>b.querySelector('strong').textContent==='UHC Victor').click()");
   const teams=await evaluate("[...document.querySelectorAll('.trophy-dialog li')].map(li=>({season:Number(li.querySelector('a').textContent),name:li.querySelector('.trophy-winning-team').textContent,color:li.querySelector('.trophy-winning-team').style.color}))");
   assert(teams.length>0);assert(teams.every(t=>t.name&&!t.name.includes('Member of')&&t.color));
   await evaluate("document.querySelector('.trophy-dialog-header button').click()");
   await evaluate("[...document.querySelectorAll('.trophy-tile')].find(b=>b.querySelector('strong').textContent==='UHC Victor').dispatchEvent(new PointerEvent('pointerenter',{pointerType:'mouse'}))");
   assert(await evaluate("document.querySelectorAll('.trophy-hover-preview .trophy-winning-team').length>0"),'Hover previews show colored team names');
   await evaluate("document.querySelector('.trophy-hover-preview').hidePopover()");
   console.log(file,width,'Monarch icon and winning-team entries passed');
  }
 }
 }finally{ws?.close();browser.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
`);
