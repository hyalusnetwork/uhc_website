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
const misrok=bios.find(b=>b.name==='Misrok');
if(misrok){
 const cell=misrok.cells.find(c=>String(c.value).startsWith('Formerly Known As:'));
 if(!cell)misrok.cells.push({value:'Formerly Known As: FaithInChrist'});
 else if(!/\bFaithInChrist\b/i.test(cell.value))cell.value+=', FaithInChrist';
}else bios.push({name:'Misrok',cells:[{value:'Formerly Known As: FaithInChrist'}]});
const crackAttack=bios.find(b=>b.name==='Crack_Attack');
if(!crackAttack)throw Error('Missing Crack_Attack bio');
const crackAliases=crackAttack.cells.find(c=>String(c.value).startsWith('Formerly Known As:'));
if(!crackAliases)crackAttack.cells.push({value:'Formerly Known As: AbsorptionV'});
else if(!/\bAbsorptionV\b/i.test(crackAliases.value))crackAliases.value+=', AbsorptionV';
const tulltull=bios.find(b=>b.name.toLowerCase()==='tulltull')||{name:'tulltull',cells:[]};
if(!bios.includes(tulltull))bios.push(tulltull);
const tulltullAliases=tulltull.cells.find(c=>String(c.value).startsWith('Formerly Known As:'));
if(!tulltullAliases)tulltull.cells.push({value:'Formerly Known As: Nocturn2'});
else if(!/\bNocturn2\b/i.test(tulltullAliases.value))tulltullAliases.value+=', Nocturn2';
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
const heartHits=read('season-37-heart-damage.json');
const damageByPlayer=new Map();
for(const [name,[dealt,taken,pveHealthLost]] of Object.entries(damage.players)){
 const player=participant(name),regained=damage.healthRegained[name];
 if(!player||!Number.isFinite(regained)||regained<0)throw Error('Invalid damage report for '+name);
 const totals={red:{},yellow:{}},breakdown={};
 const pvp=h=>h.attacker&&h.attacker!==h.target;
 const friendly=(h,other)=>pvp(h)&&!!player.color&&participant(other)?.color===player.color;
 const cols={
   dealt:[h=>pvp(h)&&h.attacker===name,h=>h.target],
   taken:[h=>pvp(h)&&h.target===name,h=>h.attacker],
   pve:[h=>!pvp(h)&&h.target===name,h=>h.source&&h.source!==name?h.source:h.type],
   friendlyDealt:[h=>h.attacker===name&&friendly(h,h.target),h=>h.target],
   friendlyTaken:[h=>h.target===name&&friendly(h,h.attacker),h=>h.attacker]
 };
 for(const [field,[matches,group]] of Object.entries(cols)){
   const entries=new Map();
   totals.red[field]=totals.yellow[field]=0;
   for(const h of heartHits.filter(matches)){
     const red=h.red/2,yellow=h.yellow/2;
     if(red+yellow<=0)continue;
     const label=field==='pve'?group(h):identity(participant(group(h))?.name||group(h));
     if(!entries.has(label))entries.set(label,{name:label,red:0,yellow:0,sources:new Set()});
     const entry=entries.get(label);
     entry.red+=red;entry.yellow+=yellow;entry.sources.add(h.type);
     totals.red[field]+=red;totals.yellow[field]+=yellow;
   }
   breakdown[field]=[...entries.values()].sort((a,b)=>(b.red+b.yellow)-(a.red+a.yellow)||a.name.localeCompare(b.name))
     .map(entry=>({...entry,sources:[...entry.sources].sort()}));
 }
 for(const [field,expected] of [['dealt',dealt],['taken',taken],['pve',pveHealthLost]]){
   const actual=totals.red[field]+(field==='pve'?0:totals.yellow[field]);
   if(Math.abs(actual-expected/2)>1e-5)throw Error('Damage split mismatch: '+name+' '+field);
 }
 damageByPlayer.set(identity(player.name),{...totals,breakdown,regained:regained/2,regainedLowerBound:!player.type});
}
for(const p of output.allPlayers){
 const game=p.history.find(h=>h.season===damage.season);
 if(game&&damageByPlayer.has(p.name))game.damage=damageByPlayer.get(p.name);
}
// Optional per-season, per-player totals by potion type (drunk or splashed upon).
const potionReports=fs.existsSync('potion-breakdowns.json')?read('potion-breakdowns.json'):{};
for(const p of output.allPlayers)for(const game of p.history){
 const total=game.metrics?.[2];
 const report=potionReports[game.season]?.[p.name]??(game.season===37&&total>0?{Regeneration:total}:null);
 if(!report)continue;
 const entries=Object.entries(report);
 if(entries.some(([name,count])=>!name.trim()||!Number.isInteger(count)||count<0))throw Error('Invalid potion breakdown: '+p.name+' S'+game.season);
 const reported=entries.reduce((n,[,count])=>n+count,0);
 if(total!=null&&reported>total)throw Error('Potion breakdown exceeds total: '+p.name+' S'+game.season);
 if(total==null){game.metrics??=Array(6).fill(null);game.metrics[2]=reported;}
 game.potionBreakdown=Object.fromEntries(entries.filter(([,count])=>count>0));
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
const historicalSeasons=window.UHC_DATA.filter(season=>season.id<=36);
const historicalProfiles=buildProfiles(historicalSeasons,bios,specials);
const playerRankings=buildPlayerRankings(historicalProfiles,historicalSeasons);
const {buildSeasonGrades}=require('./season-grades.cjs');
playerRankings.seasonGrades=buildSeasonGrades(output,window.UHC_DATA,[damage.season]);
fs.writeFileSync('dist/player-rankings-data.js','window.UHC_PLAYER_RANKINGS = '+JSON.stringify(playerRankings)+';\n');
if(fs.existsSync('trivia-document-reference.json')&&fs.existsSync('trivia-records-reference.json')){
 const {buildTrivia}=require('./trivia-engine.cjs');
 fs.writeFileSync('dist/trivia-data.js','window.UHC_TRIVIA = '+JSON.stringify(buildTrivia(window.UHC_DATA,output,stats,{document:read('trivia-document-reference.json'),workbook:read('trivia-records-reference.json'),legacy:read('trivia-legacy-records.json')}))+';\n');
}
delete output.allPlayers;
fs.writeFileSync('dist/profiles.js','window.UHC_PROFILES = '+JSON.stringify(output)+';\n');
console.log(`Built ${output.profiles.length} eligible player profiles; ${output.deathCount} recorded deaths.`);
