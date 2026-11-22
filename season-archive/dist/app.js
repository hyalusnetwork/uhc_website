
function seasonFooterActions(id){
 const info='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="7.5" r="1.2" fill="currentColor"/></svg>';
 const youtube='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" fill="#e65b63"/><path d="m10 8 6 4-6 4Z" fill="#fff"/></svg>';
 return '<span class="season-footer-actions"><button type="button" data-season-menu="info" data-season-id="'+id+'" aria-label="Season '+id+' information" data-season-hint="Season information" aria-haspopup="dialog">'+info+'</button><button type="button" data-season-menu="videos" data-season-id="'+id+'" aria-label="Season '+id+' YouTube videos" data-season-hint="Click to show season videos" aria-haspopup="dialog">'+youtube+'</button></span>';
}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-season-menu]');if(!button)return;
 const season=seasons.find(s=>s.id===Number(button.dataset.seasonId));if(!season)return;
 let dialog=document.getElementById('season-menu-dialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='season-menu-dialog';dialog.className='season-menu-dialog';document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});}
 const videos=window.UHC_SEASON_VIDEOS?.[season.id]||[];

 const isVideo=button.dataset.seasonMenu==='videos';
 dialog.classList.toggle('season-menu-is-video',isVideo);
 const play='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 10 6-10 6Z" fill="currentColor"/></svg>';
 const content=isVideo?'<p class="season-menu-intro">'+videos.length+' available video'+(videos.length===1?'':'s')+' · Choose a perspective to watch.</p><ul class="season-menu-videos">'+videos.map((v,i)=>'<li><a href="https://www.youtube.com/watch?v='+v.id+'" target="_blank" rel="noopener noreferrer"><span class="season-video-play">'+play+'</span><span class="season-video-copy"><strong>'+escape(v.title)+'</strong><small>WATCH ON YOUTUBE</small></span><span class="season-video-external" aria-hidden="true">↗</span></a></li>').join('')+'</ul><a class="season-playlist-link" href="https://www.youtube.com/playlist?list=PL2lIZSsagJkI2UD_VM5v6c2ksedvxIaCL" target="_blank" rel="noopener noreferrer">Browse the full UHC playlist ↗</a>':'<dl class="season-menu-info"><dt>Game format</dt><dd>'+escape(season.mode)+(season.teamSize===1?' · Solo':' · Teams of '+season.teamSize)+'</dd><dt>World seed</dt><dd>Not available</dd></dl>';
 dialog.innerHTML='<div class="season-menu-heading"><div><p class="season-menu-eyebrow">SEASON '+String(season.id).padStart(2,'0')+'</p><h2 id="season-menu-title">'+(isVideo?'Watch the season':'Season information')+'</h2></div><button type="button" class="season-menu-close">Close</button></div>'+content;
 dialog.setAttribute('aria-labelledby','season-menu-title');dialog.querySelector('button').onclick=()=>dialog.close();dialog.showModal();
});
function seasonAwardIcon(icon,label,description){return `<img class="season-award-icon" src="${window.UHC_ICONS[icon]}" alt="${label}" title="${label}: ${description}" width="22" height="22">`; }
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
function seasonDeathResult(player){
  if(player.finalHearts==null)return escape(player.death||'N/A');
  const hearts=player.finalHearts;
  const full='<img src="'+window.UHC_ICONS['hardcore-heart-full']+'" alt="" width="18" height="18">';
  const half='<img src="'+window.UHC_ICONS['hardcore-heart-half']+'" alt="" width="18" height="18">';
  const container=window.UHC_ICONS['hardcore-container'];
  const empty='<img class="season-empty-heart" src="'+container+'" alt="" width="18" height="18">';
  const capacity=Math.max(10,Math.ceil(hearts));
  const label=hearts+' of '+capacity+' hearts remaining';
  return '<span class="season-survivor-hearts" role="img" aria-label="'+label+'" title="'+label+'" style="--heart-container:url('+container+')">'+
    full.repeat(Math.floor(hearts))+(hearts%1===0?'':half)+empty.repeat(capacity-Math.ceil(hearts))+'</span>';
}
function seasonPlayerRow(s,p){
 const team=s.teamSize===1?'':`<div class="season-team-label"><span class="team-name">${historyTeamLink(p.team,p.color,s.id)}</span>${p.moleFor?`<small class="mole-cover">Cover team: <b style="color:${colors[p.moleFor]||'#c7d2e5'}">${escape(p.moleFor)}</b></small>`:''}</div>`;
 const time=p.seconds==null&&!p.type&&!p.death?'':duration(p.seconds);
 return `<tr class="${p.color==='Mole'?'mole-row':''}" style="${p.color==='Mole'?molePaint(s.id):''}--team:${colors[p.color]||'#b3bda9'}"><td><div class="player-cell">${playerFace(p.name)}<button class="player-name" data-player="${escape(p.name)}">${escape(p.name)}</button>${p.debut?seasonAwardIcon('oak-sapling','Debut','First recorded appearance'):''}${!/^Disqualif/i.test(p.type||'')&&p.achievement==='Ironman'?seasonAwardIcon('iron-chestplate','Ironman','Last player to take damage this season'):''}${p.achievement==='First Damage'?seasonAwardIcon('redstone','First Damage','First player to take damage this season'):''}${s.crown?.name===p.name?crown(s):''}${p.roamer?'<span class="badge roamer-badge">Roamer</span>':''}</div>${team?`<div class="mobile-season-team">${team}</div>`:''}</td>${team?`<td class="season-team-cell">${team}</td>`:''}<td class="death"><div class="season-result">${seasonDeathResult(p)}</div><small class="mobile-season-time ${p.seconds==null?'unknown':''}">${time}</small></td><td class="elapsed ${p.seconds==null?'unknown':''}">${time}</td></tr>`;
}
function teamJoinRow(s,event){
 const label=event.kind==='formed'?'Team formed':event.kind==='roamer'?'Roamer joined':'Team joined';
 return `<tr class="team-join-row" style="--team:${colors[event.color]||'#b0b6c2'};--join-accent:${event.color==='Black'?'#b7c5da':event.color==='Navy'?'#9ab7ff':colors[event.color]||'#b0b6c2'}" data-join-seconds="${event.seconds}"><td colspan="${matchMedia('(max-width:800px)').matches?2:3}"><div class="team-join-content"><span class="team-join-marker" aria-hidden="true">+</span><div class="team-join-body"><div class="team-join-heading"><span>${label}</span><strong title="${escape(event.color)}">${historyTeamLink(event.team,event.color,s.id)}</strong><small class="mobile-season-time">${duration(event.seconds)}</small></div><div class="team-join-members">${event.names.map(name=>`<span class="team-join-person">${playerFace(name)}<button class="player-name" data-player="${escape(name)}">${escape(name)}</button></span>`).join('')}</div></div></div></td><td class="elapsed team-join-time">${duration(event.seconds)}</td></tr>`;
}
function seasonLogRows(s){
 if(!s.teamJoins?.length)return s.players.map(p=>seasonPlayerRow(s,p)).join('');
 const log=[...s.players.map((player,index)=>({player,seconds:player.seconds??Infinity,index})),...s.teamJoins.map((join,index)=>({join,seconds:join.seconds,index}))];
 log.sort((a,b)=>a.seconds-b.seconds||(a.join?0:1)-(b.join?0:1)||a.index-b.index);
 return log.map(e=>e.join?teamJoinRow(s,e.join):seasonPlayerRow(s,e.player)).join('');
}
function card(s){
  return `<article class="season-card" id="season-${s.id}"><header class="season-top"><div class="season-number"><small>SEASON</small><strong>${String(s.id).padStart(2,'0')}</strong></div><div class="season-info"><h3>${date(s.date)}</h3><div class="metadata"><span>${s.players.length} participants</span><span>${s.teamSize===1?'Solo':`Teams of ${s.teamSize}`}</span><span${s.mode==='War'?` ${chartTip('War\nTwo large teams face each other.')}`:''}>${escape(s.mode)}</span>${s.dragon?'<span>Ender Dragon</span>':''}<span>v${escape(minecraftVersion(s.version))}</span>${s.hasRoamers?`<span class="season-roamer-flag" ${chartTip('Roamer game\nOne or more players started without a team while most others started with teammates.')}>Roamer game</span>`:''}</div><div class="faces" aria-label="Season participants">${s.players.map(p=>`<span title="${escape(p.name)}">${playerFace(p.name)}</span>`).join('')}</div></div><div class="time-box"><strong>${duration(s.seconds)}</strong><small>MATCH TIME</small></div></header><div class="table-wrap" tabindex="0" role="region" aria-label="Season ${s.id} results"><table><caption>Season ${s.id} results${s.teamJoins?.length?' and team-joining events in chronological order':' in workbook order'}</caption><thead><tr><th scope="col">Player</th>${s.teamSize===1?'':'<th scope="col">Team</th>'}<th scope="col">Death / result</th><th scope="col">Time</th></tr></thead><tbody>${seasonLogRows(s)}</tbody></table></div><footer class="season-bottom"><span>${s.crown?`Crown after this season · <b>${escape(s.crown.name)}</b> ${s.players.some(p=>p.name===s.crown.name)?'':crown(s)}`:'Crown not recorded'}</span>${seasonFooterActions(s.id)}</footer></article>`;
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
 const pageName=location.pathname?.split('/').pop()?.replace(/\.html$/,'');
 const pageRoute={players:'players',stats:'stats',rankings:'rankings-teams',trivia:'trivia',about:'about'}[pageName]||'seasons';
 const hash=location.hash.slice(1)||pageRoute;
 const switchingModernCategory=visibleRankingEra==='modern'&&getRankingsMode(location.hash)==='grades';
 updateRankingEraBanner(location.hash);
 const selected=hash==='about'||hash.startsWith('about-')?'about':hash==='rankings'||hash.startsWith('rankings-')||hash.startsWith('rank-player-')||hash.startsWith('team-color-')?'rankings':hash==='players'||hash.startsWith('player-')?'players':['stats','trivia'].includes(hash)?hash:'seasons';
 document.title=selected[0].toUpperCase()+selected.slice(1)+' | Hyalus UHC';
 for(const page of ['seasons','players','stats','rankings','trivia','about'])$(page+'-view').hidden=selected!==page;
 $('placeholder-view').hidden=true;
 if(selected==='trivia')renderTrivia();if(selected==='rankings')rankingsRoute();if(selected==='stats')renderStats();if(selected==='players')playersRoute();
 if(!switchingModernCategory&&(Object.values(rankingModeHashes).includes(location.hash)||['rankings','rankings-players','rankings-grades'].includes(hash)))window.scrollTo({top:0,behavior:'instant'});
 document.querySelectorAll('[data-tab]').forEach(a=>{a.classList.toggle('active',a.dataset.tab===selected);if(a.dataset.tab===selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 if(selected==='about')requestAnimationFrame(()=>{if(hash==='about')window.scrollTo?.({top:0,behavior:'instant'});else document.getElementById(hash)?.scrollIntoView?.({block:'start'});});
}
// Reuse the loaded views for navbar clicks while retaining directly loadable URLs.
document.addEventListener('click',event=>{
 const link=event.target.closest('a[data-tab]');
 if(!link||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
 const href=link.getAttribute('href');
 if(!/^(?:index|players|stats|rankings|trivia|about)\.html$/.test(href))return;
 try{
  history.pushState(null,'',href);
 }catch{
  return;
 }
 event.preventDefault();
 tab();
 window.scrollTo({top:0,behavior:'instant'});
});
window.addEventListener('popstate',()=>tab());
$('unique-count').textContent=profileData.recordedPlayers;
$('season-index').innerHTML=seasons.map(s=>`<a href="#season-${s.id}" data-season="${s.id}" aria-label="Go to season ${s.id}">${String(s.id).padStart(2,'0')}</a>`).join('');
const originalFilterWidth=$('year').getBoundingClientRect?.().width;
if(originalFilterWidth&&window.innerWidth>720){$('season-filter-category').style.width=originalFilterWidth+'px';}
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
$('season-total').textContent=seasons.length;$('archive-years').textContent=seasons[0].date.slice(0,4)+'–'+seasons.at(-1).date.slice(0,4);$('season-range').textContent=String(seasons[0].id).padStart(2,'0')+'—'+String(seasons.at(-1).id).padStart(2,'0');initializeStats();initializePlayers();initializeRankings();initializePlayerRankings();initializeTrivia();render();tab();if(/^#season-\d+$/.test(location.hash))requestAnimationFrame(()=>document.querySelector(location.hash)?.scrollIntoView());

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
 async function throwPearl(event){
  if(throwing||scrollY<=0)return;
  const trigger=event.currentTarget;
  sync();
  const r=button.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
  const finishX=Math.max(26,x-56),finishY=Math.min(96,innerHeight/3);
  const keyboard=trigger.matches(':focus-visible');
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
 }
 button.addEventListener('click',throwPearl);
 $('ranking-index-top').addEventListener('click',throwPearl);
 window.addEventListener('scroll',sync,{passive:true});
 window.addEventListener('pageshow',sync);
 sync();
}
initializeBackToTopPearl();

document.querySelectorAll('.about-gallery').forEach(gallery=>{
 const header=document.querySelector('header.nav'),about=gallery.closest('.about-page');
 if(header&&about){
  const syncNavHeight=()=>about.style.setProperty('--about-nav-top',header.getBoundingClientRect().height+'px');
  syncNavHeight();
  if(typeof ResizeObserver==='function')new ResizeObserver(syncNavHeight).observe(header);
 }
 const region=gallery.querySelector('.about-slates');
 const slates=[...gallery.querySelectorAll('.about-slate')];
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let current=0,timer,visible=false,manual=false;
 function advance(step){
  slates[current].inert=true;
  current=(current+step+slates.length)%slates.length;
  slates[current].inert=false;
 }
 function schedule(){
  clearInterval(timer);
  if(visible&&!manual&&!motion.matches&&!document.hidden)timer=setInterval(()=>advance(1),7300);
 }
 new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule()}).observe(gallery);
 document.addEventListener('visibilitychange',schedule);
 motion.addEventListener('change',schedule);
 gallery.querySelectorAll('[data-slate-step]').forEach(button=>{
  button.hidden=false;
  button.addEventListener('click',()=>{
   manual=true;
   schedule();
   region.setAttribute('aria-live','polite');
   advance(Number(button.dataset.slateStep));
  });
 });
});

document.querySelector('.hero-motion-toggle')?.addEventListener('click',event=>{const button=event.currentTarget,hero=button.closest('.hero'),paused=hero.classList.toggle('hero-photos-paused');button.setAttribute('aria-pressed',String(paused));button.setAttribute('aria-label',paused?'Play background images':'Pause background images');button.title=button.getAttribute('aria-label');button.innerHTML=paused?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5 3 8 5-8 5Z" fill="currentColor"/></svg>':'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3v10M11 3v10" stroke="currentColor" stroke-width="2"/></svg>';});

/* Fit the square heart to the actual ink bounds of UHC, rather than its line box. */
(()=>{
 const letters=document.querySelector('.hero-wordmark-uhc .hero-wordmark-letters');
 const heart=document.querySelector('.hero-wordmark-bottom>img');
 if(!letters||!heart)return;
 const baseline=document.createElement('span');
 baseline.setAttribute('aria-hidden','true');
 baseline.style.cssText='display:inline-block;width:0;height:0;padding:0;margin:0;vertical-align:baseline';
 letters.append(baseline);
 const context=document.createElement('canvas').getContext('2d');
 const alignHeart=()=>{
  const style=getComputedStyle(letters);
  context.font=style.font;
  const ink=context.measureText('UHC');
  const size=ink.actualBoundingBoxAscent+ink.actualBoundingBoxDescent;
  if(!size)return;
  heart.style.width=heart.style.height=size+'px';
  heart.style.translate='none';
  const top=baseline.getBoundingClientRect().top-ink.actualBoundingBoxAscent;
  heart.style.translate='0 '+(top-heart.getBoundingClientRect().top)+'px';
 };
 new ResizeObserver(alignHeart).observe(letters);
 document.fonts.ready.then(alignHeart);
})();
/* A synchronized image copy keeps the blur independent of browser backdrop repaints. */
(()=>{
 const hero=document.querySelector('.hero-with-photos');
 const glass=hero?.querySelector('.hero-copy-glass');
 const scene=hero?.querySelector(':scope>.hero-photo-window');
 if(!glass||!scene)return;
 // Shuffle once, then repeat that same order for a continuous loop and matching blur.
 const groups=[...scene.querySelectorAll('.hero-photo-group')];
 const images=[...groups[0].children];
 for(let i=images.length-1;i>0;i--){
  const j=Math.floor(Math.random()*(i+1));
  [images[i],images[j]]=[images[j],images[i]];
 }
 groups[0].replaceChildren(...images);
 for(const group of groups.slice(1))group.replaceChildren(...images.map(image=>image.cloneNode(true)));
 glass.replaceChildren(scene.cloneNode(true),hero.querySelector(':scope>.hero-photo-shade').cloneNode(true));
 const original=scene.querySelector('.hero-photo-track');
 const blurred=glass.querySelector('.hero-photo-track');
 const sync=()=>{
  hero.style.setProperty('--hero-scene-width',hero.getBoundingClientRect().width+'px');
  const source=original.getAnimations()[0],copy=blurred.getAnimations()[0];
  if(source&&copy)copy.currentTime=source.currentTime;
 };
 new ResizeObserver(sync).observe(hero);
 requestAnimationFrame(sync);
 matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change',()=>requestAnimationFrame(sync));
})();

matchMedia('(max-width:800px)').addEventListener('change',event=>{document.querySelectorAll('.season-card .team-join-row>td:first-child').forEach(cell=>cell.colSpan=event.matches?2:3);});
