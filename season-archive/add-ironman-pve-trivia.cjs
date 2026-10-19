const fs=require('node:fs');let p=fs.readFileSync('profile-engine.cjs','utf8');const marker='  const allPlayers=[...players.values()];';if(!p.includes(marker))throw Error('Insertion point missing');
p=p.replace(marker,marker+`
  const ironmanPvePlayers=allPlayers.filter(p=>p.history.some(h=>h.iron&&h.type==='PVE'));
  for(const player of ironmanPvePlayers){
    const ids=player.history.filter(h=>h.iron&&h.type==='PVE').map(h=>h.season).sort((a,b)=>a-b);
    player.trivia.push('Earned Ironman but died to PVE in the same season (one of '+ironmanPvePlayers.length+' out of '+allPlayers.length+' recorded players to do so) ('+(ids.length===1?'Season':'Seasons')+' '+ids.join(', ')+').');
  }
`);fs.writeFileSync('profile-engine.cjs',p);
