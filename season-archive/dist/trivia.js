const triviaData=window.UHC_TRIVIA;
let triviaCategory='all';
const triviaCategoryLabel=id=>triviaData.categories.find(c=>c.id===id)?.label||id;
function triviaPerson(instance){
 let html=instance.name?`<span class="trivia-person">${instance.entity?escape(instance.name):statPlayer(instance.name)}</span>`:'';
 if(instance.victim)html+=`<span class="trivia-connect">→</span><span class="trivia-person">${statPlayer(instance.victim)}</span>`;
 if(instance.other)html+=`<span class="trivia-connect">↔</span><span class="trivia-person">${statPlayer(instance.other)}</span>`;
 const ids=instance.seasons||[instance.season].filter(Boolean);if(ids.length)html+=`<span class="trivia-seasons">${seasonLinks(ids)}</span>`;
 if(instance.details)html+=`<span class="trivia-instance-detail">${escape(instance.details)}</span>`;
 return `<div class="trivia-instance">${instance.number?`<b class="trivia-milestone-number">#${instance.number}</b>`:''}${html}</div>`;
}
function triviaRecord(record){
 const display=record.unit==='time'?duration(record.value):record.value;
 const scope=record.scope==='All time'?'all-time':'season';
 return `<article class="trivia-record trivia-record--${scope}"><div class="trivia-record-top"><span>${scope==='all-time'?'All-time record':'Single-season record'}</span><img src="${window.UHC_ICONS[record.icon]}" alt="" width="28" height="28"></div><h3>${escape(record.title)}</h3><div class="trivia-record-value"><strong>${display}</strong>${record.unit!=='time'?`<span>${escape(record.unit)}</span>`:''}</div><div class="trivia-record-holders">${record.holders.map(triviaPerson).join('')}</div><button type="button" class="trivia-info" aria-label="How ${escape(record.title)} is calculated" ${chartTip(record.detail+'\n\nCategory: '+triviaCategoryLabel(record.category)+'\nSource: UHC_Data.xlsx')}>ⓘ</button></article>`;
}
function triviaFact(fact){
 const archived=fact.source.type==='document',confirmed=fact.source.type==='user';
 return `<article class="trivia-fact ${archived?'trivia-archival':''}"><div class="trivia-fact-top"><span>${escape(triviaCategoryLabel(fact.category))}</span><img src="${window.UHC_ICONS[fact.icon||'helmet']}" alt="" width="28" height="28"></div><h3>${escape(fact.title)}</h3><p>${escape(fact.text)}</p>${fact.instances.length?`<div class="trivia-fact-preview">${fact.instances.slice(0,3).map(triviaPerson).join('')}</div>${fact.instances.length>3?`<details class="trivia-instances"><summary>All ${fact.instances.length} instances</summary><div>${fact.instances.slice(3).map(triviaPerson).join('')}</div></details>`:''}`:''}${archived||confirmed?`<div class="trivia-fact-source"><span>${archived?'◷ Historical document note':confirmed?'✓ User-confirmed trivia':'↻ Calculated from current records'}</span>${archived?`<span ${chartTip('Hyalus UHC Trivia & Charts.docx\n'+fact.source.locator+'\nThis is a historical observation, not a statistic recalculated from the ledger.')} tabindex="0">ⓘ</span>`:''}</div>`:''}</article>`;
}
function triviaMatches(item,query){return (!query||[item.title,item.text,item.detail,item.scope,...(item.holders||item.instances||[]).flatMap(h=>[h.name,h.victim,h.other,h.details,...(h.seasons||[h.season]).filter(Boolean).map(s=>'S'+s)])].filter(Boolean).some(v=>String(v).toLowerCase().includes(query)))&&(triviaCategory==='all'||item.category===triviaCategory);}
let triviaLayoutFrame=0,triviaLayoutObserver;
function scheduleTriviaLayout(){
 cancelAnimationFrame(triviaLayoutFrame);
 triviaLayoutFrame=requestAnimationFrame(()=>{
  const grid=$('trivia-grid');if(!grid.offsetWidth)return;
  grid.classList.add('trivia-grid--packed');
  grid.querySelectorAll('.trivia-entry').forEach(entry=>{entry.style.gridRowEnd=`span ${Math.ceil(entry.firstElementChild.getBoundingClientRect().height)+14}`;});
 });
}
function renderTrivia(){
 const query=$('trivia-search').value.trim().toLowerCase(),type=$('trivia-type').value||'all';
 const records=type==='facts'||type==='stories'?[]:triviaData.records.filter(r=>triviaMatches(r,query));
 const facts=type==='records'?[]:triviaData.facts.filter(f=>triviaMatches(f,query)&&(type!=='stories'||f.source.type==='document'));
 $('trivia-count').textContent=`${records.length} records · ${facts.length} trivia entries`;
 // Keep each topic's records and stories together, without a featured tier.
 const entries=[];
 for(const category of triviaData.categories.filter(c=>c.id!=='all')){
  const topicRecords=records.filter(r=>r.category===category.id),topicFacts=facts.filter(f=>f.category===category.id);
  while(topicRecords.length||topicFacts.length){
   entries.push(...topicRecords.splice(0,2).map(triviaRecord));
   if(topicFacts.length)entries.push(triviaFact(topicFacts.shift()));
  }
 }
 triviaLayoutObserver?.disconnect();
 $('trivia-grid').innerHTML=entries.map(html=>`<div class="trivia-entry">${html}</div>`).join('');
 if(triviaLayoutObserver){triviaLayoutObserver.observe($('trivia-grid'));$('trivia-grid').querySelectorAll('article').forEach(card=>triviaLayoutObserver.observe(card));}
 scheduleTriviaLayout();
 $('trivia-empty').hidden=records.length+facts.length>0;
 document.querySelectorAll('[data-trivia-category]').forEach(b=>{const active=b.dataset.triviaCategory===triviaCategory;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
}
function initializeTrivia(){
 if(typeof ResizeObserver!=='undefined')triviaLayoutObserver=new ResizeObserver(scheduleTriviaLayout);
 $('trivia-summary').textContent=`${triviaData.counts.seasons} seasons · ${triviaData.records.length} current records · ${triviaData.facts.length} trivia entries`;
 $('trivia-categories').innerHTML=triviaData.categories.map(c=>`<button data-trivia-category="${c.id}" aria-pressed="${c.id==='all'}" class="${c.id==='all'?'active':''}">${escape(c.label)}</button>`).join('');
 $('trivia-search').addEventListener('input',renderTrivia);$('trivia-type').addEventListener('change',renderTrivia);
 $('trivia-reset').addEventListener('click',()=>{$('trivia-search').value='';$('trivia-type').value='all';triviaCategory='all';renderTrivia();});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-trivia-category]');if(b){triviaCategory=b.dataset.triviaCategory;renderTrivia();}});
 $('trivia-source-notes').textContent=triviaData.sourceNotes;
 const cellValue=value=>{const text=String(value);const num=Number(text);return Number.isFinite(num)&&num>0&&num<1?duration(Math.round(num*86400)):text;};
 $('trivia-reference-sheet').innerHTML=`<div class="table-wrap"><table class="trivia-reference-table"><thead><tr><th>Source row</th><th>Original entries</th></tr></thead><tbody>${triviaData.referenceRows.map(row=>`<tr><td>${row.row}</td><td>${row.cells.map(c=>`<span><b>${escape(c.cell)}</b> ${escape(cellValue(c.value))}</span>`).join('')}</td></tr>`).join('')}</tbody></table></div>`;
 $('trivia-reference-site').innerHTML=`<div class="table-wrap"><table><thead><tr><th>Original record category</th><th>Historical wording</th></tr></thead><tbody>${triviaData.legacyRecords.filter(r=>r[0]!=='Stat').map(r=>`<tr><td>${escape(r[0])}</td><td>${escape(r[1])}</td></tr>`).join('')}</tbody></table></div>`;
}
