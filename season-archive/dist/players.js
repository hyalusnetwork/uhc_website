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
function comparePlayerDebuts(a,b){
  const x=a.history[0],y=b.history[0];
  if(x.season!==y.season)return x.season-y.season;
  const outcome=h=>['PVP','PVE','Team Kill'].includes(h.type)?0:h.death||h.type?1:2;
  const group=outcome(x),otherGroup=outcome(y);
  if(group!==otherGroup)return group-otherGroup;
  if(group===0){
    const time=(x.seconds??Infinity)-(y.seconds??Infinity);
    if(time)return time;
  }
  if(group===2&&x.kills!==y.kills)return y.kills-x.kills;
  const roster=window.UHC_DATA.find(s=>s.id===x.season)?.players||[];
  const damage=h=>roster.find(r=>r.name===h.recordedName)?.achievement==='First Damage';
  return Number(y.iron)-Number(x.iron)||Number(damage(x))-Number(damage(y))||a.name.localeCompare(b.name);
}
function playerCards(){
  const q=$('player-search').value.trim().toLowerCase();
  const sort=$('player-sort').value||'name';
  const visible=playerProfiles.filter(p=>[p.name,...p.aliases].some(n=>n.toLowerCase().includes(q))).sort((a,b)=>sort==='debut'?comparePlayerDebuts(a,b):(sort==='games'?b.games-a.games:0)||a.name.localeCompare(b.name));
  $('player-count').textContent=`${visible.length} of ${playerProfiles.length} profiles`;
  $('player-grid').innerHTML=visible.map(p=>`<a class="player-card player-introduction" href="${profileHref(p.name)}"><div class="directory-header"><div class="directory-portrait">${playerFace(p.name)}</div><div class="directory-person"><h3>${escape(p.name)}</h3><p class="directory-debut">Debut · Season ${p.history[0].season}</p></div></div></a>`).join('')||'<div class="empty">No eligible player matches that name.</div>';
}
function killChart(p){
  const w=760,h=230,left=42,right=42,top=22,bottom=35,cw=w-left-right,ch=h-top-bottom,n=seasons.length;
  const best=Math.max(1,p.bestKills),total=Math.max(1,p.kills);let cumulative=0;const points=[];
  const bars=seasons.map((s,i)=>{const record=p.history.find(r=>r.season===s.id),k=record?.kills||0;cumulative+=k;const x=left+(i+.5)*cw/n;points.push(`${x},${top+ch-cumulative/total*ch}`);return `<g tabindex="0" data-chart-tip="${escape(`Season ${s.id}\n${record ? `${k} PVP kills` : `Did not play`}\n${cumulative} career PVP kills`)}" aria-label="Season ${s.id}: ${record?k+' kills, '+cumulative+' career kills':'did not play'}"><rect x="${x-cw/n*.32}" y="${top+ch-k/best*ch}" width="${cw/n*.64}" height="${Math.max(1,k/best*ch)}" fill="${record?'#85b8ff':'#393e48'}"/><text x="${x}" y="${h-15}" text-anchor="middle">${s.id}</text><rect class="chart-hit" x="${x-cw/seasons.length/2}" y="${top}" width="${cw/seasons.length}" height="${ch}" fill="transparent"/></g>`;}).join('');
  const grid=[0,.5,1].map(f=>`<line x1="${left}" x2="${w-right}" y1="${top+ch-f*ch}" y2="${top+ch-f*ch}"/><text x="${left-10}" y="${top+ch-f*ch+4}" text-anchor="end">${best*f}</text><text x="${w-right+10}" y="${top+ch-f*ch+4}">${total*f}</text>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="PVP kills per season and cumulative career kills for ${escape(p.name)}" class="profile-chart">${grid}${bars}<polyline points="${points.join(' ')}" fill="none" stroke="#f2bc79" stroke-width="2.5"/></svg>`;
}
function survivalChart(p){
  const w=760,h=200,left=42,right=20,top=15,bottom=35,cw=w-left-right,ch=h-top-bottom;
  const bars=seasons.map((s,i)=>{const r=p.history.find(r=>r.season===s.id),x=left+(i+.5)*cw/seasons.length;const available=r?.outlivedAvailable,val=available?r.outlivedPercent:0;return `<g tabindex="0" data-chart-tip="${escape(`Season ${s.id}\n${!r ? `Did not play` : available ? `${val}% of other participants outlived` : `Exit time unavailable`}${r ? `\nTeam: ${r.team}` : ``}`)}" aria-label="Season ${s.id}: ${!r?'did not play':available?val+' percent of other participants outlived':'exit time unavailable'}"><rect x="${x-5}" width="10" y="${top+ch-val/100*ch}" height="${Math.max(2,val/100*ch)}" fill="${available?'#9fc5e8':'#3b4338'}"/><text x="${x}" y="${h-15}" text-anchor="middle">${s.id}</text><rect class="chart-hit" x="${x-cw/seasons.length/2}" y="${top}" width="${cw/seasons.length}" height="${ch}" fill="transparent"/></g>`;}).join('');
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Percentage of other players outlived each season" class="profile-chart">${[0,50,100].map(v=>`<line x1="${left}" x2="${w-right}" y1="${top+ch-v/100*ch}" y2="${top+ch-v/100*ch}"/><text x="${left-8}" y="${top+ch-v/100*ch+4}" text-anchor="end">${v}%</text>`).join('')}${bars}</svg>`;
}
function teamColorChart(p){
  const percent=c=>c.percent.toFixed(1)+'%';
  return `<section class="profile-section team-color-section"><div class="profile-section-title"><div><p class="eyebrow">THE COLORS OF A CAREER</p><h2>Team colors<span>.</span></h2></div><span>${p.games} recorded games</span></div><div class="team-color-bar" aria-label="Team color distribution">${p.teamColors.map(c=>`<button class="team-color-segment ${c.color==='Mole'?'mole-color':''}" style="${c.color==='Mole'?molePaint():''}flex:${c.count};--team-color:${colors[c.color]||'#798372'};background:var(--team-color)" data-chart-tip="${escape(`${teamDisplayName(c.color)}\n${c.count} of ${p.games} games · ${percent(c)}\nSeasons: ${c.seasons.map(s=>'S'+s).join(', ')}`)}" aria-label="${escape(teamDisplayName(c.color))}: ${c.count} games, ${percent(c)}">${c.percent>=12?`<span>${percent(c)}</span>`:''}</button>`).join('')}</div><div class="team-color-key">${p.teamColors.map(c=>`<span><i class="${c.color==='Mole'?'mole-color':''}" style="${c.color==='Mole'?molePaint():''}background:${colors[c.color]||'#798372'}"></i><b>${escape(teamDisplayName(c.color))}</b> ${percent(c)} <small>(${c.count})</small></span>`).join('')}</div><p class="chart-caption">Share of games played on each recorded color. Hover, focus, or tap a segment for its seasons.</p></section>`;
}
let activeChartTarget,chartTooltipHideTimer;
function deferChartTooltipHide(){clearTimeout(chartTooltipHideTimer);chartTooltipHideTimer=setTimeout(hideChartTooltip,100);}
function hideChartTooltip(){clearTimeout(chartTooltipHideTimer);const tip=$('chart-tooltip');tip.hidden=true;activeChartTarget?.removeAttribute('aria-describedby');activeChartTarget?.classList.remove('chart-active');activeChartTarget=null;}
function displayChartTooltip(target,event){
  clearTimeout(chartTooltipHideTimer);
  const tip=$('chart-tooltip');if(activeChartTarget&&activeChartTarget!==target){activeChartTarget.removeAttribute('aria-describedby');activeChartTarget.classList.remove('chart-active');}activeChartTarget=target;target.classList.add('chart-active');
  tip.classList.toggle('death-time-tooltip',!!target.dataset.deathTip);
  const chartAccent=target.matches('.team-size-arc, .milestone-dot, .outcome-segment')?target.getAttribute('fill'):target.style.getPropertyValue('--calendar-color')||target.style.getPropertyValue('--team-color')||(target.matches('.pve-bar-row')?target.style.getPropertyValue('--cause'):'');
  tip.classList.toggle('colored-chart-tooltip',!!chartAccent);
  const mole=target.matches('.team-color-segment.mole-color');
  tip.classList.toggle('mole-chart-tooltip',mole);
  if(mole){
    for(const prop of ['--mole-paint','--mole-cycle'])tip.style.setProperty(prop,target.style.getPropertyValue(prop));
  }
  if(chartAccent)tip.style.setProperty('--tip-chart-accent',chartAccent);
  else tip.style.removeProperty('--tip-chart-accent');
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
function profileSeasonGrid(history){
  const attended=new Map(history.map(h=>[h.season,h]));
  return `<div class="profile-season-grid">${[...seasons].sort((a,b)=>a.id-b.id).map(({id,teamSize})=>{
    const label=String(id).padStart(2,'0'),h=attended.get(id);
    if(!h)return `<span aria-label="Season ${id}, not played" role="img">${label}</span>`;
    const ink=teamSize!==1&&h.color!=='Solo'?colors[h.color]:null;
    const mole=h.color==='Mole'&&molePalette(id).length>0;
    const team=ink?' · '+h.color+' team':'';
    return `<a href="#season-${id}" data-profile-season="${id}" aria-label="Season ${id}, played${escape(team)}"${ink?` class="profile-season-team${mole?' profile-season-mole':''}" style="--season-team:${ink};${mole?molePaint(id):''}"`:''}>${label}</a>`;
  }).join('')}</div>`;
}
function bindProfileSeasonPreview(root,player){
  const grid=root.querySelector('.profile-season-grid');
  const tip=document.createElement('div');
  tip.id='profile-season-preview';tip.className='profile-season-preview';tip.setAttribute('popover','manual');tip.setAttribute('role','tooltip');root.append(tip);
  let active,tapped,touch=false;
  const tile=e=>e.target.closest('[data-profile-season]');
  function hide(){
    active?.removeAttribute('aria-describedby');active=null;tapped=null;
    if(tip.matches(':popover-open'))tip.hidePopover();
  }
  function show(link){
    const id=Number(link.dataset.profileSeason),season=seasons.find(s=>s.id===id),h=player.history.find(h=>h.season===id);
    if(!season||!h)return;
    const member=season.players.find(r=>r.name===h.recordedName);
    const grouped=season.teamSize!==1&&(member?.color&&member.color!=='Solo'||member?.team);
    const roster=grouped?season.players.filter(r=>r!==member&&(member.color&&member.color!=='Solo'?r.color===member.color:r.team===member.team)):[];
    const title=grouped?(member.team||member.color):'';
    const mole=grouped&&member.color==='Mole'&&molePalette(id).length>0;
    tip.classList.toggle('profile-season-mole',!!mole);
    tip.style.cssText=mole?molePaint(id):'';
    tip.style.setProperty('--preview-team',grouped?colors[member.color]||'#777d88':'#777d88');
    const heads=[player.name,...roster.map(r=>profileIdentity(r.name))];
    tip.innerHTML=`<div class="season-preview-title"><strong>S${id}</strong>${h.win?'<span class="season-preview-win">Victory</span>':''}</div>${title?`<div class="season-preview-team">${escape(title)}</div>`:''}<div class="season-preview-heads">${heads.map((name,i)=>`<span class="${i===0?'season-preview-self':''}" title="${escape(name)}" role="img" aria-label="${escape(name)}">${playerFace(name)}</span>`).join('')}</div>`;
    active?.removeAttribute('aria-describedby');active=link;link.setAttribute('aria-describedby',tip.id);
    if(!tip.matches(':popover-open'))tip.showPopover();
    const r=link.getBoundingClientRect(),left=Math.max(8,Math.min(innerWidth-tip.offsetWidth-8,r.left+(r.width-tip.offsetWidth)/2));
    tip.style.left=left+'px';tip.style.top=(r.top>=tip.offsetHeight+10?r.top-tip.offsetHeight-5:r.bottom+5)+'px';
  }
  grid.addEventListener('pointerdown',e=>{touch=e.pointerType==='touch';});
  grid.addEventListener('pointerover',e=>{const link=tile(e);if(e.pointerType!=='touch'){if(link)show(link);else hide();}});
  grid.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch')hide();});
  grid.addEventListener('focusin',e=>{const link=tile(e);if(link&&!touch)show(link);});
  grid.addEventListener('focusout',e=>{if(!touch)hide();});
  grid.addEventListener('click',e=>{
    const link=tile(e);
    if(!link||!(e.pointerType==='touch'||touch&&e.detail>0))return;
    if(tapped===link){hide();return;}
    e.preventDefault();show(link);tapped=link;
  });
  const cleanup=new AbortController();
  const observer=new MutationObserver(()=>{if(!tip.isConnected){cleanup.abort();observer.disconnect();}});
  observer.observe(root,{childList:true});
  document.addEventListener('pointerdown',e=>{if(!grid.contains(e.target))hide();},{signal:cleanup.signal});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();},{signal:cleanup.signal});
  window.addEventListener('scroll',hide,{passive:true,signal:cleanup.signal});
  window.addEventListener('resize',hide,{signal:cleanup.signal});
}
function profileColorNote(c){
  const ink=colors[c.color]||'#798372';
  return `<div class="profile-color-note"><i aria-hidden="true" style="background:${ink}"></i><strong>${escape(teamDisplayName(c.color))}</strong><span>${c.count} ${c.count===1?'game':'games'} · ${c.percent.toFixed(1)}%</span></div>`;
}
function trophyImage(icon){
  const src=window.UHC_ICONS[icon];
  const img=`<img src="${src}" alt="">`;
  return icon==='enchanted-apple'?`<span class="enchanted-trophy" style="--item-mask:url(${src})">${img}</span>`:img;
}
function bindTrophyDialog(root,trophies){
  const dialog=document.createElement('dialog');
  dialog.className='trophy-dialog';
  dialog.setAttribute('aria-labelledby','trophy-dialog-title');
  root.append(dialog);
  root.querySelector('.trophy-grid').addEventListener('click',event=>{
    const tile=event.target.closest('[data-trophy]');if(!tile)return;
    const t=trophies[Number(tile.dataset.trophy)];
    dialog.innerHTML=`<div class="trophy-dialog-header">${trophyImage(t.icon)}<h2 id="trophy-dialog-title">${t.count} × ${escape(t.label)}</h2><form method="dialog"><button autofocus aria-label="Close trophy details">×</button></form></div><ul>${t.events.map(e=>`<li><a href="#season-${e.season}">S${e.season}</a><span>${escape(e.detail)}</span></li>`).join('')}</ul>`;
    dialog.showModal();
  });
  dialog.addEventListener('click',event=>{
    if(event.target.closest('a'))dialog.close();
    else if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}
  });
}
function fitProfileName(name){
  name.style.removeProperty('font-size');
  const natural=parseFloat(getComputedStyle(name).fontSize);
  for(let size=natural;name.scrollWidth>name.clientWidth&&size>1;){
    size=Math.max(1,size-1);
    name.style.fontSize=size+'px';
  }
}
const profileSidebarObserver=new ResizeObserver(entries=>{
  for(const {target} of entries){
    if(target.matches('.profile-trophies')){
      target.parentElement.style.setProperty('--profile-trophy-height',target.offsetHeight+'px');
    }else{
      fitProfileName(target.querySelector('h1'));
      target.style.setProperty('--profile-sidebar-height',target.offsetHeight+'px');
    }
  }
});
function showPlayer(name){
  profileSidebarObserver.disconnect();
  const p=profileByName(name);
  $('player-directory').hidden=true;$('full-profile').hidden=false;
  if(!p){$('full-profile').innerHTML='<div class="empty"><h2>Profile unavailable</h2><p>A full player profile requires at least five recorded games.</p><a href="#players">Return to Players</a></div>';return;}
  const played=p.history.map(h=>h.season),trophy=p.trophies;
  $('full-profile').innerHTML=`<a class="profile-back" href="#players">← All players</a><div class="profile-body"><aside class="profile-sidebar" aria-label="Career notes"><section class="profile-section"><header class="profile-hero"><h1>${escape(p.name)}</h1><div class="portrait">${playerFace(p.name)}</div><div class="profile-identity">${p.aliases.length?`<p class="aliases">Former names: ${p.aliases.map(escape).join(', ')}</p>`:''}</div></header><dl><dt>Seasons played</dt><dd>${profileSeasonGrid(p.history)}</dd><dt>Most common team color</dt><dd class="profile-common-colors">${p.commonColors.map(profileColorNote).join('')}</dd><dt>Most frequent teammate${p.topTeammates.length===1?'':'s'}</dt><dd>${topPeople(p.topTeammates)}</dd><dt>Most frequent PVP victim${p.topVictims.length===1?'':'s'}</dt><dd>${profilePvpPairs(p,p.topVictims,true)}</dd><dt>Most frequent PVP killer${p.topKillers.length===1?'':'s'}</dt><dd>${profilePvpPairs(p,p.topKillers,false)}</dd><dt>Recorded deaths</dt><dd>${p.pvpDeaths} PVP · ${p.pveDeaths} PVE · ${p.teamKillDeaths} Team Kills</dd>${p.otherExits?`<dt>Other exits</dt><dd>${p.otherExits} disconnects / disqualifications</dd>`:''}${p.teamKills?`<dt>Team Kills committed</dt><dd>${p.teamKills} (excluded from PVP kills)</dd>`:''}</dl></section></aside><div class="profile-primary"><section class="profile-section profile-trophies"><div class="profile-section-title trophy-case-title"><h2>Trophy case<span>.</span></h2></div><div class="trophy-grid">${trophy.map((t,i)=>`<button type="button" class="trophy trophy-tile" data-trophy="${i}" aria-haspopup="dialog">${trophyImage(t.icon)}<strong>${t.count} × ${escape(t.label)}</strong><small>${[...new Set(t.events.map(e=>'S'+e.season))].join(' · ')}</small><span class="trophy-plus" aria-hidden="true">+</span></button>`).join('')||'<p class="unknown">No trophies recorded yet.</p>'}</div></section><section class="profile-section profile-trivia"><h2>Trivia<span>.</span></h2><ul class="trivia-list" tabindex="0" aria-label="Player trivia">${p.trivia.map(t=>`<li>${escape(t)}</li>`).join('')||'<li>More milestones will appear as the record grows.</li>'}</ul></section><div class="profile-followup"><section class="profile-section"><div class="profile-section-title"><h2>The career curve<span>.</span></h2></div><h3 class="chart-subheading chart-first-title">PVP kills by season and career total</h3><div class="chart-legend"><span class="chart-bar">PVP kills · left axis</span><span class="chart-line">Career kills · right axis</span></div>${killChart(p)}<p class="chart-caption">Season number · Hover or focus a bar for details. Grey marks an unplayed season.</p><h3 class="chart-subheading">Players outlived per season</h3>${survivalChart(p)}<p class="chart-caption">A surviving player outlives 100% of other participants. Equal death times do not count as outliving each other.</p></section>${teamColorChart(p)}<section class="profile-section"><div class="profile-section-title"><h2>Season by season<span>.</span></h2></div><div class="table-wrap"><table class="career-table"><thead><tr><th>Season</th><th>Team</th><th>Kills</th><th>Highlights</th><th>Death / result</th></tr></thead><tbody>${p.history.map(r=>`<tr class="${r.color==='Mole'?'mole-row':''}" style="${r.color==='Mole'?molePaint(r.season):''}--team:${colors[r.color]||'#b3bda9'}"><td><a href="#season-${r.season}">S${r.season}</a></td><td>${historyTeamLink(r.team,r.color,r.season)}${r.moleFor?`<small class="mole-cover">Cover team: <b style="color:${colors[r.moleFor]||'#c7d2e5'}">${escape(r.moleFor)}</b></small>`:''}</td><td>${r.kills}</td><td>${[r.win?'Victory':null,r.iron?'◈ Ironman':null,r.crownAcquired?'<img class="crown-icon" src="'+window.UHC_ICONS.crown+'" alt="" width="20" height="12"> Crown':null].filter(Boolean).join(' · ')||'—'}</td><td>${escape(r.death||'No death recorded')}${r.seconds!=null?` <span class="elapsed">${duration(r.seconds)}</span>`:''}</td></tr>`).join('')}</tbody></table></div></section></div></div></div>`;
  bindProfileSeasonPreview($('full-profile'),p);
  bindTrophyDialog($('full-profile'),trophy);
  const sidebar=$('full-profile').querySelector('.profile-sidebar');
  sidebar.style.setProperty('--profile-sidebar-height',sidebar.offsetHeight+'px');
  fitProfileName(sidebar.querySelector('h1'));
  profileSidebarObserver.observe(sidebar);
  const trophyPanel=$('full-profile').querySelector('.profile-trophies');
  trophyPanel.parentElement.style.setProperty('--profile-trophy-height',trophyPanel.offsetHeight+'px');
  profileSidebarObserver.observe(trophyPanel);
}
function playersRoute(){const hash=location.hash;if(hash.startsWith('#player-')){let name;try{name=decodeURIComponent(hash.slice(8))}catch{name=''}showPlayer(name);}else{$('player-directory').hidden=false;$('full-profile').hidden=true;playerCards();}}
function initializePlayers(){
  $('player-search').addEventListener('input',playerCards);$('player-sort').addEventListener('change',playerCards);
  $('player-count-summary').textContent=`${playerProfiles.length} eligible players · At least 5 matches each`;
  $('profile-methods').innerHTML=Object.entries(profileData.definitions).map(([label,value])=>`<dt>${escape(label.replace(/([A-Z])/g,' $1'))}</dt><dd>${escape(value)}</dd>`).join('');
}

