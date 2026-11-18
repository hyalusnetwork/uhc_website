const fs=require('fs');let s=fs.readFileSync('dist/season-replay.js','utf8');
s=s.replace('r.getBoundingClientRect().top]))','r.getBoundingClientRect().top]))');
s=s.replace('if(changed)for(const row of st.rows.values())row.getAnimations().forEach(animation=>animation.cancel());','if(changed)for(const row of st.rows.values())row.querySelectorAll(".replay-cell-content").forEach(cell=>cell.getAnimations().forEach(animation=>animation.cancel()));');
s=s.replace("death=row.querySelector('.death'),elapsed=row.querySelector('.elapsed');","death=row.querySelector('.death .replay-cell-content'),elapsed=row.querySelector('.elapsed .replay-cell-content');");
s=s.replace("row.animate([{transform:'translateY('+delta+'px)'},{transform:'translateY(0)'}],{duration:250,easing:'ease-out'});","row.querySelectorAll(':scope > td > .replay-cell-content').forEach(cell=>cell.animate([{transform:'translateY('+delta+'px)'},{transform:'translateY(0)'}],{duration:250,easing:'ease-out'}));");
s=s.replace(" const st={id,season,body,saved,rows,", " for(const row of rows.values())for(const cell of row.cells){const content=document.createElement('div');content.className='replay-cell-content';while(cell.firstChild)content.append(cell.firstChild);cell.append(content);}\n const st={id,season,body,saved,rows,");
fs.writeFileSync('dist/season-replay.js',s);
