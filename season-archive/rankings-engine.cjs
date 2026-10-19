const TEAM_COLORS=new Set(['Black','Blue','Cyan','Green','Lime','Maroon','Navy','Orange','Pink','Purple','Red','Turquoise','White','Yellow']);
function buildRankings(seasons,profileData){
 const identity=n=>profileData.identities[String(n).toLowerCase()]||n;
 const entries=new Map();
 for(const season of seasons){
  if(season.teamSize===1)continue;
  const groups=new Map();for(const player of season.players){if(player.color==='Solo')continue;const color=player.color||'Not recorded';if(!groups.has(color))groups.set(color,[]);groups.get(color).push(player);}
  for(const [color,roster] of groups){
   if(!entries.has(color))entries.set(color,{color,isColor:TEAM_COLORS.has(color),history:[]});
   const history=roster.map(p=>profileData.allPlayers.find(a=>a.name===identity(p.name)).history.find(h=>h.season===season.id));
   entries.get(color).history.push({season:season.id,date:season.date,teams:[...new Set(roster.map(p=>p.team).filter(Boolean))],players:roster.map(p=>identity(p.name)),participants:roster.length,win:history.some(h=>h.win),kills:history.reduce((n,h)=>n+h.kills,0),survivors:roster.filter(p=>!p.death&&!p.type).length,ironmen:roster.filter(p=>!/^Disqualif/i.test(p.type||'')&&p.achievement==='Ironman').length,pveDeaths:roster.filter(p=>p.type==='PVE').length,pvpDeaths:roster.filter(p=>p.type==='PVP').length,teamKillDeaths:roster.filter(p=>p.type==='Team Kill').length,teamKills:history.reduce((n,h)=>n+h.teamKills,0),otherExits:roster.filter(p=>p.type&&!['PVP','PVE','Team Kill'].includes(p.type)).length});
  }
 }
 const teams=[...entries.values()].map(team=>{
  const sum=key=>team.history.reduce((n,h)=>n+h[key],0),appearances=team.history.length,participants=sum('participants'),wins=team.history.filter(h=>h.win).length,kills=sum('kills'),survivors=sum('survivors');
  return {...team,appearances,participants,uniquePlayers:new Set(team.history.flatMap(h=>h.players)).size,wins,kills,survivors,ironmen:sum('ironmen'),pveDeaths:sum('pveDeaths'),pvpDeaths:sum('pvpDeaths'),teamKillDeaths:sum('teamKillDeaths'),teamKills:sum('teamKills'),otherExits:sum('otherExits'),winRate:wins/appearances,killsPerParticipant:kills/participants,survivalRate:survivors/participants,eligible:team.isColor&&appearances>5,rank:null,score:null};
 });
 const pool=teams.filter(t=>t.isColor),total=key=>pool.reduce((n,t)=>n+t[key],0);
 const baseline={winRate:total('wins')/total('appearances'),killsPerParticipant:total('kills')/total('participants'),survivalRate:total('survivors')/total('participants')};
 for(const team of teams){
  const win=(team.wins+5*baseline.winRate)/(team.appearances+5),kills=(team.kills+10*baseline.killsPerParticipant)/(team.participants+10),survival=(team.survivors+10*baseline.survivalRate)/(team.participants+10);
  team.components={win:60*Math.min(win/0.40,1),combat:25*Math.min(kills/0.75,1),survival:15*Math.min(survival/0.40,1)};
  if(team.eligible)team.score=Object.values(team.components).reduce((a,b)=>a+b,0);
 }
 const qualified=teams.filter(t=>t.eligible).sort((a,b)=>b.score-a.score||a.color.localeCompare(b.color));
 qualified.forEach((team,i)=>{team.rank=i&&Math.abs(team.score-qualified[i-1].score)<1e-9?qualified[i-1].rank:i+1;});
 teams.sort((a,b)=>(a.rank??Infinity)-(b.rank??Infinity)||b.appearances-a.appearances||a.color.localeCompare(b.color));
 return {teams,baseline,minimumAppearances:6,method:'Score = 60 × min(adjusted win rate / 40%, 1) + 25 × min(adjusted kills per participant / 0.75, 1) + 15 × min(adjusted survival rate / 40%, 1). These fixed strong-performance benchmarks give ordinary UHC results a useful spread without forcing the leader to score 100. Each component caps at its weight. A score of 100 means meeting all three benchmarks, not winning every game. Adjusted win rate adds 5 appearances at the overall color average; the other rates add 10 participant entries at their overall color averages. Raw ratios remain visible.',notes:'A color appearance is one season in which that color has at least one recorded participant. Participant entries count each person once per appearance, including repeat players across seasons. A win counts once for the color when its recorded team wins; dead teammates count toward the win. PVP kills exclude Team Kills. Only actual colors with at least six appearances are ranked; Mole and missing colors remain browsable as special groupings. Solo matches are excluded from Teams. Results use the workbook and the same winner inference as player profiles.'};
}
module.exports={buildRankings};
