const teamDisplayName=value=>!value||value==='Not recorded'?'None':value;
function historyTeamLink(name,color,seasonId){
 const season=window.UHC_DATA.find(s=>s.id===seasonId);
 if(season?.teamSize===1||!color||color==='Solo')return escape(teamDisplayName(name));
 const ink=color==='Black'?'#c5c8ce':color==='Navy'?'#9ab7ff':colors[color]||'#b3bda9';
 return `<a class="season-team-link" href="#${teamAnchor(color)}" style="color:${ink}">${escape(teamDisplayName(name||color))}</a>`;
}
function molePalette(seasonId){
 const season=window.UHC_DATA.find(s=>s.id===seasonId);
 const names=season?[...new Set(season.players.flatMap(p=>[p.color,p.moleFor]).filter(c=>c&&c!=='Mole'&&c!=='Solo'&&colors[c]))]:Object.keys(colors).filter(c=>!['Mole','Solo'].includes(c));
 return names.map(name=>colors[name]);
}
function molePaint(seasonId){
 const palette=molePalette(seasonId),size=palette.length*16;
 return `--mole-paint:linear-gradient(to bottom,${palette.map((c,i)=>`${c} ${i*16}px ${(i+1)*16}px`).join(',')});--mole-cycle:${size}px;`;
}
const profileData=window.UHC_PROFILES;
const playerProfiles=profileData.profiles;
const profileIdentity=name=>profileData.identities[String(name).toLowerCase()]||name;
const profileByName=name=>playerProfiles.find(p=>p.name===profileIdentity(name));
const profileHref=name=>`#player-${encodeURIComponent(name)}`;
const seasonLinks=ids=>[...new Set(ids)].sort((a,b)=>a-b).map(id=>`<a href="#season-${id}">S${id}</a>`).join(' ');
const topPeople=entries=>entries.length?entries.map(e=>'<div class="profile-pvp-pair"><span class="stat-person">'+statPlayer(e.name)+'</span><span class="profile-pvp-count">('+e.count+')</span></div>').join(''):'None recorded';
function profilePvpPairs(player,entries,asKiller){
 return entries.length?entries.map(entry=>{
  const killer=asKiller?player.name:entry.name,victim=asKiller?entry.name:player.name;
  return '<div class="profile-pvp-pair"><span class="stat-person">'+statPlayer(killer)+'</span><span class="profile-pvp-arrow" aria-label="killed">→</span><span class="stat-person">'+statPlayer(victim)+'</span><span class="profile-pvp-count">('+entry.count+')</span></div>';
 }).join(''):'None recorded';
}
function playerIntroduction(p){
  const priorities=[/Got at least one PVP kill in all /,/three-peat multiple times/,/Has the most |Made the quickest |Had the quickest |Played the most /,/Won with the exact same team roster/,/Has traveled to the End/,/first PVP kill was with a ranged weapon/,/Won \d+ consecutive matches played/,/Won (his|her) first season/,/Made (his|her) debut/];
  for(const pattern of priorities){const note=p.trivia.find(t=>t.length<=210&&pattern.test(t));if(note)return note.replace(/ \(one of \d+ recorded players[^)]*\)/g,'');}
  if(p.topTeammates.length)return `Most often teamed with ${p.topTeammates.map(t=>t.name).join(' and ')}.`;
  return `Part of the archive since Season ${p.history[0].season}.`;
}
function playerTriviaSlides(p){
  return [...new Set([playerIntroduction(p),...p.trivia])];
}
let directoryCarouselTimer;
function startDirectoryCarousels(visible){
  clearInterval(directoryCarouselTimer);
  const cards=[...$('player-grid').querySelectorAll('.player-introduction')];
  const states=cards.map((card,i)=>({card,slides:playerTriviaSlides(visible[i]),index:0}));
  let next=0;
  directoryCarouselTimer=setInterval(()=>{
    if(document.hidden||$('player-directory').hidden||!states.length)return;
    const state=states[next];next=(next+1)%states.length;
    if(state.card.matches(':hover, :focus-within')||state.slides.length<2)return;
    state.index=(state.index+1)%state.slides.length;
    const text=state.card.querySelector('.directory-story');text.textContent=state.slides[state.index];
    state.card.querySelector('.directory-trivia').scrollTop=0;
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)text.animate([{opacity:.25,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:250});
  },1500);
}
function playerCards(){
  const q=$('player-search').value.trim().toLowerCase();
  const sort=$('player-sort').value||'games';
  const visible=playerProfiles.filter(p=>[p.name,...p.aliases].some(n=>n.toLowerCase().includes(q))).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):b[sort]-a[sort]||a.name.localeCompare(b.name));
  $('player-count').textContent=`${visible.length} of ${playerProfiles.length} profiles`;
  $('player-grid').innerHTML=visible.map(p=>`<a class="player-card player-introduction" href="${profileHref(p.name)}"><div class="directory-header"><div class="directory-portrait">${playerFace(p.name)}</div><div class="directory-person"><div class="directory-heading"><h3>${escape(p.name)}</h3><span class="directory-link">Explore profile <span aria-hidden="true">↗</span></span></div><p class="directory-debut">Debut · Season ${p.history[0].season}</p></div></div><div class="directory-trivia"><div class="directory-trivia-label"><span>CAREER NOTES</span></div><p class="directory-story">${escape(playerIntroduction(p))}</p></div></a>`).join('')||'<div class="empty">No eligible player matches that name.</div>';
  startDirectoryCarousels(visible);
}
function killChart(p){
  const w=760,h=230,left=42,right=42,top=22,bottom=35,cw=w-left-right,ch=h-top-bottom,n=seasons.length;
  const best=Math.max(1,p.bestKills),total=Math.max(1,p.kills);let cumulative=0;const points=[];
  const bars=seasons.map((s,i)=>{const record=p.history.find(r=>r.season===s.id),k=record?.kills||0;cumulative+=k;const x=left+(i+.5)*cw/n;points.push(`${x},${top+ch-cumulative/total*ch}`);return `<g tabindex="0" data-chart-tip="${escape(`Season ${s.id}\n${record ? `${k} PVP kills` : `Did not play`}\n${cumulative} career PVP kills`)}" aria-label="Season ${s.id}: ${record?k+' kills, '+cumulative+' career kills':'did not play'}"><rect x="${x-cw/n*.32}" y="${top+ch-k/best*ch}" width="${cw/n*.64}" height="${Math.max(1,k/best*ch)}" fill="${record?'#b1cc87':'#3b4338'}"/><text x="${x}" y="${h-15}" text-anchor="middle">${s.id}</text><rect class="chart-hit" x="${x-cw/seasons.length/2}" y="${top}" width="${cw/seasons.length}" height="${ch}" fill="transparent"/></g>`;}).join('');
  const grid=[0,.5,1].map(f=>`<line x1="${left}" x2="${w-right}" y1="${top+ch-f*ch}" y2="${top+ch-f*ch}"/><text x="${left-10}" y="${top+ch-f*ch+4}" text-anchor="end">${best*f}</text><text x="${w-right+10}" y="${top+ch-f*ch+4}">${total*f}</text>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="PVP kills per season and cumulative career kills for ${escape(p.name)}" class="profile-chart">${grid}${bars}<polyline points="${points.join(' ')}" fill="none" stroke="#e9c67d" stroke-width="2.5"/></svg>`;
}
function survivalChart(p){
  const w=760,h=200,left=42,right=20,top=15,bottom=35,cw=w-left-right,ch=h-top-bottom;
  const bars=seasons.map((s,i)=>{const r=p.history.find(r=>r.season===s.id),x=left+(i+.5)*cw/seasons.length;const available=r?.outlivedAvailable,val=available?r.outlivedPercent:0;return `<g tabindex="0" data-chart-tip="${escape(`Season ${s.id}\n${!r ? `Did not play` : available ? `${val}% of other participants outlived` : `Exit time unavailable`}${r ? `\nTeam: ${r.team}` : ``}`)}" aria-label="Season ${s.id}: ${!r?'did not play':available?val+' percent of other participants outlived':'exit time unavailable'}"><rect x="${x-5}" width="10" y="${top+ch-val/100*ch}" height="${Math.max(2,val/100*ch)}" fill="${available?'#9fc5e8':'#3b4338'}"/><text x="${x}" y="${h-15}" text-anchor="middle">${s.id}</text><rect class="chart-hit" x="${x-cw/seasons.length/2}" y="${top}" width="${cw/seasons.length}" height="${ch}" fill="transparent"/></g>`;}).join('');
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Percentage of other players outlived each season" class="profile-chart">${[0,50,100].map(v=>`<line x1="${left}" x2="${w-right}" y1="${top+ch-v/100*ch}" y2="${top+ch-v/100*ch}"/><text x="${left-8}" y="${top+ch-v/100*ch+4}" text-anchor="end">${v}%</text>`).join('')}${bars}</svg>`;
}
function teamColorChart(p){
  const percent=c=>c.percent.toFixed(1)+'%';
  return `<section class="profile-section team-color-section"><div class="profile-section-title"><div><p class="eyebrow">THE COLORS OF A CAREER</p><h2>Team colors<span>.</span></h2></div><span>${p.games} recorded games</span></div><div class="team-color-bar" aria-label="Team color distribution">${p.teamColors.map(c=>`<button class="team-color-segment ${c.color==='Mole'?'mole-color':''}" style="${c.color==='Mole'?molePaint():''}flex:${c.count};background:${colors[c.color]||'#798372'}" data-chart-tip="${escape(`${teamDisplayName(c.color)}\n${c.count} of ${p.games} games · ${percent(c)}\nSeasons: ${c.seasons.map(s=>'S'+s).join(', ')}`)}" aria-label="${escape(teamDisplayName(c.color))}: ${c.count} games, ${percent(c)}">${c.percent>=12?`<span>${percent(c)}</span>`:''}</button>`).join('')}</div><div class="team-color-key">${p.teamColors.map(c=>`<span><i class="${c.color==='Mole'?'mole-color':''}" style="${c.color==='Mole'?molePaint():''}background:${colors[c.color]||'#798372'}"></i><b>${escape(teamDisplayName(c.color))}</b> ${percent(c)} <small>(${c.count})</small></span>`).join('')}</div><p class="chart-caption">Share of games played on each recorded color. Hover, focus, or tap a segment for its seasons.</p></section>`;
}
let activeChartTarget,chartTooltipHideTimer;
function deferChartTooltipHide(){clearTimeout(chartTooltipHideTimer);chartTooltipHideTimer=setTimeout(hideChartTooltip,100);}
function hideChartTooltip(){clearTimeout(chartTooltipHideTimer);const tip=$('chart-tooltip');tip.hidden=true;activeChartTarget?.removeAttribute('aria-describedby');activeChartTarget?.classList.remove('chart-active');activeChartTarget=null;}
function displayChartTooltip(target,event){
  clearTimeout(chartTooltipHideTimer);
  const tip=$('chart-tooltip');if(activeChartTarget&&activeChartTarget!==target){activeChartTarget.removeAttribute('aria-describedby');activeChartTarget.classList.remove('chart-active');}activeChartTarget=target;target.classList.add('chart-active');
  tip.classList.toggle('death-time-tooltip',!!target.dataset.deathTip);
  if(target.dataset.deathTip){
    const info=JSON.parse(target.dataset.deathTip),accent=colors[info.color]||'#a3ad9e';
    tip.style.setProperty('--tip-team',accent);
    tip.innerHTML=`<div class="death-tip-heading"><strong>Season ${info.season}</strong><span>${escape(teamDisplayName(info.color))}</span></div><div class="death-tip-interval">${duration(info.start)}–${duration(info.end)}</div><div class="death-tip-count">${info.players.length} recorded death${info.players.length===1?'':'s'}</div><ul class="death-tip-players">${info.players.map(name=>'<li>'+escape(name)+'</li>').join('')}</ul>`;
  }else{tip.style.removeProperty('--tip-team');tip.textContent=target.dataset.chartTip.replace(/\\n/g,'\n');}
  tip.hidden=false;target.setAttribute('aria-describedby','chart-tooltip');
  const viewport=window.visualViewport,margin=10;
  const viewLeft=viewport?.offsetLeft||0,viewTop=viewport?.offsetTop||0;
  const viewWidth=viewport?.width||document.documentElement.clientWidth,viewHeight=viewport?.height||window.innerHeight;
  // Measure intrinsic width independently of the previous screen position.
  tip.style.boxSizing='border-box';tip.style.width='max-content';
  tip.style.minWidth='0';tip.style.maxWidth=Math.max(1,viewWidth-margin*2)+'px';
  tip.style.maxHeight=Math.max(1,viewHeight-margin*2)+'px';tip.style.overflowY='auto';
  const r=target.getBoundingClientRect(),x=event?.clientX??r.left+r.width/2,y=event?.clientY??r.top;
  const bounds=tip.getBoundingClientRect(),right=viewLeft+viewWidth-margin,bottom=viewTop+viewHeight-margin;
  const desiredLeft=x+14+bounds.width>right?x-bounds.width-14:x+14;
  const desiredTop=y+14+bounds.height>bottom?y-bounds.height-14:y+14;
  tip.style.left=Math.max(viewLeft+margin,Math.min(right-bounds.width,desiredLeft))+'px';
  tip.style.top=Math.max(viewTop+margin,Math.min(bottom-bounds.height,desiredTop))+'px';
}
function chartPointerElement(event){return event.pointerType==='touch'?document.elementFromPoint(event.clientX,event.clientY):event.target;}
function pointerInsideActiveChart(event){const graph=activeChartTarget?.closest('svg');if(!graph)return false;const r=graph.getBoundingClientRect();return event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom;}
document.addEventListener('pointermove',event=>{
 const element=chartPointerElement(event),target=element?.closest('[data-chart-tip]');
 if(target)displayChartTooltip(target,event);
 else if(activeChartTarget){if(pointerInsideActiveChart(event))displayChartTooltip(activeChartTarget,event);else hideChartTooltip();}
});
document.addEventListener('pointerout',event=>{
 if(!activeChartTarget)return;
 const next=event.relatedTarget?.closest?.('[data-chart-tip]');
 if(next){displayChartTooltip(next,event);return;}
 const graph=activeChartTarget.closest('svg');
 if(graph&&event.relatedTarget&&graph.contains(event.relatedTarget)){clearTimeout(chartTooltipHideTimer);return;}
 if(!event.relatedTarget||graph)hideChartTooltip();else if(!activeChartTarget.contains(event.relatedTarget))deferChartTooltipHide();
});
document.addEventListener('pointerdown',event=>{if(event.pointerType!=='touch')return;const target=event.target.closest('[data-chart-tip]');if(target)displayChartTooltip(target,event);});
for(const type of ['pointerup','pointercancel'])document.addEventListener(type,event=>{if(event.pointerType==='touch')hideChartTooltip();});
document.addEventListener('focusin',event=>{const target=event.target.closest('[data-chart-tip]');if(target)displayChartTooltip(target);});
document.addEventListener('focusout',event=>{if(activeChartTarget&&!activeChartTarget.contains(event.relatedTarget))hideChartTooltip();});
document.addEventListener('click',event=>{if(event.pointerType==='touch')return;const target=event.target.closest('[data-chart-tip]');if(target)displayChartTooltip(target,event);else if(activeChartTarget)hideChartTooltip();});
document.addEventListener('keydown',event=>{if(event.key==='Escape')hideChartTooltip();});
window.addEventListener('scroll',()=>{if(activeChartTarget)hideChartTooltip();},{passive:true});
window.addEventListener('hashchange',()=>{if(activeChartTarget)hideChartTooltip();});
function showPlayer(name){
  const p=profileByName(name);
  $('player-directory').hidden=true;$('full-profile').hidden=false;
  if(!p){$('full-profile').innerHTML='<div class="empty"><h2>Profile unavailable</h2><p>A full player profile requires at least five recorded games.</p><a href="#players">Return to Players</a></div>';return;}
  const played=p.history.map(h=>h.season),trophy=p.trophies;
  const ranked=[...playerProfiles].sort((a,b)=>b.kills-a.kills);const rank=ranked.filter(r=>r.kills>p.kills).length+1;
  const original=p.description?`<details class="original-bio"><summary>Original player description <span>Historical workbook text</span></summary><p>The original prose is preserved below. Its totals and rankings reflect when it was written; the current figures appear above.</p><div>${escape(p.description).replace(/\n/g,'<br>')}</div></details>`:'';
  const historical=p.historicalTrivia?`<details class="original-bio"><summary>Original trivia <span>Historical workbook text</span></summary><p>These notes may use older totals or counting conventions.</p><div>${escape(p.historicalTrivia).replace(/\n/g,'<br>')}</div></details>`:'';
  $('full-profile').innerHTML=`<a class="profile-back" href="#players">← All players</a><header class="profile-hero"><div class="portrait">${playerFace(p.name)}</div><div class="profile-identity"><p class="eyebrow">PLAYER BIO</p><h1>${escape(p.name)}</h1>${p.aliases.length?`<p class="aliases">Former names: ${p.aliases.map(escape).join(', ')}</p>`:''}</div><div class="career-rank debut-badge"><strong>SEASON ${p.history[0].season}</strong><span>DEBUT · ${escape(String(p.history[0].date).slice(0,4))}</span></div></header><div class="profile-metrics">${[[p.games,'GAMES PLAYED'],[p.wins,'WINS'],[p.kills,'PVP KILLS'],[p.ironmen,'IRONMEN'],[p.bestKills,'BEST GAME · KILLS']].map(([n,l])=>`<div><strong>${n}</strong><span>${l}</span></div>`).join('')}</div><div class="profile-body"><div class="profile-primary"><section class="profile-section"><div class="profile-section-title"><div><p class="eyebrow">EARNED IN THE ARENA</p><h2>Trophy case<span>.</span></h2></div><span>${trophy.length} achievement types</span></div><div class="trophy-grid">${trophy.map(t=>`<details class="trophy"><summary><img src="${window.UHC_ICONS[t.icon]}" alt="" width="42" height="42"><span><strong>${t.count} × ${escape(t.label)}</strong><small>${[...new Set(t.events.map(e=>'S'+e.season))].join(' · ')}</small></span><span class="trophy-expand" aria-hidden="true">+</span></summary><ul>${t.events.map(e=>`<li><a href="#season-${e.season}">S${e.season}</a> ${escape(e.detail)}</li>`).join('')}</ul></details>`).join('')||'<p class="unknown">No trophies recorded yet.</p>'}</div></section><section class="profile-section"><div class="profile-section-title"><h2>The career curve<span>.</span></h2></div><div class="chart-legend"><span class="chart-bar">PVP kills · left axis</span><span class="chart-line">Career kills · right axis</span></div>${killChart(p)}<p class="chart-caption">Season number · Hover or focus a bar for details. Grey marks an unplayed season.</p><h3 class="chart-subheading">Players outlived per season</h3>${survivalChart(p)}<p class="chart-caption">A surviving player outlives 100% of other participants. Equal death times do not count as outliving each other.</p></section>${teamColorChart(p)}<section class="profile-section"><div class="profile-section-title"><h2>Season by season<span>.</span></h2></div><div class="table-wrap"><table class="career-table"><thead><tr><th>Season</th><th>Team</th><th>Kills</th><th>Highlights</th><th>Death / result</th></tr></thead><tbody>${p.history.map(r=>`<tr class="${r.color==='Mole'?'mole-row':''}" style="${r.color==='Mole'?molePaint(r.season):''}--team:${colors[r.color]||'#b3bda9'}"><td><a href="#season-${r.season}">S${r.season}</a></td><td>${historyTeamLink(r.team,r.color,r.season)}${r.moleFor?`<small class="mole-cover">Cover team: <b style="color:${colors[r.moleFor]||'#c7d2e5'}">${escape(r.moleFor)}</b></small>`:''}</td><td>${r.kills}</td><td>${[r.win?'Victory':null,r.iron?'◈ Ironman':null,r.crownAcquired?'<img class="crown-icon" src="'+window.UHC_ICONS.crown+'" alt="" width="20" height="12"> Crown':null].filter(Boolean).join(' · ')||'—'}</td><td>${escape(r.death||'No death recorded')}${r.seconds!=null?` <span class="elapsed">${duration(r.seconds)}</span>`:''}</td></tr>`).join('')}</tbody></table></div></section>${original}${historical}</div><aside class="profile-sidebar"><section class="profile-section"><p class="eyebrow">THE CONNECTIONS</p><h2>Career notes<span>.</span></h2><dl><dt>Seasons played</dt><dd class="played-seasons">${seasonLinks(played)}</dd><dt>Most common team color</dt><dd>${p.commonColors.map(c=>`${escape(teamDisplayName(c.color))} · ${c.count} games (${c.percent.toFixed(1)}%)`).join("<br>")}</dd><dt>Most frequent teammate${p.topTeammates.length===1?'':'s'}</dt><dd>${topPeople(p.topTeammates)}</dd><dt>Most frequent PVP victim${p.topVictims.length===1?'':'s'}</dt><dd>${profilePvpPairs(p,p.topVictims,true)}</dd><dt>Most frequent PVP killer${p.topKillers.length===1?'':'s'}</dt><dd>${profilePvpPairs(p,p.topKillers,false)}</dd><dt>Recorded deaths</dt><dd>${p.pvpDeaths} PVP · ${p.pveDeaths} PVE · ${p.teamKillDeaths} Team Kills</dd>${p.otherExits?`<dt>Other exits</dt><dd>${p.otherExits} disconnects / disqualifications</dd>`:''}${p.teamKills?`<dt>Team Kills committed</dt><dd>${p.teamKills} (excluded from PVP kills)</dd>`:''}</dl></section><section class="profile-section"><p class="eyebrow">THE SMALL DETAILS</p><h2>Trivia<span>.</span></h2><ul class="trivia-list">${p.trivia.map(t=>`<li>${escape(t)}</li>`).join('')||'<li>More milestones will appear as the record grows.</li>'}</ul></section></aside></div>`;
}
function playersRoute(){const hash=location.hash;if(hash.startsWith('#player-')){let name;try{name=decodeURIComponent(hash.slice(8))}catch{name=''}showPlayer(name);}else{$('player-directory').hidden=false;$('full-profile').hidden=true;playerCards();}}
function initializePlayers(){
  $('player-search').addEventListener('input',playerCards);$('player-sort').addEventListener('change',playerCards);
  $('player-count-summary').textContent=`${playerProfiles.length} eligible players · At least 5 matches each`;
  $('profile-methods').innerHTML=Object.entries(profileData.definitions).map(([label,value])=>`<dt>${escape(label.replace(/([A-Z])/g,' $1'))}</dt><dd>${escape(value)}</dd>`).join('');
}

