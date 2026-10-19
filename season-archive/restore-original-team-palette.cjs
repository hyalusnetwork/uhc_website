const fs=require('node:fs');const mappings={Green:'#68c185',Purple:'#b294ef',Blue:'#78b6ff',Yellow:'#ffe052',Red:'#f27f85',Pink:'#f0a0cd',Orange:'#ff983f',Maroon:'#d56565',Cyan:'#51d6da',Navy:'#5375d4',Lime:'#c1e879',Turquoise:'#80dfc7'};
let a=fs.readFileSync('dist/app.js','utf8');for(const [name,hex] of Object.entries(mappings))a=a.replace(new RegExp(name+":'#[0-9a-fA-F]{6}'"),name+":'"+hex+"'");
a=a.replace("event.color==='Black'?'#b7c5da':colors[event.color]", "event.color==='Black'?'#b7c5da':event.color==='Navy'?'#9ab7ff':colors[event.color]");fs.writeFileSync('dist/app.js',a);
let p=fs.readFileSync('dist/players.js','utf8');p=p.replace("color==='Black'?'#c5c8ce':colors[color]", "color==='Black'?'#c5c8ce':color==='Navy'?'#9ab7ff':colors[color]");fs.writeFileSync('dist/players.js',p);
