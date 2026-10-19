const fs=require('node:fs');let p=fs.readFileSync('profile-engine.cjs','utf8');
const old="Played on Green Team in consecutive matches attended: ${runs.map(run=>'(S'+run.join(', S')+')').join('; ')} (one of ${greenStreakPlayers.length} eligible players to do so).";
const replacement="Played on Green Team in consecutive matches attended (one of ${greenStreakPlayers.length} recorded players to do so) ${runs.map(run=>'(S'+run.join(', S')+')').join('; ')}.";
if(!p.includes(old))throw Error('Green trivia wording not found');p=p.replace(old,replacement);fs.writeFileSync('profile-engine.cjs',p);
