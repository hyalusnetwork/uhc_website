const fs=require('node:fs');
const harness=fs.readFileSync('qa-profile-photos.cjs','utf8').split(' const manifest=JSON.parse')[0];
eval(harness+`
 for(const file of ['dist/index.html','../UHC.html']){
  await send('Page.navigate',{url:pathToFileURL(path.resolve(__dirname,file)).href+'#player-Enzo_'});await pause(800);
  for(const [selector,touch] of [['.profile-sidebar [data-profile-season]',false],['.career-teammate-nodes [data-profile-season]',true]]){
   if(touch)await evaluate("document.querySelector('#career-tab-5').click()");
   await evaluate(\`(()=>{const tile=document.querySelector('\${selector}');if(\${touch}){tile.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',pointerId:9}));tile.dispatchEvent(new PointerEvent('click',{bubbles:true,cancelable:true,pointerType:'touch',detail:1}));}else tile.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}));})()\`);
   assert(await evaluate("document.querySelector('#profile-season-preview').matches(':popover-open')"),'Tooltip opens');
   const before=await evaluate("document.querySelector('.profile-photo-position').textContent");
   await pause(6200);
   assert.notEqual(await evaluate("document.querySelector('.profile-photo-position').textContent"),before,'Carousel rotated');
   assert(await evaluate("document.querySelector('#profile-season-preview').matches(':popover-open')"),'Tooltip survives carousel scrolling');
   console.log(file,touch?'teammate touch tooltip':'sidebar hover tooltip','survives automatic rotation');
  }
  await evaluate("document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,300)");await pause(100);
  assert(await evaluate("!document.querySelector('#profile-season-preview').matches(':popover-open')"),'Page scrolling still dismisses tooltip');
 }
 }finally{ws?.close();browser.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
`);
