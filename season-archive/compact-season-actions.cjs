const fs=require('fs');let a=fs.readFileSync('dist/app.js','utf8');a=a.slice(a.indexOf('\n')+1);
a=a.replace('${seasonVideoLinks(s.id)}','');
a=a.replace('<span>Season ${s.id} · ${s.players.filter(p=>p.debut).length} debuts</span>','${seasonFooterActions(s.id)}');
const helpers=`
function seasonFooterActions(id){
 const info='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="7.5" r="1.2" fill="currentColor"/></svg>';
 const youtube='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" fill="#e65b63"/><path d="m10 8 6 4-6 4Z" fill="#fff"/></svg>';
 return '<span class="season-footer-actions"><button type="button" data-season-menu="info" data-season-id="'+id+'" aria-label="Season '+id+' information" title="Click to show season information" aria-haspopup="dialog">'+info+'</button><button type="button" data-season-menu="videos" data-season-id="'+id+'" aria-label="Season '+id+' YouTube videos" title="Click to show videos for this season" aria-haspopup="dialog">'+youtube+'</button></span>';
}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-season-menu]');if(!button)return;
 const season=seasons.find(s=>s.id===Number(button.dataset.seasonId));if(!season)return;
 let dialog=document.getElementById('season-menu-dialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='season-menu-dialog';dialog.className='season-menu-dialog';document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});}
 const videos=window.UHC_SEASON_VIDEOS?.[season.id]||[];
 const content=button.dataset.seasonMenu==='videos'?'<ul class="season-menu-videos">'+videos.map(v=>'<li><a href="https://www.youtube.com/watch?v='+v.id+'" target="_blank" rel="noopener noreferrer">'+escape(v.title)+'</a></li>').join('')+'</ul><a class="season-playlist-link" href="https://www.youtube.com/playlist?list=PL2lIZSsagJkI2UD_VM5v6c2ksedvxIaCL" target="_blank" rel="noopener noreferrer">Full UHC playlist ↗</a>':'<dl class="season-menu-info"><dt>Game format</dt><dd>'+escape(season.mode)+(season.teamSize===1?' · Solo':' · Teams of '+season.teamSize)+'</dd><dt>World seed</dt><dd>Not available</dd></dl>';
 dialog.innerHTML='<div class="season-menu-heading"><h2 id="season-menu-title">Season '+season.id+' · '+(button.dataset.seasonMenu==='videos'?'YouTube videos':'Information')+'</h2><button type="button" aria-label="Close">×</button></div>'+content;
 dialog.setAttribute('aria-labelledby','season-menu-title');dialog.querySelector('button').onclick=()=>dialog.close();dialog.showModal();
});
`;
a=helpers+a;fs.writeFileSync('dist/app.js',a);
let s=fs.readFileSync('dist/season-replay.js','utf8');const start=s.indexOf('function controls(id){'),end=s.indexOf('function snapshot',start);
s=s.slice(0,start)+`function controls(id){
return '<section class="season-replay-controls" id="season-replay-controls-'+id+'" data-replay-controls="'+id+'"><div class="season-replay-slide"><div class="season-replay-tools"><button type="button" data-replay-action="toggle" data-replay-id="'+id+'">Play</button><label><span class="sr-only">Playback speed</span><span class="ore-select-bevel"><select aria-label="Playback speed" data-replay-speed="'+id+'">'+[1,10,30,60,120,300].map(n=>'<option value="'+n+'"'+(n===60?' selected':'')+'>'+n+'×</option>').join('')+'</select></span></label><label><span class="sr-only">Row order</span><span class="ore-select-bevel"><select aria-label="Row order" data-replay-order="'+id+'"><option value="deaths">Move on death</option><option value="teams">Keep teams together</option><option value="health">Health, highest first</option></select></span></label><button type="button" data-replay-action="next" data-replay-id="'+id+'">Next event</button><button type="button" data-replay-action="close" data-replay-id="'+id+'">Final results</button><label class="season-replay-seek"><span class="sr-only">Match time</span><input aria-label="Match time" type="range" min="0" max="'+replays[id].end+'" step="any" value="0" data-replay-seek="'+id+'"></label><span class="season-replay-status sr-only" aria-live="polite"></span></div></div></section>';
}
`+s.slice(end);
s=s.replace("card.querySelector('.season-replay-tools').hidden=false;", "card.querySelector('.season-replay-controls').classList.add('is-open');card.querySelector('.season-replay-controls').inert=false;card.querySelector('.season-animation-launch').setAttribute('aria-expanded','true');");
s=s.replace("card.querySelector('.season-replay-tools').hidden=true;", "card.querySelector('.season-replay-controls').classList.remove('is-open');card.querySelector('.season-replay-controls').inert=true;card.querySelector('.season-animation-launch').setAttribute('aria-expanded','false');card.querySelector('.season-animation-launch').focus();");
s=s.replace("card.querySelector('[data-replay-action=\"toggle\"]').textContent='Watch season';","card.querySelector('[data-replay-action=\"toggle\"]').textContent='Play';");
s=s.replace("card.querySelector('.table-wrap').insertAdjacentHTML('beforebegin',controls(id));", "card.querySelector('.table-wrap').insertAdjacentHTML('beforebegin',controls(id));card.querySelector('.season-replay-controls').inert=true;card.querySelector('.time-box').insertAdjacentHTML('beforeend','<button type=\"button\" class=\"season-animation-launch\" data-replay-action=\"open\" data-replay-id=\"'+id+'\" aria-expanded=\"false\" aria-controls=\"season-replay-controls-'+id+'\">Season Animation</button>');");
s=s.replace("if(action==='toggle'){", "if(action==='open'){document.getElementById('season-'+id).querySelector('[data-replay-action=\"toggle\"]').focus();}\n if(action==='toggle'){");
fs.writeFileSync('dist/season-replay.js',s);
