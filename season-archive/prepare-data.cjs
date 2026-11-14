const fs = require('node:fs');
const raw = JSON.parse(fs.readFileSync('../workbook-extracted.json', 'utf8').replace(/^\uFEFF/, ''));
const displayName=value=>typeof value==='string'?value.replace(/\barecue\b/gi,'Happy_Guy555'):value;
const rows = s => raw[s - 1].rows.slice(1).map(r => Object.fromEntries(r.cells.map(c => [c.cell.replace(/\d/g, ''), displayName(c.value)]))).filter(r => r.A);
const namedRows = s => {
  if(!raw[s-1])return [];
  const headings=Object.fromEntries(raw[s-1].rows[0].cells.map(c=>[c.cell.replace(/\d/g,''),c.value]));
  return rows(s).map(row=>Object.fromEntries(Object.entries(row).map(([column,value])=>[headings[column],value])));
};
const teamJoins=namedRows(5).map(r=>({season:Number(r.Season),name:r.Player,color:r['Team Joined'],seconds:r.Time==null?null:Math.round(Number(r.Time)*86400)}));
const first = new Map();
const metricLabels=['Diamond Ore','Gold Ore','Potions Drank','Golden Apples','Enchant. Apples','Ender Pearls'];
const players = namedRows(1).filter(r=>r['Player Name']).map(row => {
  const [A,B,C,D,E,F,G,H,I,J]=['Season','Player Name','Death Type','Death Message','Death Result','Death Time','Team Color','Team Name','First Damage/Ironman','Mole For'].map(key=>row[key]);
  const r={A,B,C,D,E,F,G,H,I,J};
  const metrics=metricLabels.map(key=>row[key]==null||String(row[key]).trim()===''?null:Number(row[key]));
  if(metrics.some(v=>v!==null&&(!Number.isInteger(v)||v<0)))throw Error('Invalid activity counts: '+A+' '+B);
  const season = Number(r.A);
  if (!first.has(r.B)) first.set(r.B, season);
  return {season, metrics, name:r.B, type:r.C, death:r.D, result:r.E, seconds:r.F == null ? null : Math.round(Number(r.F)*86400), color:r.G, team:r.H, achievement:r.I, moleFor:r.J||null, debut:first.get(r.B)===season};
});
const crowns = rows(3);
const seasons = namedRows(2).map(r => {
  const id = Number(r.Season), roster=players.filter(p=>p.season===id);
  const c = crowns.find(c=>Number(c.A.replace('Season ',''))===id);
  const crown = c ? {name:c.C || c.B, method:c.D, previous:c.B, acquired:!!c.C} : null;
  const mode=r.Gamemode,hasRoamers=Number(r['Roamer(s)']||0)>0,joins=new Map();
  for(const event of teamJoins.filter(e=>e.season===id)){
    const player=roster.find(p=>p.name.toLowerCase()===String(event.name).toLowerCase());
    if(!player||player.color!==event.color||event.seconds==null||!Number.isFinite(event.seconds)||event.seconds<0)throw Error(`Invalid team-joining event: S${id} ${event.name}`);
    if(mode!=='Find Your Team'&&!hasRoamers)throw Error(`Team join without Find Your Team or roamer flag: S${id}`);
    if(player.seconds!=null&&event.seconds>player.seconds)throw Error(`Team join after recorded exit: S${id} ${player.name}`);
    player.joinedAt=event.seconds;player.roamer=mode!=='Find Your Team'&&hasRoamers;
    const key=JSON.stringify([event.color,event.seconds]);
    if(!joins.has(key))joins.set(key,{color:event.color,team:player.team||event.color,seconds:event.seconds,names:[],kind:player.roamer?'roamer':'join'});
    if(!joins.get(key).names.includes(player.name))joins.get(key).names.push(player.name);
  }
  const events=[...joins.values()].sort((a,b)=>a.seconds-b.seconds);
  const formed=new Set();for(const event of events){if(mode==='Find Your Team'&&!formed.has(event.color)&&event.names.length>1)event.kind='formed';formed.add(event.color);}
  const version=r.Version;
  return {id,date:new Date(Date.UTC(1899,11,30)+Number(r.Date)*86400000).toISOString().slice(0,10),teamSize:Number(r['Team Size']),mode,hasRoamers,dragon:Number(r['Ender Dragon'])===1,version:id===22&&String(version)==='1.1'?'1.10':version,seconds:Math.max(0,...roster.map(p=>p.seconds||0)),players:roster,crown,teamJoins:events};
});
if(teamJoins.some(e=>!seasons.some(s=>s.id===e.season)))throw Error('Team-joining event references an unknown season');
if(!seasons.length||new Set(seasons.map(s=>s.id)).size!==seasons.length||players.some(p=>!seasons.some(s=>s.id===p.season))) throw Error('Source reconciliation failed: missing or duplicate season metadata');
fs.writeFileSync('dist/data.js', 'window.UHC_DATA = '+JSON.stringify(seasons)+';\n');
console.log(`Imported ${seasons.length} seasons and ${players.length} participant records.`);
console.log(`Imported ${teamJoins.length} player joins in ${seasons.reduce((n,s)=>n+s.teamJoins.length,0)} team events; ${seasons.filter(s=>s.hasRoamers).length} seasons with roamers.`);
if(fs.existsSync('../bios-extracted.json')) require('./prepare-profiles.cjs');
