const fs=require('fs');let s=fs.readFileSync('dist/season-replay.js','utf8');
s=s.replace("const st={id,season,body,saved,rows,time:0,playing:false,speed:60,order:'deaths'};", "const st={id,season,body,saved,rows,time:0,playing:false,speed:Number(card.querySelector('[data-replay-speed]').value),order:card.querySelector('[data-replay-order]').value};");
fs.writeFileSync('dist/season-replay.js',s);
