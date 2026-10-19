const fs=require('node:fs');let e=fs.readFileSync('stats-engine.cjs','utf8');
const marker=' const sizes={};';
e=e.replace(marker,` const weekdayNames=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
 const weekdayData=weekdayNames.map(day=>({day,count:0,seasons:[]}));
 for(const season of seasons){if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(season.date||''))throw Error('Invalid season date for weekday chart: '+season.id);const day=new Date(season.date+'T12:00:00Z').getUTCDay(),row=weekdayData[(day+6)%7];row.count++;row.seasons.push(season.id);}
`+marker);
e=e.replace("{id:'timeline',title:'Timeline',data:timeline}","{id:'day-of-week',title:'Day of Week',data:weekdayData},{id:'timeline',title:'Timeline',data:timeline}");fs.writeFileSync('stats-engine.cjs',e);
let s=fs.readFileSync('dist/stats.js','utf8');s=s.replace("const isVersion=g.id==='game-version',format=r=>isVersion?", "const isDay=g.id==='day-of-week',isVersion=g.id==='game-version',format=r=>isDay?r.day:isVersion?");
s=s.replace('const arcs=g.data.map((r,i)=>{const start=angle;',"const arcs=g.data.map((r,i)=>{if(!r.count)return '';const start=angle;");
s=s.replaceAll("${isVersion?'\\nSeasons: '","${isVersion||isDay?'\\nSeasons: '");
s=s.replace("${isVersion?'GAME VERSION DISTRIBUTION'", "${isDay?'DAY OF WEEK DISTRIBUTION':isVersion?'GAME VERSION DISTRIBUTION'");
s=s.replace("${isVersion?'Game versions'", "${isDay?'Days of the week':isVersion?'Game versions'");
s=s.replace("${isVersion?'Version':'Format'}", "${isDay?'Day':isVersion?'Version':'Format'}");
s=s.replace("${isVersion?'Minecraft versions from UHC_Data.xlsx'", "${isDay?'Days of the week from recorded match dates':isVersion?'Minecraft versions from UHC_Data.xlsx'");
s=s.replace("['team-size','game-version'].includes(g.id)","['team-size','game-version','day-of-week'].includes(g.id)");fs.writeFileSync('dist/stats.js',s);
