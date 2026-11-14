const fs=require('node:fs'),vm=require('node:vm');
const {buildProfiles}=require('./profile-engine.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const window={};vm.runInNewContext(fs.readFileSync('dist/data.js','utf8'),{window});
const raw=read('../workbook-extracted.json');
const specials=raw[3].rows.slice(1).map(r=>Object.fromEntries(r.cells.map(c=>[c.cell.replace(/\d/g,''),c.value]))).filter(r=>r.A&&r.B&&r.C).map(r=>({season:Number(r.A),stat:r.B,name:r.C}));
const bios=read('../bios-extracted.json');
bios.push({
 name:'ButterDucksy',
 cells:[{value:'Formerly Known As: ButterWarriorYT'}],
 recordedNames:['ButterDuckys']
});
const output=buildProfiles(window.UHC_DATA,bios,specials);
const {buildStats}=require('./stats-engine.cjs');
const stats=buildStats(window.UHC_DATA,output);
fs.writeFileSync('dist/stats-data.js','window.UHC_STATS = '+JSON.stringify(stats)+';\n');
const {buildRankings}=require('./rankings-engine.cjs');
fs.writeFileSync('dist/rankings-data.js','window.UHC_RANKINGS = '+JSON.stringify(buildRankings(window.UHC_DATA,output))+';\n');
const {buildPlayerRankings}=require('./player-rankings-engine.cjs');
const playerRankings=buildPlayerRankings(output,window.UHC_DATA);
fs.writeFileSync('dist/player-rankings-data.js','window.UHC_PLAYER_RANKINGS = '+JSON.stringify(playerRankings)+';\n');
if(fs.existsSync('trivia-document-reference.json')&&fs.existsSync('trivia-records-reference.json')){
 const {buildTrivia}=require('./trivia-engine.cjs');
 fs.writeFileSync('dist/trivia-data.js','window.UHC_TRIVIA = '+JSON.stringify(buildTrivia(window.UHC_DATA,output,stats,{document:read('trivia-document-reference.json'),workbook:read('trivia-records-reference.json'),legacy:read('trivia-legacy-records.json')}))+';\n');
}
delete output.allPlayers;
fs.writeFileSync('dist/profiles.js','window.UHC_PROFILES = '+JSON.stringify(output)+';\n');
console.log(`Built ${output.profiles.length} eligible player profiles; ${output.deathCount} recorded deaths.`);
