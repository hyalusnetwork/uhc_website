const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process'),{pathToFileURL}=require('node:url');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',[
  '--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=9252',
  '--user-data-dir='+path.join(__dirname,'.mobile-season-tables-qa'),'about:blank'
 ],{windowsHide:true,stdio:'ignore'});
 let ws;
 try{
  let pages;
  for(let i=0;i<50;i++){try{pages=await fetch('http://127.0.0.1:9252/json').then(r=>r.json());break;}catch{await pause(200);}}
  assert(pages,'Headless Edge started');
  ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
  let id=0;const pending=new Map(),errors=[];
  ws.addEventListener('message',event=>{
   const m=JSON.parse(event.data);
   if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);
   if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{
   const n=++id,timer=setTimeout(()=>reject(Error(method+' timed out')),15000);
   pending.set(n,m=>{clearTimeout(timer);m.error?reject(Error(m.error.message)):resolve(m.result);});
   ws.send(JSON.stringify({id:n,method,params}));
  });
  const evaluate=async expression=>{
   const r=await send('Runtime.evaluate',{expression,returnByValue:true});
   assert(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;
  };
  await send('Page.enable');await send('Runtime.enable');
  for(const file of ['dist/index.html','../UHC.html']){
   await send('Page.navigate',{url:pathToFileURL(path.resolve(__dirname,file)).href+'#seasons'});
   await pause(700);
   for(const width of [320,360,390,414,600,720,768,800,801,1440,390]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<=800});
    await pause(160);
    const result=await evaluate(`(()=>{
     const mobile=innerWidth<=800,visible=e=>!!e.getClientRects().length;
     const tables=[...document.querySelectorAll('.season-card .table-wrap')];
     const rows=[...document.querySelectorAll('.season-card tbody tr:not(.team-join-row)')];
     const joins=[...document.querySelectorAll('.season-card .team-join-row')];
     return {width:innerWidth,tables:tables.length,rows:rows.length,joins:joins.length,
      overflow:tables.filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.closest('article').id),
      invalid:rows.filter(row=>{
       const time=row.querySelector('.mobile-season-time'),elapsed=row.querySelector('.elapsed');
       return visible(time)!==(mobile&&!!time.textContent)||time.textContent!==elapsed.textContent||
        visible(elapsed)===mobile||!!row.querySelector('.mobile-season-team')&&visible(row.querySelector('.mobile-season-team'))!==mobile;
      }).length,
      badJoins:joins.filter(row=>row.cells[0].colSpan!==(mobile?2:3)||
       row.querySelector('.mobile-season-time').textContent!==row.querySelector('.elapsed').textContent).length,
      textOverflow:[...document.querySelectorAll('.season-card td,.season-card .team-join-heading,.season-card .player-name')]
       .filter(e=>visible(e)&&e.scrollWidth>e.clientWidth+2).map(e=>({cls:e.className,text:e.textContent.slice(0,70),scroll:e.scrollWidth,client:e.clientWidth})).slice(0,8)
     };
    })()`);
    console.log(file,width,JSON.stringify(result));
    assert(result.tables>30);assert.equal(result.invalid,0);assert.equal(result.badJoins,0);
    if(width<=800){assert.deepEqual(result.overflow,[]);assert.deepEqual(result.textOverflow,[]);}
   }
   for(const [name,selector] of [['results','#season-37 .table-wrap'],['joins','.team-join-row']]){
    await evaluate(`document.documentElement.style.scrollBehavior='auto';document.querySelector(${JSON.stringify(selector)}).scrollIntoView();window.scrollBy(0,-140)`);
    await pause(250);
    const shot=await send('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(__dirname,'mobile-seasons-'+name+'.png'),Buffer.from(shot.data,'base64'));
   }
   // Mobile times must follow the replay state, including seeking and restoring results.
   await evaluate("document.querySelector('#season-37 .season-animation-launch').click();document.querySelector('#season-37 [data-replay-action=toggle]').click()");
   for(const time of [0,await evaluate('window.UHC_REPLAYS[37].end')]){
    await evaluate(`(()=>{const seek=document.querySelector('#season-37 [data-replay-seek]');seek.value=${time};seek.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    const replay=await evaluate(`(()=>{const card=document.querySelector('#season-37'),wrap=card.querySelector('.table-wrap');return {
     overflow:wrap.scrollWidth>wrap.clientWidth+1,
     mismatch:[...card.querySelectorAll('tbody tr')].some(row=>row.querySelector('.mobile-season-time').textContent!==row.querySelector('.elapsed').textContent)
    };})()`);
    assert.equal(replay.overflow,false);assert.equal(replay.mismatch,false);
   }
   await evaluate("document.querySelector('#season-37 .season-animation-launch').click()");
  }
  assert.deepEqual(errors,[],'No browser runtime errors');
  console.log('Mobile season tables and replay passed in both builds.');
  await send('Browser.close');
 }finally{ws?.close();browser.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
