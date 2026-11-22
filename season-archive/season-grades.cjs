const {isAdministrativeDeath,isRecordedDeath}=require('./death-types.cjs');

const categories=[
 {id:'survival',label:'PvE Survival',overallWeight:30,metrics:['pveDamage','pveDeaths','ironman'],
  weights:{pveDamage:42.5,pveDeaths:42.5,ironman:15},
  explanation:'Fewer regular hearts lost to mobs, the environment, or self-inflicted damage earns a higher damage score. A lower PvE death rate earns a higher death score. Self-inflicted deaths count as PvE. The death rate omits disconnects and disqualifications. Earning Ironman more often improves the Ironman score. Disqualification forfeits Ironman credit.'},
 {id:'combat',label:'Enemy Combat',overallWeight:30,metrics:['enemyDamage','enemyKills'],
  weights:{enemyDamage:60,enemyKills:40},
  explanation:'More damage and more kills against opponents earn higher scores. Damage includes regular and absorption hearts. Teammate damage and team kills count under Team Contribution.'},
 {id:'team-contribution',label:'Team Contribution',overallWeight:40,
  metrics:['wins','friendlyDamage','teamKills','diamondOre','goldOre'],
  weights:{wins:100/3,friendlyDamage:100/6,teamKills:100/6,diamondOre:100/6,goldOre:100/6},
  explanation:'Match Results, Friendly Fire, and Mining each count for one third. Match Results uses win rate in games with a known winner. Eliminated and disconnected players still receive credit for a team win. Disqualification forfeits win credit. Friendly Fire rewards fewer teammate kills and fewer regular and absorption hearts dealt to teammates in team games. Mining rewards more diamond and gold ore mined.'}
];
const metrics={
 pveDamage:{label:'PvE hearts lost',lower:true},
 pveDeaths:{label:'PvE death rate',rate:true,lower:true},
 enemyDamage:{label:'Enemy hearts dealt'},
 enemyKills:{label:'Enemy kills'},
 wins:{label:'Win rate',rate:true},
 friendlyDamage:{label:'Friendly hearts dealt',lower:true},
 teamKills:{label:'Team kills',lower:true},
 diamondOre:{label:'Diamond ore mined'},
 goldOre:{label:'Gold ore mined'},
 ironman:{label:'Ironman rate',rate:true}
};
const average=values=>values.reduce((sum,value)=>sum+value,0)/values.length;
const grade=score=>score>=90?'Netherite':score>=70?'Diamond':score>=50?'Gold':score>=35?'Iron':'Copper';
const combatDeath=type=>isRecordedDeath(type)&&!isAdministrativeDeath(type);

