const fs=require('fs');let p=fs.readFileSync('prepare-season-replay.cjs','utf8').replace("source:r.damage_type,sequence:i","source:r.damage_type,combat:r.attacker_is_player==='true'&&r.attacker_uuid!==r.victim_uuid,sequence:i");fs.writeFileSync('prepare-season-replay.cjs',p);
let s=fs.readFileSync('dist/season-replay.js','utf8');s=s.replace("[1,10,30,60,120,300].map(n=>'<option value=\"'+n+'\"'+(n===60?' selected':'')+'>'+n+'×</option>')","['variable',60,90,150,300].map(n=>'<option value=\"'+n+'\"'+(n==='variable'?' selected':'')+'>'+(n==='variable'?'Variable':n+'×')+'</option>')");
s=s.replace('Health, healthiest at bottom','Health');
const marker='let frame=0,last=0,lastPaint=0;';
s=s.replace(marker,marker+`
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
`);
s=s.replace("speed:Number(card.querySelector('[data-replay-speed]').value)","speed:card.querySelector('[data-replay-speed]').value");
s=s.replace("st.time=Math.min(replays[st.id].end,st.time+delta*st.speed);","st.time=advance(st.id,st.time,delta,st.speed);");
s=s.replace(".speed=Number(e.target.value)",".speed=e.target.value");
s=s.replace("{snapshot,states,hearts}","{snapshot,states,hearts,speedAt,advance,slowWindows}");
fs.writeFileSync('dist/season-replay.js',s);
