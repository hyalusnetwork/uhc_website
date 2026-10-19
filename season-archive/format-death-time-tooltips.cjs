const fs=require('node:fs');let s=fs.readFileSync('dist/stats.js','utf8');
const old='stroke-width=".6" ${chartTip(`${duration(bin.start)}';
const replacement='stroke-width=".6" data-death-tip="${escape(JSON.stringify({season:group.season,color:group.color,start:bin.start,end:bin.end,players:group.players}))}" ${chartTip(`${duration(bin.start)}';
if(!s.includes(old))throw Error('Histogram tooltip not found');s=s.replace(old,replacement);fs.writeFileSync('dist/stats.js',s);
let p=fs.readFileSync('dist/players.js','utf8');const marker="  tip.textContent=target.dataset.chartTip.replace(/\\\\n/g,'\\n');tip.hidden=false;";
if(!p.includes(marker))throw Error('Tooltip renderer missing');
p=p.replace(marker,`  tip.classList.toggle('death-time-tooltip',!!target.dataset.deathTip);
  if(target.dataset.deathTip){
    const info=JSON.parse(target.dataset.deathTip),accent=colors[info.color]||'#a3ad9e';
    tip.style.setProperty('--tip-team',accent);
    tip.innerHTML=\`<div class="death-tip-heading"><strong>Season \${info.season}</strong><span>\${escape(teamDisplayName(info.color))}</span></div><div class="death-tip-interval">\${duration(info.start)}–\${duration(info.end)}</div><div class="death-tip-count">\${info.players.length} recorded death\${info.players.length===1?'':'s'}</div><ul class="death-tip-players">\${info.players.map(name=>'<li>'+escape(name)+'</li>').join('')}</ul>\`;
  }else{tip.style.removeProperty('--tip-team');tip.textContent=target.dataset.chartTip.replace(/\\\\n/g,'\\n');}
  tip.hidden=false;`);
fs.writeFileSync('dist/players.js',p);
