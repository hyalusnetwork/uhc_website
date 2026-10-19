const fs=require('node:fs');let s=fs.readFileSync('dist/stats.js','utf8');const start=s.indexOf('function timingGraph(g){'),end=s.indexOf('function teamSizeGraph(g)',start);if(start<0||end<0)throw Error('Chart boundaries missing');
const replacement=`function timingGraph(g){
 const metrics=[['length','Last elimination','#4fa5e6'],['firstBlood','First Blood','#e46b86'],['firstDeath','First Death','#e6b94e']];
 const max=Math.ceil(Math.max(1,...g.data.flatMap(r=>metrics.map(([key])=>r[key]||0)))/3600)*3600;
 const left=172,width=876,top=20,bottom=300,x=value=>left+value/max*width;
 const grid=Array.from({length:max/1800+1},(_,i)=>{const value=i*1800;return \`<line class="outcome-gridline" x1="\${x(value)}" x2="\${x(value)}" y1="\${top}" y2="\${bottom}"/><text class="outcome-axis-label" x="\${x(value)}" y="322" text-anchor="middle">\${duration(value).slice(0,-3)}</text>\`}).join('');
 const rows=metrics.map(([key,label,color],row)=>{
  const cy=65+row*95,lanes=[];
  const dots=g.data.filter(r=>r[key]!=null).sort((a,b)=>a[key]-b[key]||a.season-b.season).map(r=>{
   const cx=x(r[key]);let lane=0;while(lanes[lane]!=null&&cx-lanes[lane]<13)lane++;lanes[lane]=cx;
   const offset=lane===0?0:Math.ceil(lane/2)*13*(lane%2?-1:1);
   return \`<circle class="milestone-dot" cx="\${cx}" cy="\${cy+offset}" r="5.5" fill="\${color}" stroke="#191c21" stroke-width="1.5" \${chartTip('Season '+r.season+'\\n'+label+': '+duration(r[key]))}/>\`;
  }).join('');
  return \`<g class="milestone-row"><line x1="\${left}" x2="\${left+width}" y1="\${cy}" y2="\${cy}" stroke="#ffffff12"/><text class="milestone-row-label" x="\${left-18}" y="\${cy+4}" text-anchor="end" fill="\${color}">\${label}</text>\${dots}</g>\`;
 }).join('');
 const legend=metrics.map(([key,label,color])=>{const values=g.data.map(r=>r[key]).filter(v=>v!=null),average=values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):null;return \`<span class="outcome-key-item"><i style="background:\${color}"></i><span>\${label}</span><b>\${average==null?'—':duration(average)} avg.</b></span>\`}).join('');
 return \`<div class="outcome-visual"><div class="outcome-chart-meta"><span>THREE MILESTONES · ONE DOT PER SEASON</span><span>\${g.data.length} SEASONS</span></div><div class="outcome-plot-scroll"><svg class="outcome-plot milestone-plot" viewBox="0 0 1084 354" role="group" aria-label="Match Milestones: three rows of season dots positioned by time into the match">\${grid}\${rows}<text class="outcome-axis-title" x="610" y="351" text-anchor="middle">TIME INTO MATCH · HOURS:MINUTES</text></svg></div><div class="outcome-key">\${legend}</div></div><p class="chart-caption">Each dot represents one season. Nearby times are stacked within their milestone row so every dot remains accessible. Last elimination is the final recorded death, rather than a separately recorded match-end time. Averages include only recorded times.</p>\`;
}
`;
s=s.slice(0,start)+replacement+s.slice(end);fs.writeFileSync('dist/stats.js',s);
