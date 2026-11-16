const rankingsData=window.UHC_RANKINGS;
const teamAnchor=color=>'team-color-'+encodeURIComponent(color);
const noneLast=(a,b)=>Number(a.color==='Not recorded')-Number(b.color==='Not recorded');
const ratio=(n,d)=>`${n} / ${d}`;
const percent=n=>(100*n).toFixed(1)+'%';
function teamCard(team){
 const reason=team.isColor?`${team.appearances} of 6 required appearances`:'Special grouping; not a team color';
 const score=team.eligible
  ? `<div class="team-score team-score-breakdown" ${chartTip(`Performance score: ${team.score.toFixed(2)} / 100
Win contribution: ${team.components.win.toFixed(2)} / 60
Combat: ${team.components.combat.toFixed(2)} / 25
Survival: ${team.components.survival.toFixed(2)} / 15`)}><strong>${team.score.toFixed(2)}</strong><span>PERFORMANCE SCORE / 100</span></div>`
  : '<div class="team-score"><span>HISTORY AVAILABLE</span></div>';
 const counts=`<dl class="team-counts">${[
  ['Participant entries', team.participants],
  ['PVP deaths', team.pvpDeaths],
  ['PVE deaths', team.pveDeaths],
  ['Team Kill deaths', team.teamKillDeaths],
  ['Other exits', team.otherExits],
  ['Ironmen', team.ironmen],
  ['Team Kills committed', team.teamKills]
 ].map(([label, value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
 return `<article class="team-ranking-card" id="${teamAnchor(team.color)}" style="--team:${colors[team.color]||'#a3ad9e'}"><header class="team-ranking-header"><div class="team-swatch ${team.color==='Mole'?'mole-color':''}" style="${team.color==='Mole'?molePaint():''}"></div><div><p class="eyebrow">${team.eligible?'COLOR RANK #'+team.rank:'UNRANKED'}</p><h2>${escape(teamDisplayName(team.color))}<span>.</span></h2><p>${team.appearances} appearances · ${team.uniquePlayers} distinct players${team.eligible?'':' · '+escape(reason)}</p></div>${score}</header><div class="team-metrics"><div><b>${percent(team.winRate)}</b><span>WIN RATE</span><small>${ratio(team.wins,team.appearances)} wins / appearances</small></div><div><b>${team.killsPerParticipant.toFixed(2)}</b><span>KILLS / PARTICIPANT</span><small>${ratio(team.kills,team.participants)} kills / entries</small></div><div><b>${percent(team.survivalRate)}</b><span>SURVIVAL RATE</span><small>${ratio(team.survivors,team.participants)} survivors / entries</small></div></div>${counts}<div class="table-wrap"><table class="team-history"><caption>${escape(teamDisplayName(team.color))} appearances</caption><thead><tr><th>Season / date</th><th>Team name</th><th>Players</th><th>Result</th><th>PVP kills</th><th>Survivors</th></tr></thead><tbody>${team.history.map(h=>`<tr class="${team.color==='Mole'?'mole-row':''}" style="${team.color==='Mole'?molePaint(h.season):''}"><td><a href="#season-${h.season}">S${h.season}</a><small>${escape(h.date)}</small></td><td>${escape(h.teams.map(teamDisplayName).join(' · ')||'None')}</td><td>${h.players.map(n=>`<span class="stat-person">${statPlayer(n)}</span>`).join('')}</td><td>${h.win?'<span class="badge iron">Victory</span>':'—'}</td><td>${h.kills}</td><td>${h.survivors} / ${h.participants}</td></tr>`).join('')}</tbody></table></div></article>`;
}
function rankingTeams(){
 const query=$('ranking-search').value.trim().toLowerCase(),filter=$('ranking-filter').value,sort=$('ranking-order').value;
 return rankingsData.teams.filter(t=>(filter!=='ranked'||t.eligible)&&(filter!=='unranked'||!t.eligible)&&(!query||t.color.toLowerCase().includes(query)||t.history.some(h=>h.teams.some(n=>n.toLowerCase().includes(query))||h.players.some(n=>n.toLowerCase().includes(query))||query===`s${h.season}`||query===`season ${h.season}`||query===String(h.season)))).sort((a,b)=>noneLast(a,b)||(sort==='wins'?b.winRate-a.winRate||b.appearances-a.appearances:sort==='kills'?b.killsPerParticipant-a.killsPerParticipant:sort==='appearances'?b.appearances-a.appearances:sort==='name'?a.color.localeCompare(b.color):(a.rank??Infinity)-(b.rank??Infinity)||b.appearances-a.appearances||a.color.localeCompare(b.color)));
}
function renderRankings(){
 const teams=rankingTeams();$('ranking-result-count').textContent=`${teams.length} of ${rankingsData.teams.length} colors / groupings`;
 $('ranking-index').innerHTML=[...rankingsData.teams].sort(noneLast).map(t=>`<a href="#${teamAnchor(t.color)}" class="ranking-index-tile${teams.includes(t)?'':' filtered'}" style="--team:${colors[t.color]||'#a3ad9e'}"><i class="${t.color==='Mole'?'mole-color':''}" style="${t.color==='Mole'?molePaint():''}background:var(--team)"></i>${escape(teamDisplayName(t.color))}<span>${t.rank?'#'+t.rank:'—'}</span></a>`).join('');
 $('ranking-list').innerHTML=teams.map(teamCard).join('')||'<div class="empty">No colors match your search.</div>';
}
function rankingsRoute(){const mode=getRankingsMode(location.hash);switchRankingsMode(mode);if(mode==='grades'){renderSeasonGrades(location.hash);return;}if(mode==='players'){if(location.hash.startsWith('#rank-player-')){let name;try{name=decodeURIComponent(location.hash.slice(13))}catch{return}const player=playerRankingData.players.find(p=>p.name===profileIdentity(name));if(player){$('pr-search').value='';$('pr-tier-filter').value='all';renderPlayerRankings();requestAnimationFrame(()=>{const row=document.getElementById(rankingPlayerAnchor(player.name));if(row){row.open=true;row.scrollIntoView();}});}}return;}renderRankings();if(location.hash.startsWith('#team-color-')){let color;try{color=decodeURIComponent(location.hash.slice(12))}catch{return}const team=rankingsData.teams.find(t=>t.color===color);if(!team)return;if(!rankingTeams().some(t=>t.color===color)){$('ranking-search').value='';$('ranking-filter').value='all';renderRankings();}requestAnimationFrame(()=>document.getElementById(teamAnchor(color))?.scrollIntoView());}}
async function renderRankingWall(){
 const wall=document.createElement('div');
 wall.className='ranking-background';
 wall.setAttribute('aria-hidden','true');
 $('team-rankings-panel').prepend(wall);

 const blocks=[...document.querySelectorAll('.ranking-blocks > .ranking-block')];
 const textures=await Promise.all(blocks.map(async block=>{
  const image=new Image();
  image.src=block.style.getPropertyValue('--block-texture').slice(4,-1);
  try{await image.decode();return image;}catch{return null;}
 }));
 if(textures.some(texture=>!texture))return;

 const columns=32,rows=24,tile=16;
 // Give the colorful textures more chances to appear, with a stable layout on reload.
 const palette=[...textures,...textures.slice(0,11)];
 let seed=329041;

 const canvas=document.createElement('canvas');
 canvas.width=columns*tile;
 canvas.height=rows*tile;
 const context=canvas.getContext('2d');
 if(!context)return;
 context.fillStyle='rgba(17,19,24,.15)';
 for(let y=0;y<canvas.height;y+=tile){
  for(let x=0;x<canvas.width;x+=tile){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const texture=palette[Math.floor(seed/2**32*palette.length)];
   context.drawImage(texture,x,y);
   context.fillRect(x,y+tile-1,tile,1);
   context.fillRect(x+tile-1,y,1,tile-1);
  }
 }
 wall.style.setProperty('--ranking-wall', 'url('+canvas.toDataURL()+')');
}
function initializeRankings(){
 renderRankingWall();
 const help=$('ranking-help-dialog');
 $('ranking-help').addEventListener('click',()=>help.showModal());
 help.addEventListener('click',e=>{
  if(e.target!==help)return;
  const r=help.getBoundingClientRect();
  if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)help.close();
 });
 $('ranking-search').addEventListener('input',renderRankings);$('ranking-filter').addEventListener('change',renderRankings);$('ranking-order').addEventListener('change',renderRankings);
 $('ranking-reset').addEventListener('click',()=>{$('ranking-search').value='';$('ranking-filter').value='all';$('ranking-order').value='rank';renderRankings();});
 $('ranking-method').textContent=rankingsData.method;$('ranking-notes').textContent=rankingsData.notes;
 $('ranking-summary').textContent=`${rankingsData.teams.filter(t=>t.eligible).length} ranked colors · Six appearances required`;
}
