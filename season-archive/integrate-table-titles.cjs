const fs=require('fs');
let s=fs.readFileSync('dist/stats.js','utf8');
const title=`function statsTableTitle(table,info,columns){
 const tools=table.id==='pve'?statsViewSwitch('By cause','By season','PVE deaths by season',pveBySeason,'data-pve-toggle'):'';
 const content=\`<div class="stats-integrated-title"><h2>\${escape(table.title)}<span>.</span></h2><div class="stats-title-tools"><span>\${escape(info)}</span>\${tools}</div></div>\`;
 return columns?\`<tr class="stats-title-row"><th colspan="\${columns}">\${content}</th></tr>\`:content;
}
`;
s=title+s;
const a=s.indexOf('function statsTable(){'),b=s.indexOf('const typeColors=',a);
s=s.slice(0,a)+`function statsTable(){
 const {table,rows}=statsTableRows();
 $('stats-content').classList.add('stats-table-surface');
 if(['wins','pve','mob-damage','pvp','ironmen','victims'].includes(table.id)){
  const info=rows.length+' '+(table.id==='victims'?'pairs':'entries');
  let body=groupedAllTime(table,rows);
  if(['ironmen','victims'].includes(table.id)){
   body=body.replace('<div class="stats-grouped">','<div class="stats-grouped">'+statsTableTitle(table,info));
  }else{
   body=body.replace('<div class="pve-ledger">','<div class="pve-ledger">'+statsTableTitle(table,info));
  }
  $('stats-content').innerHTML=body+(table.note?\`<p class="stats-table-note">\${escape(table.note)}</p>\`:'');
  return;
 }
 $('stats-content').innerHTML=seasonStatsTable(table,rows);
}
`+s.slice(b);
// Put season titles inside a spanning header cell, above the column labels.
const start=s.indexOf(' return `<div class="stats-section-heading"',s.indexOf('function seasonStatsTable'));
const frame=s.indexOf('<div class="season-stat-frame">',start);
s=s.slice(0,start)+' return `'+s.slice(frame);
s=s.replace('<thead><tr>${table.columns.map','<thead>${statsTableTitle(table,count+\' of \'+statsData.counts.seasons+\' seasons\'+(rows.length!==count?\' · \'+rows.length+\' entries\':\'\'),table.columns.length-(table.id===\'winners\'?1:0))}<tr>${table.columns.map');
s=s.replace('function statsGraph(){','function statsGraph(){\n $(\'stats-content\').classList.remove(\'stats-table-surface\');');
fs.writeFileSync('dist/stats.js',s);
