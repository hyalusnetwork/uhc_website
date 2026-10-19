const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const window={};for(const file of ['data','profiles'])vm.runInNewContext(fs.readFileSync('dist/'+file+'.js','utf8'),{window});
const notes=window.UHC_PROFILES.profiles.flatMap(p=>p.trivia.filter(t=>t.includes('no recorded team in a Find Your Team')).map(t=>({player:p.name,note:t})));
console.log(JSON.stringify(notes,null,2));assert(notes.length>0);
const source=fs.readFileSync('dist/stats.js','utf8');assert(source.includes("+unit(count)+'</span>"));
const index=fs.readFileSync('dist/index.html','utf8');assert(index.indexOf('>All-Time Tables</button>')<index.indexOf('>Season Tables</button>'));
