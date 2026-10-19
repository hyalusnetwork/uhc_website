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
assert.equal(trophy(ace,'sharpshooter').count,5);assert.equal(trophy(ace,'triple-threat').count,5);assert.equal(trophy(ace,'grand-slam').count,1);
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
console.log('Passed: five-game boundary, aliases, team wins for dead teammates, kill credit, team wipes, first/last kills, ties, special records, crown transfers, streaks and teammates.');
