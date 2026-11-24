function statsTableTitle(table,info,columns){
 const tools=table.id==='pve'?statsViewSwitch('By cause','By season','PVE deaths by season',pveBySeason,'data-pve-toggle'):'';
 const content=`<div class="stats-integrated-title"><h2>${escape(table.title)}<span>.</span></h2><div class="stats-title-tools">${table.id==='pve'?'':`<span>${escape(info)}</span>`}${tools}</div></div>`;
 return columns?`<tr class="stats-title-row"><th colspan="${columns}">${content}</th></tr>`:content;
}
const statsData=window.UHC_STATS;
let outcomeView='count';
let pveBySeason=false;
let statsMode='graphs',statsTab='death-type',statsSort={column:null,direction:1};
function playerFace(name){const key=profileIdentity(name);const src=window.UHC_FACES[key]||window.UHC_FACES[name]||window.UHC_FACES._default;return `<img src="${src}" class="face" alt="" width="25" height="25">`;}
const statPlayer=name=>`${playerFace(name)}${profileByName(name)?`<a href="${profileHref(profileIdentity(name))}">${escape(name)}</a>`:`<span>${escape(name)}</span>`}`;
const statCell=(value,kind)=>kind==='players'?(value.length?value.map(statPlayer).map(v=>`<span class="stat-person">${v}</span>`).join(' '):'Not recorded'):kind==='player'?`<span class="stat-person">${statPlayer(value)}</span>`:kind==='entity'?`<span class="stat-person">${window.UHC_FACES[value]?playerFace(value):''}${escape(value)}</span>`:kind==='season'?`<a href="#season-${value}">S${value}</a>`:escape(value);
function statsTableRows(){const table=statsData.tables.find(t=>t.id===statsTab);const query=$('stats-search').value.trim().toLowerCase();let rows=table.rows.filter(row=>row.flat().some(v=>String(v).toLowerCase().includes(query)));if(statsSort.column!=null){const c=statsSort.column;rows=[...rows].sort((a,b)=>statsSort.direction*(typeof a[c]==='number'?a[c]-b[c]:String(a[c]).localeCompare(String(b[c]),undefined,{numeric:true})));}return {table,rows};}
function pveIcon(name){
 const key={TNT:'tnt',Warden:'warden'}[name];
 return key?`<img class="face" src="${window.UHC_ICONS[key]}" alt="">`:window.UHC_FACES[name]?playerFace(name):'<span class="pve-cause-placeholder" aria-hidden="true">'+escape(name.slice(0,1))+'</span>';
}
function statsViewSwitch(before,after,label,checked,attribute){
 return `<div class="outcome-switch"><span class="outcome-mode-label ${checked?'':'selected'}">${before}</span><button type="button" class="ore-outcome-toggle" role="switch" aria-label="${label}" aria-checked="${checked}" ${attribute}><span class="ore-toggle-track" aria-hidden="true"><span class="ore-toggle-on"></span><span class="ore-toggle-off"></span></span><span class="ore-toggle-thumb" aria-hidden="true"></span></button><span class="outcome-mode-label ${checked?'selected':''}">${after}</span></div>`;
}
function pveLedgerMeta(table,rows,label){
 return `<div class="pve-ledger-meta"><span>${label}</span><span>${rows.length} ENTRIES · ${table.rows.reduce((n,r)=>n+r[1],0)} RECORDED PVE DEATHS</span></div>`;
}
function pveSeasonBars(table,rows){
 const causes=new Set(rows.map(r=>r[0]));
 const columns=seasons.map(s=>{
  const deaths=s.players.filter(p=>p.type==='PVE'&&causes.has(p.result||'Not recorded')).sort((a,b)=>(a.seconds??Infinity)-(b.seconds??Infinity));
  const icons=deaths.map(p=>`<span class="pve-season-death" ${chartTip(`Season ${s.id} · ${p.result||'Not recorded'}\n${p.name} · ${p.seconds==null?'Time not recorded':duration(p.seconds)}`)}>${pveIcon(p.result||'Not recorded')}</span>`).join('');
  return `<div class="pve-season-column"><div class="pve-season-stack">${icons}<b>${deaths.length}</b></div><a href="#season-${s.id}" aria-label="Season ${s.id}">S${s.id}</a></div>`;
 }).join('');
 return `<div class="pve-ledger">${pveLedgerMeta(table,rows,'PVE DEATHS BY SEASON')}<div class="pve-season-scroll" role="group" aria-label="PVE deaths by season"><div class="pve-season-columns">${columns}</div></div><p class="pve-ledger-caption">One icon per death. Earliest deaths are at the bottom. Hover, focus, or tap an icon for details.</p></div>`;
}
function pveKillBars(table,rows){
 if(!rows.length)return '<p class="stats-note">No records match your search.</p>';
 const palette={Creeper:'#82b977',Lava:'#e5a16a',Skeleton:'#bbc2c9',Falling:'#b6acd4',Zombie:'#799b69',Drowning:'#79b8d2',Enderman:'#a98ac5',Spider:'#be7a78','World Border':'#81b7b0','Wither Skeleton':'#a2a7b1'};
 const ordered=[...rows].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 const max=Math.max(1,...table.rows.map(r=>r[1])),total=table.rows.reduce((n,r)=>n+r[1],0);
 const ranked=ordered.filter(r=>r[1]>1),singles=ordered.filter(r=>r[1]===1);
 const icon=pveIcon;
 const bars=ranked.map(([name,count])=>`<div class="pve-bar-row" style="--cause:${palette[name]||'#a6b4c5'}" ${chartTip(name+'\n'+count+' kills · '+(100*count/total).toFixed(1)+'% of all recorded PVE deaths')}><div class="pve-cause">${icon(name)}<span>${escape(name)}</span></div><div class="pve-bar-track" aria-hidden="true"><span style="width:${100*count/max}%"></span></div><strong class="pve-bar-count">${count}</strong></div>`).join('');
 return `<div class="pve-ledger">${pveLedgerMeta(table,rows,'MOBS &amp; CAUSES')}${bars?'<div class="pve-bars" role="group" aria-label="PVE kills by cause, highest first">'+bars+'</div>':''}${singles.length?`<section class="pve-single-section"><div class="pve-single-heading"><h3>One recorded kill each</h3><span>${singles.length} causes</span></div><div class="pve-single-grid">${singles.map(([name])=>`<div class="pve-single">${icon(name)}<span>${escape(name)}</span></div>`).join('')}</div></section>`:''}<p class="pve-ledger-caption">${rows.length===table.rows.length?'All recorded causes':'Matching causes'} · Bar lengths share the same scale; equal totals have equal lengths.</p></div>`;
}
function mobDamageBars(table,rows){
 if(!rows.length)return '<p class="stats-note">No records match your search.</p>';
 const max=Math.max(...table.rows.map(r=>r[1]));
 const total=table.rows.reduce((sum,r)=>sum+r[1],0);
 const format=value=>value.toFixed(2);
 const bars=rows.map(([cause,hearts])=>`<details><summary class="pve-bar-row" style="--cause:#e5a16a"><div class="pve-cause">${statCell(cause, "entity")}</div><div class="pve-bar-track" aria-hidden="true"><span style="width:${100*hearts/max}%"></span></div><strong class="pve-bar-count">${format(hearts)}</strong></summary><div class="pve-single-grid mob-damage-players">${table.breakdown[cause].map(([name,value])=>`<div class="pve-single">${statPlayer(name)} <strong>${format(value)} hearts</strong></div>`).join("")}</div></details>`).join("");
 return `<div class="pve-ledger mob-damage-ledger"><div class="pve-ledger-meta"><span>MOBS &amp; CAUSES</span><span>${format(total)} HEARTS LOST</span></div><div class="pve-bars">${bars}</div><p class="pve-ledger-caption">Select a source to see how much damage each player took.</p></div>`;
}
function playerTotalBars(table,rows){
 if(!rows.length)return '<p class="stats-note">No records match your search.</p>';
 const wins=table.id==='wins',unit=wins?'win':'kill',plural=unit+'s';
 const ordered=[...rows].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 const max=Math.max(1,...table.rows.map(r=>r[1])),total=table.rows.reduce((n,r)=>n+r[1],0),ranked=ordered.filter(r=>r[1]>1),singles=ordered.filter(r=>r[1]===1);
 const accent=wins?'#dfbf78':'#9dbbdf';
 const groups=new Map();for(const [name,count] of ranked){if(!groups.has(count))groups.set(count,[]);groups.get(count).push(name);}
 const bars=[...groups].map(([count,names])=>`<div class="player-total-tie-row" style="--cause:${accent}"><div class="player-total-tie-meter"><strong>${count}</strong><span>${plural}</span><div class="pve-bar-track" aria-hidden="true"><span style="width:${100*count/max}%"></span></div></div><div class="player-total-tied-people">${names.map(name=>`<span class="player-total-tied-person">${statPlayer(name)}</span>`).join('')}</div></div>`).join('');
 return `<div class="pve-ledger player-total-ledger"><div class="pve-ledger-meta"><span>PLAYERS · HIGHEST FIRST</span><span>${total} RECORDED ${wins?'PLAYER WINS':'PVP KILLS'}</span></div>${bars?'<div class="pve-bars">'+bars+'</div>':''}${singles.length?`<section class="pve-single-section"><div class="pve-single-heading"><h3>One recorded ${unit} each</h3><span>${singles.length} players</span></div><div class="pve-single-grid">${singles.map(([name])=>`<div class="pve-single player-total-single">${statPlayer(name)}</div>`).join('')}</div></section>`:''}<p class="pve-ledger-caption">${rows.length===table.rows.length?'All unique players':'Matching players'} · Equal totals have equal bar lengths.${wins?' Wins count every member of the winning team.':''}</p></div>`;
}
function groupedAllTime(table,rows){
 if(['wins','pvp'].includes(table.id))return playerTotalBars(table,rows);
 if(table.id==='pve')return pveBySeason?pveSeasonBars(table,rows):pveKillBars(table,rows);
 if(table.id==='mob-damage')return mobDamageBars(table,rows);
 const column=table.columns.findIndex(c=>c[1]==='number'),groups=new Map();
 for(const row of rows){const count=row[column];if(!groups.has(count))groups.set(count,[]);groups.get(count).push(row);}
 const unit=count=>table.id==='wins'?(count===1?'win':'wins'):table.id==='ironmen'?(count===1?'Ironman':'Ironmen'):(count===1?'kill':'kills');
 return '<div class="stats-grouped"><div class="stats-group-heading"><span>'+escape(table.columns[column][0])+'</span><span>'+(table.id==='pve'?'Mobs & causes':table.id==='victims'?'Killer → victim':'Players')+'</span></div>'+[...groups].sort((a,b)=>b[0]-a[0]).map(([count,entries])=>'<div class="stats-count-row"><div class="stats-count"><strong>'+count+'</strong><span>'+unit(count)+'</span></div><div class="stats-count-people">'+entries.map(row=>'<span class="stats-count-person">'+row.map((v,i)=>i===column?'':(i===1&&table.id==='victims'?'<span class="stats-pair-arrow" aria-label="killed">→</span>':'')+statCell(v,table.columns[i][1])).join('')+'</span>').join('')+'</div></div>').join('')+(!rows.length?'<p class="stats-note">No records match your search.</p>':'')+'</div>';
}
function seasonStatCell(value,kind,title){
 if(kind==='season')return `<a class="season-stat-link" href="#season-${value}">${String(value).padStart(2,'0')}</a>`;
 if(kind==='players')return value.length?`<div class="season-stat-people">${value.map(name=>`<span class="season-stat-person">${statPlayer(name)}</span>`).join('')}</div>`:'<span class="season-stat-missing">Not recorded</span>';
 if(kind==='player')return `<span class="season-stat-person">${statPlayer(value)}</span>`;
 if(kind==='number')return `<strong class="season-stat-number">${value}</strong>`;
 if(/time/i.test(title))return `<span class="season-stat-time">${escape(teamDisplayName(value))}</span>`;
 if(title==='Team Name')return escape(teamDisplayName(value));
 if(title==='Team Color')return `<span class="season-stat-color"><i style="background:${colors[value]||'#949ba5'}"></i>${escape(value)}</span>`;
 if(title==='Death Message')return `<span class="season-stat-message">${escape(value)}</span>`;
 return escape(value);
}
function seasonSubjectPalette(table,row){
 let teamColors=[];
 if(table.id==='winners')teamColors=[row[1]];
 else{
  const subjects=Array.isArray(row[1])?row[1]:[row[1]],season=seasons.find(s=>s.id===row[0]);
  teamColors=subjects.map(name=>season?.players.find(p=>profileIdentity(p.name)===profileIdentity(name))?.color).filter(Boolean);
 }
 return [...new Set(teamColors.map(color=>colors[color]).filter(Boolean))];
}
function seasonSubjectRail(table,row){
 const palette=seasonSubjectPalette(table,row);
 if(!palette.length)return 'transparent';
 return `linear-gradient(to bottom,${palette.map((color,i)=>`${color} ${100*i/palette.length}% ${100*(i+1)/palette.length}%`).join(',')})`;
}
function seasonSubjectBackground(table,row){
 const palette=seasonSubjectPalette(table,row);
 if(!palette.length)return 'var(--panel)';
 return 'linear-gradient(to bottom,'+palette.map((color,i)=>'color-mix(in srgb,'+color+' var(--season-tint),var(--panel)) '+100*i/palette.length+'% '+100*(i+1)/palette.length+'%').join(',')+')';
}
function seasonSubjectIsMole(table,row){
 if(table.id==='winners')return row[1]==='Mole';
 const subjects=Array.isArray(row[1])?row[1]:[row[1]],season=seasons.find(s=>s.id===row[0]);
 return subjects.some(name=>season?.players.some(p=>profileIdentity(p.name)===profileIdentity(name)&&p.color==='Mole'));
}
function seasonMoleTint(seasonId){
 const palette=molePalette(seasonId);
 return '--mole-tint-paint:linear-gradient(to bottom,'+palette.map((color,i)=>'color-mix(in srgb,'+color+' var(--season-tint),var(--panel)) '+i*16+'px '+(i+1)*16+'px').join(',')+');';
}
function seasonStatsTable(table,rows){
 const count=new Set(rows.map(r=>r[0])).size;
 return `<div class="season-stat-frame"><div class="table-wrap season-stat-scroll" tabindex="0" role="region" aria-label="${escape(table.title)} table"><table class="stats-table season-stat-table ${table.id==='winners'?'season-winners-table':table.id==='top-killer'?'season-top-killer-table':''}"><caption>${escape(table.title)}</caption><thead>${statsTableTitle(table,count+' of '+statsData.counts.seasons+' seasons'+(rows.length!==count?' · '+rows.length+' entries':''),table.columns.length-(table.id==='winners'?1:0))}<tr>${table.columns.map(([title],i)=>table.id==='winners'&&i===1?'':`<th scope="col" aria-sort="${statsSort.column===i?(statsSort.direction===1?'ascending':'descending'):'none'}"><button data-sort-column="${i}">${escape(title)} <span aria-hidden="true">${statsSort.column===i?(statsSort.direction===1?'↑':'↓'):'↕'}</span></button></th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr class="${seasonSubjectIsMole(table,row)?'mole-row':''}" style="${seasonSubjectIsMole(table,row)?molePaint(row[0])+seasonMoleTint(row[0]):''}--season-team-background:${seasonSubjectBackground(table,row)};--season-rail:${seasonSubjectRail(table,row)}">${row.map((v,i)=>table.id==='winners'&&i===1?'':`<td${table.columns[i][1]==='number'?' class="season-stat-numeric"':''}>${table.id==='winners'&&table.columns[i][0]==='Team Name'&&seasons.find(s=>s.id===row[0])?.teamSize===1?'':seasonStatCell(v,table.columns[i][1],table.columns[i][0])}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${table.columns.length-(table.id==='winners'?1:0)}" class="season-stat-empty">No records match your search.</td></tr>`}</tbody></table></div><div class="season-stat-footer"><span>Click a season or player to explore their records.</span><span>All recorded ties included</span></div></div>`;
}
function statsTable(){
 const {table,rows}=statsTableRows();
 $('stats-content').classList.remove('stats-graph-surface');
 $('stats-content').classList.add('stats-table-surface');
 if(['wins','pve','mob-damage','pvp','ironmen','victims'].includes(table.id)){
  const info=rows.length+' '+(table.id==='victims'?'pairs':'entries');
  let body=groupedAllTime(table,rows);
  if(['ironmen','victims'].includes(table.id)){
   const column=table.columns.findIndex(c=>c[1]==='number'),groups=new Map();
   for(const row of rows){const count=row[column];if(!groups.has(count))groups.set(count,[]);groups.get(count).push(row);}
   body=`<table class="stats-grouped stats-grouped-table stats-${table.id}-table"><colgroup><col class="stats-total-column"><col></colgroup><thead>${statsTableTitle(table,info,2)}<tr><th scope="col">${escape(table.columns[column][0])}</th><th scope="col">${table.id==='victims'?'Killer → victim':'Players'}</th></tr></thead><tbody>${[...groups].sort((a,b)=>b[0]-a[0]).map(([count,entries])=>`<tr><td class="stats-count"><strong>${count}</strong><span>${table.id==='ironmen'?(count===1?'Ironman':'Ironmen'):(count===1?'kill':'kills')}</span></td><td><div class="stats-count-people">${entries.map(row=>`<span class="stats-count-person">${row.map((v,i)=>i===column?'':(i===1&&table.id==='victims'?'<span class="stats-pair-arrow" aria-label="killed">→</span>':'')+statCell(v,table.columns[i][1])).join('')}</span>`).join('')}</div></td></tr>`).join('')||'<tr><td colspan="2" class="stats-table-note">No records match your search.</td></tr>'}</tbody></table>`;
  }else{
   body=body.replace(/^(<div class="[^"]*\bpve-ledger\b[^"]*">)/,(_,opening)=>opening+statsTableTitle(table,info));
   if(!body.includes('stats-integrated-title'))body=statsTableTitle(table,info)+body;
  }
  $('stats-content').innerHTML=body+(table.note?`<p class="stats-table-note">${escape(table.note)}</p>`:'');
  return;
 }
 $('stats-content').innerHTML=seasonStatsTable(table,rows);
}
const typeColors={'Lived':'#7fa8dd','PVP':'#dc7974','PVE':'#e6c56f','Team Kill':'#9abf75','Disconnect':'#e8a26a','Disqualification':'#a75b69'};
const gradeColors={S:'#dc7974',A:'#e8a26a',B:'#e6c56f',C:'#9abf75',D:'#7fa8dd'};
const chartTip=text=>`data-chart-tip="${escape(text)}" tabindex="0" aria-label="${escape(text.replace(/\n/g,', '))}"`;
const chartFrame=(body,max,labels,{time=false,percent=false}={})=>{const top=25,height=300,left=50,right=20,width=930;return `<svg viewBox="0 0 1000 370" class="profile-chart stats-chart" role="group" aria-label="${escape(statsData.graphs.find(g=>g.id===statsTab)?.title||'Statistics chart')}">${[0,.25,.5,.75,1].map(f=>`<line x1="${left}" x2="980" y1="${top+height*(1-f)}" y2="${top+height*(1-f)}"/><text x="43" y="${top+height*(1-f)+4}" text-anchor="end">${time?duration(Math.round(max*f)).slice(0,-3):percent?Math.round(f*100)+'%':Number((max*f).toFixed(1))}</text>`).join('')}${body}${labels.map((l,i)=>`<text x="${left+(i+.5)*width/labels.length}" y="348" text-anchor="middle">${escape(l)}</text>`).join('')}</svg>`};
const statsLegend=items=>`<div class="stats-legend">${items.map(([label,color])=>`<span><i style="background:${color}"></i>${escape(label)}</span>`).join('')}</div>`;
function stackedDeathGraph(g,percent){
 const palette={'Lived':'#4cc49e','PVP':'#e46b86','PVE':'#e6b94e','Team Kill':'#b47bea','Disconnect':'#4fa5e6','Disqualification':'#ca966b'};
 const labels={'Lived':'Survived','PVP':'PVP','PVE':'PVE','Team Kill':'Team Kills','Disconnect':'Disconnects','Disqualification':'Disqualifications'};
 const totals=g.data.map(r=>g.types.reduce((n,t)=>n+r.counts[t],0)),max=percent?1:Math.ceil(Math.max(1,...totals)/5)*5;
 const left=52,top=28,height=280,width=1008,step=width/g.data.length,baseline=top+height;
 let bars='';
 g.data.forEach((row,i)=>{const total=totals[i],x=Math.round(left+i*step+5),barWidth=Math.max(8,Math.floor(step-10));let base=0;
  const segments=g.types.map(type=>{const count=row.counts[type];if(!count)return '';const value=percent?count/total:count,y=baseline-(base+value)/max*height,h=value/max*height;base+=value;
   return `<rect class="outcome-segment" x="${x}" y="${y}" width="${barWidth}" height="${h}" fill="${palette[type]}" stroke="#191c21" stroke-width="1" ${chartTip(`Season ${row.season}\n${labels[type]}: ${count} (${(100*count/total).toFixed(1)}% of participants)\n${total} participants total`)}/>`;
  }).join('');
  bars+=`<g class="outcome-season"><rect class="outcome-lane" x="${left+i*step}" y="${top}" width="${step}" height="${height}"/>${segments}<text class="outcome-season-label" x="${x+barWidth/2}" y="${baseline+24}" text-anchor="middle">${row.season}</text></g>`;
 });
 const ticks=percent?[0,.25,.5,.75,1]:Array.from({length:max/5+1},(_,i)=>i*5/max);
 const grid=ticks.map(f=>{const value=max*f;return `<line class="outcome-gridline" x1="${left}" x2="${left+width}" y1="${baseline-height*f}" y2="${baseline-height*f}"/><text class="outcome-axis-label" x="${left-12}" y="${baseline-height*f+4}" text-anchor="end">${percent?Math.round(value*100)+'%':Number(value.toFixed(1))}</text>`}).join('');
 const legend=g.types.map(type=>{const count=g.data.reduce((n,r)=>n+r.counts[type],0);return `<span class="outcome-key-item"><i style="background:${palette[type]}"></i><span>${labels[type]}</span><b>${count}</b></span>`}).join('');
 return `<div class="outcome-visual"><div class="outcome-chart-meta"><span>${percent?'SHARE OF PARTICIPANTS':'PARTICIPANTS'}</span><span>${g.data.length} SEASONS · ${totals.reduce((a,b)=>a+b,0)} PARTICIPATIONS</span></div><div class="outcome-plot-scroll"><svg class="outcome-plot" viewBox="0 0 1084 354" role="group" aria-label="Season outcomes by ${percent?'percentage':'count'}">${grid}${bars}<text class="outcome-axis-title" x="556" y="351" text-anchor="middle">SEASON</text></svg></div><div class="outcome-key">${legend}</div></div>`;
}
function histogram(g){
 const counts=g.bins.map(b=>b.groups.reduce((n,x)=>n+x.players.length,0)),max=Math.max(1,...counts);
 const left=52,top=28,height=280,width=1008,step=width/g.bins.length,baseline=top+height;
 let bars='';
 g.bins.forEach((bin,i)=>{let base=0;const x=left+i*step+1.5;
  bars+=bin.groups.map(group=>{const count=group.players.length,y=baseline-(base+count)/max*height;base+=count;
   return `<rect class="outcome-segment" x="${x}" y="${y}" width="${Math.max(1,step-3)}" height="${count/max*height}" fill="${colors[group.color]||'#a3ad9e'}" stroke="#191c21" stroke-width=".6" data-death-tip="${escape(JSON.stringify({season:group.season,color:group.color,start:bin.start,end:bin.end,players:group.players}))}" ${chartTip(`${duration(bin.start)}–${duration(bin.end)}\nSeason ${group.season} · ${group.color}\n${count} deaths: ${group.players.join(', ')}`)}/>`;
  }).join('');
  if(i%6===0)bars+=`<text class="outcome-axis-label" x="${x+step/2}" y="${baseline+24}" text-anchor="middle">${duration(bin.start).slice(0,-3)}</text>`;
 });
 const ticks=[0,...Array.from({length:Math.floor(max/5)},(_,i)=>(i+1)*5).filter(v=>v<max-2.5),max];
 const grid=ticks.map(value=>{const y=baseline-value/max*height;return `<line class="outcome-gridline" x1="${left}" x2="${left+width}" y1="${y}" y2="${y}"/><text class="outcome-axis-label" x="${left-12}" y="${y+4}" text-anchor="end">${value}</text>`}).join('');
 const total=counts.reduce((a,b)=>a+b,0),peak=Math.max(...counts),peakBin=g.bins[counts.indexOf(peak)];
 return `<div class="outcome-visual"><div class="outcome-chart-meta"><span>RECORDED DEATHS</span><span>${statsData.counts.seasons} SEASONS · 5-MINUTE INTERVALS</span></div><div class="outcome-plot-scroll"><svg class="outcome-plot death-time-plot" viewBox="0 0 1084 354" role="group" aria-label="Death Time: recorded deaths in five-minute intervals">${grid}${bars}<text class="outcome-axis-title" x="556" y="351" text-anchor="middle">TIME INTO MATCH · HOURS:MINUTES</text></svg></div><div class="outcome-key"><span class="outcome-key-item"><span>Timed deaths</span><b>${total}</b></span><span class="outcome-key-item"><span>Busiest interval</span><b>${duration(peakBin.start).slice(0,-3)}–${duration(peakBin.end).slice(0,-3)}</b></span><span class="outcome-key-item"><span>Deaths in peak interval</span><b>${peak}</b></span></div></div>`;
}
function timingGraph(g){
 const metrics=[['length','Last elimination','#4fa5e6'],['firstBlood','First Blood','#e46b86'],['firstDeath','First Death','#e6b94e']];
 const max=Math.ceil(Math.max(1,...g.data.flatMap(r=>metrics.map(([key])=>r[key]||0)))/3600)*3600;
 const left=172,width=876,top=20,bottom=300,x=value=>left+value/max*width;
 const grid=Array.from({length:max/1800+1},(_,i)=>{const value=i*1800;return `<line class="outcome-gridline" x1="${x(value)}" x2="${x(value)}" y1="${top}" y2="${bottom}"/><text class="outcome-axis-label" x="${x(value)}" y="322" text-anchor="middle">${duration(value).slice(0,-3)}</text>`}).join('');
 const rows=metrics.map(([key,label,color],row)=>{
  const cy=65+row*95,lanes=[];
  const dots=g.data.filter(r=>r[key]!=null).sort((a,b)=>a[key]-b[key]||a.season-b.season).map(r=>{
   const cx=x(r[key]);let lane=0;while(lanes[lane]!=null&&cx-lanes[lane]<13)lane++;lanes[lane]=cx;
   const offset=lane===0?0:Math.ceil(lane/2)*13*(lane%2?-1:1);
   return `<circle class="milestone-dot" cx="${cx}" cy="${cy+offset}" r="5.5" fill="${color}" stroke="#191c21" stroke-width="1.5" ${chartTip('Season '+r.season+'\n'+label+': '+duration(r[key]))}/>`;
  }).join('');
  return `<g class="milestone-row"><line x1="${left}" x2="${left+width}" y1="${cy}" y2="${cy}" stroke="#ffffff12"/><text class="milestone-row-label" x="${left-18}" y="${cy+4}" text-anchor="end" fill="${color}">${label}</text>${dots}</g>`;
 }).join('');
 const legend=metrics.map(([key,label,color])=>{const values=g.data.map(r=>r[key]).filter(v=>v!=null),average=values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):null;return `<span class="outcome-key-item"><i style="background:${color}"></i><span>${label}</span><b>${average==null?'—':duration(average)} avg.</b></span>`}).join('');
 return `<div class="outcome-visual"><div class="outcome-chart-meta"><span>THREE MILESTONES · ONE DOT PER SEASON</span><span>${g.data.length} SEASONS</span></div><div class="outcome-plot-scroll"><svg class="outcome-plot milestone-plot" viewBox="0 0 1084 354" role="group" aria-label="Match Milestones: three rows of season dots positioned by time into the match">${grid}${rows}<text class="outcome-axis-title" x="610" y="351" text-anchor="middle">TIME INTO MATCH · HOURS:MINUTES</text></svg></div><div class="outcome-key">${legend}</div></div>`;
}
function teamSizeGraph(g){
 const isDay=g.id==='day-of-week',isVersion=g.id==='game-version',format=r=>isDay?r.day:isVersion?(r.version==='Not recorded'?r.version:'v'+r.version):(r.size===1?'Solo':`Teams of ${r.size}`);
 const total=g.data.reduce((n,x)=>n+x.count,0),palette=['#dc7974','#e8a26a','#e6c56f','#9abf75','#76a5af','#7fa8dd','#b4a7d6'];
 if(isVersion)palette.push('#d292b8','#80bda8','#b3b886');
 let angle=-Math.PI/2;
 const arcs=g.data.map((r,i)=>{if(!r.count)return '';const start=angle;angle+=r.count/total*Math.PI*2;const end=angle,c=palette[i%palette.length],x=(a,radius)=>180+radius*Math.cos(a),y=(a,radius)=>180+radius*Math.sin(a),large=end-start>Math.PI?1:0;
  return `<path class="team-size-arc" data-distribution-category="${i}" role="button" aria-pressed="false" d="M${x(start,142)} ${y(start,142)} A142 142 0 ${large} 1 ${x(end,142)} ${y(end,142)} L${x(end,100)} ${y(end,100)} A100 100 0 ${large} 0 ${x(start,100)} ${y(start,100)} Z" fill="${c}" stroke="#191c21" stroke-width="3" ${chartTip(`${escape(format(r))}\n${r.count} seasons · ${(r.count/total*100).toFixed(1)}%${isVersion||isDay?'\nSeasons: '+r.seasons.map(s=>'S'+s).join(', '):''}`)}/>`;
 }).join('');
 return `<div class="outcome-visual distribution-visual"><div class="team-size-layout"><svg class="team-size-donut" viewBox="0 0 360 360" role="group" aria-label="${isDay?'Days of the week':isVersion?'Game versions':'Configured team sizes'} across ${total} seasons">${arcs}<text class="team-size-total" x="180" y="180" text-anchor="middle">${total}</text><text class="team-size-center-label" x="180" y="204" text-anchor="middle">SEASONS</text></svg><div class="distribution-season-panel"><div class="distribution-legend" aria-label="Category colors">${g.data.map((r,i)=>`<span style="--key-color:${palette[i%palette.length]}"><i></i>${escape(format(r))}</span>`).join('')}</div><div class="distribution-season-grid" aria-label="Seasons in numerical order">${g.data.flatMap((r,i)=>(r.seasons||seasons.filter(s=>s.teamSize===r.size).map(s=>s.id)).map(id=>({id,category:i,label:format(r),color:palette[i%palette.length]}))).sort((a,b)=>a.id-b.id).map(({id,category,label,color})=>`<a class="distribution-season-button" data-distribution-category="${category}" href="#season-${id}" style="--season-button-color:${color}" ${chartTip(`Season ${id} · ${label}`)}>${String(id).padStart(2,'0')}</a>`).join('')}</div></div></div></div>`;
}
function calendarGraph(g){
 const total=g.data.reduce((n,r)=>n+r.count,0),max=Math.max(1,...g.data.map(r=>r.count),...g.months.map(r=>r.count));
 const palette=['#dc7974','#e8a26a','#e6c56f','#9abf75','#76a5af','#7fa8dd','#b4a7d6','#d292b8','#80bda8','#b3b886','#bb9c80','#90a8bb'];
 const strip=(rows,key,title,meta)=>`<section class="calendar-strip"><div class="calendar-strip-heading"><h3>${title}</h3><span>${meta}</span></div><div class="calendar-columns" style="--columns:${rows.length};--calendar-max:${max}" role="group" aria-label="Seasons by ${key==='day'?'day of the week':'month of the year'}">${rows.map((r,i)=>{const share=(total?100*r.count/total:0).toFixed(1);return `<div class="calendar-column ${key==='month'?'calendar-month':'calendar-day'}" style="--calendar-color:${palette[i]};--calendar-count:${r.count}" ${chartTip(r[key]+'\n'+r.count+' seasons · '+share+'%'+(r.seasons.length?'\nSeasons: '+r.seasons.map(s=>'S'+s).join(', '):''))}><div class="calendar-column-plot"><b>${r.count}</b><div class="calendar-column-bar" aria-hidden="true">${r.seasons.map(()=>'<i></i>').join('')}</div></div><span class="calendar-column-label">${r[key].slice(0,3)}</span></div>`;}).join('')}</div></section>`;
 return `<div class="outcome-visual calendar-landscape">${strip(g.data,'day','Days of the week','DAY OF WEEK DISTRIBUTION')}${strip(g.months,'month','Months of the year','MONTH OF YEAR DISTRIBUTION')}</div>`;
}

function timelineGraph(g){
 const entries=g.data.filter(r=>r.date),years=new Map();
 entries.forEach(r=>{const year=r.date.slice(0,4);if(!years.has(year))years.set(year,[]);years.get(year).push(r)});
 const intervals=entries.filter(r=>r.days!=null),longest=intervals.reduce((a,b)=>!a||b.days>a.days?b:a,null);
 const sorted=intervals.map(r=>r.days).sort((a,b)=>a-b),mid=Math.floor(sorted.length/2),median=sorted.length?(sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2):0;
 const dateLabel=date=>new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
 const fullDate=date=>new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
 const gapLabel=days=>days===0?'Same day':days===1?'1 day later':days+' days later';
 const groups=[...years].map(([year,rows])=>`<section class="cadence-year"><div class="cadence-year-heading"><h3>${escape(year)}</h3><span>${rows.length} ${rows.length===1?'season':'seasons'}</span></div><div class="cadence-events">${rows.map(r=>`<a class="cadence-event ${r.days>=180?'cadence-hiatus':''}" href="#season-${r.season}" aria-label="Season ${r.season}, ${escape(fullDate(r.date))}${r.days==null?'':', '+r.days+' days since the previous season'}"><div class="cadence-event-top"><strong>S${String(r.season).padStart(2,'0')}</strong><time datetime="${escape(r.date)}">${escape(dateLabel(r.date))}</time><span aria-hidden="true">↗</span></div><div class="cadence-gap">${r.days==null?'The first recorded season':r.days>=180?`<i aria-hidden="true"></i>After ${r.days.toLocaleString()} days away`:gapLabel(r.days)}</div></a>`).join('')}</div></section>`).join('');
 return `<div class="outcome-visual cadence"><div class="outcome-chart-meta"><span>THE MATCH CALENDAR</span><span>${entries.length} SEASONS · ${years.size} ACTIVE YEARS</span></div><div class="cadence-summary"><div><span>HYALUS UHC</span><strong>${entries[0]?.date.slice(0,4)||'—'}<small> — </small>${entries.at(-1)?.date.slice(0,4)||'—'}</strong></div><div><span>TYPICAL GAP · MEDIAN</span><strong>${median}<small> days</small></strong></div><div><span>LONGEST HIATUS</span><strong>${longest?longest.days.toLocaleString():'—'}<small> days</small></strong>${longest?`<a href="#season-${longest.season}">S${entries[entries.indexOf(longest)-1].season} → S${longest.season}</a>`:''}</div></div><div class="cadence-years">${groups}</div></div>`;
}
function statsGraph(){
 const target=$('stats-content'),g=statsData.graphs.find(g=>g.id===statsTab);
 target.classList.remove('stats-table-surface');target.classList.add('stats-graph-surface');
 const tools=g.id==='death-type'?`<div class="outcome-switch"><span class="outcome-mode-label ${outcomeView==='count'?'selected':''}">Count</span><button type="button" class="ore-outcome-toggle" role="switch" aria-label="Percentage view" aria-checked="${outcomeView==='percent'}" data-outcome-toggle><span class="ore-toggle-track" aria-hidden="true"><span class="ore-toggle-on"></span><span class="ore-toggle-off"></span></span><span class="ore-toggle-thumb" aria-hidden="true"></span></button><span class="outcome-mode-label ${outcomeView==='percent'?'selected':''}">Percentage</span></div>`:'';
 const title=`<div class="stats-integrated-title stats-graph-title"><h2>${escape(g.title)}<span>.</span></h2>${tools}</div>`;
 const chart=g.id==='day-of-week'?calendarGraph(g):g.id==='death-time'?histogram(g):g.id==='death-type'?stackedDeathGraph(g,outcomeView==='percent'):g.id==='timing'?timingGraph(g):['team-size','game-version'].includes(g.id)?teamSizeGraph(g):timelineGraph(g);
 target.innerHTML=chart.replace(/^(<div class="outcome-visual[^"]*">)/,(_,opening)=>opening+title);

}
function statsEntries(mode){
 const allTimeIds=['wins','pve','mob-damage','pvp','victims','ironmen'];
 return mode==='graphs'?statsData.graphs:statsData.tables.filter(t=>mode==='all-time'?allTimeIds.includes(t.id):!allTimeIds.includes(t.id));
}
function renderStats(){
 const entries=statsEntries(statsMode);
 if(!entries.some(t=>t.id===statsTab))statsTab=entries[0].id;
 document.querySelector('#stats-view .stats-mode').innerHTML=[['graphs','Graphs'],['all-time','All-Time Tables'],['season','Season Tables']].map(([mode,label])=>`<details class="stats-dropdown ${statsMode===mode?'active':''}"><summary>${label}<span aria-hidden="true">▾</span></summary><div class="stats-dropdown-menu">${statsEntries(mode).map(t=>`<button type="button" data-stats-choice="${t.id}" data-choice-mode="${mode}" aria-pressed="${statsMode===mode&&statsTab===t.id}">${escape(t.title)}</button>`).join('')}</div></details>`).join('');
 $('stats-table-controls').hidden=statsMode==='graphs';
 requestAnimationFrame(updateStatsHeaderBlur);
 statsMode==='graphs'?statsGraph():statsTable();
}
function updateDistributionHighlight(chart,category){
 chart.querySelectorAll('.distribution-season-button').forEach(tile=>tile.classList.toggle('distribution-muted',category!=null&&tile.dataset.distributionCategory!==category));
 chart.querySelectorAll('.team-size-arc').forEach(arc=>arc.setAttribute('aria-pressed',String(arc.dataset.distributionCategory===chart.dataset.selectedCategory)));
 const svg=chart.querySelector('.team-size-donut');
 let outline=svg.querySelector('.distribution-segment-outline');
 const active=Array.from(svg.querySelectorAll('.team-size-arc')).find(arc=>arc.dataset.distributionCategory===category);
 if(!active){outline?.remove();return;}
 if(!outline){outline=document.createElementNS('http://www.w3.org/2000/svg','path');outline.setAttribute('class','distribution-segment-outline');outline.setAttribute('aria-hidden','true');svg.appendChild(outline);}
 outline.setAttribute('d',active.getAttribute('d'));
}
function initializeDistributionInteractions(){
 const segment=target=>target?.closest?.('.distribution-visual .team-size-arc');
 const preview=event=>{const arc=segment(event.target);if(arc)updateDistributionHighlight(arc.closest('.distribution-visual'),arc.dataset.distributionCategory);};
 const restore=event=>{const arc=segment(event.target);if(!arc||segment(event.relatedTarget)===arc)return;const chart=arc.closest('.distribution-visual');updateDistributionHighlight(chart,chart.dataset.selectedCategory);};
 document.addEventListener('pointerover',preview);
 document.addEventListener('pointerout',restore);
 document.addEventListener('focusin',preview);
 document.addEventListener('focusout',restore);
 const select=arc=>{const chart=arc.closest('.distribution-visual'),category=arc.dataset.distributionCategory;if(chart.dataset.selectedCategory===category)delete chart.dataset.selectedCategory;else chart.dataset.selectedCategory=category;updateDistributionHighlight(chart,chart.dataset.selectedCategory);};
 document.addEventListener('click',event=>{const arc=segment(event.target);if(arc)select(arc);});
 document.addEventListener('keydown',event=>{const arc=segment(event.target);if(!arc)return;if(event.key==='Enter'||event.key===' '){event.preventDefault();select(arc);}else if(event.key==='Escape'){const chart=arc.closest('.distribution-visual');delete chart.dataset.selectedCategory;updateDistributionHighlight(chart);}});
}

function updateStatsHeaderBlur(){
 const header=document.querySelector('#stats-view .stats-header');
 if(!header||!header.getClientRects().length)return;
 const origin=header.getBoundingClientRect(),heading=header.querySelector('.stats-heading').getBoundingClientRect();
 const controls=Array.from(header.querySelectorAll('.stats-dropdown summary,.stats-table-controls .search')).filter(el=>el.getClientRects().length).map(el=>el.getBoundingClientRect());
 if(!controls.length)return;
 const pad=22,offset=64;
 const x=value=>Math.round(value-origin.left+offset),y=value=>Math.round(value-origin.top+offset);
 const left=x(heading.left-pad),top=y(heading.top-pad),step=x(heading.right+pad);
 const right=x(Math.max(heading.right,...controls.map(r=>r.right))+pad);
 const bottom=y(Math.max(heading.bottom,...controls.map(r=>r.bottom))+pad);
 const controlTop=y(Math.min(...controls.map(r=>r.top))-pad);
 const sideBySide=Math.min(...controls.map(r=>r.left))>=heading.right;
 const points=sideBySide?`${left},${top} ${step},${top} ${step},${controlTop} ${right},${controlTop} ${right},${bottom} ${left},${bottom}`:`${left},${top} ${right},${top} ${right},${bottom} ${left},${bottom}`;
 const width=Math.ceil(origin.width+offset*2),height=Math.ceil(origin.height+offset*2);
 // Fade the blur's opacity itself, like the hero's masked scenery layer.
 // The extra inset gives the feather room to disappear before the layer ends.
 const mask=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><filter id="fade" filterUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}"><feGaussianBlur stdDeviation="18"/></filter></defs><polygon points="${points}" fill="white" filter="url(#fade)"/></svg>`;
 header.style.setProperty('--stats-blur-mask',`url("data:image/svg+xml,${encodeURIComponent(mask)}")`);
}
function initializeStats(){
 const header=document.querySelector('#stats-view .stats-header');
 if(header&&typeof ResizeObserver==='function'){
  const observer=new ResizeObserver(updateStatsHeaderBlur);
  observer.observe(header);observer.observe(header.querySelector('.stats-heading'));observer.observe(header.querySelector('.stats-header-controls'));
 }
 window.addEventListener('resize',updateStatsHeaderBlur);
 initializeDistributionInteractions();
 document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.stats-dropdown[open]').forEach(d=>{d.open=false;d.querySelector('summary').focus();});});
 document.addEventListener('click',event=>{
  document.querySelectorAll('.stats-dropdown[open]').forEach(d=>{if(!d.contains(event.target))d.open=false;});
  const choice=event.target.closest('[data-stats-choice]');
  if(choice){statsMode=choice.dataset.choiceMode;statsTab=choice.dataset.statsChoice;statsSort.column=null;renderStats();if(event.detail===0)document.querySelector('.stats-dropdown.active summary').focus();}
 });
 $('stats-search').addEventListener('input',statsTable);
 document.addEventListener('click',event=>{if(event.target.closest('[data-pve-toggle]')){pveBySeason=!pveBySeason;statsTable();if(event.detail===0)$('stats-content').querySelector('[data-pve-toggle]').focus();return;}const outcome=event.target.closest('[data-outcome-toggle]');if(outcome){outcomeView=outcomeView==='count'?'percent':'count';statsGraph();if(event.detail===0)$('stats-content').querySelector('[data-outcome-toggle]').focus();return;}const mode=event.target.closest('[data-stats-mode]'),tab=event.target.closest('[data-stats-tab]'),sort=event.target.closest('[data-sort-column]');if(mode){statsMode=mode.dataset.statsMode;statsTab='';statsSort.column=null;renderStats();}if(tab){statsTab=tab.dataset.statsTab;statsSort.column=null;renderStats();}if(sort){const c=Number(sort.dataset.sortColumn);statsSort={column:c,direction:statsSort.column===c?-statsSort.direction:1};statsTable();}});
}

