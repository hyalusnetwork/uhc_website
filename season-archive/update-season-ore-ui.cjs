const fs=require('fs');
function edit(f,fn){fs.writeFileSync(f,fn(fs.readFileSync(f,'utf8')));}
edit('dist/index.html',s=>s.replace('<b class="badge iron">◈ Ironman</b> Last to take damage</span><span><b class="badge debut">Debut</b> First recorded appearance','<img class="legend-item-icon" src="icons/oak-sapling.png" alt="Debut"> First recorded appearance</span><span><img class="legend-item-icon" src="icons/iron-chestplate.png" alt="Ironman"> Last to take damage').replace('class="season-filter-kind"','class="season-filter-kind ore-select-bevel"').replace('class="season-filter-choice"','class="season-filter-choice ore-select-bevel"').replace('<label><span class="sr-only">Season order','<label class="ore-select-bevel"><span class="sr-only">Season order'));
edit('make-html.cjs',s=>s.replace('const iconScript=',"for(const name of ['oak-sapling','iron-chestplate']){icons[name]='data:image/png;base64,'+fs.readFileSync('dist/icons/'+name+'.png').toString('base64');html=html.replaceAll('src=\"icons/'+name+'.png\"','src=\"'+icons[name]+'\"');}\nconst iconScript="));
edit('dist/ore-theme.css',s=>s.split('\n').map(l=>{
 if(l.startsWith('.profile-season-grid>a')||l.startsWith('@media(hover:hover){.profile-season-grid>a'))l=l.replaceAll('.profile-season-grid>a',':is(.profile-season-grid,.season-index)>a').replaceAll(':is(.profile-season-grid,.season-index)>a.profile-season-mole','.profile-season-grid>a.profile-season-mole');
 if(l.includes('),.ore-select-bevel{')||l.includes('),.ore-select-bevel::before{'))l=l.replace(',.ore-select-bevel',',#seasons-view #reset,#back-to-top-pearl,.ore-select-bevel');
 if(l.startsWith(':is(#player-sort,#ranking-filter,#ranking-order,#pr-tier-filter,#pr-order)'))l=l.replaceAll('#pr-order)','#pr-order,#season-filter-category,#year,#order)');
 return l;
}).join('\n'));
