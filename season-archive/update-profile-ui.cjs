const fs=require('node:fs');
const path='dist/players.js';let code=fs.readFileSync(path,'utf8');
code=code.replace(/team kills/g,'Team Kills').replace('Team kills committed','Team Kills committed');
code=code.replace('<g tabindex="0" aria-label="Season ${s.id}: ${record?', '<g tabindex="0" data-chart-tip="${escape(`Season ${s.id}\\n${record ? `${k} PVP kills` : `Did not play`}\\n${cumulative} career PVP kills`)}" aria-label="Season ${s.id}: ${record?');
code=code.replace('<g tabindex="0" aria-label="Season ${s.id}: ${!r?', '<g tabindex="0" data-chart-tip="${escape(`Season ${s.id}\\n${!r ? `Did not play` : available ? `${val}% of other participants outlived` : `Exit time unavailable`}${r ? `\\nTeam: ${r.team}` : ``}`)}" aria-label="Season ${s.id}: ${!r?');
code=code.replace(/<\/text><\/g>`;/g,'</text><rect class="chart-hit" x="${x-cw/seasons.length/2}" y="${top}" width="${cw/seasons.length}" height="${ch}" fill="transparent"/></g>`;');
code=code.replace('<section class="profile-section"><div class="profile-section-title"><h2>Season by season','${teamColorChart(p)}<section class="profile-section"><div class="profile-section-title"><h2>Season by season');
code=code.replace('<dt>Most frequent teammates</dt>','<dt>Most common team color</dt><dd>${p.commonColors.map(c=>`${escape(c.color)} · ${c.count} games (${c.percent.toFixed(1)}%)`).join("<br>")}</dd><dt>Most frequent teammates</dt>');
fs.writeFileSync(path,code);
