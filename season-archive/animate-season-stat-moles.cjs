const fs=require('fs'),p='dist/stats.js';let s=fs.readFileSync(p,'utf8');const at=s.indexOf('function seasonStatsTable(');s=s.slice(0,at)+`function seasonSubjectIsMole(table,row){
 if(table.id==='winners')return row[1]==='Mole';
 const subjects=Array.isArray(row[1])?row[1]:[row[1]],season=seasons.find(s=>s.id===row[0]);
 return subjects.some(name=>season?.players.some(p=>profileIdentity(p.name)===profileIdentity(name)&&p.color==='Mole'));
}
`+s.slice(at);s=s.replace('<tr style="--season-rail:${seasonSubjectRail(table,row)}">','<tr class="${seasonSubjectIsMole(table,row)?\'mole-row\':\'\'}" style="${seasonSubjectIsMole(table,row)?molePaint(row[0]):\'\'}--season-rail:${seasonSubjectRail(table,row)}">');fs.writeFileSync(p,s);
