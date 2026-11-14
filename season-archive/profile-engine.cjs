// Calculations use the match ledger; bios supply explicit aliases and historical prose.
const seasonNumbers = text => {
  const match = String(text).match(/\(([^)]*)\)/); if (!match) return [];
  return [...new Set(match[1].replace(/S/gi,'').split(/[,;+]/).flatMap(part => {
    const m=part.trim().match(/^(\d+)(?:\s*[-–]\s*(\d+))?$/); if(!m)return [];
    const start=Number(m[1]),end=Number(m[2]||m[1]);return end>=start&&end-start<100?Array.from({length:end-start+1},(_,i)=>start+i):[];
  }))];
};
const pvpKillTypes=[
  {cause:'Fire',message:/^(?:was )?(?:burnt|burned|went up in flames|(?:tried to )?swim in lava|walked into (?:a )?fire|discovered the floor was lava)\b/i,icon:'lava-bucket'},
  {cause:'Fall Damage',message:/^(?:fell|hit the ground|was doomed to fall)\b/i,trophyCause:'Fall',icon:'wind-charge'},
  {cause:'Pet',message:/^was slain by (?:a )?wolf(?=\s*\(|\s*$)/i,icon:'wolf-face'},
  {cause:'Melee',message:/^was (?:slain|stabbed|pummeled) by\b/i},
  {cause:'Ranged',message:/^was (?:shot|sniped|impaled) by\b/i},
  {cause:'TNT',message:/\b(?:blew up|blown up|exploded)\b.*\bTNT\b/i}
];
function buildProfiles(seasons,bios,specials){
  const names=new Map(),canonical=new Map();
  for(const bio of bios){
    const aliasText=bio.cells.find(c=>String(c.value).startsWith('Formerly Known As:'))?.value||'';
    let aliases=aliasText.replace('Formerly Known As:','').split(/,|\band\b|\n/).map(s=>s.trim()).filter(Boolean);
    const currentName=/^(arecue|Happy_Guy555)$/i.test(bio.name)?'Happy_Guy555':bio.name;
    if(currentName==='Happy_Guy555')aliases=[...new Set([...aliases,'arecue'])].filter(n=>n.toLowerCase()!=='happy_guy555');
    const displayText=text=>String(text||'').replace(/\barecue\b/gi,'Happy_Guy555');
    const entry={name:currentName,aliases,description:displayText(bio.cells.find(c=>c.cell==='D19')?.value),historicalTrivia:displayText(bio.cells.find(c=>c.cell==='J3')?.value),documentedWins:seasonNumbers(bio.cells.find(c=>/UHC Victor/.test(c.value))?.value||'')};
    names.set(currentName,entry);for(const n of [bio.name,currentName,...aliases])canonical.set(n.toLowerCase(),currentName);
  }
  const unsquaredBio=names.get('Unsquared_')||{name:'Unsquared_',aliases:[],description:'',historicalTrivia:'',documentedWins:[]};
  unsquaredBio.aliases=[...new Set([...unsquaredBio.aliases,'Minecraftian8888'])];
  names.set('Unsquared_',unsquaredBio);
  canonical.set('unsquared_','Unsquared_');canonical.set('minecraftian8888','Unsquared_');
  const toastyBio=names.get('Toasty_boii')||{name:'Toasty_boii',aliases:[],description:'',historicalTrivia:'',documentedWins:[]};
  toastyBio.aliases=[...new Set([...toastyBio.aliases,'Toastfliper'])];
  names.set('Toasty_boii',toastyBio);
  canonical.set('toasty_boii','Toasty_boii');canonical.set('toastfliper','Toasty_boii');
  const identity=n=>canonical.get(String(n||'').toLowerCase())||n;
  const players=new Map();
  const ensure=name=>{if(!players.has(name))players.set(name,{name,aliases:names.get(name)?.aliases||[],description:names.get(name)?.description||'',historicalTrivia:names.get(name)?.historicalTrivia||'',history:[],kills:0,pveDeaths:0,pvpDeaths:0,teamKillDeaths:0,otherExits:0,teamKills:0,trophies:[],trivia:[],victims:{},killers:{},teammates:{},milestones:[],killStreak:0});return players.get(name)};
  let deathNumber=0;const milestoneList=[],winnerSources=[];
  const inc=(o,k)=>o[k]=(o[k]||0)+1;
  const add=(p,key,label,season,detail,icon)=>{let t=p.trophies.find(t=>t.key===key);if(!t){t={key,label,icon,count:0,events:[]};p.trophies.push(t)}t.count++;t.events.push({season,detail})};
  const teamKey=(s,p)=>s.teamSize===1?`solo:${identity(p.name)}`:p.color&&p.color!=='Solo'?`color:${p.color}`:p.team?`name:${p.team}`:`unassigned:${identity(p.name)}`;
  const activeStreaks=new Map();
  for(const s of [...seasons].sort((a,b)=>a.id-b.id)){
    const roster=s.players.map(p=>({...p,id:identity(p.name),key:teamKey(s,p)}));
    if(new Set(roster.map(p=>p.id)).size!==roster.length)throw Error(`Duplicate player identity in S${s.id}`);
    const groups=new Map();for(const p of roster){if(!groups.has(p.key))groups.set(p.key,[]);groups.get(p.key).push(p)};
    const deathEvents=roster.filter(p=>['PVP','PVE','Team Kill'].includes(p.type)&&p.death);
    const ordered=[...deathEvents].sort((a,b)=>(a.seconds??Infinity)-(b.seconds??Infinity));
    const pvp=ordered.filter(p=>p.type==='PVP');
    const firstTime=pvp.length?Math.min(...pvp.filter(p=>p.seconds!=null).map(p=>p.seconds)):null;
    const lastTime=pvp.length?Math.max(...pvp.filter(p=>p.seconds!=null).map(p=>p.seconds)):null;
    const survivors=roster.filter(p=>!p.death&&!p.type);
    const survivorTeams=[...new Set(survivors.map(p=>p.key))];
    let winKeys=survivorTeams.length===1?survivorTeams:[];
    let winMethod=winKeys.length?'Only one team has players without a recorded death.':'';
    if(!winKeys.length){winKeys=[...new Set(roster.filter(p=>names.get(p.id)?.documentedWins.includes(s.id)).map(p=>p.key))];winMethod=winKeys.length?'Winning team documented in the historical bios.':'Winner not established.';}
    winnerSources.push({season:s.id,teams:winKeys,method:winMethod});
    const killCounts={},killCauses=new Map();
    for(const victim of ordered){
      const p=ensure(victim.id);deathNumber++;
      if(deathNumber%50===0){const milestone={number:deathNumber,season:s.id,name:victim.id,detail:`${victim.death} · ${victim.seconds==null?'time not recorded':victim.seconds+' seconds'}`};milestoneList.push(milestone);p.milestones.push(milestone);}
      if(victim.type==='PVE')p.pveDeaths++;else if(victim.type==='PVP')p.pvpDeaths++;else p.teamKillDeaths++;
      const killer=identity(victim.result),killerRecord=roster.find(r=>r.id===killer);
      if(victim.type==='PVP'&&killerRecord&&killer!==victim.id){
        const kp=ensure(killer);kp.kills++;inc(kp.victims,victim.id);inc(p.killers,killer);inc(killCounts,killer);
        const cause=pvpKillTypes.find(rule=>rule.message.test(victim.death))?.cause;
        if(cause){
          if(!killCauses.has(killer))killCauses.set(killer,{});
          inc(killCauses.get(killer),cause);
        }
        activeStreaks.set(killer,(activeStreaks.get(killer)||0)+1);kp.killStreak=Math.max(kp.killStreak,activeStreaks.get(killer));
        if(victim.seconds!=null&&victim.seconds===firstTime&&!kp.trophies.find(t=>t.key==='first-blood')?.events.some(e=>e.season===s.id))add(kp,'first-blood','First Blood',s.id,`First PVP kill: ${victim.id}${pvp.filter(v=>v.seconds===firstTime).length>1?' (tied recorded time)':''}`,'golden-sword');
      }else if(victim.type==='Team Kill'&&killerRecord)ensure(killer).teamKills++;
      activeStreaks.set(victim.id,0);
      if(victim.type==='PVP'&&victim.seconds!=null&&victim.seconds===lastTime)add(p,'final-boss','Final Boss',s.id,`Last PVP victim: killed by ${killer}${pvp.filter(v=>v.seconds===lastTime).length>1?' (tied recorded time)':''}`,'creeper');
    }
    const maxKills=Math.max(0,...Object.values(killCounts));
    for(const r of roster){
      const p=ensure(r.id),win=!/^Disqualif/i.test(r.type||'')&&winKeys.includes(r.key),iron=!/^Disqualif/i.test(r.type||'')&&r.achievement==='Ironman',kills=killCounts[r.id]||0;
      const debut=p.history.length===0;
      const peers=(groups.get(r.key)||[]).filter(x=>x.id!==r.id);
      peers.forEach(x=>inc(p.teammates,x.id));
      const ranged=pvp.filter(v=>identity(v.result)===r.id&&/shot by/i.test(v.death)).length;
      const teamKills=ordered.filter(v=>v.type==='Team Kill'&&identity(v.result)===r.id).length;
      const lastDeathTime=ordered.filter(v=>v.seconds!=null).reduce((max,v)=>Math.max(max,v.seconds),-1);
      if(r.type==='PVE'&&r.seconds!=null&&r.seconds===lastDeathTime)p.trivia.push(`Season ${s.id}: Was the last player to die, but died from a PVE source (${r.death})${ordered.filter(v=>v.seconds===lastDeathTime).length>1?' (tied recorded time)':''}.`);
      if(win&&teamKills){const victims=ordered.filter(v=>v.type==='Team Kill'&&identity(v.result)===r.id).map(v=>v.id);p.trivia.push(`Season ${s.id}: Killed their teammate${victims.length===1?'':'s'} (${victims.join(', ')}) but still won.`);}
      if(win&&r.type==='Team Kill')p.trivia.push(`Season ${s.id}: Was killed by their teammate ${identity(r.result)} but still earned a win.`);
      if(win&&kills>0&&peers.length>=2&&peers.every(peer=>!killCounts[peer.id]))p.trivia.push(`Season ${s.id}: Was the only player on their ${peers.length+1}-player team to get a PVP kill in a win (${kills} kill${kills===1?'':'s'}).`);
      const firstDeathTime=Math.min(...ordered.filter(v=>v.seconds!=null).map(v=>v.seconds));
      const diedFirst=deathEvents.some(v=>v.id===r.id)&&r.seconds!=null&&r.seconds===firstDeathTime;
      const runnerUp=p.trophies.some(t=>t.key==='final-boss'&&t.events.some(e=>e.season===s.id));
      const crownAtEnd=identity(s.crown?.name)===r.id;
      const crownAcquired=s.crown?.acquired&&crownAtEnd;
      const outlived=r.seconds==null&&!r.death&&!r.type?roster.length-1:deathEvents.filter(v=>v.id!==r.id&&v.seconds!=null&&r.seconds!=null&&v.seconds<r.seconds).length;
      p.history.push({season:s.id,metrics:r.metrics,date:s.date,recordedName:r.name,team:r.team||r.color||'Not recorded',color:r.color,moleFor:r.moleFor||null,joinedAt:r.joinedAt??null,roamer:!!r.roamer,kills,ranged,teamKills,diedFirst,runnerUp,win,winMethod:win?winMethod:'',iron,death:r.death,type:r.type,seconds:r.seconds,outlivedPercent:roster.length>1?Math.round(100*outlived/(roster.length-1)):0,outlivedAvailable:r.seconds!=null||(!r.death&&!r.type),participants:roster.length,crownAcquired});
      if(r.type&&!['PVP','PVE','Team Kill'].includes(r.type)){p.otherExits++;activeStreaks.set(r.id,0)}
      if(win)add(p,'victor','UHC Victor',s.id,'Member of the winning team, including eliminated teammates.','apple');
      if(iron)add(p,'ironman','Ironman',s.id,'Last player to take damage, explicitly recorded in the match workbook.','armor');
      if(crownAcquired)add(p,'crown','Crown Holder',s.id,s.crown.method,'crown');
      if(maxKills>0&&kills===maxKills)add(p,'top-fragger','Most Kills',s.id,`${kills} PVP kills${Object.values(killCounts).filter(k=>k===maxKills).length>1?' (tied)':''}.`,'diamond-sword');
      if(ranged>=2)add(p,'sharpshooter','Sharpshooter',s.id,`${ranged} Ranged Kills, recorded as “shot by”.`,'bow');
      if(debut&&kills)add(p,'first-impression','First Impression',s.id,`${kills} PVP kill${kills===1?'':'s'} in their first recorded game.`,'sword');
      if(win&&iron&&kills)add(p,'triple-threat','Triple Threat',s.id,'Win + at least one PVP kill + Ironman.','trident');
      if(win&&iron&&kills&&crownAtEnd)add(p,'grand-slam','Grand Slam',s.id,`Win + PVP kill + Ironman + ${crownAcquired?'earned':'retained'} the crown.`,'diamond-block');
      const causes=killCauses.get(r.id);
      for(const {cause,trophyCause=cause,icon} of pvpKillTypes){
        const count=causes?.[cause]||0;
        if(icon&&count>=2)add(p,`multiple-${trophyCause.toLowerCase()}-kills`,`Multiple ${trophyCause} PVP Kills`,s.id,`${count} ${trophyCause} PVP kills in one match.`,icon);
      }
      if(causes?.Pet)p.trivia.push(`Season ${s.id}: Got ${causes.Pet===1?'a Pet PVP kill':causes.Pet+' Pet PVP kills'}.`);
      const killTypes=Object.keys(causes||{}).sort();
      if(killTypes.length>=3)p.trivia.push(`Season ${s.id}: Got PVP kills with ${killTypes.length} different kill types (${killTypes.join(', ')}).`);
      if(win&&r.achievement==='First Damage')add(p,'phoenix','Phoenix',s.id,'Took first damage and still won with their team.','blaze-powder');
      for(const [key,members] of groups){if(key===r.key||members.length<2||key.startsWith('unassigned:'))continue;if(members.every(v=>v.type==='PVP'&&identity(v.result)===r.id))add(p,'team-wipe','Team Wipe',s.id,`Killed all ${members.length} members of ${members[0].team||members[0].color} (${members.map(m=>m.id).join(', ')}).`,'tnt');}
    }
  }
  for(const event of specials){
    const name=identity(event.name),p=players.get(name);if(!p||!p.history.some(h=>h.season===event.season))continue;
    const labels={'Perfect Ironman':['perfect-ironman','Perfect Ironman','Took no damage during the match.','diamond-chestplate'],'Overpowered':['overpowered','Overpowered','Ate an Enchanted Golden Apple.','enchanted-apple'],'Struck by Lightning':['lightning','Struck by Lightning','Explicitly recorded in the workbook.','lightning'],'Rocket Science':['rocket-science','Rocket Science','Used fireworks with a crossbow, explicitly recorded in the workbook.','rocket-science'],'Firework + Crossbow':['rocket-science','Rocket Science','Used fireworks with a crossbow, explicitly recorded in the workbook.','rocket-science'],'The End?':['the-end','The End?','Entered the End during the match, explicitly recorded in the workbook.','ender-eye']};
    const spec=labels[event.stat];if(spec)add(p,spec[0],spec[1],event.season,spec[2],spec[3]);
  }
  const appleGames=[...players.values()].flatMap(p=>p.history.map(h=>{
    const events=p.trophies.find(t=>t.key==='overpowered')?.events.filter(e=>e.season===h.season).length||0;
    return {p,season:h.season,count:Math.max(events,h.metrics?.[4]??0)};
  }));
  const mostApples=Math.max(0,...appleGames.map(g=>g.count));
  const recordHolders=new Set(appleGames.filter(g=>g.count===mostApples).map(g=>g.p));
  for(const {p,season,count} of appleGames){
    if(count>1)p.trivia.push(`Season ${season}: Ate ${count} Enchanted Golden Apples (Overpowered).`);
    if(count>0&&count===mostApples)p.trivia.push(`${recordHolders.size>1?'Tied the':'Set the'} single-game Overpowered record with ${count} Enchanted Golden Apple${count===1?'':'s'} in Season ${season}.`);
  }
  const topEntries=o=>{const entries=Object.entries(o).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));return entries.length?entries.filter(e=>e[1]===entries[0][1]).map(([name,count])=>({name,count})):[]};
  for(const p of players.values()){
    p.games=p.history.length;p.wins=p.history.filter(h=>h.win).length;p.ironmen=p.history.filter(h=>h.iron).length;p.bestKills=Math.max(0,...p.history.map(h=>h.kills));
    p.topVictims=topEntries(p.victims);p.topKillers=topEntries(p.killers);p.topTeammates=topEntries(p.teammates);
    const consecutiveRuns=predicate=>{const runs=[];let current=[];for(const s of [...seasons].sort((a,b)=>a.id-b.id)){const h=p.history.find(h=>h.season===s.id);if(h&&predicate(h))current.push(s.id);else if(current.length){runs.push(current);current=[];}}if(current.length)runs.push(current);return runs;};
    p.winRuns=[];let winRun=[];
    for(const h of [...p.history].sort((a,b)=>a.season-b.season)){if(h.win)winRun.push(h.season);else if(winRun.length){p.winRuns.push(winRun);winRun=[];}}
    if(winRun.length)p.winRuns.push(winRun);
    p.winStreak=p.winRuns.reduce((best,run)=>run.length>best.length?run:best,[]);p.ironRuns=consecutiveRuns(h=>h.iron);p.ironStreak=p.ironRuns.reduce((best,run)=>run.length>best.length?run:best,[]);
    p.runnerUpStreak=[];let runnerUpRun=[];for(const h of p.history){runnerUpRun=h.runnerUp?[...runnerUpRun,h.season]:[];if(runnerUpRun.length>p.runnerUpStreak.length)p.runnerUpStreak=[...runnerUpRun];}
    const colorCounts={};p.history.forEach(h=>inc(colorCounts,h.color||'Not recorded'));
    p.teamColors=Object.entries(colorCounts).map(([color,count])=>({color,count,percent:100*count/p.games,seasons:p.history.filter(h=>(h.color||'Not recorded')===color).map(h=>h.season)})).sort((a,b)=>b.count-a.count||a.color.localeCompare(b.color));
    p.commonColors=p.teamColors.filter(c=>c.count===p.teamColors[0].count);
    p.bestTeamKills=Math.max(0,...p.history.map(h=>h.teamKills));p.bestRangedKills=Math.max(0,...p.history.map(h=>h.ranged));
    const wonGames=p.history.filter(h=>h.win);
    if(wonGames.length&&wonGames.every(h=>!h.death&&!h.type))p.trivia.push(p.wins===1?'Was alive for their only win.':`Was alive for all ${p.wins} of their wins.`);
    if(p.wins>0&&wonGames.every(h=>['PVP','PVE','Team Kill'].includes(h.type)))p.trivia.push(p.wins===1?'Their only win came after they had already died.':`All ${p.wins} wins came after they had already died.`);
    if(p.runnerUpStreak.length>=2)p.trivia.push(`Was runner-up (Final Boss) in ${p.runnerUpStreak.length} consecutive games played (S${p.runnerUpStreak.join(', S')}).`);
    for(let i=1;i<p.history.length;i++){const prev=p.history[i-1],next=p.history[i];if(prev.diedFirst&&!next.death&&!next.type)p.trivia.push(`Died first in Season ${prev.season}, then survived their next game, Season ${next.season}.`);}
    if(p.pveDeaths===1)p.trivia.push('Has only one recorded PVE death.');else if(p.pveDeaths===0)p.trivia.push('Has no recorded PVE deaths.');
    const doubleWins=p.winRuns.filter(run=>run.length===2);
    if(doubleWins.length)p.trivia.push(`Won 2 consecutive matches${doubleWins.length>1?' on '+doubleWins.length+' separate occasions':''}: ${doubleWins.map(run=>'(S'+run.join(', S')+')').join('; ')}.`);
    for(const run of p.winRuns.filter(run=>run.length>=3))p.trivia.push(`Won ${run.length} consecutive matches played (S${run.join(', S')})${run.length===3?' — a three-peat':run.length===4?' — a four-peat':''}.`);
    const doubleIronmen=p.ironRuns.filter(run=>run.length===2);
    if(doubleIronmen.length)p.trivia.push(`Earned Ironman in 2 consecutive matches${doubleIronmen.length>1?' on '+doubleIronmen.length+' separate occasions':''}: ${doubleIronmen.map(run=>'(S'+run.join(', S')+')').join('; ')}.`);
    for(const run of p.ironRuns.filter(run=>run.length>=3))p.trivia.push(`Earned Ironman in ${run.length} consecutive seasons (S${run.join(', S')}).`);
    if(p.killStreak>=3)p.trivia.push(`Longest PVP kill streak without a recorded death: ${p.killStreak}.`);
    for(const m of p.milestones)p.trivia.push(`Was the ${m.number}th recorded death, in Season ${m.season}.`);
    for(const h of p.history.filter(h=>h.moleFor)){
      const season=seasons.find(s=>s.id===h.season);
      const victims=[...new Set((season?.players||[]).filter(v=>identity(v.name)!==p.name&&['PVP','Team Kill'].includes(v.type)&&identity(v.result)===p.name&&(v.color===h.moleFor||v.moleFor===h.moleFor)).map(v=>identity(v.name)))];
      if(victims.length){const names=victims.length>1?victims.slice(0,-1).join(', ')+' and '+victims.at(-1):victims[0];p.trivia.push(`Season ${h.season}: While a mole on the ${h.moleFor} team, killed ${victims.length} of their cover teammates: ${names}.`);}else p.trivia.push(`Season ${h.season}: Was a mole planted on the ${h.moleFor} team, secretly playing for ${h.team}.`);
    }
    const first=p.history[0];if(first.win)p.trivia.push(`Won their first season (Season ${first.season}).`);if(first.kills)p.trivia.push(`Made their debut in Season ${first.season} with ${first.kills} PVP kill${first.kills===1?'':'s'}.`);
    const wipesBySeason={};
    for(const {season} of p.trophies.find(t=>t.key==='team-wipe')?.events||[])inc(wipesBySeason,season);
    for(const [season,count] of Object.entries(wipesBySeason)){
      if(count>=2)p.trivia.push(`Season ${season}: Wiped ${count} teams in a single match.`);
    }
    const combos=p.history.map(h=>({season:h.season,labels:p.trophies.filter(t=>t.events.some(e=>e.season===h.season)&&['first-blood','team-wipe','ironman','crown','perfect-ironman','overpowered'].includes(t.key)).map(t=>t.label)})).filter(c=>c.labels.length>=3);
    combos.forEach(c=>p.trivia.push(`Season ${c.season}: ${c.labels.join(' + ')}.`));
    p.pronouns=p.name==='Hopalot202'?{subject:'she',possessive:'her',object:'her'}:{subject:'he',possessive:'his',object:'him'};
    const playerWording=text=>text.replace(/\bTheir\b/g,p.pronouns.possessive[0].toUpperCase()+p.pronouns.possessive.slice(1)).replace(/\btheir\b/g,p.pronouns.possessive).replace(/\bthey\b/g,p.pronouns.subject);
    p.trivia=p.trivia.map(playerWording);
    p.trophies.forEach(t=>t.events.forEach(event=>{event.detail=playerWording(event.detail)}));
    p.trophies.sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label));
  }
  const allPlayers=[...players.values()];
  const debutIronmen=allPlayers.filter(p=>p.history[0].iron);
  for(const p of debutIronmen){
    const rarity=debutIronmen.length===1?'the only recorded player to do so':`one of ${debutIronmen.length} recorded players to do so`;
    p.trivia.push(`Earned Ironman on ${p.pronouns.possessive} debut (Season ${p.history[0].season}) (${rarity}).`);
  }
  const killInEveryWinPlayers=allPlayers.filter(p=>p.wins>=2&&p.history.filter(h=>h.win).every(h=>h.kills>0));
  for(const p of killInEveryWinPlayers)p.trivia.push(`Got at least one PVP kill in all ${p.wins} of ${p.pronouns.possessive} wins (${killInEveryWinPlayers.length===1?'the only recorded player':'one of '+killInEveryWinPlayers.length+' recorded players'} to do so, with at least two wins).`);
  const ironmanPvePlayers=allPlayers.filter(p=>p.history.some(h=>h.iron&&h.type==='PVE'));
  for(const player of ironmanPvePlayers){
    const ids=player.history.filter(h=>h.iron&&h.type==='PVE').map(h=>h.season).sort((a,b)=>a-b);
    player.trivia.push('Earned Ironman but died to PVE in the same season ('+(ironmanPvePlayers.length===1?'the only recorded player to do so':'one of '+ironmanPvePlayers.length+' recorded players to do so')+') ('+(ids.length===1?'Season':'Seasons')+' '+ids.join(', ')+').');
  }

  const pveCauses=new Map();
  for(const season of seasons)for(const death of season.players){
    const cause=String(death.result||'').trim();
    if(death.type!=='PVE'||!cause||cause.toLowerCase()==='not recorded')continue;
    const key=cause.toLowerCase();
    if(!pveCauses.has(key))pveCauses.set(key,{cause,players:new Map()});
    const victims=pveCauses.get(key).players,name=identity(death.name);
    if(!victims.has(name))victims.set(name,new Set());
    victims.get(name).add(season.id);
  }
  for(const {cause,players:victims} of pveCauses.values())if(victims.size===1){
    const [name,ids]=[...victims][0],seasons=[...ids].sort((a,b)=>a-b);
    players.get(name).trivia.push('The only recorded player to have died to '+cause+' ('+(seasons.length===1?'Season':'Seasons')+' '+seasons.join(', ')+').');
  }

  // Missing team colors in Find Your Team are distinct from late joins to known teams.
  const findYourTeamIds=new Set(seasons.filter(s=>s.mode==='Find Your Team').map(s=>s.id));
  for(const rule of [{field:'kills',label:'Got a PVP kill'},{field:'iron',label:'Earned Ironman'}]){
    const qualifying=p=>p.history.filter(h=>findYourTeamIds.has(h.season)&&(!h.color||h.color==='Not recorded')&&h[rule.field]>0);
    const total=allPlayers.reduce((sum,p)=>sum+qualifying(p).length,0);
    for(const player of allPlayers){
      const matches=qualifying(player);if(!matches.length)continue;
      player.trivia.push(rule.label+' despite having no recorded team in a Find Your Team game ('+(matches.length===1?'Season':'Seasons')+' '+matches.map(h=>h.season).join(', ')+'). This has happened '+total+' '+(total===1?'time':'times')+' in recorded game history.');
    }
  }

  const mutualKillInstances=new Set();
  const mutualKillNotes=[];
  for(const p of allPlayers){
    const mutual=new Map();
    for(const s of seasons){
      const self=s.players.find(r=>identity(r.name)===p.name);
      if(!self||!self.death||!['PVP','Team Kill'].includes(self.type))continue;
      const otherName=identity(self.result),other=s.players.find(r=>identity(r.name)===otherName);
      if(otherName===p.name||!other?.death||!['PVP','Team Kill'].includes(other.type)||identity(other.result)!==p.name)continue;
      if(!mutual.has(otherName))mutual.set(otherName,[]);mutual.get(otherName).push(s.id);mutualKillInstances.add(JSON.stringify([s.id,...[p.name,otherName].sort()]));
    }
    for(const [other,ids] of mutual){const note=`Killed ${other} and was also killed by ${other} in the same season (${ids.length===1?'Season':'Seasons'} ${ids.sort((a,b)=>a-b).join(', ')}).`;p.trivia.push(note);mutualKillNotes.push({player:p,note});}
  }
  for(const {player,note} of mutualKillNotes)player.trivia[player.trivia.indexOf(note)]+=` This has happened ${mutualKillInstances.size} ${mutualKillInstances.size===1?'time':'times'} in recorded game history.`;
  const teamKillAndKillPlayers=allPlayers.filter(p=>p.history.some(h=>h.teamKills>0&&h.kills>0));
  for(const p of teamKillAndKillPlayers){
    const ids=p.history.filter(h=>h.teamKills>0&&h.kills>0).map(h=>h.season).sort((a,b)=>a-b);
    p.trivia.push(`Recorded both a Team Kill and a PVP kill in the same season (one of ${teamKillAndKillPlayers.length} recorded players to do so) (${ids.length===1?'Season':'Seasons'} ${ids.join(', ')}).`);
  }
  const endVisitors=allPlayers.filter(p=>p.trophies.some(t=>t.key==='the-end'));
  for(const p of endVisitors){const ids=[...new Set(p.trophies.find(t=>t.key==='the-end').events.map(e=>e.season))].sort((a,b)=>a-b);p.trivia.push(`Has traveled to the End (one of ${endVisitors.length} recorded players to do so) (${ids.length===1?'Season':'Seasons'} ${ids.join(', ')}).`);}
  const consecutiveKillRecords=[];
  for(const p of allPlayers){
    const runs=[];let run=[];
    for(const s of [...seasons].sort((a,b)=>a.id-b.id)){
      const h=p.history.find(h=>h.season===s.id);
      if(h&&h.kills>0&&(!run.length||s.id===run.at(-1)+1))run.push(s.id);
      else{if(run.length)runs.push(run);run=h&&h.kills>0?[s.id]:[];}
    }
    if(run.length)runs.push(run);
    const longest=Math.max(0,...runs.map(r=>r.length));
    if(longest>=3){const tied=runs.filter(r=>r.length===longest);const note=`Got at least one PVP kill in ${longest} consecutive seasons: ${tied.map(r=>'(S'+r.join(', S')+')').join('; ')}.`;p.trivia.push(note);consecutiveKillRecords.push({player:p,longest,note});}
  }
  const longestConsecutiveKills=Math.max(0,...consecutiveKillRecords.map(r=>r.longest));
  const consecutiveKillHolders=consecutiveKillRecords.filter(r=>r.longest===longestConsecutiveKills);
  for(const r of consecutiveKillHolders){const others=consecutiveKillHolders.filter(h=>h!==r).map(h=>h.player.name);const suffix=others.length?` This is tied for the longest such streak in game history with ${others.join(', ')}.`:' This is the longest such streak in game history.';r.player.trivia[r.player.trivia.indexOf(r.note)]+=suffix;}
  const firstBloodFinalBossPlayers=allPlayers.flatMap(p=>{
    const firstBloodSeasons=new Set(p.trophies.find(t=>t.key==='first-blood')?.events.map(e=>e.season)||[]);
    const ids=[...new Set((p.trophies.find(t=>t.key==='final-boss')?.events||[]).filter(e=>firstBloodSeasons.has(e.season)).map(e=>e.season))].sort((a,b)=>a-b);
    return ids.length?[{player:p,seasons:ids}]:[];
  });
  for(const {player,seasons:ids} of firstBloodFinalBossPlayers)player.trivia.push(`Earned First Blood and was the Final Boss in the same season: ${ids.map(id=>'S'+id).join(', ')} (one of ${firstBloodFinalBossPlayers.length} recorded players to do so).`);
  const greenStreakEligible=allPlayers.filter(p=>p.games>1);
  const greenStreakPlayers=greenStreakEligible.flatMap(p=>{
    const runs=[];let run=[];
    for(const h of [...p.history].sort((a,b)=>a.season-b.season)){
      if(h.color==='Green')run.push(h.season);
      else{if(run.length>=2)runs.push(run);run=[];}
    }
    if(run.length>=2)runs.push(run);
    return runs.length?[{player:p,runs}]:[];
  });
  for(const {player,runs} of greenStreakPlayers)player.trivia.push(`Played on Green Team in consecutive matches attended (one of ${greenStreakPlayers.length} recorded players to do so) ${runs.map(run=>'(S'+run.join(', S')+')').join('; ')}.`);
  for(const rule of [{label:'melee death',types:['PVP','Team Kill'],clarification:' Melee deaths caused by teammates count for this record.'},{label:'PVP melee death',types:['PVP'],clarification:' Team Kills do not count for this record.'}]){
    const waits=allPlayers.flatMap(p=>{
      const history=[...p.history].sort((a,b)=>a.season-b.season),index=history.findIndex(h=>rule.types.includes(h.type)&&/\bslain by\b/i.test(h.death||''));
      return index<0?[]:[{player:p,count:index,season:history[index].season}];
    });
    const longest=Math.max(0,...waits.map(r=>r.count)),holders=waits.filter(r=>r.count===longest);
    for(const r of holders){const possessive=r.player.pronouns.possessive;r.player.trivia.push(`${holders.length>1?'Tied for the most':'Played the most'} matches before ${possessive} first ${rule.label}: ${r.count}. ${possessive[0].toUpperCase()+possessive.slice(1)} first ${rule.label} came in Season ${r.season}, on appearance ${r.count+1}.${rule.clarification}`);}
  }
  const multiKillDebuts=allPlayers.filter(p=>p.history[0]?.kills>=2);
  for(const p of multiKillDebuts)p.trivia=p.trivia.map(t=>/^Made (his|her) debut in Season /.test(t)?`${t.replace(/\.$/,'')} (one of ${multiKillDebuts.length} recorded players to earn multiple kills on debut).`:t);
  let greenAppearances=0;
  for(const s of [...seasons].sort((a,b)=>a.id-b.id)){
    const green=s.players.filter(r=>r.color==='Green');
    if(!green.length)continue;
    greenAppearances++;
    const winners=green.filter(r=>players.get(identity(r.name))?.history.some(h=>h.season===s.id&&h.win));
    if(winners.length){
      for(const r of winners)players.get(identity(r.name)).trivia.push(`Season ${s.id}: Was part of Green Team's first win. It took Green Team ${greenAppearances} matches to earn its first win, including that winning match.`);
      break;
    }
  }
  const bothTeamKillRoles=allPlayers.filter(p=>p.teamKills>0&&p.teamKillDeaths>0);
  for(const p of bothTeamKillRoles)p.trivia.push(`Has both killed a teammate and been killed by a teammate (one of ${bothTeamKillRoles.length} recorded players to do so).`);
  const firstPveWaits=allPlayers.flatMap(p=>{
    const history=[...p.history].sort((a,b)=>a.season-b.season),index=history.findIndex(h=>h.type==='PVE');
    return index<0?[]:[{player:p,count:index,season:history[index].season}];
  });
  const longestPveWait=Math.max(0,...firstPveWaits.map(r=>r.count));
  const firstPveHolders=firstPveWaits.filter(r=>r.count===longestPveWait);
  for(const r of firstPveHolders)r.player.trivia.push(`${firstPveHolders.length>1?'Tied for the most':'Played the most'} matches before their first PVE death: ${r.count}. Their first PVE death came in Season ${r.season}, on appearance ${r.count+1}.`.replace(/\btheir\b/g,r.player.pronouns.possessive).replace(/\bTheir\b/g,r.player.pronouns.possessive[0].toUpperCase()+r.player.pronouns.possessive.slice(1)));
  const winningRecords=allPlayers.filter(p=>p.games>1&&p.wins>p.games-p.wins);
  for(const p of winningRecords){const losses=p.games-p.wins;p.trivia.push(`${winningRecords.length===1?'The only player':'One of '+winningRecords.length+' players'} with more than one recorded match to have more wins than losses (${p.wins} win${p.wins===1?'':'s'}, ${losses} loss${losses===1?'':'es'}).`);}
  const threePeatPlayers=allPlayers.filter(p=>p.winRuns.some(run=>run.length>=3));
  const repeatThreePeatPlayers=threePeatPlayers.filter(p=>p.winRuns.filter(run=>run.length>=3).length>=2);
  for(const p of threePeatPlayers)p.trivia.push(`One of ${threePeatPlayers.length} recorded players to achieve a three-peat: at least three wins in consecutive matches played. Skipped seasons do not break a winning streak.`);
  for(const p of repeatThreePeatPlayers)p.trivia.push(`One of ${repeatThreePeatPlayers.length} recorded players to achieve a three-peat multiple times (${p.winRuns.filter(run=>run.length>=3).length} separate winning streaks). A longer streak counts as one instance.`);
  const colorRuns=[];
  for(const p of allPlayers){
    let run=[];
    for(const h of [...p.history].sort((a,b)=>a.season-b.season)){
      const valid=h.color&&!['Solo','Not recorded'].includes(h.color);
      if(run.length&&(!valid||h.color!==run[0].color)){colorRuns.push({name:p.name,color:run[0].color,seasons:run.map(r=>r.season)});run=[];}
      if(valid)run.push(h);
    }
    if(run.length)colorRuns.push({name:p.name,color:run[0].color,seasons:run.map(r=>r.season)});
  }
  const longestColorRun=Math.max(0,...colorRuns.map(r=>r.seasons.length));
  const colorHolders=colorRuns.filter(r=>r.seasons.length===longestColorRun);
  const colorTied=new Set(colorHolders.map(r=>r.name)).size>1;
  for(const run of colorHolders)players.get(run.name).trivia.push(`${colorTied?'Tied for the most':'Had the most'} consecutive matches played on the same team color: ${longestColorRun} on ${run.color} (Seasons ${run.seasons.join(', ')}). Skipped seasons do not break this streak.`);
  const attendanceRuns=[];
  for(const p of allPlayers){
    const ids=[...new Set(p.history.map(h=>h.season))].sort((a,b)=>a-b);let run=[];
    for(const id of ids){if(run.length&&id!==run.at(-1)+1){attendanceRuns.push({name:p.name,seasons:run});run=[];}run.push(id);}
    if(run.length)attendanceRuns.push({name:p.name,seasons:run});
  }
  const longestAttendance=Math.max(0,...attendanceRuns.map(r=>r.seasons.length));
  const attendanceHolders=attendanceRuns.filter(r=>r.seasons.length===longestAttendance);
  const attendanceTied=new Set(attendanceHolders.map(r=>r.name)).size>1;
  for(const name of new Set(attendanceHolders.map(r=>r.name))){
    const ranges=attendanceHolders.filter(r=>r.name===name).map(r=>`Seasons ${r.seasons[0]}–${r.seasons.at(-1)}`);
    players.get(name).trivia.push(`${attendanceTied?'Tied for the most':'Played the most'} consecutive matches: ${longestAttendance} (${ranges.join('; ')}).`);
  }
  const firstRangedKills=[];
  for(const p of allPlayers){
    const events=seasons.flatMap(s=>s.players.filter(v=>v.type==='PVP'&&v.death&&identity(v.result)===p.name&&identity(v.name)!==p.name&&s.players.some(r=>identity(r.name)===p.name)).map(v=>({season:s.id,victim:identity(v.name),seconds:v.seconds,ranged:/shot by/i.test(v.death)}))).sort((a,b)=>a.season-b.season||(a.seconds??Infinity)-(b.seconds??Infinity));
    if(!events.length)continue;
    const first=events[0],openingSeason=events.filter(e=>e.season===first.season);
    // Unknown times or mixed simultaneous kills cannot establish a ranged first kill.
    if(openingSeason.some(e=>e.seconds==null))continue;
    const tied=openingSeason.filter(e=>e.seconds===first.seconds);
    if(tied.every(e=>e.ranged))firstRangedKills.push({player:p,season:first.season,victims:tied.map(e=>e.victim)});
  }
  for(const event of firstRangedKills){
    const possessive=event.player.pronouns.possessive;
    event.player.trivia.push(`One of ${firstRangedKills.length} recorded players whose first PVP kill was with a ranged weapon. Shot ${event.victims.join(' and ')} in Season ${event.season} for ${possessive} first kill${event.victims.length>1?'s (tied recorded time)':''}.`);
  }
  const timedKills=seasons.flatMap(s=>s.players.filter(v=>v.type==='PVP'&&v.death&&v.seconds!=null&&identity(v.result)!==identity(v.name)&&players.has(identity(v.result))).map(v=>({killer:identity(v.result),victim:identity(v.name),season:s.id,seconds:v.seconds})));
  const quickestKill=Math.min(...timedKills.map(k=>k.seconds));
  const quickestKills=timedKills.filter(k=>k.seconds===quickestKill);
  for(const event of quickestKills){
    const time=`${Math.floor(event.seconds/3600)}:${String(Math.floor(event.seconds%3600/60)).padStart(2,'0')}:${String(event.seconds%60).padStart(2,'0')}`;
    players.get(event.killer).trivia.push(`${quickestKills.length>1?'Tied for the quickest':'Made the quickest'} PVP kill in game history: killed ${event.victim} at ${time} in Season ${event.season}.`);
  }
  const firstDeaths=allPlayers.flatMap(p=>p.history.filter(h=>h.diedFirst&&h.seconds!=null).map(h=>({name:p.name,season:h.season,seconds:h.seconds})));
  const quickestFirstDeath=Math.min(...firstDeaths.map(h=>h.seconds));
  const quickestHolders=firstDeaths.filter(h=>h.seconds===quickestFirstDeath);
  for(const name of new Set(quickestHolders.map(h=>h.name))){
    const events=quickestHolders.filter(h=>h.name===name),time=`${Math.floor(quickestFirstDeath/3600)}:${String(Math.floor(quickestFirstDeath%3600/60)).padStart(2,'0')}:${String(quickestFirstDeath%60).padStart(2,'0')}`;
    players.get(name).trivia.push(`${new Set(quickestHolders.map(h=>h.name)).size>1?'Tied for the quickest':'Had the quickest'} first death in game history: ${time} into the match (${events.map(h=>'Season '+h.season).join(', ')}).`);
  }
  const repeatRosters=new Map();
  for(const s of seasons){
    if(s.teamSize===1)continue;
    const teams=new Map();
    for(const r of s.players){const key=teamKey(s,r);if(!teams.has(key))teams.set(key,[]);teams.get(key).push(r);}
    for(const members of teams.values()){
      const roster=[...new Set(members.map(r=>identity(r.name)))].sort();
      if(roster.length<2||!roster.every(name=>players.get(name)?.history.some(h=>h.season===s.id&&h.win)))continue;
      const key=JSON.stringify(roster);
      if(!repeatRosters.has(key))repeatRosters.set(key,{roster,wins:[]});
      const colors=[...new Set(members.map(r=>r.color).filter(Boolean))];
      repeatRosters.get(key).wins.push({season:s.id,color:colors.length===1?colors[0]:null});
    }
  }
  const listNames=names=>names.length<2?names[0]:names.slice(0,-1).join(', ')+' and '+names.at(-1);
  for(const {roster,wins} of repeatRosters.values()){
    if(wins.length<2)continue;
    wins.sort((a,b)=>a.season-b.season);
    const sameColors=new Map();
    for(const win of wins){if(!win.color||['Solo','Not recorded'].includes(win.color))continue;if(!sameColors.has(win.color))sameColors.set(win.color,[]);sameColors.get(win.color).push(win.season);}
    const colorNotes=[...sameColors].filter(([,ids])=>ids.length>=2).map(([color,ids])=>ids.length===wins.length?`${wins.length===2?'Both wins':'All '+wins.length+' wins'} were on the ${color} team.`:`This roster also won on the ${color} team in Seasons ${listNames(ids)}.`);
    for(const name of roster)players.get(name).trivia.push(`Won with the exact same team roster ${wins.length} times (${listNames(roster)}) in Seasons ${listNames(wins.map(w=>w.season))}.${colorNotes.length?' '+colorNotes.join(' '):''}`);
  }
  const records=[['teamKills','Has the most total Team Kills','career'],['bestTeamKills','Has the most Team Kills in a single game','teamKills'],['bestRangedKills','Has the most Ranged Kills in a single game','ranged']];
  for(const [field,label,seasonField] of records){const max=Math.max(0,...allPlayers.map(p=>p[field]));if(!max)continue;const holders=allPlayers.filter(p=>p[field]===max);for(const p of holders){const ids=seasonField==='career'?[]:p.history.filter(h=>h[seasonField]===max).map(h=>h.season);p.trivia.push(`${holders.length>1?'Tied for ':''}${holders.length>1?label.replace('Has the ','the '):label}: ${max}${ids.length?' (S'+ids.join(', S')+')':''}.`);}}
  const profiles=[...players.values()].filter(p=>p.games>=5).sort((a,b)=>b.games-a.games||a.name.localeCompare(b.name));
  return {allPlayers,profiles,identities:Object.fromEntries(canonical),recordedPlayers:players.size,deathCount:deathNumber,milestones:milestoneList,winnerSources,definitions:{rangedKills:'PVP deaths recorded as shot by. The ledger contains no sniped by messages.',runnerUp:'Only the player awarded Final Boss counts as runner-up. Their teammates do not count. Streaks require Final Boss in consecutive games played, ignoring skipped seasons; tied Final Boss awards follow the recorded-time rule.',teamColors:'Each game contributes one recorded team color. Missing colors appear as Not recorded; percentages include every game played.',recordTrivia:'Kill records compare all recorded players, including those ineligible for a full profile. Shared maximums count as ties.',wins:'Every member of the winning team counts except disqualified players. Disqualification also revokes Ironman for that match. A winner is inferred when only one recorded team has players with no recorded death or exit. Historical documented wins are used if inference is ambiguous.',kills:'Only deaths classified PVP credit a kill, using Death Result as the killer. Team kills are counted separately.',finalBoss:'Last PVP victim by recorded death time. Ties share the achievement; PVE deaths do not count.',firstBlood:'Killer of the earliest timed PVP victim. Ties share the achievement.',teamWipe:'One player kills every recorded member of an opposing team of at least two players. Teams use recorded team color, or team name when color is missing. Solo opponents are excluded.',overpowered:'Eating an Enchanted Golden Apple; awarded only from explicit special-achievement records. Repeated rows count as multiple recorded apple events.',perfectIronman:'Taking no damage in a match; awarded only from an explicit record, not inferred from Ironman.',milestones:'PVP, PVE and team-kill deaths in season order, then recorded death time. Tied times preserve workbook row order. Disconnects and disqualifications are excluded.',outlived:'Percentage of the other participants with an earlier timed death; equal death times do not count. Players without a recorded death or exit outlive all opponents. Missing exit times remain unavailable.',aliases:'Only aliases explicitly named in the bios are combined. Match tables retain the names recorded at the time.',killStreak:'PVP kills without a recorded death, across games played. All recorded deaths and other exits reset the streak.'}};
}
module.exports={buildProfiles,seasonNumbers};

