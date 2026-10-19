function buildStats(seasons,data){
 const names=n=>data.identities[String(n).toLowerCase()]||n;
 const time=seconds=>seconds==null?'N/A':`${Math.floor(seconds/3600)}:${String(Math.floor(seconds%3600/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
 const tables=[];const add=(id,title,columns,rows,note='')=>tables.push({id,title,columns,rows,note});
 const seasonRows=fn=>seasons.flatMap(s=>fn(s));
 const deaths=s=>s.players.filter(p=>['PVP','PVE','Team Kill'].includes(p.type)&&p.death&&p.seconds!=null);
 const edge=(s,pvp,last=false)=>{const ds=deaths(s).filter(p=>!pvp||p.type==='PVP');if(!ds.length)return [];const n=(last?Math.max:Math.min)(...ds.map(p=>p.seconds));return ds.filter(p=>p.seconds===n)};
 const players=data.allPlayers;
 add('winners','Season Winners',[['Season','season'],['Team Color'],['Team Name'],['Players','players']],seasonRows(s=>{const winners=players.filter(p=>p.history.some(h=>h.season===s.id&&h.win));const groups=new Map();for(const p of winners){const h=p.history.find(h=>h.season===s.id),key=s.teamSize===1?p.name:h.color||h.team;if(!groups.has(key))groups.set(key,{color:h.color||'Not recorded',team:h.team,players:[]});groups.get(key).players.push(p.name)}return [...groups.values()].map(g=>[s.id,g.color,g.team,g.players])}),'Victories count every teammate, including eliminated players, except disqualified players. Uses the same winner inference as player profiles.');
 add('first-damage','First Damage',[['Season','season'],['Player Name','players']],seasonRows(s=>[[s.id,s.players.filter(p=>p.achievement==='First Damage').map(p=>names(p.name))]]));
 add('first-death','First Death',[['Season','season'],['Player Name','players'],['Death Time']],seasonRows(s=>edge(s,false).map(p=>[s.id,[names(p.name)],time(p.seconds)])));
 add('first-blood','First Blood',[['Season','season'],['Victim','player'],['Killer','player'],['Death Time']],seasonRows(s=>edge(s,true).map(p=>[s.id,names(p.name),names(p.result),time(p.seconds)])));
 add('top-killer','Top Killer',[['Season','season'],['Top Killer(s)','players'],['Kills','number']],seasonRows(s=>{const ps=players.map(p=>({name:p.name,kills:p.history.find(h=>h.season===s.id)?.kills||0}));const max=Math.max(...ps.map(p=>p.kills));return [[s.id,max?ps.filter(p=>p.kills===max).map(p=>p.name):[],max]]}));
 add('final-boss','Final Boss',[['Season','season'],['Final Boss','player'],['Death Message'],['Killer','player'],['Death Time']],seasonRows(s=>edge(s,true,true).map(p=>[s.id,names(p.name),p.death,names(p.result),time(p.seconds)])));
 add('ironman','Ironman',[['Season','season'],['Player Name','players'],['Players Beat Out','number']],seasonRows(s=>[[s.id,s.players.filter(p=>!/^Disqualif/i.test(p.type||'')&&p.achievement==='Ironman').map(p=>names(p.name)),s.players.length-1]]));
 const rank=(field)=>players.filter(p=>p[field]>0).sort((a,b)=>b[field]-a[field]||a.name.localeCompare(b.name)).map(p=>[p.name,p[field]]);
 add('wins','All-Time Wins',[['Player Name','player'],['Wins','number']],rank('wins'));
 const pve={};seasons.forEach(s=>s.players.filter(p=>p.type==='PVE').forEach(p=>{const result=p.result||'Not recorded';pve[result]=(pve[result]||0)+1}));
 add('pve','All-Time PVE Kills',[['PVE Killer','entity'],['Kills','number']],Object.entries(pve).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])),'');
 add('pvp','All-Time PVP Kills',[['Player Name','player'],['Kills','number']],rank('kills'),'Team Kills are excluded. All recorded players are included, even below the five-game profile requirement.');
 const victimPairs=players.flatMap(p=>Object.entries(p.victims).map(([victim,count])=>[p.name,victim,count]));
 const killerMax=new Map(),victimMax=new Map();
 for(const [killer,victim,count] of victimPairs){killerMax.set(killer,Math.max(killerMax.get(killer)||0,count));victimMax.set(victim,Math.max(victimMax.get(victim)||0,count));}
 add('victims','Favorite Victim',[['Killer','player'],['Victim','player'],['Count','number']],victimPairs.filter(([killer,victim,count])=>count>=2&&(count===killerMax.get(killer)||count===victimMax.get(victim))).sort((a,b)=>b[2]-a[2]||a[0].localeCompare(b[0])||a[1].localeCompare(b[1])),'Pairs must have at least two recorded PVP kills and tie for either the killer’s highest count against any victim or the victim’s highest count from any killer. All ties are included.');
 add('ironmen','All-Time Ironmen',[['Player Name','player'],['Total','number']],rank('ironmen'));
 const types=['Lived','PVP','PVE','Team Kill','Disconnect','Disqualification'];
 const type=p=>!p.type?'Lived':p.type==='Disqualified'?'Disqualification':p.type;
 const deathTypes=seasons.map(s=>({season:s.id,counts:Object.fromEntries(types.map(t=>[t,s.players.filter(p=>type(p)===t).length]))}));
 const binWidth=300,bins=Array.from({length:Math.floor(Math.max(...seasons.flatMap(s=>deaths(s).map(p=>p.seconds)))/binWidth)+1},(_,i)=>({start:i*binWidth,end:(i+1)*binWidth,groups:[]}));
 for(const s of seasons)for(const p of deaths(s)){const bin=bins[Math.floor(p.seconds/binWidth)];let g=bin.groups.find(g=>g.season===s.id&&g.color===(p.color||'Not recorded'));if(!g){g={season:s.id,color:p.color||'Not recorded',players:[]};bin.groups.push(g)}g.players.push(names(p.name))}
 const versions=new Map();
 for(const season of seasons){const version=season.version==null?'Not recorded':String(season.version).split('.').map(part=>/^\d+$/.test(part)?String(Number(part)):part).join('.');if(!versions.has(version))versions.set(version,[]);versions.get(version).push(season.id);}
 const versionData=[...versions].sort((a,b)=>a[0].localeCompare(b[0],undefined,{numeric:true})).map(([version,ids])=>({version,count:ids.length,seasons:ids}));
 const weekdayNames=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
 const weekdayData=weekdayNames.map(day=>({day,count:0,seasons:[]}));
 for(const season of seasons){if(!/^\d{4}-\d{2}-\d{2}$/.test(season.date||''))throw Error('Invalid season date for weekday chart: '+season.id);const day=new Date(season.date+'T12:00:00Z').getUTCDay(),row=weekdayData[(day+6)%7];row.count++;row.seasons.push(season.id);}
 const sizes={};seasons.forEach(s=>sizes[s.teamSize]=(sizes[s.teamSize]||0)+1);
 const timing=seasons.map(s=>({season:s.id,length:s.seconds,firstDeath:edge(s,false)[0]?.seconds??null,firstBlood:edge(s,true)[0]?.seconds??null}));
 const timeline=seasons.map((s,i)=>({season:s.id,date:s.date,previousDate:i?seasons[i-1].date:null,days:i?Math.round((Date.parse(s.date)-Date.parse(seasons[i-1].date))/86400000):null}));
 const tableOrder=['winners','top-killer','ironman','final-boss','first-blood','first-death','first-damage','wins','pve','pvp','victims','ironmen'];
 tables.sort((a,b)=>tableOrder.indexOf(a.id)-tableOrder.indexOf(b.id));
 return {tables,graphs:[{id:'death-type',title:'Player Deaths',types,data:deathTypes},{id:'death-time',title:'Death Time',bins},{id:'timing',title:'Match Milestones',data:timing},{id:'team-size',title:'Team Size',data:Object.entries(sizes).map(([size,count])=>({size:Number(size),count}))},{id:'game-version',title:'Game Version',data:versionData},{id:'day-of-week',title:'Day of Week',data:weekdayData},{id:'timeline',title:'Timeline',data:timeline}],counts:{seasons:seasons.length,players:players.length,deaths:data.deathCount},source:'https://hyalus.shinyapps.io/hyalus_uhc/'};
}
module.exports={buildStats};
