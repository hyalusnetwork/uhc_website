const fs=require('fs'),vm=require('vm'),window={};vm.runInNewContext(fs.readFileSync('dist/data.js','utf8'),{window});
const s=window.UHC_DATA.find(s=>s.id===37),aliases={Pecus__:'Pecus',Lukeyvonswaggel:'Lukeyvonswaggle',Pontoonman31:'pontoonman'};
const rows=JSON.parse(fs.readFileSync('references/season-37-damage-events.json','utf8'));
let skipped=false;
const events=rows.flatMap((r,i)=>{
 const name=aliases[r.victim_name]||r.victim_name;if(!s.players.some(p=>p.name===name))throw Error('Unknown '+name);
 if(!skipped&&name==='Pecus'){skipped=true;return [];}
 const t=Number(r.recording_elapsed_ms)/1000;
 const before=Number(r.health_before),after=Number(r.health_after_resolution||r.health_after_damage);
 return [{t,name,before,after,absBefore:Number(r.absorption_before),absAfter:Number(r.absorption_after_damage),fatal:r.fatal==='true',source:r.damage_type,combat:r.attacker_is_player==='true'&&r.attacker_uuid!==r.victim_uuid,sequence:i}];
}).sort((a,b)=>a.t-b.t||a.sequence-b.sequence);
if(!skipped||events.length!==488)throw Error('Excluded damage mismatch');
fs.writeFileSync('dist/season-replay-data.js','window.UHC_REPLAYS = '+JSON.stringify({37:{end:Math.max(s.seconds,...events.map(e=>e.t)),events,healing:'snapshot'}})+';\n');
console.log(events.length+' replay damage events; initial Pecus hit excluded.');
