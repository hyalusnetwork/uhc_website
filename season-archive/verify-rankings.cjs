const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {buildRankings}=require('./rankings-engine.cjs');
const seasons=Array.from({length:6},(_,i)=>({id:i+1,date:'2024-01-01',players:[{name:'A',color:'Red',team:'Test'},...(i<5?[{name:'B',color:'Blue',team:'Other'}]:[])]}));
const history=(name,n,win)=>Array.from({length:n},(_,i)=>({season:i+1,kills:2,teamKills:0,win}));
const input={identities:{},allPlayers:[{name:'A',history:history('A',6,true)},{name:'B',history:history('B',5,false)}]};
const result=buildRankings(seasons,input),red=result.teams.find(t=>t.color==='Red'),blue=result.teams.find(t=>t.color==='Blue');
assert.equal(red.rank,1);assert.equal(red.appearances,6);assert.equal(red.wins,6);assert.equal(red.kills,12);assert.equal(red.killsPerParticipant,2);assert.equal(red.winRate,1);
assert.equal(blue.eligible,false);assert.equal(blue.rank,null);assert.equal(blue.score,null);
assert(red.score>0&&red.score<=100);
assert.equal(red.score,red.components.win+red.components.combat+red.components.survival);
const tied=buildRankings(seasons.map(s=>({...s,players:[...s.players.filter(p=>p.color==='Red'),{name:'C',color:'Green',team:'Equal'}]})),{identities:{},allPlayers:[input.allPlayers[0],{name:'C',history:history('C',6,true)}]});
assert.equal(tied.teams[0].rank,tied.teams[1].rank);
const w={};for(const f of ['data','rankings-data'])vm.runInNewContext(fs.readFileSync(`dist/${f}.js`,'utf8'),{window:w});
assert.equal(w.UHC_RANKINGS.teams.reduce((n,t)=>n+t.participants,0),w.UHC_DATA.reduce((n,s)=>n+s.players.length,0));
for(const t of w.UHC_RANKINGS.teams){assert.equal(t.appearances,new Set(t.history.map(h=>h.season)).size);assert.equal(t.eligible,t.isColor&&t.appearances>5);if(t.eligible)assert(t.score>=0&&t.score<=100);else assert.equal(t.rank,null);}
const html=fs.readFileSync('../UHC.html','utf8');assert(/rel="icon" type="image\/webp" href="data:image\/webp;base64,/.test(html));assert(html.includes('class="navbar-heart" src="data:image/webp;base64,'));
console.log('Passed: six-appearance boundary, raw ratios, weighted score, ties, all participant entries, unranked histories and embedded Hardcore-heart favicon.');
