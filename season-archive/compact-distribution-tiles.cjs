const fs=require('fs');const p='dist/stats.js';let s=fs.readFileSync(p,'utf8');
const start=s.indexOf('<div class="team-size-breakdown">',s.indexOf('function teamSizeGraph'));
const end=s.indexOf('</div></div></div>`;',start);
if(start<0||end<0)throw Error('Distribution breakdown missing');
const grid='<div class="distribution-season-grid" aria-label="Seasons in numerical order">${g.data.flatMap((r,i)=>(r.seasons||seasons.filter(s=>s.teamSize===r.size).map(s=>s.id)).map(id=>({id,label:format(r),color:palette[i%palette.length]}))).sort((a,b)=>a.id-b.id).map(({id,label,color})=>`<a class="distribution-season-button" href="#season-${id}" style="--season-button-color:${color}" ${chartTip(`Season ${id} · ${label}`)}>${String(id).padStart(2,\'0\')}</a>`).join(\'\')}';
s=s.slice(0,start)+grid+s.slice(end);fs.writeFileSync(p,s);
