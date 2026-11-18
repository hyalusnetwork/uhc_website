(() => {
const states=new Map(),replays=window.UHC_REPLAYS||{},reduced=matchMedia('(prefers-reduced-motion: reduce)');
let frame=0,last=0,lastPaint=0;
const slowWindows=new Map();
for(const [id,data] of Object.entries(replays)){
 const spans=data.events.filter(e=>e.fatal||e.combat).map(e=>[Math.max(0,e.t-(e.fatal?45:15)),Math.min(data.end,e.t+15)]).sort((a,b)=>a[0]-b[0]),merged=[];
 for(const span of spans){const prior=merged.at(-1);if(prior&&span[0]<=prior[1])prior[1]=Math.max(prior[1],span[1]);else merged.push([...span]);}
 slowWindows.set(Number(id),merged);
}
function speedAt(id,time){return (slowWindows.get(id)||[]).some(([start,end])=>time>=start&&time<end)?30:300;}
function advance(id,time,seconds,speed){
 const end=replays[id].end;if(speed!=='variable')return Math.min(end,time+seconds*Number(speed));
 // Consume wall time at each boundary so fast playback cannot skip a slow window.
 while(seconds>1e-9&&time<end){const rate=speedAt(id,time),boundary=(slowWindows.get(id)||[]).flat().find(t=>t>time+1e-7)??end,next=Math.min(boundary,end),cost=(next-time)/rate;
 if(seconds<cost){time+=seconds*rate;break;}time=next;seconds-=cost;
 }return Math.min(end,time);
}

function hearts(health,absorption=0){
 const red=Math.max(0,health/2),yellow=Math.max(0,absorption/2),capacity=Math.max(10,Math.ceil(red));
 function cell(value,icon){return '<span class="replay-heart"><img src="'+window.UHC_ICONS['hardcore-container']+'" alt=""><span style="width:'+Math.min(100,Math.max(0,value*100))+'%"><img src="'+window.UHC_ICONS[icon]+'" alt=""></span></span>'}
 return '<span class="replay-hearts" role="img" aria-label="'+red.toFixed(2)+' hearts'+(yellow?' and '+yellow.toFixed(2)+' absorption hearts':'')+'" title="'+red.toFixed(2)+' hearts'+(yellow?' + '+yellow.toFixed(2)+' absorption':'')+'">'+Array.from({length:capacity},(_,i)=>cell(red-i,'hardcore-heart-full')).join('')+(yellow?'<span class="replay-absorption">'+Array.from({length:Math.ceil(yellow)},(_,i)=>cell(yellow-i,'absorption-heart')).join('')+'</span>':'')+'</span>';
}
function controls(id){
return '<section class="season-replay-controls" id="season-replay-controls-'+id+'" data-replay-controls="'+id+'"><div class="season-replay-slide"><div class="season-replay-tools"><button type="button" data-replay-action="toggle" data-replay-id="'+id+'">Play</button><label><span class="sr-only">Playback speed</span><span class="ore-select-bevel"><select aria-label="Playback speed" data-replay-speed="'+id+'">'+['variable',60,90,150,300].map(n=>'<option value="'+n+'"'+(n==='variable'?' selected':'')+'>'+(n==='variable'?'Variable':n+'×')+'</option>').join('')+'</select></span></label><label><span class="sr-only">Row order</span><span class="ore-select-bevel"><select aria-label="Row order" data-replay-order="'+id+'"><option value="deaths">Move on death</option><option value="teams">Keep teams together</option><option value="health">Health</option></select></span></label><button type="button" data-replay-action="next" data-replay-id="'+id+'">Next event</button><label class="season-replay-seek"><span class="sr-only">Match time</span><input aria-label="Match time" type="range" min="0" max="'+replays[id].end+'" step="any" value="0" data-replay-seek="'+id+'"></label><span class="season-replay-status sr-only" aria-live="polite"></span></div></div></section>';
}
function snapshot(id,t){
 const s=seasons.find(s=>s.id===id),data=replays[id],players=new Map(s.players.map(p=>[p.name,{health:20,abs:0,dead:false,time:null,observed:null}]));
 for(const e of data.events){if(e.t>t)break;const p=players.get(e.name);if(p.dead)continue;p.health=e.after;p.abs=e.absAfter;p.observed=e.t;if(e.fatal){p.dead=true;p.time=e.t;p.health=0;p.abs=0;}}
 // The final survivor observations are the ledger's confirmed end-of-match snapshots.
 if(t>=data.end)for(const p of s.players){if(p.finalHearts!=null){players.get(p.name).health=p.finalHearts*2;players.get(p.name).abs=0;}}
 return players;
}
function paint(st,animate=true){
 const card=document.getElementById('season-'+st.id);if(!card?.isConnected){st.playing=false;return;}
 const model=snapshot(st.id,st.time),data=replays[st.id];

 const teamSort=(a,b)=>(a.team||a.color||'None').localeCompare(b.team||b.color||'None')||a.name.localeCompare(b.name);
 const sorted=[...st.season.players].sort((a,b)=>{
 const x=model.get(a.name),y=model.get(b.name);
 if(st.order==='teams')return teamSort(a,b);
 if(x.dead!==y.dead)return x.dead?-1:1;
 if(x.dead)return x.time-y.time||teamSort(a,b);
 return (st.order==='health'?x.health+x.abs-y.health-y.abs:0)||teamSort(a,b);
 });
 const orderKey=sorted.map(p=>p.name).join('|'),changed=st.orderKey!==orderKey;
 const before=changed?new Map([...st.rows].map(([n,r])=>[n,r.getBoundingClientRect().top])):new Map();
 if(changed)for(const row of st.rows.values())row.querySelectorAll(".replay-cell-content").forEach(cell=>cell.getAnimations().forEach(animation=>animation.cancel()));
 st.orderKey=orderKey;
 for(const p of sorted){const row=st.rows.get(p.name),state=model.get(p.name),death=row.querySelector('.death .replay-cell-content'),elapsed=row.querySelector('.elapsed .replay-cell-content');
 const markup=state.dead?escape(p.death||'Died'):hearts(state.health,state.abs);
 if(death.innerHTML!==markup)death.innerHTML=markup;
 elapsed.textContent=state.dead?duration(p.seconds??state.time):'';
 row.classList.toggle('replay-dead',state.dead);
 row.querySelectorAll('.season-award-icon').forEach(icon=>{icon.hidden=icon.alt==='Ironman'?st.time<data.end:icon.alt==='First Damage'?st.time<(data.events.find(e=>e.name===p.name)?.t??Infinity):false;});
 row.querySelectorAll('.crown').forEach(c=>c.hidden=st.time<data.end);
 st.body.append(row);
 }
 if(changed&&animate&&!reduced.matches)for(const [name,row] of st.rows){const delta=before.get(name)-row.getBoundingClientRect().top;if(Math.abs(delta)>1)row.querySelectorAll(':scope > td > .replay-cell-content').forEach(cell=>cell.animate([{transform:'translateY('+delta+'px)'},{transform:'translateY(0)'}],{duration:250,easing:'ease-out'}));}
 card.querySelector('.time-box strong').textContent=duration(Math.floor(st.time));card.querySelector('.time-box small').textContent='MATCH TIME';
 const panel=card.querySelector('.season-replay-controls');
 panel.querySelector('[data-replay-seek]').value=st.time;
 panel.querySelector('[data-replay-action="toggle"]').textContent=st.playing?'Pause':st.time>=data.end?'Replay':'Play';
 const label=st.time>=data.end?'Match complete':st.playing?'Playing':'Paused';
 if(panel.querySelector('.season-replay-status').textContent!==label)panel.querySelector('.season-replay-status').textContent=label;
}
function init(id){
 const old=states.get(id);if(old)return old;
 const card=document.getElementById('season-'+id),season=seasons.find(s=>s.id===id),body=card.querySelector('tbody');
 card.style.setProperty('--replay-row-height',Math.min(...[...body.rows].map(row=>row.getBoundingClientRect().height).filter(height=>height>0))+'px');
 const saved=body.innerHTML,rows=new Map([...body.rows].map(row=>[row.querySelector('[data-player]')?.dataset.player,row]));
 for(const row of rows.values())for(const cell of row.cells){const content=document.createElement('div');content.className='replay-cell-content';while(cell.firstChild)content.append(cell.firstChild);cell.append(content);}
 const st={id,season,body,saved,rows,time:0,playing:false,speed:card.querySelector('[data-replay-speed]').value,order:card.querySelector('[data-replay-order]').value};states.set(id,st);
 card.classList.add('season-replaying');card.querySelector('.season-replay-controls').classList.add('is-open');card.querySelector('.season-replay-controls').inert=false;card.querySelector('.season-animation-launch').setAttribute('aria-expanded','true');card.querySelector('.season-animation-launch').dataset.replayAction='close';card.querySelector('.season-animation-launch').textContent='Show Final Results';paint(st,false);return st;
}
function tick(now){const delta=last?Math.min(1,(now-last)/1000):0;last=now;
 for(const st of states.values())if(st.playing){if(!document.getElementById('season-'+st.id)?.isConnected){st.playing=false;continue;}if(document.getElementById('seasons-view').hidden){st.playing=false;paint(st,false);continue;}st.time=advance(st.id,st.time,delta,st.speed);if(st.time>=replays[st.id].end)st.playing=false;if(now-lastPaint>=100||!st.playing)paint(st);}
 if(now-lastPaint>=100)lastPaint=now;
 if([...states.values()].some(s=>s.playing))frame=requestAnimationFrame(tick);else{frame=0;last=0;}
}
function run(){if(!frame)frame=requestAnimationFrame(tick);}
function attach(){
 for(const [key] of Object.entries(replays)){const id=Number(key),card=document.getElementById('season-'+id);if(!card||card.querySelector('.season-replay-controls'))continue;states.delete(id);card.querySelector('.table-wrap').insertAdjacentHTML('beforebegin',controls(id));card.querySelector('.season-replay-controls').inert=true;card.querySelector('.time-box').insertAdjacentHTML('beforeend','<button type="button" class="season-animation-launch" data-replay-action="open" data-replay-id="'+id+'" aria-expanded="false" aria-controls="season-replay-controls-'+id+'">Season Animation</button>');}
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-replay-action]');if(!b)return;const id=Number(b.dataset.replayId),action=b.dataset.replayAction,st=init(id);
 if(action==='close'){st.playing=false;st.body.innerHTML=st.saved;const card=document.getElementById('season-'+id);card.classList.remove('season-replaying');card.querySelector('.season-replay-controls').classList.remove('is-open');card.querySelector('.season-replay-controls').inert=true;card.querySelector('.season-animation-launch').setAttribute('aria-expanded','false');card.querySelector('.season-animation-launch').dataset.replayAction='open';card.querySelector('.season-animation-launch').textContent='Season Animation';card.querySelector('.season-animation-launch').focus();card.querySelector('[data-replay-action="toggle"]').textContent='Play';card.querySelector('.time-box strong').textContent=duration(st.season.seconds);states.delete(id);return;}
 if(action==='open'){st.playing=true;}
 if(action==='toggle'){if(st.time>=replays[id].end)st.time=0;st.playing=!st.playing;}
 if(action==='start'){st.time=0;st.playing=false;}
 if(action==='next'){st.playing=false;st.time=replays[id].events.find(x=>x.t>st.time)?.t??replays[id].end;}
 paint(st);run();
});
document.addEventListener('input',e=>{if(e.target.matches('[data-replay-seek]')){const st=init(Number(e.target.dataset.replaySeek));st.playing=false;st.time=Number(e.target.value);paint(st,false);}});
document.addEventListener('change',e=>{if(e.target.matches('[data-replay-speed]'))init(Number(e.target.dataset.replaySpeed)).speed=e.target.value;if(e.target.matches('[data-replay-order]')){const st=init(Number(e.target.dataset.replayOrder));st.order=e.target.value;paint(st);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)for(const st of states.values())if(st.playing){st.playing=false;paint(st,false);}});
window.addEventListener('hashchange',()=>{for(const st of states.values()){st.playing=false;paint(st,false);}});
new MutationObserver(attach).observe(document.getElementById('season-list'),{childList:true});
attach();window.UHC_REPLAY_API={snapshot,states,hearts,speedAt,advance,slowWindows};
})();
