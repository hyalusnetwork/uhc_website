const fs=require('node:fs');const mappings={Green:'#00AA00',Navy:'#0000AA',Cyan:'#00AAAA',Maroon:'#AA0000',Orange:'#FFAA00',Blue:'#5555FF',Turquoise:'#55FFFF',Pink:'#FF55FF',Purple:'#AA00AA',Red:'#FF5555',Yellow:'#FFFF55',Lime:'#55FF55'};
let a=fs.readFileSync('dist/app.js','utf8');for(const [name,hex] of Object.entries(mappings)){const pattern=new RegExp(name+":'#[0-9a-fA-F]{6}'");if(!pattern.test(a))throw Error('Missing team '+name);a=a.replace(pattern,name+":'"+hex+"'");}
a=a.replace("event.color==='Navy'?'#9ab7ff':",'');fs.writeFileSync('dist/app.js',a);
let p=fs.readFileSync('dist/players.js','utf8');p=p.replace("color==='Navy'?'#9ab7ff':",'');fs.writeFileSync('dist/players.js',p);
