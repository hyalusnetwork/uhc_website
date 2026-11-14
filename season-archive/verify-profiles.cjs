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
assert.equal(trophy(ace,'sharpshooter').count,5);assert.equal(trophy(ace,'triple-threat').count,5);assert.equal(trophy(ace,'grand-slam').count,5);
assert.match(trophy(ace,'grand-slam').events[1].detail,/retained the crown/);
assert(ace.trivia.includes('Earned Ironman on his debut (Season 1) (the only recorded player to do so).'));
assert.equal(data.deathCount,15);assert.equal(ace.killStreak,10);assert.equal(ace.history[0].outlivedPercent,100);
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
const comeback=structuredClone(rounds);comeback[1].players[1]={name:'Partner',color:'Green',team:'Winners'};
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
console.log('Passed: five-game boundary, aliases, team wins for dead teammates, kill credit, team wipes, first/last kills, ties, special records, crown transfers, streaks and teammates.');
