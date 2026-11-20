const fs=require('node:fs');
const edit=(p,fn)=>fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));
edit('dist/index.html',s=>s.replace('<p class="intro">Records and data visualized.</p>','').replace(/<div id="stats-subtabs"[^>]*><\/div>/,''));
edit('dist/stats.js',s=>{
 const start=s.indexOf('function renderStats(){'),end=s.indexOf('function initializeStats(){',start);
 s=s.slice(0,start)+`function statsEntries(mode){
 const allTimeIds=['wins','pve','mob-damage','pvp','victims','ironmen'];
 return mode==='graphs'?statsData.graphs:statsData.tables.filter(t=>mode==='all-time'?allTimeIds.includes(t.id):!allTimeIds.includes(t.id));
}
function renderStats(){
 const entries=statsEntries(statsMode);
 if(!entries.some(t=>t.id===statsTab))statsTab=entries[0].id;
 document.querySelector('#stats-view .stats-mode').innerHTML=[['graphs','Graphs'],['all-time','All-Time Tables'],['season','Season Tables']].map(([mode,label])=>\`<details class="stats-dropdown \${statsMode===mode?'active':''}"><summary>\${label}<span aria-hidden="true">▾</span></summary><div class="stats-dropdown-menu">\${statsEntries(mode).map(t=>\`<button type="button" data-stats-choice="\${t.id}" data-choice-mode="\${mode}" aria-pressed="\${statsMode===mode&&statsTab===t.id}">\${escape(t.title)}</button>\`).join('')}</div></details>\`).join('');
 $('stats-table-controls').hidden=statsMode==='graphs';
 statsMode==='graphs'?statsGraph():statsTable();
}
`+s.slice(end);
 s=s.replace(" $('stats-search').addEventListener",` document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.stats-dropdown[open]').forEach(d=>{d.open=false;d.querySelector('summary').focus();});});
 document.addEventListener('click',event=>{
  document.querySelectorAll('.stats-dropdown[open]').forEach(d=>{if(!d.contains(event.target))d.open=false;});
  const choice=event.target.closest('[data-stats-choice]');
  if(choice){statsMode=choice.dataset.choiceMode;statsTab=choice.dataset.statsChoice;statsSort.column=null;renderStats();if(event.detail===0)document.querySelector('.stats-dropdown.active summary').focus();}
 });
 $('stats-search').addEventListener`);
 return s;
});
fs.appendFileSync('dist/ore-theme.css',`
/* Stats categories open their own view menus. */
.stats-header-controls{display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap}
.stats-header-controls .stats-mode{display:flex;gap:10px;flex-wrap:wrap}
.stats-header-controls .stats-table-controls{flex:1;min-width:180px}
.stats-header-controls .stats-table-controls .search{margin:0;min-height:48px;box-sizing:border-box}
.stats-dropdown{position:relative}
.stats-dropdown summary{display:flex;align-items:center;justify-content:space-between;gap:14px;cursor:pointer;list-style:none;padding:10px 14px 14px;color:#f5f7fa;background:linear-gradient(#596575,#394454);border:2px solid #252d39;box-shadow:inset 0 0 0 2px #ffffff38,inset 0 -6px #29313f;font-size:13px;font-weight:600}
.stats-dropdown summary::-webkit-details-marker{display:none}
.stats-dropdown.active summary{color:#101c2c;background:linear-gradient(#c0d7ff,#a8c7ff);border-color:#667c9f;box-shadow:inset 0 0 0 2px #ffffff38,inset 0 -6px #768eb5}
.stats-dropdown summary:hover{filter:brightness(1.12)}
.stats-dropdown summary:focus-visible{outline:2px solid #dbe8ff;outline-offset:2px}
.stats-dropdown-menu{position:absolute;top:calc(100% + 6px);left:0;z-index:20;min-width:220px;max-width:calc(100vw - 48px);max-height:55vh;overflow-y:auto;padding:5px;background:#20252d;border:1px solid #697587;box-shadow:0 6px 16px #0008}
#stats-view .stats-mode .stats-dropdown-menu button{display:block;width:100%;text-align:left;border:0;padding:10px 12px;background:none;box-shadow:none;color:#e0e3e8;min-height:36px;transform:none}
#stats-view .stats-mode .stats-dropdown-menu button::before{content:none}
#stats-view .stats-mode .stats-dropdown-menu button:hover,#stats-view .stats-mode .stats-dropdown-menu button:focus-visible{background:#394454;outline:1px solid #a8c7ff}
#stats-view .stats-mode .stats-dropdown-menu button[aria-pressed="true"]{background:#a8c7ff;color:#101c2c}
@media(min-width:1100px){.stats-header{grid-template-columns:minmax(225px,1fr) minmax(0,2.8fr)}}
@media(max-width:600px){.stats-header-controls{gap:10px}.stats-header-controls .stats-mode{gap:6px;width:100%}.stats-dropdown{flex:1}.stats-dropdown summary{font-size:11px;padding:10px 8px 14px;gap:6px}.stats-dropdown:last-child .stats-dropdown-menu{left:auto;right:0}.stats-header-controls .stats-table-controls{flex-basis:100%}}
`);
