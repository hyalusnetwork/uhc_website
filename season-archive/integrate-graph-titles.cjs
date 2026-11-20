const fs=require('fs');
const p='dist/stats.js';let s=fs.readFileSync(p,'utf8');
s=s.replace(" $('stats-content').classList.add('stats-table-surface');"," $('stats-content').classList.remove('stats-graph-surface');\n $('stats-content').classList.add('stats-table-surface');");
const a=s.indexOf('function statsGraph(){'),b=s.indexOf('function statsEntries(',a);
const original=s.slice(a,b);
const switchStart=original.indexOf('<div class="outcome-switch">'),switchEnd=original.indexOf('</div>`',switchStart);
if(switchStart<0||switchEnd<0)throw Error('Original switch not found');
const toggle=original.slice(switchStart,switchEnd+6);
const replacement='function statsGraph(){\n'+
" const target=$('stats-content'),g=statsData.graphs.find(g=>g.id===statsTab);\n"+
" target.classList.remove('stats-table-surface');target.classList.add('stats-graph-surface');\n"+
" const tools=g.id==='death-type'?"+'`'+toggle+'`'+":'';\n"+
' const title=`<div class="stats-integrated-title stats-graph-title"><h2>${escape(g.title)}<span>.</span></h2>${tools}</div>`;\n'+
" const chart=g.id==='day-of-week'?calendarGraph(g):g.id==='death-time'?histogram(g):g.id==='death-type'?stackedDeathGraph(g,outcomeView==='percent'):g.id==='timing'?timingGraph(g):['team-size','game-version'].includes(g.id)?teamSizeGraph(g):timelineGraph(g);\n"+
' target.innerHTML=chart.replace(/^(<div class="outcome-visual[^"]*">)/,(_,opening)=>opening+title);\n}\n';
s=s.slice(0,a)+replacement+s.slice(b);fs.writeFileSync(p,s);
