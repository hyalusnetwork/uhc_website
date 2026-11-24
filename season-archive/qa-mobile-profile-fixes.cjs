const fs=require('node:fs');
const harness=fs.readFileSync('qa-profile-photos.cjs','utf8').split(' const manifest=JSON.parse')[0].replace('.mobile-scrollbar-grid-qa','.cache/mobile-profile-fixes-qa');
eval(harness+`
 const errors=[];await send('Runtime.enable');ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);});
 for(const file of ['dist/index.html','../UHC.html']){
 await send('Page.navigate',{url:pathToFileURL(path.resolve(__dirname,file)).href+'#player-Enzo_'});await pause(900);
 for(const width of [320,390,1440]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<600});await pause(250);
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Profile fits '+width);
 assert(await evaluate("(()=>{const el=document.querySelector('.trivia-list');return !el.parentElement.querySelector('.overflow-rail')&&getComputedStyle(el).scrollbarWidth==='thin'&&el.scrollTop===0})()"),'Native trivia scrollbar');
 assert(await evaluate("!document.querySelector('#profile-methods')"));
 assert(await evaluate("window.UHC_PROFILE_PHOTOS.every(p=>p.season===37)"));
 await evaluate("(()=>{const f=document.querySelector('[data-photo-season]');f.value='37';f.dispatchEvent(new Event('change'));})()");await pause(200);
 assert.equal(await evaluate("document.querySelector('[data-photo-season]').value"),'37');
 await evaluate("document.querySelector('.profile-photo-card:not(.profile-photo-clone)').click()");assert(await evaluate("document.querySelector('.photo-season-label').textContent==='Season 37'"));await evaluate("document.querySelector('[data-photo-close]').click()");
 await evaluate("document.querySelector('[data-photo-season]').value='all';document.querySelector('[data-photo-season]').dispatchEvent(new Event('change'))");
 await evaluate("document.querySelectorAll('.career-tabs button')[1].click()");await pause(100);
 assert(await evaluate("(()=>{const el=document.querySelector('.damage-table').parentElement;el.scrollLeft=el.scrollWidth;return getComputedStyle(el).scrollbarWidth==='none'&&(el.scrollWidth<=el.clientWidth+1||el.scrollLeft>0);})()"),'Damage scrolls');
 await evaluate("showPlayer(playerProfiles.find(p=>p.history.some(h=>h.color==='Mole')).name)");
 assert(await evaluate("document.querySelector('.mole-bar-stripes')?.getAnimations().length>0"),'Animated mole kill bar');
 await evaluate("document.querySelectorAll('.career-tabs button')[2].click()");assert(await evaluate("!!document.querySelector('.mole-chart-bar')"),'Mole survival bar');
 console.log(file,width,'profiles, trivia, damage, moles, photo season filter passed');await evaluate("showPlayer('Enzo_')");
 }
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 for(const tab of ['death-type','death-time','timing']){
 await evaluate("location.hash='#stats';statsMode='graphs';statsTab='"+tab+"';renderStats()");await pause(200);
 assert(await evaluate("(()=>{const el=document.querySelector('.outcome-plot-scroll'),rail=el.nextElementSibling,native=rail.classList.contains('chart-scroll-rail')&&getComputedStyle(rail).scrollbarWidth==='thin';rail.scrollLeft=rail.scrollWidth;rail.dispatchEvent(new Event('scroll'));return native&&el.scrollLeft>0&&getComputedStyle(el.querySelector('svg')).touchAction==='pan-y';})()"),'Chart scroll '+tab);
 }
 for(const tab of ['pve','wins','pvp','victims','ironmen','winners']){
 await evaluate("statsMode='"+(tab==='winners'?'season':'all-time')+"';statsTab='"+tab+"';renderStats()");await pause(100);
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Stats fits '+tab);
 if(['pve','wins','pvp'].includes(tab))assert.equal(await evaluate("getComputedStyle(document.querySelector('.pve-single-grid')).gridTemplateColumns.split(' ').length"),2);
 if(tab==='winners')assert(await evaluate("document.querySelector('.season-winners-table').offsetWidth<=document.querySelector('.season-stat-scroll').clientWidth"),'Winners compact');
 }
 await evaluate("location.hash='#players';document.querySelector('#player-sort').selectedIndex=-1;playerCards()");assert.equal(await evaluate("document.querySelector('#player-sort').value"),'name');
 await evaluate("location.hash='#rankings-players';document.querySelector('#ranking-era-filter').selectedIndex=-1;renderSeasonGrades('#rankings-players')");assert.equal(await evaluate("document.querySelector('#ranking-era-filter').value"),'all');
 console.log(file,'all mobile stats and dropdown defaults passed');
 await evaluate("location.hash='#stats';statsMode='graphs';statsTab='death-type';renderStats();document.querySelector('.outcome-plot-scroll').scrollIntoView({block:'center',behavior:'instant'})");await pause(200);
 const points=await evaluate("(()=>{const el=document.querySelector('.outcome-plot-scroll'),r=el.getBoundingClientRect();return [...el.querySelectorAll('.outcome-segment')].map(e=>{const b=e.getBoundingClientRect();return {x:b.left+b.width/2,y:b.bottom-2}}).filter(p=>p.x>r.left&&p.x<r.right&&p.y>0&&p.y<innerHeight).slice(0,2)})()");
 assert.equal(points.length,2);
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[points[0]]});await pause(80);
 const tipBefore=await evaluate("document.querySelector('#chart-tooltip').textContent");
 await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[points[1]]});await pause(80);
 const tipAfter=await evaluate("document.querySelector('#chart-tooltip').textContent");
 assert.notEqual(tipBefore,tipAfter,'Finger scrubs between data bars');assert.equal(await evaluate("document.querySelector('.outcome-plot-scroll').scrollLeft"),0,'Scrubbing does not scroll');
 await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await evaluate("showPlayer('coleam');location.hash='#player-coleam';document.querySelector('.profile-photos').scrollIntoView({block:'center',behavior:'instant'})");await pause(300);await evaluate("document.querySelector('.profile-photos').scrollIntoView({block:'center',behavior:'instant'})");await pause(100);
 const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('mobile-season-photo-filter.png',Buffer.from(shot.data,'base64'));

 }
 assert.deepEqual(errors,[]);console.log('No browser runtime errors');
 }finally{ws?.close();browser.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
`);
