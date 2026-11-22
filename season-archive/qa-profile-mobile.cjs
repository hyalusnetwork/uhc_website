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

 for(const file of ['dist/index.html','../UHC.html']){
  await send('Page.navigate',{url:pathToFileURL(path.resolve(__dirname,file)).href+'#player-Enzo_'});
  await pause(1000);
  for(const width of [320,390,600,1440]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<800});
   await pause(150);
   const state=await evaluate(`(()=>{
    const table=document.querySelector('.season-history-table');
    const r=table.getBoundingClientRect();
    const overlaps=[...document.querySelectorAll('.trophy-count')].some(c=>{
     const a=c.getBoundingClientRect(),b=c.parentElement.querySelector('strong').getBoundingClientRect();
     return a.top<b.bottom&&a.bottom>b.top&&a.left<b.right&&a.right>b.left;
    });
    return {overlay:!!document.querySelector('.page-overlay-scrollbar'),display:getComputedStyle(table).display,width:r.width,viewport:document.documentElement.clientWidth,overlaps,icons:document.querySelectorAll('.history-highlight').length,selection:getComputedStyle(document.querySelector('.profile-chart')).webkitUserSelect};
   })()`);
   assert(!state.overlay,'Uses native scrollbar');assert(!state.overlaps,'Counts clear trophy names');assert(state.icons>0,'Highlight symbols exist');assert.equal(state.selection,'none');
   if(width<=600){assert.equal(state.display,'block');assert(state.width<=state.viewport,'Season cards fit viewport');}
   await evaluate("document.querySelector('#career-tab-5').click()");
   const scroll=await evaluate("(()=>{const e=document.querySelector('.career-teammate-rows');return {client:e.clientWidth,scroll:e.scrollWidth,overflow:getComputedStyle(e).overflowX}})()");
   assert.equal(scroll.overflow,'auto');if(width===320)assert(scroll.scroll>scroll.client,'Teammates scroll on narrow view');
   await evaluate("document.querySelector('.trophy-tile').click()");
   const dialog=await evaluate("(()=>{const d=document.querySelector('.trophy-dialog');return {open:d.open,focus:document.activeElement===d,overflow:getComputedStyle(d).overflowY}})()");
   assert(dialog.open&&dialog.focus);assert.equal(dialog.overflow,'auto');
   if(width===320)assert(await evaluate("(()=>{const d=document.querySelector('.trophy-dialog');return d.scrollHeight>d.clientHeight})()"),'Long trophy lists scroll');
   await evaluate("document.querySelector('.trophy-dialog').close();document.querySelector('#career-tab-0').click()");
   await evaluate("document.querySelector('.history-highlight').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch'}))");
   assert(await evaluate("!document.querySelector('#chart-tooltip').hidden&&document.querySelector('#chart-tooltip').textContent.includes('Ironman')"),'Touch opens highlight information');
   await evaluate("document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch'}))");
   console.log(file,width,'passed');
  }
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await pause(500);
  await evaluate("document.documentElement.style.scrollBehavior='auto';document.querySelector('.season-history-table').scrollIntoView()");
  await pause(500);
  const shot=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(__dirname,'profile-mobile-qa.png'),Buffer.from(shot.data,'base64'));
 }
 }finally{ws?.close();browser.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
