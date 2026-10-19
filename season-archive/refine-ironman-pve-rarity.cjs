const fs=require('node:fs');let p=fs.readFileSync('profile-engine.cjs','utf8');
const old="(one of '+ironmanPvePlayers.length+' out of '+allPlayers.length+' recorded players to do so)";
const actual="('+ironmanPvePlayers.length+' out of '+allPlayers.length+' recorded players to do so)";
const replacement="('+(ironmanPvePlayers.length===1?'the only recorded player to do so':'one of '+ironmanPvePlayers.length+' recorded players to do so')+')";
if(!p.includes(actual))throw Error('Count wording not found');p=p.replace(actual,replacement);fs.writeFileSync('profile-engine.cjs',p);
