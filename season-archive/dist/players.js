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
  const bars=seasons.map((s,i)=>{const record=p.history.find(r=>r.season===s.id),k=record?.kills||0;cumulative+=k;const victims=k?s.players.filter(v=>v.type==='PVP'&&profileIdentity(v.result)===p.name&&profileIdentity(v.name)!==p.name).map(v=>profileIdentity(v.name)):[];
  const teamColor=record?(s.teamSize!==1&&record.color!=='Solo'&&colors[record.color])||'#737e8d':'#393e48';
  const killTip={season:s.id,k,cumulative,played:!!record,victims};const x=left+(i+.5)*cw/n;const lineY=top+ch-cumulative/total*ch;points.push(`${x},${lineY}`);return `<g class="kill-bar" tabindex="0" style="--team-color:${teamColor}" data-kill-tip="${escape(JSON.stringify(killTip))}" data-chart-tip="${escape(`Season ${s.id}\n${record ? `${k} PVP kills` : `Did not play`}\n${cumulative} career PVP kills`)}" aria-label="Season ${s.id}: ${record?k+' kills, '+cumulative+' career kills':'did not play'}"><rect x="${x-cw/n*.32}" y="${top+ch-k/best*ch}" width="${cw/n*.64}" height="${Math.max(1,k/best*ch)}" fill="${teamColor}"/><text x="${x}" y="${h-15}" text-anchor="middle">${s.id}</text><rect class="chart-hit" x="${x-cw/seasons.length/2}" y="${top}" width="${cw/seasons.length}" height="${ch}" fill="transparent"/><circle class="career-kill-point" cx="${x}" cy="${lineY}" r="6" fill="#f2bc79" aria-hidden="true"/></g>`;}).join('');
  const grid=[0,.5,1].map(f=>`<line x1="${left}" x2="${w-right}" y1="${top+ch-f*ch}" y2="${top+ch-f*ch}"/><text x="${left-10}" y="${top+ch-f*ch+4}" text-anchor="end">${best*f}</text><text x="${w-right+10}" y="${top+ch-f*ch+4}">${total*f}</text>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="PVP kills per season and cumulative career kills for ${escape(p.name)}" class="profile-chart">${grid}${bars}<polyline points="${points.join(' ')}" fill="none" stroke="#f2bc79" stroke-width="2.5"/></svg>`;
}
function survivalChart(p){
  const w=760,h=200,left=42,right=20,top=15,bottom=35,cw=w-left-right,ch=h-top-bottom;
  const bars=seasons.map((s,i)=>{const r=p.history.find(r=>r.season===s.id),x=left+(i+.5)*cw/seasons.length;const available=r?.outlivedAvailable,val=available?r.outlivedPercent:0;
  const team=available&&s.teamSize!==1&&r.color!=='Solo'?colors[r.color]:null;
  return `<g class="outlast-bar" tabindex="0" style="--team-color:${team||'#737e8d'}" data-chart-tip="${escape(`Season ${s.id}\n${!r ? `Did not play` : available ? `${val}% of other participants outlived` : `Exit time unavailable`}${r ? `\nTeam: ${r.team}` : ``}`)}" aria-label="Season ${s.id}: ${!r?'did not play':available?val+' percent of other participants outlived':'exit time unavailable'}"><rect x="${x-5}" width="10" y="${top+ch-val/100*ch}" height="${Math.max(2,val/100*ch)}" fill="${available?team||'#737e8d':'#393e48'}"/><text x="${x}" y="${h-15}" text-anchor="middle">${s.id}</text><rect class="chart-hit" x="${x-cw/seasons.length/2}" y="${top}" width="${cw/seasons.length}" height="${ch}" fill="transparent"/></g>`;}).join('');
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Percentage of other players outlived each season" class="profile-chart">${[0,50,100].map(v=>`<line x1="${left}" x2="${w-right}" y1="${top+ch-v/100*ch}" y2="${top+ch-v/100*ch}"/><text x="${left-8}" y="${top+ch-v/100*ch+4}" text-anchor="end">${v}%</text>`).join('')}${bars}</svg>`;
}
function teamColorLegend(p,percent){
 return `<div class="team-color-key" role="list" aria-label="Team colors played">${p.teamColors.filter(c=>c.count>0).map(c=>`<span class="team-color-tile" role="listitem" style="--team-color:${colors[c.color]||'#798372'}"><i class="${c.color==='Mole'?'mole-color':''}" style="${c.color==='Mole'?molePaint():''}background:var(--team-color)" aria-hidden="true"></i><b>${escape(teamDisplayName(c.color))}</b><span class="team-color-tile-stats">${percent(c)} <small>(${c.count})</small></span></span>`).join('')}</div>`;
}
function teamColorChart(p){
  const percent=c=>c.percent.toFixed(1)+'%';
  return `<section class="profile-section team-color-section"><div class="profile-section-title"><div><p class="eyebrow">THE COLORS OF A CAREER</p><h2>Team colors<span>.</span></h2></div><span>${p.games} recorded games</span></div><div class="team-color-bar" aria-label="Team color distribution">${p.teamColors.map(c=>`<button data-team-color="${escape(c.color)}" class="team-color-segment ${c.color==='Mole'?'mole-color':''}" style="${c.color==='Mole'?molePaint():''}flex:${c.count};--team-color:${colors[c.color]||'#798372'};background:var(--team-color)" data-chart-tip="${escape(`${teamDisplayName(c.color)}\n${c.count} of ${p.games} games · ${percent(c)}\nSeasons: ${c.seasons.map(s=>'S'+s).join(', ')}`)}" aria-label="${escape(teamDisplayName(c.color))}: ${c.count} games, ${percent(c)}">${c.percent>=12?`<span>${percent(c)}</span>`:''}</button>`).join('')}</div>${teamColorLegend(p,percent)}<p class="chart-caption">Share of games played on each recorded color. Hover, focus, or tap a segment for its seasons.</p></section>`;
}
let activeChartTarget,chartTooltipHideTimer;
function deferChartTooltipHide(){clearTimeout(chartTooltipHideTimer);chartTooltipHideTimer=setTimeout(hideChartTooltip,100);}
function hideChartTooltip(){clearTimeout(chartTooltipHideTimer);const tip=$('chart-tooltip');tip.hidden=true;activeChartTarget?.removeAttribute('aria-describedby');activeChartTarget?.classList.remove('chart-active');activeChartTarget=null;}
function displayChartTooltip(target,event){
  clearTimeout(chartTooltipHideTimer);
  const tip=$('chart-tooltip');if(activeChartTarget&&activeChartTarget!==target){activeChartTarget.removeAttribute('aria-describedby');activeChartTarget.classList.remove('chart-active');}activeChartTarget=target;target.classList.add('chart-active');
  tip.classList.toggle('death-time-tooltip',!!target.dataset.deathTip);
  const chartAccent=target.matches('.team-size-arc, .milestone-dot, .outcome-segment')?target.getAttribute('fill'):target.style.getPropertyValue('--season-button-color')||target.style.getPropertyValue('--calendar-color')||target.style.getPropertyValue('--team-color')||(target.matches('.pve-bar-row')?target.style.getPropertyValue('--cause'):'');
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
  }else if(target.dataset.killTip){
    tip.style.removeProperty('--tip-team');
    const {season,k,cumulative,played,victims}=JSON.parse(target.dataset.killTip);
    tip.innerHTML=`<strong>Season ${season}</strong><div class="kill-tip-season"><span>${played?k+' PVP kills':'Did not play'}</span>${victims.map(name=>`<span role="img" aria-label="${escape(name)}">${playerFace(name)}</span>`).join('')}</div><div>${cumulative} career PVP kills</div>`;
  }else if(target.matches('.outlast-bar')){
    tip.style.removeProperty('--tip-team');
    const [heading,...details]=target.dataset.chartTip.replace(/\\n/g,'\n').split('\n');
    tip.innerHTML='<strong>'+escape(heading)+'</strong>'+details.map(line=>'<div>'+escape(line)+'</div>').join('');
  }else if(target.dataset.damageTip){
    tip.style.removeProperty('--tip-team');
    tip.innerHTML=damageTooltip(JSON.parse(target.dataset.damageTip));
  }else if(target.dataset.potionTip){
    tip.style.removeProperty('--tip-team');
    const {season,parts}=JSON.parse(target.dataset.potionTip);
    tip.innerHTML=`<strong>Season ${season} · Potions</strong><ul class="potion-tip-list">${parts.map(p=>`<li>${potionTypeIcon(p)}<span>${escape(p.name)}</span><b>${p.count}</b></li>`).join('')}</ul>`;
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
    return profileSeasonTile(id,teamSize===1?null:h.color);
  }).join('')}</div>`;
}
function profileSeasonTile(id,color){
    const label=String(id).padStart(2,'0');
    const ink=color!=='Solo'?colors[color]:null;
    const mole=color==='Mole'&&molePalette(id).length>0;
    const team=ink?' · '+color+' team':'';
    return `<a href="#season-${id}" data-profile-season="${id}" aria-label="Season ${id}, played${escape(team)}"${ink?` class="profile-season-team${mole?' profile-season-mole':''}" style="--season-team:${ink};--season-ink:${['Black','Navy','Maroon','Mole'].includes(color)?'#fff':'#101216'};${mole?molePaint(id):''}"`:''}>${label}</a>`;
}
function bindProfileSeasonPreview(root,player){
  const cleanup=new AbortController(), options={signal:cleanup.signal};
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
  root.addEventListener('pointerdown',e=>{touch=e.pointerType==='touch';},options);
  root.addEventListener('pointerover',e=>{const link=tile(e);if(link&&e.pointerType!=='touch')show(link);},options);
  root.addEventListener('pointerout',e=>{const link=tile(e);if(link&&e.pointerType!=='touch'&&!link.contains(e.relatedTarget))hide();},options);
  root.addEventListener('focusin',e=>{const link=tile(e);if(link&&!touch)show(link);},options);
  root.addEventListener('focusout',e=>{if(tile(e)&&!touch)hide();},options);
  root.addEventListener('click',e=>{
    const link=tile(e);
    if(!link||!(e.pointerType==='touch'||touch&&e.detail>0))return;
    if(tapped===link){hide();return;}
    e.preventDefault();show(link);tapped=link;
  },options);
  const observer=new MutationObserver(()=>{if(!tip.isConnected){cleanup.abort();observer.disconnect();}else if(active&&!active.isConnected)hide();});
  observer.observe(root,{childList:true});
  document.addEventListener('pointerdown',e=>{if(!tile(e))hide();},{signal:cleanup.signal});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();},{signal:cleanup.signal});
  window.addEventListener('scroll',event=>{
    // Carousel scrolling does not move the season tile or its tooltip.
    if(event.target instanceof Element&&event.target.closest('.profile-photo-strip'))return;
    hide();
  },{passive:true,capture:true,signal:cleanup.signal});
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
const trophyColors={"dragon-head":"#725286","campfire":"#a45b25","drawn-bow":"#795331","arrow":"#677a84","flint-and-steel":"#78517f","diamond-pickaxe":"#267d83","apple":"#96691c","golden-apple":"#96691c","enchanted-apple":"#794aab","crown":"#956a20","golden-sword":"#8d671b","diamond-block":"#267d83","diamond-chestplate":"#237b83","diamond-sword":"#23787b","diamond":"#267d83","diamond-ore":"#306b74","trident":"#386d68","creeper":"#507b36","ender-eye":"#477d5b","ender-pearl":"#327269","blaze-powder":"#a44d16","slime-ball":"#507b36","lava-bucket":"#9b461f","lightning":"#9a553e","tnt":"#953e3d","rocket-science":"#883c54","bow":"#795331","crossbow":"#745840","raw-gold":"#916823","gold-ore":"#796034","potion":"#7c498d","wind-charge":"#466e87","hardcore-heart-full":"#8c4149","hardcore-heart-half":"#8c4149"};
const trophyColor=icon=>trophyColors[icon]||'#53647e';
const trophyDescriptions={"free-the-end":"Be on the team that slays the Ender Dragon.","long-shot":"Land the longest recorded ranged hit of the season.","major-miner":"Mine the most ore blocks in a season, counting all recorded ore types.","victor":"Win a season with your team.","ironman":"Be the last player to take damage.","perfect-ironman":"Finish a season without taking damage.","crown":"Claim the Crown.","top-fragger":"Tie or lead the season in PVP kills.","first-blood":"Get the first PVP kill of the season.","final-boss":"Be the final player killed in PVP.","team-wipe":"Personally eliminate an entire opposing team.","first-impression":"Get a PVP kill, win, earn Ironman, or acquire the Crown in your debut season.","sharpshooter":"Get at least two ranged kills in one match.","multiple-fire-kills":"Get at least two PVP kills using burn damage in one match.","triple-threat":"Win with a PVP kill and Ironman.","grand-slam":"Win with a PVP kill, Ironman, and the Crown at the end.","bounce-back":"Take first damage and still win.","phoenix":"Win after every teammate dies to PVE.","overpowered":"Eat an Enchanted Golden Apple.","lightning":"Get struck by lightning.","rocket-science":"Fire a firework from a crossbow.","the-end":"Enter the End."};
function trophyDescription(t){return trophyDescriptions[t.key]||(t.key.startsWith('multiple-')?'Get at least two PVP kills of this type in one match.':t.events[0].detail);}
function trophyEventDetail(t,event,player){
  if(t.key!=='victor')return escape(event.detail);
  const game=player.history.find(h=>h.season===event.season);
  const season=seasons.find(s=>s.id===event.season);
  const color=season?.teamSize===1?null:game?.color;
  const ink=color==='Black'?'#c5c8ce':color==='Navy'?'#9ab7ff':colors[color]||'var(--cream)';
  return `<span class="trophy-winning-team" style="color:${ink}">${escape(event.detail)}</span>`;
}
function trophySeasonButton(id,player){
  const game=player.history.find(h=>h.season===id),season=seasons.find(s=>s.id===id);
  const link=profileSeasonTile(id,season?.teamSize===1?null:game?.color)
    .replace(/ data-profile-season="\d+"/,'');
  return '<span class="profile-season-grid trophy-season-button">'+link+'</span>';
}
function bindTrophyDialog(root,trophies,player){
  const dialog=document.createElement('dialog');
  dialog.className='trophy-dialog';
  dialog.setAttribute('aria-labelledby','trophy-dialog-title');
  dialog.tabIndex=-1;
  root.append(dialog);
  const grid=root.querySelector('.trophy-grid');
  const preview=document.createElement('div');
  preview.className='trophy-hover-preview';
  preview.setAttribute('popover','manual');
  preview.setAttribute('aria-hidden','true');
  root.append(preview);
  const closePreview=()=>{if(preview.matches(':popover-open'))preview.hidePopover();};
  const entries=(t,links)=>(links?t.events:t.events.slice(0,4)).map(e=>`<li>${links?`<a href="#season-${e.season}">S${e.season}</a>`:`<b>S${e.season}</b>`}<span>${trophyEventDetail(t,e,player)}</span></li>`).join('');
  for(const tile of grid.querySelectorAll('[data-trophy]')){
    tile.addEventListener('pointerenter',event=>{
      if(event.pointerType!=='mouse'||dialog.open)return;
      const t=trophies[Number(tile.dataset.trophy)];
      preview.style.setProperty('--trophy-color',trophyColor(t.icon));
      preview.innerHTML=`<strong>${escape(t.label)}</strong><ul>${entries(t,false)}</ul>${t.events.length>4?'<p class="trophy-preview-more">Click to see all '+t.events.length+' entries.</p>':'<p class="trophy-preview-more">Click for more info.</p>'}`;
      preview.showPopover();
      const r=tile.getBoundingClientRect(),w=preview.offsetWidth,h=preview.offsetHeight;
      preview.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left+(r.width-w)/2))+'px';
      preview.style.top=Math.max(8,r.top>=h+8?r.top-h-6:Math.min(r.bottom+6,innerHeight-h-8))+'px';
    });
    tile.addEventListener('pointerleave',closePreview);
  }
  grid.addEventListener('keydown',event=>{if(event.key==='Escape')closePreview();});
  grid.addEventListener('click',event=>{
    const tile=event.target.closest('[data-trophy]');if(!tile)return;
    const t=trophies[Number(tile.dataset.trophy)];
    closePreview();
    dialog.style.setProperty('--trophy-color',trophyColor(t.icon));
    dialog.innerHTML=`<div class="trophy-dialog-header">${trophyImage(t.icon)}<h2 id="trophy-dialog-title">${escape(t.label)}<small class="trophy-earned">${escape(trophyDescription(t))}</small></h2><form method="dialog">${photoControl("close","","Close trophy details",false,"submit")}</form></div><p class="trophy-event-count">Earned ${t.count===1?'once':t.count+' times'}</p><ul>${t.events.map(e=>`<li>${trophySeasonButton(e.season,player)}<span>${trophyEventDetail(t,e,player)}</span></li>`).join('')}</ul>`;
    const seasonTile=root.querySelector('.profile-sidebar .profile-season-grid>a, .profile-sidebar .profile-season-grid>span');
    if(seasonTile){
      dialog.style.setProperty('--trophy-season-width',seasonTile.getBoundingClientRect().width+'px');
      dialog.style.setProperty('--trophy-season-height',seasonTile.getBoundingClientRect().height+'px');
    }
    dialog.showModal();
    dialog.focus({preventScroll:true});
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
const careerTabs=['Kills','Damage','Percent Outlasted','Ores Mined','Items Used','Teammates'];
const heartNumber=new Intl.NumberFormat('en',{maximumFractionDigits:2});
function damageHearts(value){
  return '<span class="damage-value">'+heartNumber.format(value)+'</span>';
}
const damageSources={
  arrow:['Arrow','arrow'],player_attack:['Melee','sword'],player_explosion:['Explosion','tnt'],spear:['Spear','iron-spear'],
  thorns:['Thorns','armor'],ender_pearl:['Ender Pearl','ender-pearl'],fall:['Fall Damage','feather'],
  freeze:['Freezing','ice-ball'],in_wall:['Suffocation','cobblestone'],lava:['Lava','lava-bucket'],
  on_fire:['Fire','magma-cream'],stalagmite:['Stalagmite','pointed-dripstone'],mob_attack:['Mob attack','sword']
};
const damageColumns={dealt:'PvP Dealt',taken:'PvP Taken',pve:'PvE Taken',friendlyDealt:'Friendly Fire Dealt',friendlyTaken:'Friendly Fire Taken'};
const damageSource=type=>damageSources[type]||[type.replaceAll('_',' '),'sword'];
function damageTooltip({season,field,entries}){
  const pve=field==='pve';
  return `<strong>S${season} · ${damageColumns[field]}</strong>${entries.length?`<ul class="damage-tip-list${pve?' damage-tip-pve':''}">${entries.map(e=>{
    const name=pve?(damageSources[e.name]?.[0]||e.name):e.name;
    const statsName=e.name==='fall'?'Falling':name;
    const icon=pve?(statsName==='Freezing'?trophyImage('ice-ball'):pveIcon(statsName)):playerFace(name);
    const sources=e.sources.map(type=>{const [label,icon]=damageSource(type);return `<span class="damage-tip-source">${trophyImage(icon)} ${escape(label)}</span>`;}).join(', ');
    const match=pve?null:seasons.find(s=>s.id===season);
    const member=match?.players.find(r=>profileIdentity(r.name)===name);
    const team=match?.teamSize!==1&&member?.color!=='Solo'?colors[member?.color]:null;
    return `<li${team?` class="damage-tip-team" style="--damage-team:${team}"`:''}><span class="damage-tip-icon">${icon}</span><span>${escape(name)}</span><span class="damage-tip-values">${heartNumber.format(e.red)} ${trophyImage('damage-red-heart')} · ${heartNumber.format(e.yellow)} ${trophyImage('damage-yellow-heart')}</span>${pve?'':`<span class="damage-tip-sources">(${sources})</span>`}</li>`;
  }).join('')}</ul>`:'<div>No damage recorded.</div>'}`;
}
function damageTable(games){
  const headings=['Season','Hearts','PvP dealt','PvP taken','PvE taken','Health regained','Friendly Fire Dealt','Friendly Fire Taken'];
  return `<div class="table-wrap"><table class="career-table damage-table" aria-label="Damage by season: red health and yellow absorption hearts"><thead><tr>${headings.map(h=>'<th scope="col">'+h+'</th>').join('')}</tr></thead>${games.map(g=>{
    const d=g.damage;
    const line=kind=>{
      const isRed=kind==='red',stats=d[kind];
      const healing=isRed?(d.regained==null?'—':damageHearts(d.regained)):'<span title="Absorption is not health regained">—</span>';
      const label=isRed?'Red hearts':'Yellow absorption hearts';
      const cell=field=>{
        const value=stats[field],summary=damageColumns[field]+' · '+label+': '+heartNumber.format(value);
        return `<td ${chartTip(summary)} data-damage-tip="${escape(JSON.stringify({season:g.season,field,entries:d.breakdown?.[field]||[]}))}">${damageHearts(value)}</td>`;
      };
      return `<tr class="damage-row-${kind}">${isRed?'<th scope="rowgroup" rowspan="2"><a href="#season-'+g.season+'">S'+g.season+'</a></th>':''}<th scope="row" title="${label}"><span class="damage-heart-preview">${trophyImage(isRed?'damage-red-heart':'damage-yellow-heart')}</span><span class="sr-only">${label}</span></th>${cell('dealt')}${cell('taken')}${cell('pve')}<td>${healing}</td>${cell('friendlyDealt')}${cell('friendlyTaken')}</tr>`;
    };
    return '<tbody>'+line('red')+line('yellow')+'</tbody>';
  }).join('')}</table></div>`;
}
function careerContent(p,index){
  if(index===0)return '<h3 class="chart-subheading">PvP kills by season and career total</h3><div class="chart-legend"><span class="chart-bar">PvP kills · left axis</span><span class="chart-line">Career kills · right axis</span></div>'+killChart(p)+'<p class="chart-caption">Hover or focus a bar for details. Grey marks an unplayed season.</p>';
  if(index===2)return '<h3 class="chart-subheading">Players outlasted per season</h3>'+survivalChart(p)+'<p class="chart-caption">Survivors outlast 100% of other participants. Equal death times do not count.</p>';
  if(index===1){
    const games=p.history.filter(g=>g.damage);
    if(!games.length)return '<p class="chart-caption">No damage data available for this player. The supplied damage report covers Season 37.</p>';
    return damageTable(games);
  }
  if(index===5)return careerTeammates(p);
  return careerMetricCharts(p,index===3?oreMetrics:miscMetrics);
}
const oreMetrics=[['Diamond Ore','diamond','#58dce5',0],['Gold Ore','raw-gold','#efc365',1]];
const miscMetrics=[['Potions','potion','#c296fa',2],['Golden Apples','golden-apple','#efc365',3],['Enchanted Golden Apples','enchanted-apple','#e18bff',4],['Ender Pearls','ender-pearl','#62d5b0',5]];
const potionStyles={Regeneration:['#ef72ac',0],Healing:['#dc605d',45],Strength:['#b570dd',305],Swiftness:['#6bbde5',220],Poison:['#88af48',120],'Fire Resistance':['#eda759',85],Unknown:['#8992a0',0]};
function potionParts(game,total){
  const entries=Object.entries(game.potionBreakdown||{}).filter(([,n])=>n>0);
  const untyped=total-entries.reduce((n,[,count])=>n+count,0);
  if(untyped>0)entries.push(['Unknown',untyped]);
  return entries.map(([name,count],i)=>{
    const [color,hue]=potionStyles[name]||[`hsl(${(i*137+38)%360} 62% 63%)`,(i*137+38)%360];
    return {name,count,color,hue};
  });
}
function potionTypeIcon(part){
  return `<span class="potion-type-icon" style="--potion-hue:${part.hue}deg;--potion-color:${part.color}">${trophyImage('potion')}</span>`;
}
const otherOreItems=[['coal','Coal','coal'],['copper','Copper','raw-copper'],['iron','Iron','raw-iron'],['lapis','Lapis','lapis-lazuli'],['redstone','Redstone','redstone'],['emerald','Emerald','emerald'],['nether_quartz','Quartz','quartz'],['ancient_debris','Ancient Debris','ancient-debris']];
function otherOreCells(game){
 if(!game.otherOres)return '';
 return `<div class="career-other-ores" aria-label="Other ore blocks mined">${otherOreItems.map(([key,label,icon])=>`<span class="career-ore-cell" title="${label}: ${game.otherOres[key]}" role="img" aria-label="${label}: ${game.otherOres[key]}">${trophyImage(icon)}<b aria-hidden="true">${game.otherOres[key]}</b></span>`).join('')}</div>`;
}
function careerMetricCharts(p,metrics){
  const games=p.history.filter(game=>metrics.some(([, , ,field])=>game.metrics?.[field]!=null));
  if(!games.length)return '<p class="chart-caption">No recorded data for this player.</p>';
  const max=Math.max(1,...games.flatMap(game=>metrics.map(([, , ,field])=>game.metrics?.[field]??0)));
  return `<div class="career-metric-legend">${metrics.map(([label,icon])=>`<span>${trophyImage(icon)} ${label}</span>`).join('')}</div>
    <div class="career-metric-plot">${games.map(game=>`<section class="career-metric-season" aria-label="Season ${game.season}">
      <a href="#season-${game.season}">S${game.season}</a>
      <div class="career-metric-bars">${metrics.map(([label,icon,color,field])=>{
        const value=game.metrics?.[field];
        if(value==null)return '';
        if(field===2){
          const parts=potionParts(game,value);
          const summary='Season '+game.season+' · '+(parts.map(p=>p.name+': '+p.count).join(', ')||'No potions used');
          return `<div class="career-metric-bar" style="--bar-width:${100*value/max}%" ${chartTip(summary)} ${parts.length?`data-potion-tip="${escape(JSON.stringify({season:game.season,parts}))}"`:''}>${trophyImage(icon)}<span class="career-metric-track" aria-hidden="true"><span class="potion-segments">${parts.map(p=>`<i style="flex:${p.count};background:${p.color}"></i>`).join('')}</span></span><b aria-hidden="true">${value}</b></div>`;
        }
        return `<div class="career-metric-bar" aria-label="${label}: ${value}" role="img" style="--bar-color:${color};--bar-width:${100*value/max}%">
          ${trophyImage(icon)}<span class="career-metric-track" aria-hidden="true"><span></span></span><b aria-hidden="true">${value}</b></div>`;
      }).join('')}${metrics===oreMetrics?otherOreCells(game):''}</div></section>`).join('')}</div>`;
}
function careerTeammates(p){
  const byPlayer=new Map();
  const teamKey=r=>r.color&&r.color!=='Solo'?'color:'+r.color:r.team?'name:'+r.team:null;
  for(const season of seasons){
    if(season.teamSize===1)continue;
    const member=season.players.find(r=>profileIdentity(r.name)===p.name);
    const key=member&&teamKey(member);
    if(!key)continue;
    const roster=season.players.filter(r=>teamKey(r)===key);
    const names=[...new Set(roster.map(r=>profileIdentity(r.name)))];
    for(const name of names){
      if(name===p.name)continue;
      if(!byPlayer.has(name))byPlayer.set(name,[]);
      byPlayer.get(name).push({id:season.id,color:member.color,team:member.team||member.color,roster:names});
    }
  }
  const rows=[...byPlayer].filter(([,games])=>games.length>1).sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0]));
  const once=byPlayer.size-rows.length;
  return `<p class="teammate-once">Not Depicted: Teamed up with ${once} other ${once===1?'player':'players'} in just one season.</p><div class="career-teammate-rows" tabindex="0" aria-label="Repeat teammates by season">${rows.map(([name,games])=>{
    const head=playerFace(name),title=escape(name);
    return `<div class="career-teammate-row"><div class="profile-season-grid career-teammate-nodes">${games.sort((a,b)=>b.id-a.id).map(g=>profileSeasonTile(g.id,g.color)).join('')}</div>${profileByName(name)?`<a class="career-teammate-head" href="${profileHref(name)}" title="${title}" aria-label="Open ${title}'s profile">${head}</a>`:`<span class="career-teammate-head" title="${title}" role="img" aria-label="${title}">${head}</span>`}</div>`;
  }).join('')||'<p>No repeat teammates recorded.</p>'}</div>`;
}
function careerCurve(p){
  return '<section class="profile-section"><div class="career-tabs" role="tablist" aria-label="Career Curve">'+careerTabs.map((label,i)=>'<button type="button" role="tab" id="career-tab-'+i+'" aria-controls="career-panel" aria-selected="'+(i===0)+'" tabindex="'+(i===0?0:-1)+'" class="'+(i===0?'active':'')+'">'+label+'</button>').join('')+'</div><div id="career-panel" role="tabpanel" aria-labelledby="career-tab-0" tabindex="0">'+careerContent(p,0)+'</div></section>';
}
function bindCareerCurve(root,p){
  const buttons=[...root.querySelectorAll('.career-tabs button')], panel=root.querySelector('#career-panel');
  const select=i=>{
    buttons.forEach((button,j)=>{button.classList.toggle('active',i===j);button.setAttribute('aria-selected',String(i===j));button.tabIndex=i===j?0:-1;});
    panel.setAttribute('aria-labelledby',buttons[i].id);
    panel.innerHTML=careerContent(p,i);
    if(i===5){const tile=root.querySelector('.profile-sidebar .profile-season-grid > a');if(tile){panel.style.setProperty('--teammate-tile-width',tile.offsetWidth+'px');panel.style.setProperty('--teammate-tile-height',tile.offsetHeight+'px');}}
  };
  buttons.forEach((button,i)=>{
    button.addEventListener('click',()=>select(i));
    button.addEventListener('keydown',e=>{
      const next={ArrowRight:(i+1)%buttons.length,ArrowLeft:(i+buttons.length-1)%buttons.length,Home:0,End:buttons.length-1}[e.key];
      if(next===undefined)return;
      e.preventDefault();select(next);buttons[next].focus();
    });
  });
}
function profileOutcomes(p){
  const disconnects=p.history.filter(game=>game.type==='Disconnect').length;
  const disqualifications=p.history.filter(game=>game.type==='Disqualified').length;
  return [
    p.pvpDeaths+' PVP', p.pveDeaths+' PVE',
    p.teamKillDeaths+(p.teamKillDeaths===1?' Team Kill':' Team Kills'),
    disconnects?disconnects+(disconnects===1?' Disconnect':' Disconnects'):null,
    disqualifications?disqualifications+(disqualifications===1?' Disqualification':' Disqualifications'):null
  ].filter(Boolean).join(' · ');
}
function historyHighlight(player,record,key){
 const award=player.trophies.find(t=>t.key===key)?.events.find(e=>e.season===record.season);
 const label=key==='ironman'?'Ironman':'Crown';
 const detail=award?.detail||(key==='ironman'?'Last player to take damage this season.':'Acquired the Crown this season.');
 return '<button type="button" class="history-highlight" '+chartTip(label+' · Season '+record.season+'\n'+detail)+' aria-label="'+escape(label)+'">'+trophyImage(key==='ironman'?'iron-chestplate':'crown')+'</button>';
}
function showPlayer(name){
  profilePhotosCleanup();
  profileSidebarObserver.disconnect();
  const p=profileByName(name);
  $('player-directory').hidden=true;$('full-profile').hidden=false;
  if(!p){$('full-profile').innerHTML='<div class="empty"><h2>Profile unavailable</h2><p>A full player profile requires at least five recorded games.</p><a href="#players">Return to Players</a></div>';return;}
  const played=p.history.map(h=>h.season),trophy=p.trophies;
  const photos=shuffledPhotosForPlayer(p);
  const shuffledTrivia=[...p.trivia];
  for(let i=shuffledTrivia.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [shuffledTrivia[i],shuffledTrivia[j]]=[shuffledTrivia[j],shuffledTrivia[i]];
  }
  $('full-profile').innerHTML=`<a class="profile-back" href="#players">← All players</a><div class="profile-body"><aside class="profile-sidebar" aria-label="Career notes"><section class="profile-section"><header class="profile-hero"><h1>${escape(p.name)}</h1><div class="portrait">${playerFace(p.name)}</div><div class="profile-identity">${p.aliases.length?`<p class="aliases"><span class="profile-alias-label">Former names:</span> <span>${p.aliases.map(escape).join(', ')}</span></p>`:''}</div></header><dl><dt>Seasons played (${p.history.length})</dt><dd>${profileSeasonGrid(p.history)}</dd><dt>Most common team color</dt><dd class="profile-common-colors">${p.commonColors.map(profileColorNote).join('')}</dd><dt>Most frequent teammate${p.topTeammates.length===1?'':'s'}</dt><dd>${topPeople(p.topTeammates)}</dd><dt>Most frequent PVP victim${p.topVictims.length===1?'':'s'}</dt><dd>${profilePvpPairs(p,p.topVictims,true)}</dd><dt>Most frequent PVP killer${p.topKillers.length===1?'':'s'}</dt><dd>${profilePvpPairs(p,p.topKillers,false)}</dd><dt>Death outcomes</dt><dd>${profileOutcomes(p)}</dd>${p.teamKills?`<dt>Team Kills committed</dt><dd>${p.teamKills} (excluded from PVP kills)</dd>`:''}</dl></section></aside><div class="profile-primary"><section class="profile-section profile-trophies"><div class="profile-section-title trophy-case-title"><h2>Trophy case<span>.</span></h2><p class="trophy-hint"><span class="trophy-hover-hint">Click on a trophy for more details.</span><span class="trophy-tap-hint">Click on a trophy for more details.</span></p></div><div class="trophy-grid">${trophy.map((t,i)=>`<button type="button" class="trophy trophy-tile" data-trophy="${i}" style="--trophy-color:${trophyColor(t.icon)}" aria-haspopup="dialog">${trophyImage(t.icon)}<strong>${escape(t.label)}</strong>${t.count>1?`<span class="trophy-count" aria-label="Earned ${t.count} times">${t.count}x</span>`:''}<small>${[...new Set(t.events.map(e=>'S'+e.season))].join(' · ')}</small></button>`).join('')||'<p class="unknown">No trophies recorded yet.</p>'}</div></section><section class="profile-section profile-trivia"><h2>Trivia<span>.</span></h2><ul class="trivia-list" tabindex="0" aria-label="Player trivia">${shuffledTrivia.map(t=>`<li>${escape(t)}</li>`).join('')||'<li>More milestones will appear as the record grows.</li>'}</ul></section><div class="profile-followup">${careerCurve(p)}${profilePhotosPanel(p,photos)}${teamColorChart(p)}<section class="profile-section"><div class="profile-section-title"><h2>Season by season<span>.</span></h2></div><div class="table-wrap"><table class="career-table season-history-table"><thead><tr><th>Season</th><th>Team</th><th>Kills</th><th>Highlights</th><th>Death / result</th></tr></thead><tbody>${p.history.map(r=>`<tr class="${r.color==='Mole'?'mole-row':''}" style="${r.color==='Mole'?molePaint(r.season):''}--team:${colors[r.color]||'#b3bda9'}"><td data-label="Season"><a href="#season-${r.season}">S${r.season}</a></td><td data-label="Team">${historyTeamLink(r.team,r.color,r.season)}${r.moleFor?`<small class="mole-cover">Cover team: <b style="color:${colors[r.moleFor]||'#c7d2e5'}">${escape(r.moleFor)}</b></small>`:''}</td><td data-label="Kills">${r.kills}</td><td data-label="Highlights">${[r.win?'Victory':null,r.iron?historyHighlight(p,r,'ironman'):null,r.crownAcquired?historyHighlight(p,r,'crown'):null].filter(Boolean).join(' · ')||'—'}</td><td data-label="Death / result">${escape(r.death||'No death recorded')}${r.seconds!=null?` <span class="elapsed">${duration(r.seconds)}</span>`:''}</td></tr>`).join('')}</tbody></table></div></section></div></div></div>`;
  bindProfileSeasonPreview($('full-profile'),p);
  bindTrophyDialog($('full-profile'),trophy,p);
  bindCareerCurve($('full-profile'),p);
  bindProfilePhotos($('full-profile'),p,photos);
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

