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
  for (const file of ['dist/index.html', '../UHC.html']) {
   await send('Page.navigate', { url: pathToFileURL(path.resolve(__dirname, file)).href + '#players' });
   await pause(700);
   for (const width of [280, 320, 360, 390, 414, 600, 768, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 600, deviceScaleFactor: 1, mobile: width <= 800 });
    await evaluate("document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0);document.activeElement.blur()");
    await pause(1200);
    const layout = await evaluate(`(() => {
     const grid = document.querySelector('#player-directory .player-grid');
     const rail = document.querySelector('.page-overlay-scrollbar');
     return { columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
      scrollWidth: document.documentElement.scrollWidth, gutter: innerWidth - document.documentElement.clientWidth,
      opacity: +getComputedStyle(rail).opacity, railWidth: rail.getBoundingClientRect().width,
      pointerEvents: getComputedStyle(rail).pointerEvents,
      overflow: [...grid.querySelectorAll('.directory-header')].some(e => e.scrollWidth > e.clientWidth + 1) };
    })()`);
    assert.equal(layout.scrollWidth, width, 'No page overflow at ' + width);
    assert.equal(layout.gutter, 0, 'No page gutter at ' + width);
    assert.equal(layout.overflow, false, 'Player contents fit at ' + width);
    if (width === 280) assert.equal(layout.columns, 1, 'Single column on very narrow screens');
    else assert(layout.columns >= 2, 'At least two players per row at ' + width);
    if (width >= 320 && width <= 414) assert.equal(layout.columns, 2);
    if (width <= 800) {
     assert.equal(layout.opacity, 0, 'Hidden when idle');
     assert.equal(layout.pointerEvents, 'none', 'Idle rail does not intercept taps');
     assert.equal(layout.railWidth, 6);
     await evaluate('window.scrollTo(0,180)');
     await pause(220);
     assert.equal(await evaluate("+getComputedStyle(document.querySelector('.page-overlay-scrollbar')).opacity"), 1, 'Visible during scrolling');
     await pause(1100);
     assert.equal(await evaluate("+getComputedStyle(document.querySelector('.page-overlay-scrollbar')).opacity"), 0, 'Fades after scrolling');
    } else {
     assert.equal(layout.opacity, 1, 'Desktop rail remains visible');
     assert.equal(layout.railWidth, 14);
    }
    console.log(file, width, JSON.stringify(layout));
   }
   await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
   await evaluate('window.scrollTo(0,0)');
   await pause(1200);
   const screenshot = await send('Page.captureScreenshot', { format: 'png' });
   fs.writeFileSync(path.join(__dirname, 'mobile-scrollbar-grid-preview.png'), Buffer.from(screenshot.data, 'base64'));
  }
  await send('Browser.close');
 } finally {
  if (ws) ws.close();
  browser.kill();
 }
})().catch(error => { console.error(error); process.exitCode = 1; });
