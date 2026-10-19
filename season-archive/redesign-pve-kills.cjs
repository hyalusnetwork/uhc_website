const fs=require('node:fs');let s=fs.readFileSync('dist/stats.js','utf8');
const fn=`function pveKillBars(table,rows){
 if(!rows.length)return '<p class="stats-note">No records match your search.</p>';
 const palette={Creeper:'#82b977',Lava:'#e5a16a',Skeleton:'#bbc2c9',Falling:'#b6acd4',Zombie:'#799b69',Drowning:'#79b8d2',Enderman:'#a98ac5',Spider:'#be7a78','World Border':'#81b7b0','Wither Skeleton':'#a2a7b1'};
 const ordered=[...rows].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 const max=Math.max(1,...table.rows.map(r=>r[1])),total=table.rows.reduce((n,r)=>n+r[1],0);
 const ranked=ordered.filter(r=>r[1]>1),singles=ordered.filter(r=>r[1]===1);
 const icon=name=>window.UHC_FACES[name]?playerFace(name):'<span class="pve-cause-placeholder" aria-hidden="true">'+escape(name.slice(0,1))+'</span>';
 const bars=ranked.map(([name,count])=>\`<div class="pve-bar-row" style="--cause:\${palette[name]||'#a6b4c5'}" \${chartTip(name+'\\n'+count+' kills · '+(100*count/total).toFixed(1)+'% of all recorded PVE deaths')}><div class="pve-cause">\${icon(name)}<span>\${escape(name)}</span></div><div class="pve-bar-track" aria-hidden="true"><span style="width:\${100*count/max}%"></span></div><strong class="pve-bar-count">\${count}</strong></div>\`).join('');
 return \`<div class="pve-ledger"><div class="pve-ledger-meta"><span>MOBS &amp; CAUSES</span><span>\${total} RECORDED PVE DEATHS</span></div>\${bars?'<div class="pve-bars" role="group" aria-label="PVE kills by cause, highest first">'+bars+'</div>':''}\${singles.length?\`<section class="pve-single-section"><div class="pve-single-heading"><h3>One recorded kill each</h3><span>\${singles.length} causes</span></div><div class="pve-single-grid">\${singles.map(([name])=>\`<div class="pve-single">\${icon(name)}<span>\${escape(name)}</span><b>1</b></div>\`).join('')}</div></section>\`:''}<p class="pve-ledger-caption">\${rows.length===table.rows.length?'All recorded causes':'Matching causes'} · Bar lengths share the same scale; equal totals have equal lengths.</p></div>\`;
}
`;
s=s.replace('function groupedAllTime(table,rows){',fn+"function groupedAllTime(table,rows){\n if(table.id==='pve')return pveKillBars(table,rows);");fs.writeFileSync('dist/stats.js',s);
