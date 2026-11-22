const playerRankingData=window.UHC_PLAYER_RANKINGS;
const rankingPlayerAnchor=name=>'rank-player-'+encodeURIComponent(name);
const rankingTier=(value,tip)=>`<span class="pr-tier pr-tier-${value}" ${chartTip(tip)}> ${value} </span>`;
const rankingRate=value=>(value*100).toFixed(1)+'%';
const playerScoreTip=p=>`${p.name} · ${p.score.toFixed(2)} / 100\nCombat: ${p.components.combat.points.toFixed(2)} / 40\nTeam Contribution: ${p.components.teamContribution.points.toFixed(2)} / 30\nDefense: ${p.components.defense.points.toFixed(2)} / 20\nSurvival: ${p.components.survival.points.toFixed(2)} / 10\n${p.games} games · ${$('pr-include-influence').checked?'Influence included':'Personal score'}\nIndividual: ${p.individualScore.toFixed(2)}\nInfluence on teammates ${$('pr-include-influence').checked?'(included)':'(excluded)'}: ${p.teammateInfluence>=0?'+':''}${p.teammateInfluence.toFixed(2)}`;
const prStat=(p,key,primary,secondary)=>{const c=p.components[key];return `<div class="pr-stat" ${chartTip(`${key==='combat'?'Combat':key==='victories'?'Victories':key==='ironman'?'Ironman':'Survival'} · Tier ${c.tier}\n${primary} · ${secondary}\nTeammate-adjusted rate: ${key==='combat'?c.adjustedRate.toFixed(3)+' kills / game':rankingRate(c.adjustedRate)}\nFull-points benchmark: ${key==='combat'?c.benchmark+' kills / game':rankingRate(c.benchmark)}\nScore contribution: ${c.points.toFixed(2)} / ${c.weight}`)}><span class="pr-value-line"><span class="pr-stat-value">${primary}</span><span class="pr-mini-tier pr-tier-${c.tier}">${c.tier}</span></span><span class="pr-stat-sub">${secondary}</span></div>`};
function prDefense(p){
 const c=p.components.defense;
 return `<div class="pr-stat pr-defense" ${chartTip(`Defense · Tier ${c.tier}\nAverage share of other timed deaths outlasted: ${p.outlastRate==null?'N/A':rankingRate(p.outlastRate)}\nCoverage: ${p.durabilityGames} / ${p.games} games\n${p.ironmen} Ironmen · ${rankingRate(p.ironRate)} of games\nIronman contribution: ${c.ironPoints.toFixed(2)} / 10\nDurability contribution: ${c.durabilityPoints.toFixed(2)} / 10\nTotal Defense: ${c.points.toFixed(2)} / 20\nOwn deaths excluded; tied times are not outlasted.`)}><span class="pr-value-line"><span class="pr-stat-value">${p.outlastRate==null?'N/A':rankingRate(p.outlastRate)}</span><span class="pr-mini-tier pr-tier-${c.tier}">${c.tier}</span></span><span class="pr-stat-sub">outlasted · ${p.ironmen} Ironmen</span></div>`;
}
function playerRankingRow(p){
 const includeInfluence=$('pr-include-influence').checked;
 const componentLabels={combat:'Combat',teamContribution:'Team Contribution',defense:'Defense',survival:'Survival'};
 return `<details class="pr-row" id="${rankingPlayerAnchor(p.name)}"><summary class="pr-row-summary"><span class="pr-identity">${playerFace(p.name)}<span><b>${escape(p.name)}</b><small>${p.games} games · best season: S${p.bestSeason}</small></span></span>${prStat(p,'combat',p.killsPerGame.toFixed(2),`${p.kills} PVP kills`)}<div class="pr-stat" ${chartTip(`Team Contribution · Tier ${p.components.teamContribution.tier}\nAdjusted win rate: ${rankingRate(p.components.teamContribution.adjustedRate)}\nVictories: ${p.components.teamContribution.winPoints.toFixed(2)} / 30\nTeam Kill deduction: −${p.penalty.toFixed(2)} (up to 10)\nNet: ${p.components.teamContribution.points.toFixed(2)} / 30`)}><span class="pr-value-line"><span class="pr-stat-value">${p.components.teamContribution.points.toFixed(2)}</span><span class="pr-mini-tier pr-tier-${p.components.teamContribution.tier}">${p.components.teamContribution.tier}</span></span><span class="pr-stat-sub">${p.wins} wins · ${p.teamKills} team kills</span></div>${prDefense(p)}<span class="pr-final-score" ${chartTip(playerScoreTip(p))}><strong>${p.score.toFixed(2)}</strong>${rankingTier(p.tier,`Overall tier ${p.tier}\n${playerScoreTip(p)}`)}</span><span class="pr-row-expand" aria-hidden="true">+</span></summary><div class="pr-row-detail"><div class="pr-detail-heading"><div><p class="eyebrow">INSIDE THE SCORE</p><h3>${escape(p.name)}’s performance breakdown</h3></div><a class="pr-profile-link" href="${profileHref(p.name)}">Open player profile ↗</a></div><div class="pr-breakdown-grid">${Object.entries(p.components).map(([key,c])=>`<div class="pr-breakdown-stat"><div><span>${componentLabels[key]}</span><b>${c.points.toFixed(2)} <small>/ ${c.weight}</small></b></div><div class="pr-component-track"><i style="width:${100*c.points/c.weight}%"></i></div><p>${key==='teamContribution'?`Victories ${c.winPoints.toFixed(2)} / 30 · Team Kill deduction −${c.penalty.toFixed(2)}`:key==='defense'?`Ironman ${c.ironPoints.toFixed(2)} / 10 · Outlast ${c.durabilityPoints.toFixed(2)} / 10`:key==='survival'?`${p.survived} / ${p.games} games survived · ${rankingRate(p.survivalRate)}`:`Tier ${c.tier} · ${Math.round(100*c.points/c.weight)}% of benchmark`}</p></div>`).join('')}</div><div class="pr-teammate-adjustment"><h4>How teammates affect the score</h4><p><strong>${p.individualScore.toFixed(2)}</strong> personal score ${includeInfluence?`<span>${p.teammateInfluence>=0?'+':'−'}</span> <strong>${Math.abs(p.teammateInfluence).toFixed(2)}</strong> influence = <strong>${p.score.toFixed(2)}</strong> overall.`:' · your estimated influence on teammates is off.'}</p><p>${p.teammateGames} games with identifiable fixed teammates · ${p.distinctTeammates} distinct teammates. The personal score accounts for the help you received from teammates. Turning influence on adds the estimated effect you had on their performance.</p><p class="pr-stat-sub">Influence estimates are conservative associations, especially when players rarely change teammates. ${p.teammateGames?'':'No fixed teammate relationships were established from these records.'}</p></div><details class="pr-durability-history"><summary>Durability by season · ${p.durabilityGames} / ${p.games} games with usable death timing</summary><p>Average share of other timed deaths outlasted: ${p.outlastRate==null?'N/A':rankingRate(p.outlastRate)}. Across those games: ${p.outlastedDeaths} earlier deaths out of ${p.otherTimedDeaths} other timed deaths. Each game has equal weight in the average.</p><div>${p.history.map(h=>`<a href="#season-${h.season}"><b>S${h.season}</b><span>${h.deathOutlastRate==null?'N/A':rankingRate(h.deathOutlastRate)}</span></a>`).join('')}</div></details><div class="pr-detail-bottom"><span class="${p.penalty?'pr-penalty':'pr-clean'}">${p.penalty?`Team Kill deduction · −${p.penalty.toFixed(2)} points`:'Clean discipline · No recorded Team Kills'}</span><span>Five-game-strength shrinkage softens small samples; teammate influence is estimated more conservatively.</span></div><div class="pr-form"><span>RECENT FIVE GAMES</span>${p.history.slice(-5).map(h=>`<a href="#season-${h.season}" ${chartTip(`Season ${h.season}\n${h.team}\n${h.kills} PVP kills${h.win?' · Team victory':''}${h.iron?' · Ironman':''}${h.teamKills?' · '+h.teamKills+' Team Kills':''}`)}><b>S${h.season}</b><span>${h.kills} K</span>${h.win?'<i>W</i>':''}${h.iron?'<i>◈</i>':''}</a>`).join('')}</div></div></details>`;
}
function playerRankingRows(){
 const q=$('pr-search').value.trim().toLowerCase(),filter=$('pr-tier-filter').value,order=$('pr-order').value;
 const players=$('pr-include-influence').checked?playerRankingData.players:playerRankingData.players.map(p=>({
  ...p,score:p.individualScore,tier:p.individualTier,rank:p.individualRank,components:p.individualComponents
 }));
 return players.filter(p=>(!filter||filter==='all'||p.tier===filter)&&(!q||[p.name,...p.aliases].some(n=>n.toLowerCase().includes(q)))).sort((a,b)=>order==='kills'?b.killsPerGame-a.killsPerGame||a.rank-b.rank:order==='teamContribution'?b.components.teamContribution.points-a.components.teamContribution.points||a.rank-b.rank:order==='defense'?b.components.defense.points-a.components.defense.points||a.rank-b.rank:order==='games'?b.games-a.games||a.rank-b.rank:a.rank-b.rank);
}
function renderPlayerRankings(){
 const players=playerRankingRows();$('pr-result-count').textContent=`${players.length} of ${playerRankingData.players.length} eligible players`;
 $('pr-leaderboard').innerHTML=players.map(playerRankingRow).join('')||'<div class="empty">No players match this name and tier.</div>';
}
function switchRankingsMode(mode){
 $('team-rankings-panel').hidden=mode!=='teams';$('player-rankings-panel').hidden=mode!=='players';
 $('player-rankings-panel').hidden=true;
 $('season-grades-panel').hidden=mode!=='grades'&&mode!=='players';
 document.querySelectorAll('[data-ranking-mode]').forEach(button=>{const active=button.dataset.rankingMode===mode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});

}
const rankingModeHashes={teams:'#rankings-teams',players:'#rankings-players',grades:'#rankings-players'};
function getRankingsMode(hash){
 return /^#rankings-(?:players|classic|modern|grades)(?:-|$)/.test(hash)||hash.startsWith('#rank-player-')?'grades':'teams';
}
let visibleRankingEra=null;
function updateRankingEraBanner(hash){
 visibleRankingEra=getRankingsMode(hash)==='grades'?'modern':null;
}
let gradeSort={category:'overall',key:'grade',descending:true};
function renderSeasonGrades(hash){

 const combined=playerRankingData.combinedGrades;
 if(/^#rankings-classic(?:-|$)/.test(hash))$('ranking-era-filter').value='classic';
 if(/^#rankings-(?:modern|grades)(?:-|$)/.test(hash))$('ranking-era-filter').value='modern';
 const era=$('ranking-era-filter').value;
 const {seasons,players}=combined.modes[era];
 const qualified=players.filter(player=>player.games>=5);
 const visiblePlayers=qualified.length?qualified:players;
 const {categories,metrics}=combined;
 const hero=$('season-grades-panel').querySelector('.ranking-era-hero');
 hero.classList.remove('classic-era-hero');hero.classList.add('modern-era-hero');
 hero.querySelector('h1').textContent='Player Rankings';
 $('season-grade-search').setAttribute('aria-label','Search players or aliases');
 const overallTab={id:'overall',label:'Overall'};
 const tabs=[overallTab,...categories];
 const categoryId=hash.replace(/^#rankings-(?:players|modern|grades|classic)-/, '')
  .replace(/^ironman$/, 'survival').replace(/^(victory|friendly|mining)$/, 'team-contribution');
 const category=tabs.find(item=>item.id===categoryId)||overallTab;
 if(gradeSort.category!==category.id)gradeSort={category:category.id,key:'grade',descending:true};
 const overall=category===overallTab;
 const columns=overall?categories.map(({id,label})=>({key:id,label})):
  [...category.metrics,...(category.id==='team-contribution'?['blazeKills','dragonDamage','endCrystals']:[])].map(key=>({key,...metrics[key]}));
 const metricCell=(result,metric)=>{
  if(!result.games)return '<td>—</td>';
  const raw=metric.rate?rankingRate(result.total/result.games):Number(result.total.toFixed(2)).toLocaleString();
  const coverage=metric.rate?`${result.total}/${result.games}`:`${result.games} ${result.games===1?'game':'games'}`;
  return `<td>${raw}<small>${coverage}</small></td>`;
 };
 $('season-grades-meta').textContent=`${{all:'All seasons',classic:'Classic Era · Seasons 1–36',modern:'Modern Era · Season 37 onward'}[era]} · ${visiblePlayers.length} ${qualified.length?'qualified players':'players · Awaiting the first five-game qualifier'}`;
 const navigation=$('season-grade-categories');
 navigation.innerHTML=tabs.map(item=>
  `<button type="button" data-grade-category="${item.id}">${item.label}</button>`).join('');
 for(const button of navigation.children){
  const active=button.dataset.gradeCategory===category.id;
  button.classList.toggle('active',active);
  button.setAttribute('aria-pressed',String(active));
 }
 const helpLabel=overall?'How the tiers work':`How ${category.label} is scored`;
 $('season-grade-help-label').textContent=helpLabel;
 $('season-grade-dialog-label').textContent=helpLabel.toUpperCase();
 $('season-grade-method-name').textContent=category.label;
 const eraWeights=era==='all'?['classic','modern']:[era];
 const weightRows=overall?categories.map(item=>[item.label,item.overallWeight]):
  eraWeights.flatMap(key=>{
   const item=combined.eraCategories[key].find(item=>item.id===category.id);
   return item.metrics.map(metric=>[(key==='classic'?'Classic · ':'Modern · ')+metrics[metric].label,item.weights[metric]]);
  });
 $('season-grade-weights').innerHTML=weightRows.map(([label,weight],index)=>{
  const contents='<span>'+label+'</span><strong>'+Number(weight.toFixed(1))+'%</strong><span class="grade-weight-track" aria-hidden="true"><i style="width:'+weight+'%"></i></span>';
  return overall?'<li class="grade-weight-item"><button type="button" class="ranking-bevel grade-weight-tile" data-grade-target="'+categories[index].id+'">'+contents+'</button></li>':
   '<li class="grade-weight-item"><div class="grade-weight-tile grade-weight-static">'+contents+'</div></li>';
 }).join('');
 const objectives=category.id==='team-contribution'?
  ' Blaze kills are a separate contribution for gathering potion materials. Once measured records are available, they receive 10% of Team Contribution. End objectives receive up to 10%, split 60% Dragon damage and 40% crystals. These shares come from the existing Team Contribution score. Disabled dimensions, missing records, and all-zero objective fields add no evidence. Objective ratings start at 50 with five neutral prior games, so limited opportunities have a modest effect. ' + (Object.values(combined.objectiveActive).some(Boolean)?'Objective records are included where usable comparisons exist.':'No objective records have been imported yet.'):
  '';
 const explanation=category.id==='survival'?
  'Lower PvE damage and fewer PvE deaths earn higher scores. Ironman rewards staying untouched. Self-inflicted deaths count as PvE. Disconnects and disqualifications are excluded from the PvE death rate.':
  category.id==='combat'?'More enemy damage and enemy kills earn higher scores. Player combat is measured here.':
  category.id==='team-contribution'?'Wins, avoiding friendly fire, and mining support your team. Classic uses recorded wins and team kills. Modern also measures friendly damage and ore mined.':
  'Overall is 30% PvE Survival, 30% Enemy Combat, and 40% Team Contribution.';
 $('season-grade-explanation').textContent=explanation+objectives;
 $('season-grade-era-method').textContent=
  'First, each stat is compared with players in the same season. Ties earn half credit. Each era produces a category score from its recorded stats. The weights shown for each era total 100% independently. In All seasons, the two era scores are averaged using your comparable game counts in that category. For example, 20 Classic games and 5 Modern games give that category an 80/20 split. Overall then combines the category scores. Missing stats are omitted and the available weights are rescaled within the era.';
 const {key,descending}=gradeSort;
 const sortValue=player=>{
  if(key==='player')return player.name;
  if(key==='grade')return player.grades[category.id]?.score;
  if(overall)return player.grades[key]?.score;
  const result=player.results[key];
  if(result.games)return metrics[key].rate?result.total/result.games:result.total;
 };
 const query=$('season-grade-search').value.trim().toLowerCase();
 const matchingAliases=new Set(query?Object.entries(profileData.identities)
  .filter(([alias])=>alias.includes(query)).map(([,name])=>name):[]);
 const rows=visiblePlayers.filter(player=>player.name.toLowerCase().includes(query)||matchingAliases.has(player.name)).sort((a,b)=>{
  const first=sortValue(a),second=sortValue(b);
  if(first==null||second==null)return Number(first==null)-Number(second==null)||a.name.localeCompare(b.name);
  const comparison=key==='player'?first.localeCompare(second):first-second;
  return (descending?-comparison:comparison)||a.name.localeCompare(b.name);
 });
 const headers=[{key:'player',label:'Player'},{key:'grade',label:'Tier'},...columns];
 $('season-grade-table').innerHTML=`<caption class="sr-only">${category.label} tiers</caption>
  <thead><tr>${headers.map(column=>{
   const active=column.key===key;
   const sort=active?` aria-sort="${descending?'descending':'ascending'}"`:'';
   const indicator=active?(descending?'▼':'▲'):'↕';
   return `<th scope="col"${sort}><button type="button" data-grade-sort="${column.key}">${column.label} <span aria-hidden="true">${indicator}</span></button></th>`;
  }).join('')}</tr></thead>
  <tbody>${rows.map(player=>{
   const mark=player.grades[category.id];
   const requiredGames=mark?.games??player.games;
   const provisional=requiredGames<5;
   const tier=provisional?'unknown':mark?.grade;
   const name=profileByName(player.name)?
    `<a class="season-grade-bio-link" href="${profileHref(player.name)}">${escape(player.name)}</a>`:escape(player.name);
   return `<tr><th scope="row"><span class="season-grade-player">${playerFace(player.name)}<span>${name}<small class="grade-era-coverage">${player.eraGames.classic} Classic · ${player.eraGames.modern} Modern</small></span></span></th>
    <td>${mark?`<strong class="pr-mini-tier pr-tier-${tier}" title="${provisional?`${requiredGames} of 5 required games`:mark.grade}">${provisional?'?':`<img class="pr-tier-texture" src="${window.UHC_ICONS['tier-'+mark.grade.toLowerCase()]}" alt="${mark.grade}" width="20" height="20">`}</strong><small>${mark.score.toFixed(1)} / 100${provisional?` · ${requiredGames} of 5 required games`:''}</small>`:'—'}</td>
    ${columns.map(column=>{
     if(!overall)return metricCell(player.results[column.key],column);
     const component=player.grades[column.key];
     return `<td>${component?component.score.toFixed(1):'—'}</td>`;
    }).join('')}</tr>`;
  }).join('')||`<tr><td colspan="${headers.length}">No players match this search.</td></tr>`}</tbody>`;
}
function initializePlayerRankings(){
 const gradeDialog=$('season-grade-dialog');
 $('ranking-era-filter').addEventListener('change',()=>{
  const suffix=gradeSort.category==='overall'?'':'-'+gradeSort.category;
  const hash='#rankings-players'+suffix;
  if(location.hash!==hash)location.hash=hash;
  else renderSeasonGrades(hash);
 });
 const rankingHero=$('season-grades-panel').querySelector('.ranking-era-hero');
 const sources=[...new Set([...document.querySelectorAll('.hero-photo-group:first-child img')].map(image=>image.src))];
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const deck=document.createElement('div');
 deck.className='ranking-photo-deck';
 deck.setAttribute('aria-hidden','true');
 const backdrop=document.createElement('div');
 backdrop.className='ranking-photo-backdrop';
 backdrop.setAttribute('aria-hidden','true');
 const backgroundFrames=[];
 const frames=[0,1].map(index=>{
  const image=document.createElement('img');
  image.alt='';
  if(sources.length)image.src=sources[index%sources.length];
  if(index===0)image.className='is-current';
  deck.append(image);
  const background=document.createElement('img');
  background.alt='';
  if(sources.length)background.src=image.src;
  if(index===0)background.className='is-current';
  backdrop.append(background);
  backgroundFrames.push(background);
  return image;
 });
 rankingHero.prepend(deck);
 $('season-grades-panel').prepend(backdrop);
 let current=0,next=1,loading=false;
 setInterval(async()=>{
  if(loading||motion.matches||document.hidden||$('rankings-view').hidden||$('season-grades-panel').hidden||sources.length<2)return;
  loading=true;
  const incoming=frames[1-current];
  const incomingBackground=backgroundFrames[1-current];
  incoming.src=sources[next%sources.length];
  incomingBackground.src=incoming.src;
  try{
   await Promise.all([incoming.decode(),incomingBackground.decode()]);
   if(motion.matches||document.hidden||$('season-grades-panel').hidden)return;
   incoming.classList.add('is-current');
   incomingBackground.classList.add('is-current');
   frames[current].classList.remove('is-current');
   backgroundFrames[current].classList.remove('is-current');
   current=1-current;
   next++;
  }catch{
   next++;
  }finally{
   loading=false;
  }
 },2600);

 $('season-grade-help').addEventListener('click',()=>gradeDialog.showModal());
 $('season-grade-weights').addEventListener('click',event=>{
 const button=event.target.closest('[data-grade-target]');if(!button)return;
 const category=button.dataset.gradeTarget;
 const base=getRankingsMode(location.hash)==='players'?rankingModeHashes.players:rankingModeHashes.grades;
 gradeDialog.close();location.hash=base+'-'+category;
 requestAnimationFrame(()=>document.querySelector('#season-grade-categories [data-grade-category="'+category+'"]')?.focus({preventScroll:true}));
 });
 $('season-grade-search').addEventListener('input',()=>renderSeasonGrades(location.hash));
 $('pr-summary').textContent=`Seasons 1–36 · ${playerRankingData.players.length} ranked players · Minimum five recorded matches`;
 $('pr-method-text').textContent=playerRankingData.method;$('pr-teammate-method').textContent=playerRankingData.teammateMethod;$('pr-tier-method').textContent=playerRankingData.tiers;$('pr-method-notes').textContent=playerRankingData.notes;
 $('pr-include-influence').addEventListener('change',()=>{
  const openRows=[...$('pr-leaderboard').querySelectorAll('.pr-row[open]')].map(row=>row.id);
  renderPlayerRankings();
  for(const id of openRows){const row=$(id);if(row)row.open=true;}
 });
 $('pr-search').addEventListener('input',renderPlayerRankings);$('pr-tier-filter').addEventListener('change',renderPlayerRankings);$('pr-order').addEventListener('change',renderPlayerRankings);
 $('pr-reset').addEventListener('click',()=>{$('pr-search').value='';$('pr-tier-filter').value='all';$('pr-order').value='rank';renderPlayerRankings();});
 $('season-grade-categories').addEventListener('click',event=>{
  const button=event.target.closest('[data-grade-category]');
  if(!button)return;
  const category=button.dataset.gradeCategory;
  const base=getRankingsMode(location.hash)==='players'?rankingModeHashes.players:rankingModeHashes.grades;
  location.hash=category==='overall'?base:`${base}-${category}`;
 });
 const gradeTable=$('season-grade-table');
 gradeTable.addEventListener('click',event=>{
  const button=event.target.closest('[data-grade-sort]');
  if(!button)return;
  const key=button.dataset.gradeSort;
  gradeSort.descending=key===gradeSort.key?!gradeSort.descending:key!=='player';
  gradeSort.key=key;
  renderSeasonGrades(location.hash);
  gradeTable.querySelector(`[data-grade-sort="${key}"]`).focus({preventScroll:true});
 });
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-ranking-mode]');
  if(!button)return;
  const hash=rankingModeHashes[button.dataset.rankingMode];
  if(location.hash!==hash)location.hash=hash;
 });
}
