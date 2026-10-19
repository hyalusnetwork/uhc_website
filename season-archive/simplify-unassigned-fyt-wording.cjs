const fs=require('node:fs');let p=fs.readFileSync('profile-engine.cjs','utf8');
const old="+' despite having no recorded team in a Find Your Team game '+matches.length+' '+(matches.length===1?'time':'times')+' ('";
const replacement="+' despite having no recorded team in a Find Your Team game ('";
if(!p.includes(old))throw Error('Trivia wording not found');
p=p.replace(old,replacement);fs.writeFileSync('profile-engine.cjs',p);
