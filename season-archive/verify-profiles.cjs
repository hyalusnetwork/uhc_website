const assert=require('node:assert/strict');
const {buildProfiles,seasonNumbers}=require('./profile-engine.cjs');
assert.deepEqual(seasonNumbers('9 Time UHC Victor (S2-4, S10-11, S24-26, S31)'),[2,3,4,10,11,24,25,26,31]);
const bios=[{name:'Ace',cells:[{cell:'A17',value:'Formerly Known As: OldAce'}]}];
const rounds=Array.from({length:5},(_,i)=>({id:i+1,date:'2024-01-01',teamSize:2,players:[
  {name:i===0?'OldAce':'Ace',color:'Green',team:'Winners',achievement:'Ironman'},
  {name:'Partner',color:'Green',team:'Winners',type:'PVE',death:'fell',seconds:5},
  {name:'Enemy1',color:'Red',team:'Opponents',type:'PVP',death:'was shot by Ace',result:i===0?'OldAce':'Ace',seconds:10},
  {name:'Enemy2',color:'Red',team:'Opponents',type:'PVP',death:'was shot by Ace',result:'Ace',seconds:20},
  ...(i===0?[{name:'OneGame',color:'Blue',type:'Disconnect',death:'timed out',seconds:3}]:[])
],crown:{name:'Ace',acquired:i===0,method:'Winner with Most Kills'}}));
const data=buildProfiles(rounds,bios,[{season:2,name:'Ace',stat:'Perfect Ironman'},{season:3,name:'OldAce',stat:'Overpowered'}]);
const ace=data.profiles.find(p=>p.name==='Ace'),partner=data.profiles.find(p=>p.name==='Partner'),enemy=data.profiles.find(p=>p.name==='Enemy2');
assert.equal(ace.games,5);assert.equal(ace.kills,10);assert.equal(ace.wins,5);assert.equal(partner.wins,5);
assert(!data.profiles.some(p=>p.name==='OneGame'||p.name==='OldAce'));
const trophy=(p,key)=>p.trophies.find(t=>t.key===key);
assert.equal(trophy(ace,'team-wipe').count,5);assert.equal(trophy(ace,'first-blood').count,5);
assert.equal(trophy(enemy,'final-boss').count,5);assert.equal(trophy(ace,'crown').count,1);
assert.equal(trophy(ace,'perfect-ironman').count,1);assert.equal(trophy(ace,'overpowered').count,1);
assert.equal(trophy(ace,'sharpshooter').count,5);assert.equal(trophy(ace,'sharpshooter').icon,'bow');assert.equal(trophy(ace,'triple-threat'),undefined);assert.equal(trophy(ace,'grand-slam').count,5);
assert.match(trophy(ace,'grand-slam').events[1].detail,/retained the Crown/);
assert(ace.trivia.includes('Earned Ironman on his debut (S1) (the only recorded player to do so).'));
assert.equal(data.deathCount,16);
assert(ace.trivia.includes('The only player ever to kill multiple players in the majority of his games played (5 times in 5 games).'));
const halfMultiKillRounds=rounds.slice(0,4).map((s,i)=>({...s,players:s.players.map(p=>i>=2&&p.name==='Enemy2'?{...p,type:'PVE',death:'was slain by Zombie',result:'Zombie'}:p)}));
assert(!buildProfiles(halfMultiKillRounds,bios,[]).allPlayers.find(p=>p.name==='Ace').trivia.some(t=>t.includes('to kill multiple players in the majority')));
const extraMultiKiller=rounds.map(s=>({...s,players:[...s.players,{name:'Hopalot202',color:'Blue'},
 {name:'Extra1',color:'White',type:'PVP',death:'was shot by Hopalot202',result:'Hopalot202',seconds:30},
 {name:'Extra2',color:'White',type:'PVP',death:'was shot by Hopalot202',result:'Hopalot202',seconds:40}]}));
