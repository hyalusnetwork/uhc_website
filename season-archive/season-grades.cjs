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
const grade=score=>score>=90?'S':score>=70?'A':score>=50?'B':score>=35?'C':score>=20?'D':'F';
const combatDeath=type=>isRecordedDeath(type)&&!isAdministrativeDeath(type);

function buildSeasonGrades(data,seasons,seasonIds){
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
 for(const field of groups.values())for(const [key,metric] of Object.entries(metrics)){
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
  const results=Object.fromEntries(Object.keys(metrics).map(key=>{
   const observed=games.map(game=>game.values[key]).filter(Number.isFinite);
   const scores=games.map(game=>game.scores[key]).filter(Number.isFinite);
   return [key,{total:observed.reduce((sum,value)=>sum+value,0),games:observed.length,
    score:scores.length?average(scores):null,scoredGames:scores.length}];
  }));
  const grades=Object.fromEntries(categories.map(category=>{
   const components=category.metrics.map(key=>results[key]);
   const score=components.every(item=>item.score!==null)?
    category.metrics.reduce((sum,key)=>sum+results[key].score*category.weights[key]/100,0):null;
   return [category.id,score===null?null:{score,grade:grade(score),
    provisional:components.some(item=>item.scoredGames<5)}];
  }));
  const categoryGrades=categories.map(category=>grades[category.id]);
  const overallScore=categoryGrades.every(Boolean)?
   categories.reduce((sum,category)=>sum+grades[category.id].score*category.overallWeight/100,0):null;
  grades.overall=overallScore===null?null:{
   score:overallScore,grade:grade(overallScore),provisional:categoryGrades.some(mark=>mark.provisional)
  };
  return {name,games:games.length,results,grades};
 });
 return {seasons:seasonIds,categories,metrics,players};
}

module.exports={buildSeasonGrades};
