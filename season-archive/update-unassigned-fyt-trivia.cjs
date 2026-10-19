const fs=require('node:fs');
let p=fs.readFileSync('profile-engine.cjs','utf8');
const marker='  const allPlayers=[...players.values()];';
if(!p.includes(marker))throw Error('Missing insertion point');
p=p.replace(marker,marker+`
  // Missing team colors in Find Your Team are distinct from late joins to known teams.
  const findYourTeamIds=new Set(seasons.filter(s=>s.mode==='Find Your Team').map(s=>s.id));
  for(const rule of [{field:'kills',label:'Got a PVP kill'},{field:'iron',label:'Earned Ironman'}]){
    const qualifying=p=>p.history.filter(h=>findYourTeamIds.has(h.season)&&(!h.color||h.color==='Not recorded')&&h[rule.field]>0);
    const total=allPlayers.reduce((sum,p)=>sum+qualifying(p).length,0);
    for(const player of allPlayers){
      const matches=qualifying(player);if(!matches.length)continue;
      player.trivia.push(rule.label+' despite having no recorded team in a Find Your Team game '+matches.length+' '+(matches.length===1?'time':'times')+' ('+(matches.length===1?'Season':'Seasons')+' '+matches.map(h=>h.season).join(', ')+'). This has happened '+total+' '+(total===1?'time':'times')+' in recorded game history.');
    }
  }
`);
fs.writeFileSync('profile-engine.cjs',p);
let s=fs.readFileSync('dist/stats.js','utf8');
s=s.replace("const unit=table.id==='wins'?'wins':table.id==='ironmen'?'Ironmen':'kills';","const unit=count=>table.id==='wins'?(count===1?'win':'wins'):table.id==='ironmen'?(count===1?'Ironman':'Ironmen'):(count===1?'kill':'kills');").replace("+unit+'</span>'","+unit(count)+'</span>'");
fs.writeFileSync('dist/stats.js',s);
let html=fs.readFileSync('dist/index.html','utf8');
const old='<button data-stats-mode="season" class="active" aria-pressed="true">Season Tables</button><button data-stats-mode="all-time" aria-pressed="false">All-Time Tables</button>';
if(!html.includes(old))throw Error('Missing stats modes');
html=html.replace(old,'<button data-stats-mode="all-time" aria-pressed="false">All-Time Tables</button><button data-stats-mode="season" class="active" aria-pressed="true">Season Tables</button>');
fs.writeFileSync('dist/index.html',html);
