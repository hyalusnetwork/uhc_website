const fs=require('node:fs');let html=fs.readFileSync('dist/index.html','utf8');
for(const [from,to] of [
['THE ULTRA HARDCORE CHRONICLES','THE ULTRA HARDCORE LEXICON'],
['The original tables and graphs, brought forward with the latest match records.','Records and data visualized.'],
['Which colors have made the most of their time in the arena?','How well have colors competed over their matches?'],
['>THE ARCHIVE<','>HYALUS<'],
['<button data-stats-mode="all-time" aria-pressed="false">','<button data-stats-mode="all-time" class="active" aria-pressed="true">'],
['<button data-stats-mode="season" class="active" aria-pressed="true">','<button data-stats-mode="season" aria-pressed="false">']
]){if(!html.includes(from))throw Error('Missing text: '+from);html=html.replaceAll(from,to);}fs.writeFileSync('dist/index.html',html);
let stats=fs.readFileSync('dist/stats.js','utf8');stats=stats.replace("let statsMode='season',statsTab='winners'","let statsMode='all-time',statsTab='wins'");fs.writeFileSync('dist/stats.js',stats);
