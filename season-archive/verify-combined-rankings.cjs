const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {buildCombinedRankings}=require('./combined-rankings.cjs');
const window={};
vm.runInNewContext(fs.readFileSync('dist/player-rankings-data.js','utf8'),{window});
const actual=window.UHC_PLAYER_RANKINGS;
const categories=actual.seasonGrades.categories;
const source=(games,score,seasons)=>({
 categories,metrics:actual.seasonGrades.metrics,seasons,
 players:['A','B'].map(name=>({
  name,games,results:{},
  grades:Object.fromEntries(categories.map(category=>[category.id,{score,games}]))
 }))
});
const classic=source(20,80,[1]);
const modern=source(5,20,[37,38]);
const profiles={identities:{alias:'A'},allPlayers:['A','B'].map(name=>({
 name,history:[{season:37},{season:38}]
}))};
const baseline=buildCombinedRankings(classic,modern,profiles);
const player=mode=>baseline.modes[mode].players[0];
assert.equal(player('all').grades.overall.score,68);
assert.equal(player('classic').grades.overall.score,80);
assert.equal(player('modern').grades.overall.score,20);
assert.equal(player('all').games,25);
assert.equal(player('all').grades.overall.percentile,50);
assert.equal(player('all').grades.overall.grade,'Gold');
const variedModern=source(5,20,[37,38]);
for(const mark of Object.values(variedModern.players[1].grades))mark.score=80;
const varied=buildCombinedRankings(classic,variedModern,profiles);
assert.equal(varied.modes.modern.players[0].grades.overall.grade,'Copper');
assert.equal(varied.modes.modern.players[1].grades.overall.grade,'Netherite');
const report={
 37:{nether:true,end:true,players:{
  alias:{blazeKills:10,dragonDamage:100,endCrystals:2},
  B:{blazeKills:0,dragonDamage:0,endCrystals:0}
 }},
 38:{nether:false,end:false,players:{A:{blazeKills:0},B:{blazeKills:0}}}
};
const enabled=buildCombinedRankings(classic,modern,profiles,report);
const a=enabled.modes.modern.players[0],b=enabled.modes.modern.players[1];
assert.equal(a.results.blazeKills.games,1);
assert.equal(a.results.blazeKills.scoredGames,1);
assert.equal(a.results.blazeKills.score,350/6);
assert.equal(b.results.blazeKills.score,250/6);
assert(a.grades['team-contribution'].score>b.grades['team-contribution'].score);
assert.equal(enabled.modes.classic.players[0].results.blazeKills.games,0);
assert.equal(enabled.modes.classic.players[0].results.blazeKills.score,50);
const zeroReport={37:{nether:true,end:true,players:{A:{blazeKills:0},B:{blazeKills:0}}}};
const zero=buildCombinedRankings(classic,modern,profiles,zeroReport);
assert.equal(zero.objectiveActive.blazeKills,false);
assert.equal(zero.modes.all.players[0].grades.overall.score,68);
assert.equal(zero.modes.all.players[0].results.blazeKills.scoredGames,0);
assert.throws(()=>buildCombinedRankings(classic,modern,profiles,{
 37:{nether:false,end:false,players:{A:{blazeKills:1}}}
}),/disabled/);
for(const mode of Object.values(actual.combinedGrades.modes)){
 for(const p of mode.players){
  for(const mark of Object.values(p.grades)){
   if(mark)assert(Number.isFinite(mark.score)&&mark.score>=0&&mark.score<=100);
  }
 }
}
console.log('Passed combined era weighting, filtered scores, objective exposure, neutral missing/disabled data, all-zero fields, and generated scores.');
