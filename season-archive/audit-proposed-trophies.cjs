const fs=require('node:fs'),vm=require('node:vm');
const context={require:name=>name==='node:fs'?{...fs,writeFileSync(){}}:require(name),console:{log(){}}};
const source=fs.readFileSync('prepare-profiles.cjs','utf8').replace('delete output.allPlayers;','globalThis.audit={players:[...output.allPlayers],ledger:window.UHC_DATA,identities:output.identities};delete output.allPlayers;');
vm.runInNewContext(source,context);
const {players,ledger,identities}=context.audit;
const identity=name=>identities[String(name||'').toLowerCase()]||name;
const byName=new Map(players.map(p=>[p.name,p]));
const key=(s,r)=>s.teamSize===1?'solo:'+identity(r.name):r.color&&r.color!=='Solo'?'color:'+r.color:r.team?'name:'+r.team:'unassigned:'+identity(r.name);
const died=r=>['PVP','PVE','Team Kill'].includes(r.type);
const categories=[
 ['Fire',/^(?:was )?(?:burnt|burned|went up in flames|(?:tried to )?swim in lava|walked into (?:a )?fire|discovered the floor was lava)\b/i],
 ['Fall Damage',/^(?:fell|hit the ground|was doomed to fall)\b/i],
 ['Pet',/^was slain by (?:a )?wolf(?=\s*\(|\s*$)/i],
 ['Melee',/^was (?:slain|stabbed|pummeled|speared) by\b/i],
 ['Ranged',/^was (?:shot|sniped|impaled) by\b/i],
 ['TNT',/\b(?:blew up|blown up|exploded)\b.*\bTNT\b/i]
];
const events={Clutch:[],'Variety Pack':[],'Last Laugh':[],'Double Tap':[]};
events['Clutch (2+ kills)']=[];
for(const season of ledger){
 const pvp=season.players.filter(v=>v.type==='PVP'&&identity(v.name)!==identity(v.result)&&byName.has(identity(v.result)));
 for(const member of season.players){
  const name=identity(member.name),history=byName.get(name).history.find(h=>h.season===season.id);
  const kills=pvp.filter(v=>identity(v.result)===name);
  const types=[...new Set(kills.map(v=>categories.find(([,pattern])=>pattern.test(v.death||''))?.[0]).filter(Boolean))];
  if(types.length>=3)events['Variety Pack'].push({name,season:season.id,types});
  const timed=kills.filter(v=>Number.isFinite(v.seconds)).sort((a,b)=>a.seconds-b.seconds);
  const pairs=timed.slice(1).flatMap((v,i)=>v.seconds-timed[i].seconds<=10?[{victims:[identity(timed[i].name),identity(v.name)],seconds:v.seconds-timed[i].seconds}]:[]);
  if(pairs.length)events['Double Tap'].push({name,season:season.id,pairs});
  if(history.win&&season.crown?.previous&&identity(season.crown.previous)===name&&identity(season.crown.name)!==name&&season.crown.acquired)events['Last Laugh'].push({name,season:season.id});
  const teammates=season.players.filter(r=>identity(r.name)!==name&&key(season,r)===key(season,member));
  const opponents=season.players.filter(r=>key(season,r)!==key(season,member));
  if(!history.win||!teammates.length)continue;
  for(const victim of timed){
   if(!opponents.includes(victim)||!teammates.every(r=>died(r)&&Number.isFinite(r.seconds)&&r.seconds<victim.seconds))continue;
   if(!opponents.filter(r=>r!==victim).every(r=>died(r)&&Number.isFinite(r.seconds)&&r.seconds<=victim.seconds))continue;
   if(member.type||member.death)continue;
   events.Clutch.push({name,season:season.id,victim:identity(victim.name),teammates:teammates.map(r=>identity(r.name))});
   const lastTeammateDeath=Math.max(...teammates.map(r=>r.seconds));
   const lateKills=timed.filter(v=>opponents.includes(v)&&v.seconds>lastTeammateDeath&&v.seconds<=victim.seconds);
   if(lateKills.length>=2)events['Clutch (2+ kills)'].push({name,season:season.id,teamSize:teammates.length+1,kills:lateKills.length,victims:lateKills.map(v=>identity(v.name))});
  }
 }
}
const summary=Object.fromEntries(Object.entries(events).map(([label,rows])=>[label,{players:[...new Set(rows.map(r=>r.name))].sort().map(name=>({name,seasons:rows.filter(r=>r.name===name).map(r=>r.season)})),instances:rows.length,details:rows}]));
fs.writeFileSync('../../analysis/proposed-trophies.json',JSON.stringify(summary,null,2));
for(const [label,result] of Object.entries(summary))console.log(label+': '+result.players.length+' players, '+result.instances+' seasons\n'+result.players.map(p=>p.name+' (S'+p.seasons.join(', S')+')').join('; '));
