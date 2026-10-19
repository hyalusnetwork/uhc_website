const fs=require('node:fs');let p=fs.readFileSync('profile-engine.cjs','utf8');const marker='  const allPlayers=[...players.values()];';if(!p.includes(marker))throw Error('Insertion point missing');
p=p.replace(marker,marker+`
  const pveCauses=new Map();
  for(const season of seasons)for(const death of season.players){
    const cause=String(death.result||'').trim();
    if(death.type!=='PVE'||!cause||cause.toLowerCase()==='not recorded')continue;
    const key=cause.toLowerCase();
    if(!pveCauses.has(key))pveCauses.set(key,{cause,players:new Map()});
    const victims=pveCauses.get(key).players,name=identity(death.name);
    if(!victims.has(name))victims.set(name,new Set());
    victims.get(name).add(season.id);
  }
  for(const {cause,players:victims} of pveCauses.values())if(victims.size===1){
    const [name,ids]=[...victims][0],seasons=[...ids].sort((a,b)=>a-b);
    players.get(name).trivia.push('The only recorded player to have died to '+cause+' ('+(seasons.length===1?'Season':'Seasons')+' '+seasons.join(', ')+').');
  }
`);fs.writeFileSync('profile-engine.cjs',p);
