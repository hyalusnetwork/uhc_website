const tier=score=>score>=80?'S':score>=65?'A':score>=50?'B':score>=35?'C':score>=20?'D':'F';
function buildPlayerRankings(data,seasons=[]){
 const all=data.allPlayers;
 const games=all.reduce((n,p)=>n+p.games,0);
 const deathsBySeason=new Map();
 for(const p of all)for(const h of p.history)if(['PVP','PVE','Team Kill'].includes(h.type)&&h.seconds!=null){if(!deathsBySeason.has(h.season))deathsBySeason.set(h.season,[]);deathsBySeason.get(h.season).push({name:p.name,seconds:h.seconds});}
 const endurance=p=>p.history.map(h=>{const others=(deathsBySeason.get(h.season)||[]).filter(d=>d.name!==p.name),survivor=!h.death&&!h.type,available=others.length>0&&(survivor||h.seconds!=null);const outlasted=available?others.filter(d=>survivor||d.seconds<h.seconds).length:null;return {season:h.season,available,otherDeaths:others.length,outlasted,rate:available?outlasted/others.length:null};});
 const enduranceRecords=new Map(all.map(p=>[p.name,endurance(p)]));
 const validRates=[...enduranceRecords.values()].flat().filter(h=>h.available).map(h=>h.rate);
 const baseline={kills:all.reduce((n,p)=>n+p.kills,0)/games,wins:all.reduce((n,p)=>n+p.wins,0)/games,iron:all.reduce((n,p)=>n+p.ironmen,0)/games,survival:all.reduce((n,p)=>n+p.history.filter(h=>!h.death&&!h.type).length,0)/games};
 baseline.durability=validRates.length?validRates.reduce((a,b)=>a+b,0)/validRates.length:0;
 const weights={combat:40,victories:30,defense:20,survival:10};
 const benchmarks={combat:1.5,victories:0.4,defense:1,ironman:0.3,durability:0.8,survival:0.5};
 const priorGames=5;
 const {models,coverage}=require('./teammate-model.cjs').historicalModels(all,seasons,enduranceRecords);
 const bounded=(key,value)=>Math.max(0,key==='combat'?value:Math.min(1,value));
 const players=all.filter(p=>p.games>=5).map(p=>{
  const survived=p.history.filter(h=>!h.death&&!h.type).length;
  const enduranceHistory=enduranceRecords.get(p.name),valid=enduranceHistory.filter(h=>h.available),outlastRate=valid.length?valid.reduce((n,h)=>n+h.rate,0)/valid.length:null;
  const adjusted={combat:(p.kills+priorGames*baseline.kills)/(p.games+priorGames),victories:(p.wins+priorGames*baseline.wins)/(p.games+priorGames),ironman:(p.ironmen+priorGames*baseline.iron)/(p.games+priorGames),survival:(survived+priorGames*baseline.survival)/(p.games+priorGames)};
  const individualAdjusted={...adjusted},influenceRates={};
  for(const key of ['combat','victories','ironman','survival'])if(models[key]){
   const estimate=models[key].estimate(p.name);
   individualAdjusted[key]=bounded(key,models[key].baseline+estimate.individual);
   adjusted[key]=bounded(key,models[key].baseline+estimate.individual+estimate.influence);
   influenceRates[key]=estimate.influence;
  }
  const components=Object.fromEntries(Object.entries(weights).filter(([key])=>key!=='defense').map(([key,weight])=>{const attainment=Math.min(1,adjusted[key]/benchmarks[key]);return [key,{points:weight*attainment,personalPoints:weight*Math.min(1,individualAdjusted[key]/benchmarks[key]),weight,adjustedRate:adjusted[key],benchmark:benchmarks[key],tier:tier(100*attainment)}]}));
  let adjustedDurability=(valid.reduce((n,h)=>n+h.rate,0)+priorGames*baseline.durability)/(valid.length+priorGames);
  let personalDurability=adjustedDurability;
  if(models.durability){const estimate=models.durability.estimate(p.name);personalDurability=bounded('durability',models.durability.baseline+estimate.individual);adjustedDurability=bounded('durability',models.durability.baseline+estimate.individual+estimate.influence);influenceRates.durability=estimate.influence;}
  const personalDefense=10*Math.min(1,individualAdjusted.ironman/benchmarks.ironman)+10*Math.min(1,personalDurability/benchmarks.durability);
  const ironPoints=10*Math.min(1,adjusted.ironman/benchmarks.ironman),durabilityPoints=10*Math.min(1,adjustedDurability/benchmarks.durability);
  components.defense={points:ironPoints+durabilityPoints,personalPoints:personalDefense,weight:20,tier:tier(5*(ironPoints+durabilityPoints)),ironPoints,durabilityPoints,adjustedIronRate:adjusted.ironman,adjustedDurability,adjustedRate:(ironPoints+durabilityPoints)/20,benchmark:1};
  const teamKillRate=p.teamKills/p.games,penalty=Math.min(20,40*teamKillRate);
  const disciplineTier=p.teamKills===0?'S':teamKillRate<=.02?'A':teamKillRate<=.05?'B':teamKillRate<=.10?'C':teamKillRate<=.20?'D':'F';
  const score=Math.max(0,Object.values(components).reduce((n,c)=>n+c.points,0)-penalty);
  const individualScore=Math.max(0,Object.values(components).reduce((n,c)=>n+c.personalPoints,0)-penalty);
  const teammateInfluence=score-individualScore,teamCoverage=coverage.get(p.name);
  return {individualScore,teammateInfluence,teammateGames:teamCoverage.games,distinctTeammates:teamCoverage.teammates.size,influenceRates,name:p.name,aliases:p.aliases,games:p.games,kills:p.kills,wins:p.wins,ironmen:p.ironmen,survived,teamKills:p.teamKills,killsPerGame:p.kills/p.games,winRate:p.wins/p.games,ironRate:p.ironmen/p.games,outlastRate,durabilityGames:valid.length,outlastedDeaths:valid.reduce((n,h)=>n+h.outlasted,0),otherTimedDeaths:valid.reduce((n,h)=>n+h.otherDeaths,0),survivalRate:survived/p.games,teamKillRate,disciplineTier,components,penalty,score,tier:tier(score),rank:null,bestKills:p.bestKills,firstSeason:p.history[0].season,lastSeason:p.history.at(-1).season,history:p.history.map(h=>({season:h.season,kills:h.kills,win:h.win,iron:h.iron,team:h.team,color:h.color,teamKills:h.teamKills||0,deathOutlastRate:enduranceHistory.find(e=>e.season===h.season).rate})),topVictims:p.topVictims,topTeammates:p.topTeammates};
 }).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
 players.forEach((p,i)=>{p.rank=i&&Math.abs(p.score-players[i-1].score)<1e-9?players[i-1].rank:i+1});
 return {players,weights,benchmarks,baseline,priorGames,minimumGames:5,teammateMethod:'Your score combines what you produce personally with the estimated effect you have on teammates. Strong help received is accounted for rather than attributed entirely to you. Your own positive or negative influence is included in the component scores, not added again afterward. Each historical statistic is fitted as: average + individual effect + average influence of teammates + match/team circumstances + ruleset and size effects. Individual effects use penalty 5; influence uses penalty 20, so small samples stay near average. Players below five matches are included only as uncertain internal context and never appear in these rankings. Games with changing or unknown allegiances contribute personal history but do not establish teammate relationships. Influence is an association, not causal proof; players who always play together remain difficult to separate. The score stays on the existing 0–100 scale. Damage and resource data are not used.',method:'40 points for PVP kills per game, 30 for team win rate, 20 for Defense, and 10 for survival. Defense combines up to 10 points for Ironman rate (30% benchmark) and up to 10 for average share of other timed deaths outlasted (80% benchmark). Each game has equal weight in that average. Full points for the other components require 1.5 kills per game, 40% wins, and 50% survival. Each rate is estimated jointly from recorded matches, accounting for individual performance, teammate influence, shared match/team circumstances, ruleset, field size and team size. Individual estimates shrink toward the average with a five-game-strength prior; teammate influence uses a stronger twenty-game-strength prior. Team Kills subtract 40 × (Team Kills / games), capped at 20 points. Total scores are capped by the component weights, floored at zero, and never scaled to force the leader to 100.',tiers:'Overall and positive-stat tiers: S ≥ 80, A ≥ 65, B ≥ 50, C ≥ 35, D ≥ 20, F < 20. Stat tiers use percentage of their benchmark attained after adjustment. Discipline: S = no Team Kills; A = rate ≤ 0.02 per game; B ≤ 0.05; C ≤ 0.10; D ≤ 0.20; F > 0.20.',notes:'Five recorded games are required. Rates, not lifetime totals, drive the score; repeated strong performance matters more than attendance alone. Alias records are combined. Wins include all winning teammates, even those who died. Team Kills are excluded from PVP kills. Survival requires no recorded death or other exit. The same ledger and identity rules used by player profiles apply here. Durability counts other players who died to PVP, PVE, or Team Kills with recorded times. Survivors outlast all of them; otherwise only strictly earlier deaths count. Own deaths are excluded, and tied deaths do not count as outlasted. Games with no other timed deaths or unknown exit times are excluded from this average; coverage is shown. Disconnects and disqualifications are not counted as deaths. Historical bios do not supply score totals.'};
}
module.exports={buildPlayerRankings,tier};
