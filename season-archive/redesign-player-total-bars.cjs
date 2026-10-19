const fs=require('node:fs');let s=fs.readFileSync('dist/stats.js','utf8');const marker='function groupedAllTime(table,rows){';if(!s.includes(marker))throw Error('Renderer missing');
const fn=`function playerTotalBars(table,rows){
 if(!rows.length)return '<p class="stats-note">No records match your search.</p>';
 const wins=table.id==='wins',unit=wins?'win':'kill',plural=unit+'s';
 const ordered=[...rows].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 const max=Math.max(1,...table.rows.map(r=>r[1])),total=table.rows.reduce((n,r)=>n+r[1],0),ranked=ordered.filter(r=>r[1]>1),singles=ordered.filter(r=>r[1]===1);
 const accent=wins?'#dfbf78':'#9dbbdf';
 const bars=ranked.map(([name,count])=>\`<div class="pve-bar-row player-total-row" style="--cause:\${accent}" \${chartTip(name+'\\n'+count+' '+plural)}><div class="pve-cause player-total-name">\${statPlayer(name)}</div><div class="pve-bar-track" aria-hidden="true"><span style="width:\${100*count/max}%"></span></div><strong class="pve-bar-count">\${count}</strong></div>\`).join('');
 return \`<div class="pve-ledger player-total-ledger"><div class="pve-ledger-meta"><span>PLAYERS · HIGHEST FIRST</span><span>\${total} RECORDED \${wins?'PLAYER WINS':'PVP KILLS'}</span></div>\${bars?'<div class="pve-bars">'+bars+'</div>':''}\${singles.length?\`<section class="pve-single-section"><div class="pve-single-heading"><h3>One recorded \${unit} each</h3><span>\${singles.length} players</span></div><div class="pve-single-grid">\${singles.map(([name])=>\`<div class="pve-single player-total-single">\${statPlayer(name)}<b>1</b></div>\`).join('')}</div></section>\`:''}<p class="pve-ledger-caption">\${rows.length===table.rows.length?'All recorded players':'Matching players'} · Equal totals have equal bar lengths.\${wins?' Wins count every member of the winning team.':''}</p></div>\`;
}
`;
s=s.replace(marker,fn+marker+"\n if(['wins','pvp'].includes(table.id))return playerTotalBars(table,rows);");fs.writeFileSync('dist/stats.js',s);
