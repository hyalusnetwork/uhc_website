const fs=require('node:fs');
let p=fs.readFileSync('dist/players.js','utf8');
p=`function historyTeamLink(name,color,seasonId){
 const season=window.UHC_DATA.find(s=>s.id===seasonId);
 if(season?.teamSize===1||!color||color==='Solo')return escape(name||'Not recorded');
 const ink=color==='Black'?'#c5c8ce':color==='Navy'?'#9ab7ff':colors[color]||'#b3bda9';
 return \`<a class="season-team-link" style="color:\${ink}" href="#\${teamAnchor(color)}">\${escape(name||color)}</a>\`;
}
`+p;
const old='<td>${escape(r.team)}${r.moleFor?';
if(!p.includes(old))throw Error('Profile cell missing');
p=p.replace(old,'<td>${historyTeamLink(r.team,r.color,r.season)}${r.moleFor?');
fs.writeFileSync('dist/players.js',p);
let a=fs.readFileSync('dist/app.js','utf8');
const oldTeam='${p.color&&p.color!==\'Solo\'?`<a class="team-name season-team-link" href="#${teamAnchor(p.color)}">${escape(p.team||p.color)}</a>`:`<span class="team-name">${escape(p.team||p.color||\'Not recorded\')}</span>`}';
if(!a.includes(oldTeam))throw Error('Season cell missing');
a=a.replace(oldTeam,'<span class="team-name">${historyTeamLink(p.team,p.color,s.id)}</span>');
a=a.replace('<a class="season-team-link" href="#${teamAnchor(event.color)}">${escape(event.team)}</a>','${historyTeamLink(event.team,event.color,s.id)}');
fs.writeFileSync('dist/app.js',a);
