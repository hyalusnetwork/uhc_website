const fs=require('fs'),p='profile-engine.cjs';let s=fs.readFileSync(p,'utf8');const start=s.indexOf('  const firstMeleeWaits='),end=s.indexOf('  const multiKillDebuts=',start);s=s.slice(0,start)+`  for(const rule of [{label:'melee death',types:['PVP','Team Kill'],clarification:' Melee deaths caused by teammates count for this record.'},{label:'PVP melee death',types:['PVP'],clarification:' Team Kills do not count for this record.'}]){
    const waits=allPlayers.flatMap(p=>{
      const history=[...p.history].sort((a,b)=>a.season-b.season),index=history.findIndex(h=>rule.types.includes(h.type)&&/\\bslain by\\b/i.test(h.death||''));
      return index<0?[]:[{player:p,count:index,season:history[index].season}];
    });
    const longest=Math.max(0,...waits.map(r=>r.count)),holders=waits.filter(r=>r.count===longest);
    for(const r of holders){const possessive=r.player.pronouns.possessive;r.player.trivia.push(\`\${holders.length>1?'Tied for the most':'Played the most'} matches before \${possessive} first \${rule.label}: \${r.count}. \${possessive[0].toUpperCase()+possessive.slice(1)} first \${rule.label} came in Season \${r.season}, on appearance \${r.count+1}.\${rule.clarification}\`);}
  }
`+s.slice(end);fs.writeFileSync(p,s);
