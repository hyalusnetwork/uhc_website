const fs=require('fs');const harness=fs.readFileSync('qa-profile-photos.cjs','utf8').split(' const manifest=JSON.parse')[0].replace('.mobile-scrollbar-grid-qa','.cache/native-chart-scroll-qa');
eval(harness+`
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 const touch=async(type,point)=>send('Input.dispatchTouchEvent',{type,touchPoints:point?[point]:[]});
 for(const file of ['dist/index.html','../UHC.html']){
 await send('Page.navigate',{url:pathToFileURL(path.resolve(__dirname,file)).href+'#player-Enzo_'});await pause(600);
 for(const chart of ['damage','death-type','death-time','timing']){
 await evaluate(chart==='damage'?"location.hash='#player-Enzo_';showPlayer('Enzo_');document.querySelectorAll('.career-tabs button')[1].click()":"location.hash='#stats';statsMode='graphs';statsTab='"+chart+"';renderStats()");await pause(150);await evaluate("window.qaScrollRoot=document.getElementById('"+(chart==='damage'?'full-profile':'stats-content')+"')");
 await evaluate("qaScrollRoot.querySelector('.chart-scroll-rail').scrollIntoView({block:'center',behavior:'instant'})");await pause(100);
 const geometry=await evaluate("(()=>{const v=qaScrollRoot.querySelector('.scrub-scroll-viewport'),r=qaScrollRoot.querySelector('.chart-scroll-rail'),vr=v.getBoundingClientRect(),rr=r.getBoundingClientRect();const candidates=[...v.querySelectorAll('[data-chart-tip]')].map(e=>{const b=e.getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2,label:e.dataset.chartTip}}).filter(p=>p.x>vr.left+5&&p.x<vr.right-5&&p.y>90&&p.y<rr.top);let first,second;for(const a of candidates){const b=candidates.find(b=>Math.abs(b.y-a.y)<12&&Math.abs(b.x-a.x)>20&&b.label!==a.label);if(b){first=a;second=b;break}}return {first,second,rail:{left:rr.left,right:rr.right,y:rr.top+12},separate:rr.top>=vr.bottom-1,hidden:r.hidden}})()");
 assert(geometry.separate&&!geometry.hidden,'Native scrollbar outside '+chart+' data');assert(geometry.first&&geometry.second,'Two visible data points for '+chart);
 await touch('touchStart',{x:geometry.first.x,y:geometry.first.y});await pause(60);
 const before=await evaluate("document.querySelector('#chart-tooltip').textContent");
 await touch('touchMove',{x:geometry.second.x,y:geometry.second.y});await pause(60);
 const after=await evaluate("document.querySelector('#chart-tooltip').textContent");
 assert.notEqual(before,after,'Touch scrubs '+chart);assert.equal(await evaluate("qaScrollRoot.querySelector('.scrub-scroll-viewport').scrollLeft"),0,'Scrubbing does not scroll '+chart);
 await touch('touchEnd');
 const rail=geometry.rail,start=rail.right-25,end=rail.left+25;
 await touch('touchStart',{x:start,y:rail.y});
 for(let i=1;i<=6;i++){await touch('touchMove',{x:start+(end-start)*i/6,y:rail.y});await pause(25)}
 await touch('touchEnd');await pause(300);
 const result=await evaluate("(()=>{const v=qaScrollRoot.querySelector('.scrub-scroll-viewport'),r=qaScrollRoot.querySelector('.chart-scroll-rail');return {data:v.scrollLeft,rail:r.scrollLeft,hidden:document.querySelector('#chart-tooltip').hidden}})()");
 assert(result.rail>0,'Touch scrolls native rail for '+chart);assert(Math.abs(result.data-result.rail)<2,'Rail and data synchronized');assert(result.hidden,'Rail does not activate tooltips');
 console.log(file,chart,'touch scrubbing and separate native scrolling passed');
 }
 }
 }finally{ws?.close();browser.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
`);
