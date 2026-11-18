const fs=require('fs');let s=fs.readFileSync('dist/season-replay.js','utf8');
const marker=" const saved=body.innerHTML,rows=new Map";
if(!s.includes(marker))throw Error('Replay init missing');
s=s.replace(marker," card.style.setProperty('--replay-row-height',Math.min(...[...body.rows].map(row=>row.getBoundingClientRect().height).filter(height=>height>0))+'px');\n"+marker);
fs.writeFileSync('dist/season-replay.js',s);
