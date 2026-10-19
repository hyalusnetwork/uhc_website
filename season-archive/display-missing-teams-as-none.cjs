const fs=require('node:fs');
let p=fs.readFileSync('dist/players.js','utf8');
p="const teamDisplayName=value=>!value||value==='Not recorded'?'None':value;\n"+p;
p=p.replace("escape(name||'Not recorded')","escape(teamDisplayName(name))").replace('escape(name||color)','escape(teamDisplayName(name||color))');
p=p.replaceAll('escape(c.color)','escape(teamDisplayName(c.color))').replaceAll('${c.color}\\n','${teamDisplayName(c.color)}\\n').replaceAll('${escape(c.color)}:','${escape(teamDisplayName(c.color))}:');
fs.writeFileSync('dist/players.js',p);
let r=fs.readFileSync('dist/rankings.js','utf8');r=r.replaceAll('escape(team.color)','escape(teamDisplayName(team.color))').replaceAll('escape(t.color)','escape(teamDisplayName(t.color))').replace("escape(h.teams.join(' · ')||'Not recorded')","escape(h.teams.map(teamDisplayName).join(' · ')||'None')");fs.writeFileSync('dist/rankings.js',r);
let s=fs.readFileSync('dist/stats.js','utf8');s=s.replace("if(title==='Team Color')","if(title==='Team Name')return escape(teamDisplayName(value));\n if(title==='Team Color')");s=s.replace('${escape(value)}</span>`;\n', '${escape(teamDisplayName(value))}</span>`;\n');fs.writeFileSync('dist/stats.js',s);
