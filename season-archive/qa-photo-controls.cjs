const fs=require('node:fs');
const harness=fs.readFileSync('qa-profile-photos.cjs','utf8').split(" const manifest=JSON.parse")[0];
eval(harness+`
 for(const file of ['dist/index.html','../UHC.html']){
  await send('Page.navigate',{url:pathToFileURL(path.resolve(__dirname,file)).href+'#player-Enzo_'});await pause(900);
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await evaluate("document.querySelector('.trophy-tile').click()");
  const button=await evaluate("(()=>{const b=document.querySelector('.trophy-dialog-header button');return {type:b.type,svg:!!b.querySelector('svg'),color:getComputedStyle(b).backgroundColor,border:getComputedStyle(b).borderWidth,trim:getComputedStyle(b,'::before').boxShadow}})()");
  assert.equal(button.type,'submit');assert(button.svg);assert.equal(button.border,'2px');assert.notEqual(button.trim,'none');
  await evaluate("document.querySelector('.trophy-dialog-header button').click()");assert(await evaluate("!document.querySelector('.trophy-dialog').open"),'Trophy close works');
  await evaluate("document.activeElement.blur();document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0);document.querySelector('.profile-photos').dispatchEvent(new PointerEvent('pointerleave',{pointerType:'mouse'}))");
  assert(await evaluate("document.querySelector('.profile-photo-strip').getBoundingClientRect().top>innerHeight"),'Carousel is offscreen');
  const before=await evaluate("document.querySelector('.profile-photo-position').textContent");
  await pause(6000);
  assert.notEqual(await evaluate("document.querySelector('.profile-photo-position').textContent"),before,'Offscreen carousel advances');
  assert(await evaluate("(()=>{const i=Number(document.querySelector('.profile-photo-position').textContent.split('/')[0])-1;return document.querySelector('.profile-photo-backdrop img.is-current').src===document.querySelectorAll('.profile-photo-card:not(.profile-photo-clone) img')[i].src})()"),'Background stays synchronized');
  console.log(file,'trophy close button and offscreen rotation passed');
 }
 }finally{ws?.close();browser.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
`);
