const seasons = window.UHC_DATA;
const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors = {Green:'#68c185',Purple:'#b294ef',Blue:'#78b6ff',Yellow:'#ffe052',Red:'#f27f85',Pink:'#f0a0cd',Orange:'#ff983f',Maroon:'#ad3636',Cyan:'#36adad',Navy:'#3636ad',Black:'#17181c',White:'#f2f3f5',Lime:'#c1e879',Turquoise:'#70e5e5',Mole:'#c6b5e8',Solo:'#b0b6c2'};
const date = value => new Date(value+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric',timeZone:'UTC'});
const duration = seconds => seconds == null ? 'N/A' : `${Math.floor(seconds/3600)}:${String(Math.floor(seconds%3600/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
const minecraftVersion = value => String(value ?? '').split('.').map(part => /^\d+$/.test(part) ? String(Number(part)) : part).join('.');
const face = '<img src="steve.webp" class="face" alt="" width="25" height="25">';
const crown = s => s.crown ? `<span class="crown"><a class="crown-link" href="#about-crown" aria-label="About the Crown; held by ${escape(s.crown.name)}" aria-describedby="crown-tooltip-${s.id}"><img class="crown-icon" src="${window.UHC_ICONS.crown}" alt="" width="22" height="14"></a><span class="tooltip" role="tooltip" id="crown-tooltip-${s.id}"><b>${escape(s.crown.name)} · Season ${s.id}</b>${escape(s.crown.method)}${s.crown.acquired ? '' : '<br>Crown retained from an earlier season.'}</span></span>` : '';
function placeTooltip(button){const tip=button.parentElement.querySelector('.tooltip'),r=button.getBoundingClientRect();tip.style.position='fixed';tip.style.left=Math.max(12,Math.min(window.innerWidth-252,r.left-60))+'px';tip.style.top=(r.bottom+120>window.innerHeight?Math.max(12,r.top-115):r.bottom+8)+'px';}
document.addEventListener('pointerover',e=>{const b=e.target.closest('.crown-link');if(b)placeTooltip(b);});
document.addEventListener('focusin',e=>{const b=e.target.closest('.crown-link');if(b)placeTooltip(b);});
function seasonPlayerRow(s,p){return `<tr class="${p.color==='Mole'?'mole-row':''}" style="${p.color==='Mole'?molePaint(s.id):''}--team:${colors[p.color]||'#b3bda9'}"><td><div class="player-cell">${playerFace(p.name)}<button class="player-name" data-player="${escape(p.name)}">${escape(p.name)}</button>${s.crown?.name===p.name?crown(s):''}${!/^Disqualif/i.test(p.type||'')&&p.achievement==='Ironman'?'<span class="badge iron" title="Last player to take damage this season">◈ Ironman</span>':''}${p.roamer?'<span class="badge roamer-badge">Roamer</span>':''}${p.debut?'<span class="badge debut" title="First appearance of this exact name in the records">Debut</span>':''}</div></td>${s.teamSize===1?'':`<td><div class="season-team-label"><span class="team-name">${historyTeamLink(p.team,p.color,s.id)}</span>${p.moleFor?`<small class="mole-cover">Cover team: <b style="color:${colors[p.moleFor]||'#c7d2e5'}">${escape(p.moleFor)}</b></small>`:''}</div></td>`}<td class="death">${escape(p.death||'N/A')}</td><td class="elapsed ${p.seconds==null?'unknown':''}">${duration(p.seconds)}</td></tr>`;}
function teamJoinRow(s,event){
 const label=event.kind==='formed'?'Team formed':event.kind==='roamer'?'Roamer joined':'Team joined';
 return `<tr class="team-join-row" style="--team:${colors[event.color]||'#b0b6c2'};--join-accent:${event.color==='Black'?'#b7c5da':event.color==='Navy'?'#9ab7ff':colors[event.color]||'#b0b6c2'}" data-join-seconds="${event.seconds}"><td colspan="3"><div class="team-join-content"><span class="team-join-marker" aria-hidden="true">+</span><div class="team-join-body"><div class="team-join-heading"><span>${label}</span><strong title="${escape(event.color)}">${historyTeamLink(event.team,event.color,s.id)}</strong></div><div class="team-join-members">${event.names.map(name=>`<span class="team-join-person">${playerFace(name)}<button class="player-name" data-player="${escape(name)}">${escape(name)}</button></span>`).join('')}</div></div></div></td><td class="elapsed team-join-time">${duration(event.seconds)}</td></tr>`;
}
function seasonLogRows(s){
 if(!s.teamJoins?.length)return s.players.map(p=>seasonPlayerRow(s,p)).join('');
 const log=[...s.players.map((player,index)=>({player,seconds:player.seconds??Infinity,index})),...s.teamJoins.map((join,index)=>({join,seconds:join.seconds,index}))];
 log.sort((a,b)=>a.seconds-b.seconds||(a.join?0:1)-(b.join?0:1)||a.index-b.index);
 return log.map(e=>e.join?teamJoinRow(s,e.join):seasonPlayerRow(s,e.player)).join('');
}
function card(s){
  const iron=s.players.filter(p=>!/^Disqualif/i.test(p.type||'')&&p.achievement==='Ironman').map(p=>p.name).join(', ');
  const firstDamage=s.players.filter(p=>p.achievement==='First Damage').map(p=>p.name).join(', ');
  return `<article class="season-card" id="season-${s.id}"><header class="season-top"><div class="season-number"><small>SEASON</small><strong>${String(s.id).padStart(2,'0')}</strong></div><div class="season-info"><h3>${date(s.date)}</h3><div class="metadata"><span>${s.players.length} participants</span><span>${s.teamSize===1?'Solo':`Teams of ${s.teamSize}`}</span><span${s.mode==='War'?` ${chartTip('War\nTwo large teams face each other.')}`:''}>${escape(s.mode)}</span>${s.dragon?'<span>Ender Dragon</span>':''}<span>v${escape(minecraftVersion(s.version))}</span>${s.hasRoamers?`<span class="season-roamer-flag" ${chartTip('Roamer game\nOne or more players started without a team while most others started with teammates.')}>Roamer game</span>`:''}</div><div class="faces" aria-label="Season participants">${s.players.map(p=>`<span title="${escape(p.name)}">${playerFace(p.name)}</span>`).join('')}</div></div><div class="time-box"><strong>${duration(s.seconds)}</strong><small>LAST RECORDED ELIMINATION</small></div></header><div class="achievement-strip"><span>◈ <b>Ironman</b> ${escape(iron || 'Not recorded')}</span>${firstDamage?`<span>First damage · ${escape(firstDamage)}</span>`:''}</div><div class="table-wrap" tabindex="0" role="region" aria-label="Season ${s.id} results"><table><caption>Season ${s.id} results${s.teamJoins?.length?' and team-joining events in chronological order':' in workbook order'}</caption><thead><tr><th scope="col">Player</th>${s.teamSize===1?'':'<th scope="col">Team</th>'}<th scope="col">Death / result</th><th scope="col">Time</th></tr></thead><tbody>${seasonLogRows(s)}</tbody></table></div><footer class="season-bottom"><span>${s.crown?`Crown after this season · <b>${escape(s.crown.name)}</b> ${s.players.some(p=>p.name===s.crown.name)?'':crown(s)}`:'Crown not recorded'}</span><span>Season ${s.id} · ${s.players.filter(p=>p.debut).length} debuts</span></footer></article>`;
}
function seasonFilterValue(season,category){
 return category==='size'?String(season.teamSize):category==='mode'?season.mode:category==='version'?minecraftVersion(season.version):season.date.slice(0,4);
}
function updateSeasonFilterOptions(){
 const category=$('season-filter-category').value||'year';
 const all={year:'All years',size:'All sizes',mode:'All modes',version:'All'};
 const values=[...new Set(seasons.map(s=>seasonFilterValue(s,category)))].sort((a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true}));
 const label=value=>category==='size'?(value==='1'?'Solo':'Teams of '+value):category==='version'?'v'+value:value;
 $('year').innerHTML='<option value="">'+all[category]+'</option>'+values.map(value=>'<option value="'+escape(value)+'">'+escape(label(value))+'</option>').join('');
 $('year').value='';$('year').title=all[category];
 $('season-filter-value-label').textContent='Filter by '+{year:'year',size:'team size',mode:'gamemode',version:'version'}[category];
}
function filtered(){
  const q=$('search').value.trim().toLowerCase(),filterValue=$('year').value,category=$('season-filter-category').value||'year';
  const seasonQuery=q.match(/^(?:s|season\s*)?(\d+)$/);
  return seasons.filter(s=>(!filterValue||seasonFilterValue(s,category)===filterValue)&&(!q||(seasonQuery?s.id===Number(seasonQuery[1]):s.players.some(p=>[p.name,p.team,p.color,p.moleFor,p.roamer?'roamer':null].some(v=>v?.toLowerCase().includes(q)))))).sort((a,b)=>$('order').value==='new'?b.id-a.id:a.id-b.id);
}
let observer;
function render(){const visible=filtered();$('result-count').textContent=`${visible.length} of ${seasons.length} seasons`;$('season-list').innerHTML=visible.map(card).join('')||'<div class="empty">No seasons found. Try another search or filter.</div>';document.querySelectorAll('.season-index a').forEach(a=>a.classList.toggle('filtered',!visible.some(s=>s.id===Number(a.dataset.season))));observer?.disconnect();observer=new IntersectionObserver(entries=>{const current=entries.find(e=>e.isIntersecting);if(current)document.querySelectorAll('.season-index a').forEach(a=>a.classList.toggle('selected',a.hash===`#${current.target.id}`));},{rootMargin:'-90px 0px -65% 0px'});document.querySelectorAll('.season-card').forEach(c=>observer.observe(c));}
function tab(){
 const hash=location.hash.slice(1);
 const selected=hash==='about'||hash.startsWith('about-')?'about':hash==='rankings'||hash==='rankings-players'||hash.startsWith('rank-player-')||hash.startsWith('team-color-')?'rankings':hash==='players'||hash.startsWith('player-')?'players':['stats','trivia'].includes(hash)?hash:'seasons';
 for(const page of ['seasons','players','stats','rankings','trivia','about'])$(page+'-view').hidden=selected!==page;
 $('placeholder-view').hidden=true;
 if(selected==='trivia')renderTrivia();if(selected==='rankings')rankingsRoute();if(selected==='stats')renderStats();if(selected==='players')playersRoute();
 document.querySelectorAll('[data-tab]').forEach(a=>{a.classList.toggle('active',a.dataset.tab===selected);if(a.dataset.tab===selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 if(selected==='about')requestAnimationFrame(()=>{if(hash==='about')window.scrollTo?.({top:0,behavior:'instant'});else document.getElementById(hash)?.scrollIntoView?.({block:'start'});});
}
$('unique-count').textContent=profileData.recordedPlayers;
$('season-index').innerHTML=seasons.map(s=>`<a href="#season-${s.id}" data-season="${s.id}" aria-label="Go to season ${s.id}">${String(s.id).padStart(2,'0')}</a>`).join('');
const originalFilterWidth=$('year').getBoundingClientRect?.().width;
if(originalFilterWidth&&window.innerWidth>720){$('year').style.width=(originalFilterWidth+10)+'px';$('season-filter-category').style.width=originalFilterWidth+'px';}
updateSeasonFilterOptions();
$('season-filter-category').addEventListener('change',()=>{updateSeasonFilterOptions();render();});
$('search').addEventListener('input',render);$('year').addEventListener('change',()=>{$('year').title=$('year').selectedOptions[0]?.textContent||'';render();});$('order').addEventListener('change',render);
$('reset').addEventListener('click',()=>{$('search').value='';$('season-filter-category').value='year';updateSeasonFilterOptions();$('order').value='old';render();});
$('season-index').addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;if(!filtered().some(s=>s.id===Number(a.dataset.season))){$('search').value='';$('year').value='';render();}tab();});
document.addEventListener('click',e=>{
  const player=e.target.closest('[data-player]');if(!player)return;
  const name=player.dataset.player,profile=profileByName(name);
  if(profile){location.hash=profileHref(profile.name);return;}
  const identity=profileIdentity(name);
  const formerName=identity==='Wheellerr'?'Wheelin_n_Dealin':'';
  const appearances=seasons.filter(s=>s.players.some(p=>profileIdentity(p.name)===profileIdentity(name)));
  $('player-content').innerHTML=`<p class="eyebrow">PLAYER RECORD</p><h2>${escape(identity)}</h2>${formerName?'<p>Former name: '+escape(formerName)+'</p>':''}<p>${appearances.length} recorded appearances · Debut in Season ${appearances[0].id}</p><table><thead><tr><th>Season</th><th>Team</th><th>Achievement</th></tr></thead><tbody>${appearances.map(s=>{const p=s.players.find(p=>profileIdentity(p.name)===identity);return `<tr><td><a href="#season-${s.id}" class="history-link">S${s.id}</a></td><td>${escape(p.team||p.color||'N/A')}</td><td>${escape(p.achievement||'—')}</td></tr>`;}).join('')}</tbody></table>`;$('player-dialog').showModal();
});
$('player-dialog').querySelector('.close').addEventListener('click',()=>$('player-dialog').close());
$('player-dialog').addEventListener('click',e=>{if(e.target.closest('.history-link')){$('player-dialog').close();$('search').value='';$('year').value='';render();tab();}if(e.target===$('player-dialog')){const r=$('player-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('player-dialog').close();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.crown.open').forEach(c=>{c.classList.remove('open');c.querySelector('button').setAttribute('aria-expanded','false');});});
window.addEventListener('hashchange',()=>{tab();if(location.hash==='#players'||location.hash.startsWith('#player-'))window.scrollTo({top:0,behavior:'instant'});if(/^#season-\d+$/.test(location.hash)){const id=Number(location.hash.split('-')[1]);if(seasons.some(s=>s.id===id)&&!document.getElementById(`season-${id}`)){$('search').value='';$('year').value='';render();}document.getElementById(`season-${id}`)?.scrollIntoView();}});
$('season-total').textContent=seasons.length;$('archive-years').textContent=seasons[0].date.slice(0,4)+'–'+seasons.at(-1).date.slice(0,4);$('season-range').textContent=String(seasons[0].id).padStart(2,'0')+'—'+String(seasons.at(-1).id).padStart(2,'0');$('archive-footer').textContent=seasons.length+' matches. A decade of stories.';initializeStats();initializePlayers();initializeRankings();initializePlayerRankings();initializeTrivia();render();tab();if(/^#season-\d+$/.test(location.hash))requestAnimationFrame(()=>document.querySelector(location.hash)?.scrollIntoView());

function initializeBackToTopPearl(){
 const button=$('back-to-top-pearl'),icon=button.querySelector('img');
 icon.src=window.UHC_ICONS['ender-pearl'];
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let throwing=false;
 const sync=()=>{button.hidden=scrollY<=0||throwing;};
 function burst(x,y){
  for(let i=0;i<20;i++){
   const speck=document.createElement('i'),angle=i*Math.PI*2/20,range=24+i%5*11;
   speck.className='pearl-particle';speck.style.left=x+'px';speck.style.top=y+'px';
   speck.style.background=['#ca83ff','#8f5bd3','#edbaff','#653ba8'][i%4];
   document.body.append(speck);
   speck.animate([{transform:'translate(0,0)',opacity:1},{transform:'translate('+Math.cos(angle)*range+'px,'+Math.sin(angle)*range+'px) scale(.35)',opacity:0}],{duration:380+i%4*75,easing:'ease-out'}).finished.then(()=>speck.remove());
  }
 }
 button.addEventListener('click',async()=>{
  if(throwing)return;
  const r=button.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
  const finishX=Math.max(26,x-56),finishY=Math.min(96,innerHeight/3);
  const keyboard=button.matches(':focus-visible');
  throwing=true;sync();
  try{
   if(!motion.matches){
    const pearl=icon.cloneNode();pearl.className='pearl-projectile';pearl.style.left=x-15+'px';pearl.style.top=y-15+'px';document.body.append(pearl);
    try{await pearl.animate([{transform:'translate(0,0) rotate(0deg)'},{transform:'translate(-85px,'+(finishY-y)*.56+'px) rotate(-100deg)',offset:.55},{transform:'translate('+(finishX-x)+'px,'+(finishY-y)+'px) rotate(-200deg) scale(.7)'}],{duration:360,easing:'ease-out'}).finished;}finally{pearl.remove();}
   }
   if(keyboard){
    const heading=[...document.querySelectorAll('h1')].find(el=>el.getClientRects().length);
    if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
   }
   window.scrollTo({top:0,behavior:'instant'});
   if(!motion.matches)burst(finishX,finishY);
  }finally{throwing=false;sync();}
 });
 window.addEventListener('scroll',sync,{passive:true});
 window.addEventListener('pageshow',sync);
 sync();
}
initializeBackToTopPearl();
