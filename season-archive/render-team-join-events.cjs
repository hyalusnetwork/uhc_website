const fs=require('fs'),p='dist/app.js';let s=fs.readFileSync(p,'utf8');const pattern=/\$\{s\.players\.map\(p=>`(<tr[\s\S]*?<\/tr>)`\)\.join\(''\)\}/;const match=s.match(pattern);if(!match)throw Error('Player row template not found');let row=match[1];row=row.replace("${p.debut?", "${p.roamer?'<span class=\"badge roamer-badge\">Roamer</span>':''}${p.debut?");const functions=`function seasonPlayerRow(s,p){return \`${row}\`;}
function teamJoinRow(s,event){
 const label=event.kind==='formed'?'Team formed':event.kind==='roamer'?'Roamer joined':'Team joined';
 return \`<tr class="team-join-row" style="--team:\${colors[event.color]||'#b0b6c2'}" data-join-seconds="\${event.seconds}"><td colspan="3"><div class="team-join-content"><span class="team-join-marker" aria-hidden="true">+</span><div class="team-join-body"><div class="team-join-heading"><span>\${label}</span><strong>\${escape(event.team)}</strong><small>\${escape(event.color)}</small></div><div class="team-join-members">\${event.names.map(name=>\`<span class="team-join-person">\${playerFace(name)}<button class="player-name" data-player="\${escape(name)}">\${escape(name)}</button></span>\`).join('')}</div></div></div></td><td class="elapsed team-join-time">\${duration(event.seconds)}</td></tr>\`;
}
function seasonLogRows(s){
 if(!s.teamJoins?.length)return s.players.map(p=>seasonPlayerRow(s,p)).join('');
 const log=[...s.players.map((player,index)=>({player,seconds:player.seconds??Infinity,index})),...s.teamJoins.map((join,index)=>({join,seconds:join.seconds,index}))];
 log.sort((a,b)=>a.seconds-b.seconds||(a.join?0:1)-(b.join?0:1)||a.index-b.index);
 return log.map(e=>e.join?teamJoinRow(s,e.join):seasonPlayerRow(s,e.player)).join('');
}
`;
s=s.replace(pattern,'${seasonLogRows(s)}');const at=s.indexOf('function card(s){');s=s.slice(0,at)+functions+s.slice(at);s=s.replace('<span>v${escape(minecraftVersion(s.version))}</span>', '<span>v${escape(minecraftVersion(s.version))}</span>${s.hasRoamers?`<span class="season-roamer-flag" ${chartTip(\'Roamer game\\nOne or more players started without a team while most others started with teammates.\')}>Roamer game</span>`:\'\'}');s=s.replace('Season ${s.id} players in workbook order','Season ${s.id} results${s.teamJoins?.length?\' and team-joining events in chronological order\':\' in workbook order\'}');s=s.replace('[p.name,p.team,p.color,p.moleFor]','[p.name,p.team,p.color,p.moleFor,p.roamer?\'roamer\':null]');fs.writeFileSync(p,s);