function buildSeasonGrades(data,seasons,seasonIds,options={}){
 const excluded=new Set(options.excludeMetrics||[]);
 const activeMetrics=Object.fromEntries(Object.entries(metrics).filter(([key])=>!excluded.has(key)));
 const activeCategories=categories.map(category=>{
  const included=category.metrics.filter(key=>!excluded.has(key));
  const total=included.reduce((sum,key)=>sum+category.weights[key],0);
  return {...category,metrics:included,weights:Object.fromEntries(included.map(key=>[key,100*category.weights[key]/total])),
   explanation:options.classic?({
    survival:'Lower PvE death rates and more Ironman awards earn higher grades. Self-inflicted deaths count as PvE. Disconnects and disqualifications count as deaths in the archive but are excluded from this PvE-specific rate, just as in Modern. Disqualification forfeits Ironman. Damage is unavailable and omitted.',
    combat:'More enemy kills earn higher grades relative to peers in the same season. Team kills are excluded. Damage is unavailable and omitted.',
    'team-contribution':'Winning earns more credit; fewer team kills earns more credit in team games. Eliminated and disconnected winning teammates receive win credit; disqualified players do not. Unknown winners are excluded from win rates. Friendly damage and mining are unavailable and omitted.'
   }[category.id]):category.explanation};
 });

 const identity=name=>data.identities[name?.toLowerCase()]||name;
 const groups=new Map(seasonIds.map(id=>[id,[]]));
 const people=new Map();
 for(const player of data.allPlayers){
  const games=[];
  for(const game of player.history){
   if(!groups.has(game.season))continue;
   const season=seasons.find(s=>s.id===game.season);
   const record=season.players.find(p=>p.name===game.recordedName);
   const selfKill=combatDeath(game.type)&&identity(record?.result)===player.name;
   const dead=combatDeath(game.type);
   const alive=!game.type&&!game.death;
   const resultKnown=data.winnerSources.some(source=>source.season===game.season&&source.teams.length);
   const friendly=game.damage?game.damage.red.friendlyDealt+game.damage.yellow.friendlyDealt:null;
   const values={
    pveDamage:game.damage?.red.pve??null,
    pveDeaths:dead||alive?Number(game.type==='PVE'||selfKill):null,
    enemyDamage:game.damage?Math.max(0,game.damage.red.dealt+game.damage.yellow.dealt-friendly):null,
    enemyKills:game.kills,
    wins:resultKnown?Number(game.win):null,
    friendlyDamage:season.teamSize===1?null:friendly,
    teamKills:season.teamSize===1?null:game.teamKills,
    diamondOre:game.metrics?.[0]??null,
    goldOre:game.metrics?.[1]??null,
    ironman:Number(game.iron)
   };
   const entry={season:game.season,values,scores:{}};
   games.push(entry);
   groups.get(game.season).push(entry);
  }
  if(games.length)people.set(player.name,games);
 }

 // Compare each result with other measured players in the same season.
 // A tie counts as half a comparison, including when the entire field ties.
 for(const field of groups.values())for(const [key,metric] of Object.entries(activeMetrics)){
  const measured=field.filter(game=>Number.isFinite(game.values[key]));
  if(measured.length<2)continue;
  for(const game of measured){
   const value=game.values[key];
   const points=measured.reduce((sum,peer)=>{
    if(peer===game)return sum;
    const delta=value-peer.values[key];
    if(Math.abs(delta)<1e-6)return sum+0.5;
    return sum+Number(metric.lower?delta<0:delta>0);
   },0);
   game.scores[key]=100*points/(measured.length-1);
  }
 }

 const players=[...people].map(([name,games])=>{
  const results=Object.fromEntries(Object.keys(activeMetrics).map(key=>{
   const observed=games.map(game=>game.values[key]).filter(Number.isFinite);
   const scores=games.map(game=>game.scores[key]).filter(Number.isFinite);
   return [key,{total:observed.reduce((sum,value)=>sum+value,0),games:observed.length,
    score:scores.length?average(scores):null,scoredGames:scores.length}];
  }));
  const grades=Object.fromEntries(activeCategories.map(category=>{
   const measured=category.metrics.filter(key=>results[key].score!==null);
   const weight=measured.reduce((sum,key)=>sum+category.weights[key],0);
   const score=weight?measured.reduce((sum,key)=>sum+results[key].score*category.weights[key]/weight,0):null;
   const comparableGames=games.filter(game=>category.metrics.some(key=>Number.isFinite(game.scores[key]))).length;
   return [category.id,score===null?null:{score,grade:grade(score),
    games:comparableGames,provisional:comparableGames<5}];
  }));
  const categoryGrades=activeCategories.map(category=>grades[category.id]);
  const overallScore=categoryGrades.every(Boolean)?
   activeCategories.reduce((sum,category)=>sum+grades[category.id].score*category.overallWeight/100,0):null;
  grades.overall=overallScore===null?null:{
   score:overallScore,grade:grade(overallScore),provisional:categoryGrades.some(mark=>mark.provisional)
  };
  return {name,games:games.length,results,grades};
 });
 return {seasons:seasonIds,categories:activeCategories,metrics:activeMetrics,players};
}

module.exports={buildSeasonGrades,grade};