const sharedMajority=buildProfiles(extraMultiKiller,bios,[]).allPlayers;
assert(sharedMajority.find(p=>p.name==='Ace').trivia.includes('One of 2 players to kill multiple players in the majority of his games played (5 times in 5 games).'));
assert(sharedMajority.find(p=>p.name==='Hopalot202').trivia.includes('One of 2 players to kill multiple players in the majority of her games played (5 times in 5 games).'));
assert(!buildProfiles(extraMultiKiller.slice(0,4),bios,[]).allPlayers.some(p=>p.trivia.some(t=>t.includes('to kill multiple players in the majority'))));
const shortMultiKiller=extraMultiKiller.map((s,i)=>i?{...s,players:s.players.filter(p=>!['Hopalot202','Extra1','Extra2'].includes(p.name))}:s);
const shortMajority=buildProfiles(shortMultiKiller,bios,[]).allPlayers;
assert(shortMajority.find(p=>p.name==='Ace').trivia.includes('The only player ever to kill multiple players in the majority of his games played (5 times in 5 games).'));
assert(!shortMajority.find(p=>p.name==='Hopalot202').trivia.some(t=>t.includes('to kill multiple players in the majority')));
const dragonAwards=buildProfiles(rounds,bios,[{season:1,name:'Ace',stat:'Free the End'},{season:1,name:'Partner',stat:'Free the End'}]);
assert.equal(trophy(dragonAwards.allPlayers.find(p=>p.name==='Ace'),'free-the-end').count,1);
assert.equal(trophy(dragonAwards.allPlayers.find(p=>p.name==='Partner'),'free-the-end').count,1);
assert.equal(trophy(dragonAwards.allPlayers.find(p=>p.name==='Enemy1'),'free-the-end'),undefined);
assert(!buildProfiles(rounds.map(s=>({...s,dragon:true})),bios,[]).allPlayers.some(p=>trophy(p,'free-the-end')));
assert(ace.trivia.includes('Got two PVP kills within the span of 10 seconds (S1, S2, S3, S4, S5).'));
const slowerRounds=rounds.map(s=>({...s,players:s.players.map(p=>p.name==='Enemy2'?{...p,seconds:21}:p)}));
assert(!buildProfiles(slowerRounds,bios,[]).allPlayers.find(p=>p.name==='Ace').trivia.some(t=>t.startsWith('Got two PVP kills within the span of 10 seconds')));
const finishRounds=rounds.map(s=>({...s,players:s.players.filter(p=>p.name!=='OneGame')}));
assert.equal(buildProfiles(finishRounds,bios,[]).allPlayers.find(p=>p.name==='Ace').trivia.filter(t=>t.includes('PVP kills after his last teammate died')).length,5);
const lateTeammateRounds=finishRounds.map(s=>({...s,players:s.players.map(p=>p.name==='Partner'?{...p,seconds:15}:p)}));
assert(!buildProfiles(lateTeammateRounds,bios,[]).allPlayers.find(p=>p.name==='Ace').trivia.some(t=>t.includes('PVP kills after his last teammate died')));
const administrative=buildProfiles([{id:1,teamSize:3,players:[{name:"Survivor",color:"Green"},{name:"Disconnected",color:"Green",type:"Disconnect",seconds:2},{name:"Disqualified",color:"Green",type:"Disqualification",seconds:3},{name:"Opponent",color:"Red",type:"PVE",death:"fell",seconds:4}]}],[],[]);
const dc=administrative.allPlayers.find(p=>p.name==="Disconnected"),dq=administrative.allPlayers.find(p=>p.name==="Disqualified");
assert.equal(administrative.deathCount,3);
assert(dc.history[0].win);assert(!dq.history[0].win);
for(const p of [dc,dq]){assert.equal(p.administrativeDeaths,1);assert.equal(p.teamKillDeaths,0);assert.equal(p.kills,0);}
assert.equal(ace.killStreak,10);assert.equal(ace.history[0].outlivedPercent,100);
assert(ace.trivia.includes('Longest PVP kill streak without a death: 10 (S1, S2, S3, S4, S5). This is the longest streak among all players.'));
const zeroKillRounds=rounds.map(s=>s.id===3?{...s,players:s.players.map(p=>p.type==='PVP'?{...p,type:'PVE',death:'was slain by Zombie',result:'Zombie'}:p)}:s);
assert(buildProfiles(zeroKillRounds,bios,[]).allPlayers.find(p=>p.name==='Ace').trivia.some(t=>t.startsWith('Longest PVP kill streak without a death: 8 (S1, S2, S3, S4, S5).')));
const splitStreakRounds=rounds.slice(0,4).map(s=>({...s,players:s.players.map(p=>['Ace','OldAce'].includes(p.name)&&s.id%2===0?{...p,type:'PVE',death:'was slain by Zombie',seconds:25}:p)}));
assert(buildProfiles(splitStreakRounds,bios,[]).allPlayers.find(p=>p.name==='Ace').trivia.some(t=>t.startsWith('Longest PVP kill streak without a death: 4 (S1, S2 | S3, S4).')));
const streakRankRoster=[7,6,6,5,4,3].flatMap((count,i)=>[{name:'Streak'+i,color:'Blue'},...Array.from({length:count},(_,j)=>({name:'Victim'+i+'_'+j,color:'Red',type:'PVP',death:'was shot by Streak'+i,result:'Streak'+i,seconds:10+i*10+j}))]);
const streakRanks=buildProfiles([{id:1,teamSize:2,players:streakRankRoster}],[],[]).allPlayers;
assert(streakRanks.find(p=>p.name==='Streak1').trivia.some(t=>t.endsWith('This is tied for the 2nd longest streak among all players.')));
assert(streakRanks.find(p=>p.name==='Streak4').trivia.some(t=>t.endsWith('This is the 5th longest streak among all players.')));
assert(streakRanks.find(p=>p.name==='Streak5').trivia.includes('Longest PVP kill streak without a death: 3 (S1).'));
assert.equal(ace.topTeammates[0].name,'Partner');assert.equal(ace.topTeammates[0].count,5);
assert.equal(ace.teamColors.reduce((total,c)=>total+c.count,0),ace.games);
assert.equal(ace.commonColors[0].color,'Green');assert.equal(ace.commonColors[0].percent,100);
assert.equal(enemy.runnerUpStreak.length,5);
const earlierEnemy=data.profiles.find(p=>p.name==='Enemy1');
assert.equal(earlierEnemy.runnerUpStreak.length,0);
assert(!earlierEnemy.trivia.some(t=>t.includes('runner-up')));
assert(enemy.trivia.some(t=>t.includes('runner-up (Final Boss)')));
assert(partner.trivia.some(t=>t.includes('already died')));
assert(ace.trivia.some(t=>t.includes('most Ranged Kills')));
// Team kills never award PVP credit, and retained crowns never award a new Crown Holder.
const teamKillRounds=structuredClone(rounds);for(const s of teamKillRounds){s.players[2].type='Team Kill';s.players[2].color='Green';}
const tk=buildProfiles(teamKillRounds,bios,[]).profiles.find(p=>p.name==='Ace');
assert.equal(tk.kills,5);assert.equal(tk.teamKills,5);assert(!trophy(tk,'team-wipe'));
assert(tk.trivia.some(t=>t.includes('most total Team Kills')));
assert(tk.trivia.some(t=>t.includes('most Team Kills in a single game')));
const comeback=structuredClone(rounds);comeback[0].players.find(p=>p.type==='Disconnect').seconds=6;comeback[1].players[1]={name:'Partner',color:'Green',team:'Winners'};
const comebackPartner=buildProfiles(comeback,bios,[]).profiles.find(p=>p.name==='Partner');
assert(comebackPartner.trivia.some(t=>t.includes('Died first in Season 1, then survived his next game, Season 2')));
// Exact-time ties share First Blood and Final Boss rather than privileging a row.
const ties=structuredClone(rounds);for(const s of ties)s.players[3].seconds=10;
const tieData=buildProfiles(ties,bios,[]);assert.equal(trophy(tieData.profiles.find(p=>p.name==='Ace'),'first-blood').count,5);
assert.equal(trophy(tieData.profiles.find(p=>p.name==='Enemy1'),'final-boss').count,5);
const causeRounds=structuredClone(rounds);
const messages=[
  ['tried to swim in lava to escape OldAce','burned to death (Ace)'],
  ['fell from a high place (Ace)','hit the ground too hard (Ace)'],
  ['was slain by Wolf (Ace)','was slain by Wolf'],
  ['was slain by Wolf','was shot by Ace using Firework Rocket']
];
for(const [i,deaths] of messages.entries()){
  causeRounds[i].players[2].death=deaths[0];
  causeRounds[i].players[3].death=deaths[1];
}
causeRounds[0].players.push(
  {name:'Enemy3',color:'Yellow',type:'PVP',death:'was shot by Ace',result:'Ace'},
  {name:'Enemy4',color:'Yellow',type:'PVP',death:'was slain by Ace',result:'Ace'}
);
causeRounds[1].players.push(
  {name:'BlastVictim',color:'Yellow',type:'PVP',death:'was blown up by TNT (Ace)',result:'Ace'},
  {name:'PetVictim',color:'Orange',type:'PVP',death:'was slain by Wolf (Ace)',result:'Ace'}
);
causeRounds[3].players.push(
  {name:'Friendly',color:'Green',type:'Team Kill',death:'was slain by Ace',result:'Ace'},
  {name:'OtherEnemy',color:'Yellow',type:'PVP',death:'was blown up by Ace',result:'Ace'}
);
causeRounds[4].crown.name='Partner';
const causeAce=buildProfiles(causeRounds,bios,[]).profiles.find(p=>p.name==='Ace');
for(const [key,icon,season] of [['fire','lava-bucket',1],['fall','wind-charge',2],['pet','wolf-face',3]]){
  const award=trophy(causeAce,`multiple-${key}-kills`);
  assert.equal(award.icon,icon);
  assert.deepEqual(award.events.map(e=>e.season),[season]);
}
assert(causeAce.trivia.includes('Season 1: Wiped 2 teams in a single match.'));
assert(causeAce.trivia.includes('Season 4: Got a Pet PVP kill.'));
assert.deepEqual(causeAce.trivia.filter(t=>t.includes('different kill types')),[
  'Season 1: Got PVP kills with 3 different kill types (Fire, Melee, Ranged).',
  'Season 2: Got PVP kills with 3 different kill types (Fall Damage, Pet, TNT).'
]);
assert.equal(trophy(causeAce,'grand-slam').count,4);
assert.deepEqual(trophy(causeAce,'triple-threat').events.map(e=>e.season),[5]);
console.log('Passed: five-game boundary, aliases, team wins for dead teammates, kill credit, team wipes, first/last kills, ties, special records, crown transfers, streaks and teammates.');
const firstTypeCases=[
 ['FireFirst','was burnt to a crisp whilst fighting FireFirst','from burn damage'],
 ['FallFirst','hit the ground too hard (FallFirst)','from fall damage'],
 ['PetFirst','was slain by Wolf (PetFirst)','with a pet'],
 ['SpearFirst','was speared by SpearFirst','with a spear'],
 ['TntFirst','was blown up by TNT (TntFirst)','from TNT'],
 ['RangedFirst','was shot by RangedFirst','with a ranged weapon']
];
const firstTypeRoster=firstTypeCases.flatMap(([name,death])=>[{name,color:'Blue'},{name:name+'Victim',color:'Red',type:'PVP',death,result:name,seconds:10}]);
firstTypeRoster.push({name:'MixedFirst',color:'Blue'},
 {name:'MixedFire',color:'Red',type:'PVP',death:'was burnt by MixedFirst',result:'MixedFirst',seconds:10},
 {name:'MixedArrow',color:'Red',type:'PVP',death:'was shot by MixedFirst',result:'MixedFirst',seconds:10});
const firstTypePlayers=buildProfiles([{id:1,teamSize:2,players:firstTypeRoster}],[],[]).allPlayers;
for(const [name,,description] of firstTypeCases)assert(firstTypePlayers.find(p=>p.name===name).trivia.some(t=>t.includes('whose first PVP kill was '+description+'.')));
assert(!firstTypePlayers.find(p=>p.name==='MixedFirst').trivia.some(t=>t.includes('whose first PVP kill was')));
