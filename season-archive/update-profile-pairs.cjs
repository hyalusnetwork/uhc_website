const fs=require('fs');const path='dist/players.js';let s=fs.readFileSync(path,'utf8');const index=s.indexOf('function playerCards()');s=s.slice(0,index)+`function profilePvpPairs(player,entries,asKiller){
 return entries.length?entries.map(entry=>{
  const killer=asKiller?player.name:entry.name,victim=asKiller?entry.name:player.name;
  return '<div class="profile-pvp-pair"><span class="stat-person">'+statPlayer(killer)+'</span><span class="profile-pvp-arrow" aria-label="killed">→</span><span class="stat-person">'+statPlayer(victim)+'</span><span class="profile-pvp-count">('+entry.count+')</span></div>';
 }).join(''):'None recorded';
}
`+s.slice(index);s=s.replace('<dt>Most frequent PVP victims</dt><dd>${topPeople(p.topVictims)}</dd><dt>Most frequent PVP killers</dt><dd>${topPeople(p.topKillers)}</dd>','<dt>Most frequent PVP victim${p.topVictims.length===1?\'\':\'s\'}</dt><dd>${profilePvpPairs(p,p.topVictims,true)}</dd><dt>Most frequent PVP killer${p.topKillers.length===1?\'\':\'s\'}</dt><dd>${profilePvpPairs(p,p.topKillers,false)}</dd>');fs.writeFileSync(path,s);
