const fs=require('node:fs'),vm=require('node:vm');
const {buildProfiles}=require('./profile-engine.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const window={};vm.runInNewContext(fs.readFileSync('dist/data.js','utf8'),{window});
const raw=read('../workbook-extracted.json');
const specials=raw[3].rows.slice(1).map(r=>Object.fromEntries(r.cells.map(c=>[c.cell.replace(/\d/g,''),c.value]))).filter(r=>r.A&&r.B&&r.C).map(r=>({season:Number(r.A),stat:r.B,name:r.C}));
const bios=read('../bios-extracted.json');
bios.push({
 name:'ButterDuckys',
 cells:[{value:'Formerly Known As: ButterWarriorYT'}]
});
bios.push({name:'Wheellerr',cells:[{value:'Formerly Known As: Wheelin_n_Dealin'}]});
const output=buildProfiles(window.UHC_DATA,bios,specials);
const damage=read('season-37-damage.json');
const roster=window.UHC_DATA.find(s=>s.id===damage.season).players;
const reportNames={Lukeyvonswaggel:'Lukeyvonswaggle',Pontoonman31:'pontoonman',Pecus__:'Pecus'};
const identity=name=>output.identities[name.toLowerCase()]||name;
// The CSV pairs a diamond row with a gold row for each player.
const oreRows=fs.readFileSync('references/ore-mined.csv','utf8').trim().split(/\r?\n/).map(line=>line.split(','));
const oreSeasons=oreRows[1].slice(2,6).map(value=>Number(value.slice(1)));
const parseOre=value=>{
 if(value==='')return null;
 if(!/^\d+$/.test(value))throw Error('Invalid ore count: '+value);
 return Number(value);
};
for(let i=2;i<oreRows.length&&oreRows[i][0]!=='Total';i+=2){
 const [diamond,gold]=oreRows.slice(i,i+2);
 if(!diamond[0]||!gold||gold[0])throw Error('Invalid ore rows for '+diamond[0]);
 const player=output.allPlayers.find(p=>p.name===identity(diamond[0]));
 if(!player)continue;
 for(const [j,season] of oreSeasons.entries()){
   const game=player.history.find(h=>h.season===season);
   if(!game)continue;
   const counts=[parseOre(diamond[j+2]),parseOre(gold[j+2])];
   if(counts.every(count=>count===null))continue;
   game.metrics??=Array(6).fill(null);
   counts.forEach((count,k)=>{game.metrics[k]??=count;});
 }
}
const participant=name=>roster.find(p=>identity(p.name)===identity(reportNames[name]||name));
const damageByPlayer=new Map();
for(const [name,[dealt,taken,pveHealthLost]] of Object.entries(damage.players)){
 const player=participant(name);
 if(!player)throw Error('Unknown damage report player: '+name);
 const teammateHits=damage.hits.filter(hit=>{
   if(hit.attacker!==name)return false;
   const target=participant(hit.target);
   if(!target)throw Error('Unknown damage report target: '+hit.target);
   return target!==player&&player.color&&target.color===player.color;
 });
 damageByPlayer.set(identity(player.name),{
   dealt:dealt/2,taken:taken/2,pve:pveHealthLost/2,
   friendly:teammateHits.reduce((sum,h)=>sum+h.points/2,0),
   teammates:teammateHits.map(h=>({name:participant(h.target).name,hearts:h.points/2}))
 });
}
for(const p of output.profiles){
 const game=p.history.find(h=>h.season===damage.season);
 if(game&&damageByPlayer.has(p.name))game.damage=damageByPlayer.get(p.name);
}
const {buildStats}=require('./stats-engine.cjs');
const stats=buildStats(window.UHC_DATA,output);
const causes=new Map(), damageTotals=new Map();
const environment={ender_pearl:'Ender Pearl',fall:'Fall Damage',freeze:'Freezing',in_wall:'Suffocation',lava:'Lava',on_fire:'Fire',stalagmite:'Stalagmite'};
for(const event of read('season-37-pve-sources.json')){
 const player=participant(event.player);
 if(!player)throw Error('Unknown PvE damage player: '+event.player);
 const cause=event.source==='Environment'?environment[event.type]||event.type:event.source;
 if(!causes.has(cause))causes.set(cause,new Map());
 const people=causes.get(cause);
 people.set(player.name,(people.get(player.name)||0)+event.hearts);
 damageTotals.set(event.player,(damageTotals.get(event.player)||0)+event.hearts);
}
for(const [name,[,,healthLost]] of Object.entries(damage.players)){
 if(Math.abs((damageTotals.get(name)||0)-healthLost/2)>1e-6)throw Error('PvE damage total mismatch for '+name);
}
const damageRows=[...causes].map(([cause,people])=>[
 cause,[...people.values()].reduce((total,value)=>total+value,0),
 [...people.keys()]
]).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
stats.tables.splice(stats.tables.findIndex(t=>t.id==='pve')+1,0,{
 id:'mob-damage',title:'Mob Damage',
 note:'Season 37 · Regular hearts lost to mobs and environmental damage. Absorption is excluded.',
 columns:[['Source','entity'],['Hearts lost','number'],['Players','players']],
 rows:damageRows,
 breakdown:Object.fromEntries([...causes].map(([cause,people])=>[cause,[...people].sort((a,b)=>b[1]-a[1])]))
});
fs.writeFileSync('dist/stats-data.js','window.UHC_STATS = '+JSON.stringify(stats)+';\n');
const {buildRankings}=require('./rankings-engine.cjs');
fs.writeFileSync('dist/rankings-data.js','window.UHC_RANKINGS = '+JSON.stringify(buildRankings(window.UHC_DATA,output))+';\n');
const {buildPlayerRankings}=require('./player-rankings-engine.cjs');
const playerRankings=buildPlayerRankings(output,window.UHC_DATA);
fs.writeFileSync('dist/player-rankings-data.js','window.UHC_PLAYER_RANKINGS = '+JSON.stringify(playerRankings)+';\n');
if(fs.existsSync('trivia-document-reference.json')&&fs.existsSync('trivia-records-reference.json')){
 const {buildTrivia}=require('./trivia-engine.cjs');
 fs.writeFileSync('dist/trivia-data.js','window.UHC_TRIVIA = '+JSON.stringify(buildTrivia(window.UHC_DATA,output,stats,{document:read('trivia-document-reference.json'),workbook:read('trivia-records-reference.json'),legacy:read('trivia-legacy-records.json')}))+';\n');
}
delete output.allPlayers;
fs.writeFileSync('dist/profiles.js','window.UHC_PROFILES = '+JSON.stringify(output)+';\n');
console.log(`Built ${output.profiles.length} eligible player profiles; ${output.deathCount} recorded deaths.`);
