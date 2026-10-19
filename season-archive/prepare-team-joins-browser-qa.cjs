const fs=require('fs');let s=fs.readFileSync('qa-season-tables-browser.cjs','utf8');s=s.slice(0,s.indexOf("assert.equal(await evaluate('document.querySelectorAll(\"#trivia-record-grid"));s+=`
await evaluate(\`location.hash='#seasons';document.querySelector('#search').value='';document.querySelector('#year').value='';render();\`);
assert.equal(await evaluate('document.querySelectorAll(".team-join-row").length'),35);
assert.equal(await evaluate('document.querySelectorAll(".team-join-person").length'),56);
assert.equal(await evaluate('document.querySelectorAll(".season-roamer-flag").length'),7);
assert.equal(await evaluate('document.querySelectorAll("#season-15 .team-join-row").length'),7);
assert(await evaluate(\`document.querySelector('#season-24 .team-join-time').textContent==='1:07:09'\`));
assert(await evaluate(\`const rows=Array.from(document.querySelectorAll('#season-24 tbody tr'));const i=rows.findIndex(r=>r.classList.contains('team-join-row'));rows[i-1].textContent.includes('BWRE_of_Kappus')&&rows[i+1].textContent.includes('Misrok')\`));
assert(await evaluate(\`document.querySelector('#season-22 .metadata').textContent.includes('v1.10')\`));
for(const season of [15,24]){
 await evaluate(\`const node=document.querySelector('#season-\${season}');window.scrollTo(0,window.scrollY+node.getBoundingClientRect().top-100)\`);
 await new Promise(r=>setTimeout(r,150));const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('team-joins-season-'+season+'.png',Buffer.from(shot.data,'base64'));
}
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await evaluate(\`const node=document.querySelector('#season-15');window.scrollTo(0,window.scrollY+node.getBoundingClientRect().top-80)\`);
assert(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'));
const mobile=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('team-joins-mobile.png',Buffer.from(mobile.data,'base64'));
console.log('Passed browser checks: 35 chronological join rows, 56 player joins, seven roamer flags, simultaneous joining groups, S24 event order, version labels and mobile containment.');
await send('Browser.close');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
`;fs.writeFileSync('qa-team-joins-browser.cjs',s);
