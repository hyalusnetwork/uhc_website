const triviaData=window.UHC_TRIVIA;
let triviaCategory='all';
const triviaCollapsedSubjects=new Set();
function revealCollapsedTriviaGroup(group){
 requestAnimationFrame(()=>{
  if(!group?.classList.contains('is-collapsed'))return;
  const rect=group.getBoundingClientRect(),nav=document.querySelector('.nav');
  const top=Math.max(12,(nav?.getBoundingClientRect().bottom||0)+12),bottom=window.innerHeight-12;
  if(rect.top<top||rect.bottom>bottom)window.scrollBy({top:rect.top-top,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 });
}

function updateTriviaGroupControls(){
 const groups=[...document.querySelectorAll('.trivia-subject-group')];
 for(const group of groups){
  const collapsed=triviaCollapsedSubjects.has(group.dataset.subject),button=group.querySelector('.trivia-group-toggle');
  group.classList.toggle('is-collapsed',collapsed);
  group.querySelector('.trivia-group-items').hidden=collapsed;group.querySelector('.trivia-group-summary').hidden=!collapsed;
  group.querySelector('.trivia-group-symbol').textContent=collapsed?'+':'−';button.setAttribute('aria-expanded',String(!collapsed));
  button.setAttribute('aria-label',(collapsed?'Expand ':'Collapse ')+group.dataset.label);
 }
 const allCollapsed=triviaData.categories.filter(c=>c.id!=='all').every(c=>triviaCollapsedSubjects.has(c.id));
 $('trivia-toggle-all').textContent=allCollapsed?'Expand all':'Collapse all';
}

const triviaCategoryIcons={combat:'diamond-sword',ironman:'armor',victory:'apple',survival:'creeper',participation:'helmet',crown:'crown',milestones:'enchanted-apple',seasons:'book-and-quill',stories:'book-and-quill'};
const triviaCategoryLabel=id=>triviaData.categories.find(c=>c.id===id)?.label||id;
function triviaPerson(instance){
 let html=instance.name?`<span class="trivia-person">${instance.entity?escape(instance.name):statPlayer(instance.name)}</span>`:'';
 if(instance.victim)html+=`<span class="trivia-connect">→</span><span class="trivia-person">${statPlayer(instance.victim)}</span>`;
 if(instance.other)html+=`<span class="trivia-connect">↔</span><span class="trivia-person">${statPlayer(instance.other)}</span>`;
 const ids=instance.seasons||[instance.season].filter(Boolean);if(ids.length)html+=`<span class="trivia-seasons trivia-season-links">${[...new Set(ids)].sort((a,b)=>a-b).map(id=>`<a href="#season-${id}" aria-label="Go to season ${id}">${String(id).padStart(2,'0')}</a>`).join('')}</span>`;
 if(instance.details)html+=`<span class="trivia-instance-detail">${escape(instance.details)}</span>`;
 return `<div class="trivia-instance">${instance.number?`<b class="trivia-milestone-number">#${instance.number}</b>`:''}${html}</div>`;
}
function triviaRecord(record){
 const display=record.unit==='time'?duration(record.value):record.value;
 const scope=record.scope==='All time'?'all-time':'season';
 return `<article class="trivia-record trivia-record--${scope}"><div class="trivia-record-top"><img src="${window.UHC_ICONS[record.icon]}" alt="" width="28" height="28"></div><div class="trivia-record-heading"><h3>${escape(record.title)}</h3><span class="trivia-record-scope">${scope==='all-time'?'All-time record':'Single-season record'}</span></div><div class="trivia-record-value"><strong>${display}</strong>${record.unit!=='time'?`<span>${escape(record.unit)}</span>`:''}</div><div class="trivia-record-holders">${record.holders.map(triviaPerson).join('')}</div><button type="button" class="trivia-info" aria-label="How ${escape(record.title)} is calculated" ${chartTip(record.detail+'\n\nCategory: '+triviaCategoryLabel(record.category)+'\nSource: UHC_Data.xlsx')}>ⓘ</button></article>`;
}
function triviaFact(fact){
 const archived=fact.source.type==='document',confirmed=fact.source.type==='user';
 const seasonOnly=fact.instances.length>0&&fact.instances.every(i=>!i.name&&!i.victim&&!i.other&&!i.details&&!i.number);
 let instances=seasonOnly?`<div class="trivia-season-row">${fact.instances.map(triviaPerson).join('')}</div>`:fact.instances.length?`<div class="trivia-fact-preview">${fact.instances.slice(0,3).map(triviaPerson).join('')}</div>${fact.instances.length>3?`<details class="trivia-instances"><summary>All ${fact.instances.length} instances</summary><div>${fact.instances.slice(3).map(triviaPerson).join('')}</div></details>`:''}`:'';
 if(fact.id==='runner-streak')instances=`<div class="trivia-fact-preview">${fact.instances.map(triviaPerson).join('')}</div>`;
 if(fact.id==='most-distinct-pvp-killers'){
  const groups=new Map();
  for(const instance of fact.instances){if(!groups.has(instance.season))groups.set(instance.season,[]);groups.get(instance.season).push(instance);}
  instances=[...groups].map(([season,players])=>{
   const person=instance=>triviaPerson({...instance,season:undefined,seasons:[],details:'('+String(instance.details).match(/^\d+/)?.[0]+')'});
   return `<div class="trivia-season-group"><div class="trivia-season-group-heading">${triviaPerson({season})}</div><div class="trivia-fact-preview">${players.map(person).join('')}</div></div>`;
  }).join('');
 }
 return `<article class="trivia-fact ${archived?'trivia-archival':''}"><div class="trivia-fact-top"><img src="${window.UHC_ICONS[fact.icon||'helmet']}" alt="" width="28" height="28"></div><div class="trivia-fact-heading"><h3>${escape(fact.title)}</h3>${fact.id==='most-distinct-pvp-killers'?'<span class="trivia-record-scope">Single-Season Record</span>':''}</div><div class="trivia-fact-body">${fact.text?`<p>${escape(fact.text)}</p>`:''}${instances}${archived||confirmed?`<div class="trivia-fact-source"><span>${archived?'◷ Historical document note':confirmed?'✓ User-confirmed trivia':'↻ Calculated from current records'}</span>${archived?`<span ${chartTip('Hyalus UHC Trivia & Charts.docx\n'+fact.source.locator+'\nThis is a historical observation, not a statistic recalculated from the ledger.')} tabindex="0">ⓘ</span>`:''}</div>`:''}</div></article>`;
}
function triviaMatches(item,query){return (!query||[item.title,item.text,item.detail,item.scope,...(item.holders||item.instances||[]).flatMap(h=>[h.name,h.victim,h.other,h.details,...(h.seasons||[h.season]).filter(Boolean).map(s=>'S'+s)])].filter(Boolean).some(v=>String(v).toLowerCase().includes(query)))&&(triviaCategory==='all'||item.category===triviaCategory);}
function renderTrivia(){
 const query=$('trivia-search').value.trim().toLowerCase();
 triviaCategory=$('trivia-subject').value||'all';
 const records=triviaData.records.filter(r=>triviaMatches(r,query));
 const facts=triviaData.facts.filter(f=>triviaMatches(f,query));
 $('trivia-grid').setAttribute('aria-label',`${records.length} records and ${facts.length} trivia entries`);
 // Bracket each subject while preserving its existing record/trivia order.
 const groups=[];
 for(const category of triviaData.categories.filter(c=>c.id!=='all')){
  const topicRecords=records.filter(r=>r.category===category.id),topicFacts=facts.filter(f=>f.category===category.id),entries=[];
  while(topicRecords.length||topicFacts.length){
   entries.push(...topicRecords.splice(0,2).map(triviaRecord));
   if(topicFacts.length)entries.push(triviaFact(topicFacts.shift()));
  }
  if(entries.length)groups.push(`<section class="trivia-subject-group" data-subject="${category.id}" data-label="${escape(category.label)}" aria-label="${escape(category.label)}"><div class="trivia-group-rail"><button type="button" class="trivia-group-toggle" aria-controls="trivia-group-${category.id}" aria-expanded="true" aria-label="Collapse ${escape(category.label)}"></button><span class="trivia-rail-label" aria-hidden="true"><span class="trivia-group-symbol">−</span><span class="trivia-group-label"><img class="trivia-category-icon" src="${window.UHC_ICONS[triviaCategoryIcons[category.id]]}" alt="" width="16" height="16"> ${escape(category.label)}</span></span></div><div class="trivia-group-summary" hidden><img class="trivia-summary-icon" src="${window.UHC_ICONS[triviaCategoryIcons[category.id]]}" alt="" width="24" height="24"><h2>${escape(category.label)}</h2></div><div class="trivia-group-items" id="trivia-group-${category.id}">${entries.map(html=>`<div class="trivia-entry">${html}</div>`).join('')}</div></section>`);
 }
 $('trivia-grid').innerHTML=groups.join('');
 updateTriviaGroupControls();
 $('trivia-empty').hidden=records.length+facts.length>0;
}
function initializeTrivia(){
 $('trivia-grid').addEventListener('click',event=>{
  const button=event.target.closest('.trivia-group-toggle');if(!button)return;
  const id=button.closest('.trivia-subject-group').dataset.subject;
  if(triviaCollapsedSubjects.has(id))triviaCollapsedSubjects.delete(id);else triviaCollapsedSubjects.add(id);
  updateTriviaGroupControls();
  revealCollapsedTriviaGroup(button.closest('.trivia-subject-group'));
 });
 $('trivia-toggle-all').addEventListener('click',()=>{
  const ids=triviaData.categories.filter(c=>c.id!=='all').map(c=>c.id),expand=ids.every(id=>triviaCollapsedSubjects.has(id));
  const current=[...document.querySelectorAll('.trivia-subject-group')].find(group=>group.getBoundingClientRect().bottom>100);
  if(expand)triviaCollapsedSubjects.clear();else ids.forEach(id=>triviaCollapsedSubjects.add(id));
  updateTriviaGroupControls();
  if(!expand)revealCollapsedTriviaGroup(current);
 });
 $('trivia-summary').textContent=`${triviaData.counts.seasons} seasons · ${triviaData.records.length} current records · ${triviaData.facts.length} trivia entries`;
 $('trivia-subject').innerHTML=triviaData.categories.map(c=>`<option value="${c.id}">${escape(c.label)}</option>`).join('');
 $('trivia-search').addEventListener('input',renderTrivia);
 $('trivia-subject').addEventListener('change',renderTrivia);
 $('trivia-source-notes').textContent=triviaData.sourceNotes;
 const cellValue=value=>{const text=String(value);const num=Number(text);return Number.isFinite(num)&&num>0&&num<1?duration(Math.round(num*86400)):text;};
 $('trivia-reference-sheet').innerHTML=`<div class="table-wrap"><table class="trivia-reference-table"><thead><tr><th>Source row</th><th>Original entries</th></tr></thead><tbody>${triviaData.referenceRows.map(row=>`<tr><td>${row.row}</td><td>${row.cells.map(c=>`<span><b>${escape(c.cell)}</b> ${escape(cellValue(c.value))}</span>`).join('')}</td></tr>`).join('')}</tbody></table></div>`;
 $('trivia-reference-site').innerHTML=`<div class="table-wrap"><table><thead><tr><th>Original record category</th><th>Historical wording</th></tr></thead><tbody>${triviaData.legacyRecords.filter(r=>r[0]!=='Stat').map(r=>`<tr><td>${escape(r[0])}</td><td>${escape(r[1])}</td></tr>`).join('')}</tbody></table></div>`;
}
