const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');function read(file,key){const window={};vm.runInNewContext(fs.readFileSync(file,'utf8'),{window});return window[key];}
const before=read('references/data-before-2026-11-17-update.js','UHC_DATA'),after=read('dist/data.js','UHC_DATA');
assert.equal(after.length,before.length);assert.equal(after.flatMap(s=>s.players).length,533);
let teams=0,deaths=0,metrics=0;const metricSeasons=new Set();
for(const s of after){const prior=before.find(x=>x.id===s.id);assert.equal(s.players.length,prior.players.length);for(const p of s.players){const old=prior.players.find(x=>x.name===p.name);assert(old);for(const field of ['seconds','color','type','achievement'])assert.deepEqual(p[field],old[field],s.id+' '+p.name+' '+field);
if(p.team!==old.team){teams++;assert.equal(s.id,37);}
if(p.death!==old.death)deaths++;
if(JSON.stringify(p.metrics)!==JSON.stringify(old.metrics)){metrics++;metricSeasons.add(s.id);}
}}
const s37=after.find(s=>s.id===37);for(const team of ['Ironman Pact','Wopohoo','OTC'])assert(s37.players.some(p=>p.team===team));assert(!s37.players.some(p=>/placeholder/i.test(p.team||'')));
const replay=read('dist/season-replay-data.js','UHC_REPLAYS')[37];assert.equal(replay.events.length,488);assert(replay.events.every(e=>s37.players.some(p=>p.name===e.name)));
const html=fs.readFileSync('../UHC.html','utf8');assert(html.includes('Ironman Pact'));assert(html.includes('Wopohoo'));assert(html.includes('OTC'));
console.log({teamNameUpdates:teams,deathMessageUpdates:deaths,playersWithMetricUpdates:metrics,metricSeasons:[...metricSeasons],seasons:after.length,participants:533,replayEvents:replay.events.length});
