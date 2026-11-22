const {grade}=require('./season-grades.cjs');

const objectiveMetrics={
 blazeKills:{label:'Blazes killed',dimension:'nether'},
 dragonDamage:{label:'Dragon damage',dimension:'end'},
 endCrystals:{label:'End crystals destroyed',dimension:'end'}
};

function buildCombinedRankings(classic,modern,profiles,report={}){
 const identities=profiles.identities;
 const names=new Set(profiles.allPlayers.map(player=>player.name));
 const objectiveGames=new Map();
 // Reports are keyed by season, with explicit nether/end booleans and a
 // players object containing measured totals. Absent totals remain unknown.
 for(const [seasonId,season] of Object.entries(report)){
  if(typeof season.nether!=='boolean'||typeof season.end!=='boolean')throw Error('Missing objective rules for S'+seasonId);
  for(const [name,totals] of Object.entries(season.players||{})){
   const canonical=identities[name.toLowerCase()]||name;
   if(!names.has(canonical)||!profiles.allPlayers.find(p=>p.name===canonical).history.some(h=>h.season===Number(seasonId))){
    throw Error('Unknown objective participant '+name+' in S'+seasonId);
   }
   const key=canonical+'|'+seasonId;
   if(objectiveGames.has(key))throw Error('Duplicate objective identity '+key);
   objectiveGames.set(key,{});
   for(const [metric,definition] of Object.entries(objectiveMetrics)){
    const value=totals[metric];
    if(value==null)continue;
    if(!Number.isFinite(value)||value<0||(metric!=='dragonDamage'&&!Number.isInteger(value)))throw Error('Invalid '+metric+' for '+key);
    if(!season[definition.dimension]&&value>0)throw Error('Objective recorded in disabled dimension for '+key);
    if(season[definition.dimension])objectiveGames.get(key)[metric]=value;
   }
  }
 }
 const scores=new Map();
 for(const seasonId of Object.keys(report))for(const metric of Object.keys(objectiveMetrics)){
  const field=[...objectiveGames].filter(([key,values])=>key.endsWith('|'+seasonId)&&Number.isFinite(values[metric]));
  // An all-zero field supplies no evidence and does not raise confidence.
  if(field.length<2||field.every(([,values])=>values[metric]===0))continue;
  for(const [key,values] of field){
   const points=field.reduce((sum,[otherKey,other])=>sum+(key===otherKey?0:values[metric]===other[metric]?0.5:Number(values[metric]>other[metric])),0);
   if(!scores.has(key))scores.set(key,{});
   scores.get(key)[metric]=100*points/(field.length-1);
  }
 }
 const objectiveActive=Object.fromEntries(Object.keys(objectiveMetrics).map(metric=>[metric,[...scores.values()].some(row=>Number.isFinite(row[metric]))]));
 const categories=modern.categories.map(category=>({...category}));
 const datasets={classic,modern};
 const modes={};
 for(const mode of ['all','classic','modern']){
  const sources=mode==='all'?[classic,modern]:[datasets[mode]];
  const playerNames=new Set(sources.flatMap(source=>source.players.map(player=>player.name)));
  const players=[...playerNames].map(name=>{
   const records=sources.map(source=>source.players.find(player=>player.name===name)).filter(Boolean);
   const games=records.reduce((sum,player)=>sum+player.games,0);
   const results=Object.fromEntries(Object.keys(modern.metrics).map(metric=>{
    const observed=records.map(player=>player.results[metric]).filter(Boolean);
    return [metric,{total:observed.reduce((sum,r)=>sum+r.total,0),games:observed.reduce((sum,r)=>sum+r.games,0)}];
   }));
   const grades=Object.fromEntries(categories.map(category=>{
    const measured=records.map(player=>player.grades[category.id]).filter(Boolean);
    const count=measured.reduce((sum,mark)=>sum+mark.games,0);
    const score=count?measured.reduce((sum,mark)=>sum+mark.score*mark.games,0)/count:null;
    return [category.id,score==null?null:{score,games:count,grade:grade(score),provisional:count<5}];
   }));
   const selectedSeasons=new Set(sources.flatMap(source=>source.seasons));
   for(const metric of Object.keys(objectiveMetrics)){
    const entries=[...objectiveGames].filter(([key])=>{
     const separator=key.lastIndexOf('|');
     return key.slice(0,separator)===name&&selectedSeasons.has(Number(key.slice(separator+1)));
    });
    const observed=entries.filter(([,values])=>Number.isFinite(values[metric]));
    const measured=entries.map(([key])=>scores.get(key)?.[metric]).filter(Number.isFinite);
    // Five neutral prior appearances keep a single objective game modest.
    results[metric]={total:observed.reduce((sum,[,values])=>sum+values[metric],0),games:observed.length,
     scoredGames:measured.length,score:(250+measured.reduce((sum,value)=>sum+value,0))/(5+measured.length)};
   }
   const team=grades['team-contribution'];
   if(team){
    const blazeWeight=objectiveActive.blazeKills?10:0;
    const dragonWeight=objectiveActive.dragonDamage?6:0;
    const crystalWeight=objectiveActive.endCrystals?4:0;
    team.score=team.score*(100-blazeWeight-dragonWeight-crystalWeight)/100+
     (blazeWeight*results.blazeKills.score+dragonWeight*results.dragonDamage.score+crystalWeight*results.endCrystals.score)/100;
    team.grade=grade(team.score);
   }
   const complete=categories.every(category=>grades[category.id]);
   const score=complete?categories.reduce((sum,category)=>sum+grades[category.id].score*category.overallWeight/100,0):null;
   grades.overall=score==null?null:{score,grade:grade(score),games,provisional:games<5};
   return {name,games,results,grades,eraGames:{
    classic:classic.players.find(player=>player.name===name)?.games||0,
    modern:modern.players.find(player=>player.name===name)?.games||0
   }};
  });
  const qualified=players.filter(player=>player.games>=5);
  const comparisonPlayers=qualified.length?qualified:players;
  for(const key of [...categories.map(category=>category.id),'overall']){
   const comparisonScores=comparisonPlayers.map(player=>player.grades[key]?.score).filter(Number.isFinite);
   for(const player of players){
    const mark=player.grades[key];
    if(!mark||!comparisonScores.length)continue;
    const lower=comparisonScores.filter(score=>score<mark.score-1e-9).length;
    const equal=comparisonScores.filter(score=>Math.abs(score-mark.score)<1e-9).length;
    // Midranks keep tied results together. A completely tied field is neutral.
    const percentile=comparisonScores.length===1?50:
     Math.max(0,Math.min(100,100*(lower+Math.max(0,equal-1)/2)/(comparisonScores.length-1)));
    mark.percentile=percentile;
    mark.grade=percentile>=90?'Netherite':percentile>=70?'Diamond':
     percentile>=30?'Gold':percentile>=10?'Iron':'Copper';
   }
  }
  modes[mode]={seasons:sources.flatMap(source=>source.seasons),players};
 }
 return {categories,metrics:{...modern.metrics,...objectiveMetrics},modes,objectiveActive,
  eraCategories:{classic:classic.categories,modern:modern.categories}};
}

module.exports={buildCombinedRankings};
