const fs=require('node:fs');
const harness=fs.readFileSync('qa-profile-photos.cjs','utf8').split(' const manifest=JSON.parse')[0];
eval(harness+`
 for(const file of ['dist/index.html','../UHC.html']){
  await send('Page.navigate',{url:pathToFileURL(path.resolve(__dirname,file)).href+'#player-Enzo_'});await pause(800);
  const orders=new Set();
  const registry=await evaluate('JSON.stringify(window.UHC_PROFILE_PHOTOS)');
  for(let visit=0;visit<5;visit++){
   await evaluate("showPlayer('Enzo_')");await pause(100);
   const state=await evaluate("(()=>{const images=[...document.querySelectorAll('.profile-photo-card:not(.profile-photo-clone) img')],source=new Map(window.UHC_PROFILE_PHOTOS.map(p=>[new URL(p.src,location.href).href,p.id]));return {ids:images.map(i=>source.get(i.src)),expected:photosForPlayer(profileByName('Enzo_')).map(p=>p.id),background:document.querySelector('.profile-photo-backdrop img.is-current').src===images[0].src}})()");
   orders.add(state.ids.join(','));assert.deepEqual([...state.ids].sort((a,b)=>a-b),state.expected.sort((a,b)=>a-b));assert(state.background);
   await evaluate("document.querySelector('.profile-photo-card:not(.profile-photo-clone)').click()");
   assert(await evaluate("document.querySelector('.photo-dialog-image').src===document.querySelector('.profile-photo-card:not(.profile-photo-clone) img').src"),'Popup shares shuffled order');
   await evaluate("document.querySelector('[data-photo-close]').click()");
  }
  assert(orders.size>1,'New profile visits reshuffle photos');assert.equal(await evaluate('JSON.stringify(window.UHC_PROFILE_PHOTOS)'),registry,'Shared photo registry unchanged');
  console.log(file,'per-visit shuffle, photo membership and synchronized popup/background passed');
 }
 }finally{ws?.close();browser.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
`);
