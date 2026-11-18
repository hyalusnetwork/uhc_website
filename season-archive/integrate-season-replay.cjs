const fs=require('fs');let app=fs.readFileSync('dist/app.js','utf8').replaceAll('LAST RECORDED ELIMINATION','MATCH TIME');fs.writeFileSync('dist/app.js',app);
let m=fs.readFileSync('make-html.cjs','utf8');m="require('./prepare-season-replay.cjs');\n"+m;
m=m.replace('data,profiles,iconScript,seasonVideoScript','data,profiles,iconScript,seasonVideoScript').replace('app,crownHistory','app,crownHistory,fs.readFileSync("dist/season-replay-data.js","utf8"),fs.readFileSync("dist/season-replay.js","utf8")');
fs.writeFileSync('make-html.cjs',m);
