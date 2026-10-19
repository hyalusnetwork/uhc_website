const fs=require('fs');function edit(p,f){fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')))}
edit('dist/index.html',s=>s.replace('<a href="#links" data-tab="links">Links</a>','<a href="#about" data-tab="about">About</a>').replace('<section id="placeholder-view"',fs.readFileSync('about-page.html','utf8')+'<section id="placeholder-view"').replace('<img class="crown-icon crown-legend" src="icons/crown.png" alt="Crown" width="22" height="14"> Crown history on hover or tap','<a href="#about-crown" aria-label="About the Crown"><img class="crown-icon crown-legend" src="icons/crown.png" alt="Crown" width="22" height="14"></a> Hover for history · click for About'));
edit('dist/app.js',s=>{
 s=s.replace('<button type="button" aria-label="Crown history for ${escape(s.crown.name)}" aria-expanded="false" aria-describedby="crown-tooltip-${s.id}">','<a class="crown-link" href="#about-crown" aria-label="About the Crown; held by ${escape(s.crown.name)}" aria-describedby="crown-tooltip-${s.id}">').replace('width="22" height="14"></button><span class="tooltip"','width="22" height="14"></a><span class="tooltip"');
 s=s.replaceAll("closest('.crown button')","closest('.crown-link')");
 const a=s.indexOf("  const crownButton=e.target.closest('.crown-link');"),b=s.indexOf("  const player=e.target.closest('[data-player]');",a);if(a<0||b<0)throw Error('Crown click handler not found');s=s.slice(0,a)+s.slice(b);
 const tabStart=s.indexOf('function tab(){'),tabEnd=s.indexOf("$('unique-count')",tabStart);
 s=s.slice(0,tabStart)+`function tab(){
 const hash=location.hash.slice(1);
 const selected=hash==='about'||hash.startsWith('about-')?'about':hash==='rankings'||hash==='rankings-players'||hash.startsWith('rank-player-')||hash.startsWith('team-color-')?'rankings':hash==='players'||hash.startsWith('player-')?'players':['stats','trivia'].includes(hash)?hash:'seasons';
 for(const page of ['seasons','players','stats','rankings','trivia','about'])$(page+'-view').hidden=selected!==page;
 $('placeholder-view').hidden=true;
 if(selected==='trivia')renderTrivia();if(selected==='rankings')rankingsRoute();if(selected==='stats')renderStats();if(selected==='players')playersRoute();
 document.querySelectorAll('[data-tab]').forEach(a=>{a.classList.toggle('active',a.dataset.tab===selected);if(a.dataset.tab===selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 if(selected==='about')requestAnimationFrame(()=>{if(hash==='about')window.scrollTo?.({top:0,behavior:'instant'});else document.getElementById(hash)?.scrollIntoView?.({block:'start'});});
}
`+s.slice(tabEnd);
 s=s.replace('<span class="team-name">${escape(p.team||p.color||\'Not recorded\')}</span>','${p.color&&p.color!==\'Solo\'?`<a class="team-name season-team-link" href="#${teamAnchor(p.color)}">${escape(p.team||p.color)}</a>`:`<span class="team-name">${escape(p.team||p.color||\'Not recorded\')}</span>`}');
 s=s.replace('<strong title="${escape(event.color)}">${escape(event.team)}</strong>','<strong title="${escape(event.color)}"><a class="season-team-link" href="#${teamAnchor(event.color)}">${escape(event.team)}</a></strong>');return s;
});
edit('dist/styles.css',s=>s.replace('.crown:hover .tooltip,.crown:focus-within .tooltip,.crown.open .tooltip','.crown:hover .tooltip,.crown:has(.crown-link:focus-visible) .tooltip'));
