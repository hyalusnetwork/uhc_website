const fs=require('fs'),p='dist/players.js';let s=fs.readFileSync(p,'utf8');s=s.replace('${p.wins} team victories.','${p.wins} win${p.wins===1?\'\':\'s\'}.');fs.writeFileSync(p,s);
