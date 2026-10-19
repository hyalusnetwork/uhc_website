const fs=require('node:fs');let p=fs.readFileSync('dist/players.js','utf8');
p=p.replace('// Set width before measuring: auto sizing at the old right-edge position can change after placement.', '// Measure intrinsic width independently of the previous screen position.');
p=p.replace("tip.style.boxSizing='border-box';tip.style.width=Math.min(310,viewWidth-margin*2)+'px';", "tip.style.boxSizing='border-box';tip.style.width='max-content';");
fs.writeFileSync('dist/players.js',p);
