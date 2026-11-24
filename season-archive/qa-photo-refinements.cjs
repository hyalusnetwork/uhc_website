const fs=require('fs');const harness=fs.readFileSync('qa-profile-photos.cjs','utf8').split(' const manifest=JSON.parse')[0].replace('.mobile-scrollbar-grid-qa','.cache/photo-refinements-qa');
eval(harness+`
 for(const file of ['dist/index.html','../UHC.html']){
 await send('Page.navigate',{url:pathToFileURL(path.resolve(__dirname,file)).href+'#player-coleam'});await pause(800);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 const speed=await evaluate("(()=>{const full=document.querySelector('.team-color-segment.mole-color'),tile=document.querySelector('.profile-season-mole');const rate=(el,pseudo)=>{const style=getComputedStyle(el,pseudo);return parseFloat(style.getPropertyValue('--mole-cycle'))/parseFloat(style.animationDuration)};return {full:rate(full),tile:rate(tile,'::before')}})()");
 assert(Math.abs(speed.full-speed.tile)<0.001,'Subset season tile matches full-palette scroll speed');
 for(const width of [390,1440]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<600});await pause(100);
 for(const tab of [0,2]){
 await evaluate("document.querySelectorAll('.career-tabs button')["+tab+"].click();document.querySelector('#career-panel').scrollIntoView({block:'center',behavior:'instant'})");await pause(100);
 const state=await evaluate("(()=>{const bar=document.querySelector('.mole-chart-bar'),id=bar.style.fill.match(/#([^)]*)/)[1],pattern=document.querySelector('#career-panel pattern');const r=bar.getBoundingClientRect();return {fill:getComputedStyle(bar).fill,colors:[...new Set([...pattern.querySelectorAll('rect')].map(r=>r.getAttribute('fill')))],expected:molePalette(33),transform:getComputedStyle(pattern.querySelector('g')).transform,clip:{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}}})()");
 assert.deepEqual(state.colors,state.expected,'Uses participating team palette');assert(state.fill.includes('mole-bar-paint-33'));
 const barSpeed=await evaluate("(()=>{const el=document.querySelector('.mole-bar-stripes'),s=getComputedStyle(el);return parseFloat(s.getPropertyValue('--mole-bar-cycle'))/parseFloat(s.animationDuration)})()");assert(Math.abs(barSpeed-speed.full)<0.001,'Chart matches full-palette scroll speed');
 const before=await send('Page.captureScreenshot',{format:'png',clip:state.clip});await pause(650);
 const after=await send('Page.captureScreenshot',{format:'png',clip:state.clip});assert.notEqual(before.data,after.data,'Rendered Mole bar changes over time');
 console.log(file,width,tab===0?'Kills':'Outlasted','rendered moving bands passed');
 }
 await evaluate("document.querySelector('.profile-photos').scrollIntoView({block:'center',behavior:'instant'})");await pause(100);
 assert(await evaluate("(()=>{const wrap=document.querySelector('.photo-season-filter').getBoundingClientRect(),arrow=document.querySelector('[data-carousel-step]').getBoundingClientRect();return wrap.height===arrow.height&&Math.abs(wrap.top-arrow.top)<1})()"),'Photo dropdown matches arrow height and alignment');
 assert(await evaluate("(()=>{const s=document.querySelector('[data-photo-season]'),wrap=s.parentElement;return getComputedStyle(s).backgroundColor==='rgba(0, 0, 0, 0)'&&getComputedStyle(s).borderWidth==='0px'&&getComputedStyle(wrap,'::before').boxShadow!=='none';})()"),'Shared OreUI bevel is exposed');
 const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('photo-season-refined-'+width+'.png',Buffer.from(shot.data,'base64'));
 await evaluate("document.querySelector('.profile-photo-card:not(.profile-photo-clone)').click()");
 assert(await evaluate("!document.querySelector('.photo-dialog-toolbar').textContent.includes('Season')&&document.querySelector('.photo-people').firstElementChild.classList.contains('photo-season-label')"),'Season is left of people');
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
 await evaluate("document.querySelector('[data-photo-close]').click()");
 const trivia=await evaluate("(()=>{const el=document.querySelector('.trivia-list');el.scrollTop=0;const first=el.querySelector('li').getBoundingClientRect().top;el.scrollTop=80;return {scroll:el.scrollTop,moved:el.querySelector('li').getBoundingClientRect().top<first,native:!el.parentElement.querySelector('input'),style:getComputedStyle(el).scrollbarWidth}})()");assert(trivia.native);assert.equal(trivia.style,'thin');assert(trivia.scroll>0&&trivia.moved,'Native trivia scroll moves down through content');
 }
 }
 }finally{ws?.close();browser.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
`);
