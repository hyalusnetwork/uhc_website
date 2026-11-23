const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
 const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9251',
  '--user-data-dir=' + path.join(__dirname, '.mobile-scrollbar-grid-qa'), 'about:blank'
 ], { windowsHide: true, stdio: 'ignore' });
 let ws;
 try {
  let pages;
  for (let i = 0; i < 50; i++) {
   try { pages = await fetch('http://127.0.0.1:9251/json').then(r => r.json()); break; }
   catch { await pause(200); }
  }
  assert(pages, 'Headless Edge started');
  ws = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', event => {
   const message = JSON.parse(event.data);
   if (pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
   const n = ++id;
   const timer = setTimeout(() => reject(Error(method + ' timed out')), 15000);
   pending.set(n, message => {
    clearTimeout(timer);
    message.error ? reject(Error(message.error.message)) : resolve(message.result);
   });
   ws.send(JSON.stringify({ id: n, method, params }));
  });
  const evaluate = async expression => {
   const result = await send('Runtime.evaluate', { expression, returnByValue: true });
   assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
   return result.result.value;
  };
  await send('Page.enable');


 const manifest=JSON.parse(fs.readFileSync('references/profile-photos.json','utf8'));
 assert.equal(manifest.length,38);assert(!manifest.some(p=>p.id===26));
 for(const file of ['dist/index.html','../UHC.html']){
  await send('Page.navigate',{url:pathToFileURL(path.resolve(__dirname,file)).href+'#player-Enzo_'});await pause(900);
  for(const width of [390,1440]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});await pause(250);
   const state=await evaluate(`(()=>{
    const panel=document.querySelector('.profile-photos'),strip=panel.querySelector('.profile-photo-strip');
    return {count:strip.querySelectorAll('.profile-photo-card:not(.profile-photo-clone)').length,previous:!!panel.previousElementSibling.querySelector('.career-tabs'),next:panel.nextElementSibling.classList.contains('team-color-section'),overflow:document.documentElement.scrollWidth>innerWidth,cave:getComputedStyle(document.querySelector('#full-profile'),'::before').display,backdrop:document.querySelectorAll('#full-profile .ranking-photo-backdrop img').length,registry:window.UHC_PROFILE_PHOTOS.length};
   })()`);
   assert.equal(state.count,manifest.filter(p=>p.players.includes('Enzo_')).length);assert(state.previous&&state.next);assert(!state.overflow);assert.equal(state.cave,'none');assert.equal(state.backdrop,2);assert.equal(state.registry,38);
   await evaluate("document.querySelector('.profile-photo-card:not(.profile-photo-clone)').click()");await pause(120);
   assert(await evaluate("document.querySelector('.profile-photo-dialog').open"));
   assert(await evaluate("document.querySelector('.photo-dialog-image').complete&&document.querySelector('.photo-dialog-image').naturalWidth>0"));
   await evaluate("document.querySelector('[data-photo-step=\"1\"]').click()");
   assert(await evaluate("document.querySelector('.photo-dialog-toolbar').textContent.includes('Photo 2 of')"));
   assert(await evaluate("(()=>{const src=document.querySelector('.photo-dialog-image').src,n=window.UHC_PROFILE_PHOTOS.find(p=>new URL(p.src,location.href).href===src).players.length;return document.querySelectorAll('.photo-person .face').length===n&&document.querySelectorAll('.photo-person-divider').length===n-1})()"),'Player heads and pipe separators');
   assert(await evaluate("!document.querySelector('.profile-photo-card>span')"),'No inline player labels');
   const popupShot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('profile-photo-popup-'+width+'.png',Buffer.from(popupShot.data,'base64'));
   await evaluate("document.querySelector('[data-photo-close]').click();document.documentElement.style.scrollBehavior='auto';document.querySelector('.profile-photos').scrollIntoView()");await pause(600);
   const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('profile-photos-'+width+'.png',Buffer.from(shot.data,'base64'));
   console.log(file,width,'gallery, background and viewer passed');
  }
  const position=()=>evaluate("document.querySelector('.profile-photo-position').textContent");
  const sync=()=>evaluate("(()=>{const index=Number(document.querySelector('.profile-photo-position').textContent.split('/')[0])-1;return document.querySelector('.profile-photo-backdrop img.is-current').src===document.querySelectorAll('.profile-photo-card:not(.profile-photo-clone) img')[index].src})()");
  await evaluate("document.activeElement.blur();document.querySelector('.profile-photos').dispatchEvent(new PointerEvent('pointerleave',{pointerType:'mouse'}))");
  let before=await position();await pause(6000);assert.notEqual(await position(),before,'Auto advances');assert(await sync(),'Background follows carousel');
  await evaluate("document.querySelector('.profile-photos').dispatchEvent(new PointerEvent('pointerover',{pointerType:'mouse'}))");
  before=await position();await pause(5400);assert.equal(await position(),before,'Hover pauses');
  await evaluate("document.querySelector('.profile-photos').dispatchEvent(new PointerEvent('pointerleave',{pointerType:'mouse'}));document.querySelector('.profile-photos').dispatchEvent(new PointerEvent('pointerdown',{pointerType:'touch',pointerId:12}))");
  await pause(5400);assert.equal(await position(),before,'Touch holds pause');
  await evaluate("document.dispatchEvent(new PointerEvent('pointerup',{pointerType:'touch',pointerId:12}))");
  await pause(6000);assert.notEqual(await position(),before,'Resumes after touch release');assert(await sync());
  console.log(file,'autoplay, hover pause, touch pause/resume and background sync passed');
  await evaluate("location.hash='#player-Axel__'");await pause(250);
  assert(await evaluate("!document.querySelector('.profile-photos')&&document.querySelectorAll('.profile-photo-backdrop').length===1"));
  await evaluate("location.hash='#players'");await pause(250);assert(await evaluate("!document.querySelector('.profile-photo-backdrop')"));
 }
 }finally{ws?.close();browser.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
