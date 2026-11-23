const fs=require('node:fs');
const harness=fs.readFileSync('qa-profile-photos.cjs','utf8').split(' const manifest=JSON.parse')[0].replace('.mobile-scrollbar-grid-qa','.deploy-check-browser');
eval(harness+`
 for(const file of ['dist/players.html','../UHC.html']){
  await send('Page.navigate',{url:pathToFileURL(path.resolve(__dirname,file)).href+'#player-Enzo_'});await pause(700);
  const state=await evaluate("(()=>{const cards=[...document.querySelectorAll('.trophy-tile')],hot=cards.find(b=>b.querySelector('strong').textContent==='Hot Start');return {photos:!!document.querySelector('.profile-photos'),tiles:document.querySelectorAll('.team-color-tile').length,campfire:hot?.querySelector('img').src===window.UHC_ICONS.campfire,versions:[...document.scripts].filter(s=>s.src).every(s=>new URL(s.src).searchParams.has('v')),sync:document.querySelector('.profile-photo-backdrop img.is-current').src===document.querySelector('.profile-photo-card:not(.profile-photo-clone) img').src}})()");
  assert(state.photos&&state.tiles>0&&state.campfire&&state.sync);assert(state.versions);
  console.log(file,'versioned Player Bio assets and latest features passed');
 }
 }finally{ws?.close();browser.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
`);
