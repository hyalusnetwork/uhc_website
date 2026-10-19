const fs=require('fs');let p='dist/index.html',s=fs.readFileSync(p,'utf8');s=s.replace('<label><span class="sr-only">Filter by year</span><select id="year">','<label class="season-filter-kind"><span class="sr-only">Filter category</span><select id="season-filter-category" aria-label="Filter category"><option value="year">Year</option><option value="size">Team Size</option><option value="mode">Gamemode</option><option value="version">Version</option></select></label><label class="season-filter-choice"><span class="sr-only" id="season-filter-value-label">Filter by year</span><select id="year" aria-labelledby="season-filter-value-label">');fs.writeFileSync(p,s);
p='dist/app.js';s=fs.readFileSync(p,'utf8');const at=s.indexOf('function filtered(){');s=s.slice(0,at)+`function seasonFilterValue(season,category){
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
`+s.slice(at);s=s.replace("const q=$('search').value.trim().toLowerCase(),year=$('year').value;","const q=$('search').value.trim().toLowerCase(),filterValue=$('year').value,category=$('season-filter-category').value||'year';");s=s.replace("(!year||s.date.startsWith(year))","(!filterValue||seasonFilterValue(s,category)===filterValue)");const start=s.indexOf('[...new Set(seasons.map(s=>s.date.slice(0,4)))]'),end=s.indexOf("$('search').addEventListener",start);s=s.slice(0,start)+`const originalFilterWidth=$('year').getBoundingClientRect?.().width;
if(originalFilterWidth&&window.innerWidth>720){$('year').style.width=originalFilterWidth+'px';$('season-filter-category').style.width=originalFilterWidth+'px';}
updateSeasonFilterOptions();
$('season-filter-category').addEventListener('change',()=>{updateSeasonFilterOptions();render();});
`+s.slice(end);s=s.replace("$('year').addEventListener('change',render)","$('year').addEventListener('change',()=>{$('year').title=$('year').selectedOptions[0]?.textContent||'';render();})");s=s.replace("$('search').value='';$('year').value='';$('order').value='old';render();","$('search').value='';$('season-filter-category').value='year';updateSeasonFilterOptions();$('order').value='old';render();");s=s.replace('No seasons found. Try another player, team, or year.','No seasons found. Try another search or filter.');fs.writeFileSync(p,s);
