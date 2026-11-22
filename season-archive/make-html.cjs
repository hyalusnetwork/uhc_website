require('./prepare-season-replay.cjs');
const fs=require('node:fs');
require('./prepare-seasonal-background.cjs');
let html=fs.readFileSync('dist/index.html','utf8');
html=html.replace(/src="(images\/hero-season-\d+\.webp)"/g,(_,path)=>'src="data:image/webp;base64,'+fs.readFileSync('dist/'+path).toString('base64')+'"');
const oreTheme=fs.readFileSync('dist/ore-theme.css','utf8').replaceAll('images/seasonal-block-clusters.svg','data:image/svg+xml;base64,'+fs.readFileSync('dist/images/seasonal-block-clusters.svg').toString('base64')).replace(
 /images\/(?:player-grades|classic-era)-[a-z-]+\.(webp|jpg)/g,
 (path,extension)=>`data:image/${extension==='jpg'?'jpeg':extension};base64,${fs.readFileSync('dist/'+path).toString('base64')}`
);
const css=fs.readFileSync('dist/styles.css','utf8')+'\n'+fs.readFileSync('dist/players.css','utf8')+'\n'+fs.readFileSync('dist/stats.css','utf8')+'\n'+fs.readFileSync('dist/rankings.css','utf8')+'\n'+fs.readFileSync('dist/player-rankings.css','utf8')+'\n'+fs.readFileSync('dist/trivia.css','utf8')+'\n'+oreTheme+'\n'+fs.readFileSync('dist/about.css','utf8');
const face='data:image/webp;base64,'+fs.readFileSync('dist/steve.webp').toString('base64');
const heart='data:image/webp;base64,'+fs.readFileSync('dist/hardcore-heart.webp').toString('base64');
const data=fs.readFileSync('dist/data.js','utf8');
const window={};
require('node:vm').runInNewContext(data,{window});
html=html.replace(/(<meta name="description" content="Explore )\d+( seasons of UHC\.)/,(_,prefix,suffix)=>prefix+window.UHC_DATA.length+suffix);
const profiles=fs.readFileSync('dist/profiles.js','utf8');
const profileVersion=require('node:crypto').createHash('sha256').update(profiles).digest('hex').slice(0,12);
html=html.replace(/src="profiles\.js(?:\?v=[a-f0-9]+)?"/,`src="profiles.js?v=${profileVersion}"`);
fs.writeFileSync('dist/index.html',html);
html=html.replace(/<script id="season-videos-data">[\s\S]*?<\/script>/g,'');
// Keep navigation inside the downloadable, self-contained archive.
html=html.replace(/<a\b[^>]*\bdata-tab="([^"]+)"[^>]*>/g,(anchor,target)=>anchor.replace(/href="[^"]*"/,`href="#${target==='rankings'?'rankings-teams':target}"`));
const icons=Object.fromEntries(fs.readdirSync('dist/icons').filter(n=>n.endsWith('.webp')).map(n=>[n.slice(0,-5),'data:image/webp;base64,'+fs.readFileSync('dist/icons/'+n).toString('base64')]));
icons['hardcore-container']='data:image/webp;base64,'+fs.readFileSync('dist/hardcore-container.webp').toString('base64');
icons.warden='data:image/png;base64,'+fs.readFileSync('dist/icons/warden.png').toString('base64');
for(const name of ['oak-sapling','iron-chestplate','redstone']){icons[name]='data:image/png;base64,'+fs.readFileSync('dist/icons/'+name+'.png').toString('base64');html=html.replaceAll('src="icons/'+name+'.png"','src="'+icons[name]+'"');}
const iconScript='window.UHC_ICONS = '+JSON.stringify(icons)+';';
fs.writeFileSync('dist/icons.js',iconScript);
html=html.replaceAll('src="icons/crown.webp"',`src="${icons.crown}"`);
html=html.replaceAll('src="icons/apple.webp"',`src="${icons.apple}"`);
html=html.replace(/src="icons\/([a-z-]+)\.webp"/g,(match,name)=>{if(!icons[name])throw Error('Missing icon: '+name);return `src="${icons[name]}"`});
html=html.replace(/src="(images\/(?:end-portal|uhc-nether|uhc-party|uhc-battle)\.webp)"/g,(_,path)=>`src="data:image/webp;base64,${fs.readFileSync('dist/'+path).toString('base64')}"`);
html=html.replace('<link rel="stylesheet" href="about.css">','');
html=html.replaceAll('src="icons/book-and-quill.webp"',`src="${icons['book-and-quill']}"`);
const players=fs.readFileSync('dist/players.js','utf8');
const manifest=JSON.parse(fs.readFileSync('face-manifest.json','utf8'));
const faceMap=Object.fromEntries(Object.entries(manifest.mapping).map(([name,file])=>[name,'data:image/webp;base64,'+fs.readFileSync('dist/faces/'+file).toString('base64')]));
faceMap._default=face;
if(faceMap.arecue)faceMap.Happy_Guy555=faceMap.arecue;
const faceScript='window.UHC_FACES = '+JSON.stringify(faceMap)+';';fs.writeFileSync('dist/faces.js',faceScript);
const statsData=fs.readFileSync('dist/stats-data.js','utf8'),stats=fs.readFileSync('dist/stats.js','utf8');
const rankingsData=fs.readFileSync('dist/rankings-data.js','utf8'),rankings=fs.readFileSync('dist/rankings.js','utf8');
const playerRankingsData=fs.readFileSync('dist/player-rankings-data.js','utf8'),playerRankings=fs.readFileSync('dist/player-rankings.js','utf8');
const triviaData=fs.readFileSync('dist/trivia-data.js','utf8'),trivia=fs.readFileSync('dist/trivia.js','utf8');
const app=fs.readFileSync('dist/app.js','utf8').replace('src="steve.webp"',`src="${face}"`);
const seasonVideoScript='window.UHC_SEASON_VIDEOS = '+JSON.stringify(JSON.parse(fs.readFileSync('season-videos.json','utf8')))+';';
const crownHistory=fs.readFileSync('dist/crown-history.js','utf8');
html=html.replace('<script defer src="crown-history.js"></script>','');
html=html.replaceAll('src="hardcore-heart.webp"',`src="${heart}"`).replace('href="hardcore-heart.webp"',`href="${heart}"`);
html=html.replace('<link rel="stylesheet" href="styles.css">',()=>`<style>${css}</style>`).replace('<script defer src="data.js"></script><script defer src="app.js"></script>','');
html=html.replace('<link rel="stylesheet" href="players.css">','').replace('<link rel="stylesheet" href="stats.css">','').replace('<link rel="stylesheet" href="rankings.css">','').replace('<link rel="stylesheet" href="player-rankings.css">','').replace(/<script defer src="(?:data|app|profiles|icons|players|faces|stats|stats-data|rankings|rankings-data|player-rankings|player-rankings-data)\.js(?:\?v=[a-f0-9]+)?"><\/script>/g,'');
html=html.replace('<link rel="stylesheet" href="ore-theme.css">','').replace('<link rel="stylesheet" href="trivia.css">','').replace(/<script defer src="(?:trivia|trivia-data)\.js"><\/script>/g,'');
html=html.replace(/<script defer src="season-replay(?:-data)?\.js"><\/script>/g,'');
html=html.replace('<script defer src="overlay-scrollbar.js"></script>','');
html=html.replace('</body>',()=>`<script>${[data,profiles,iconScript,seasonVideoScript,faceScript,statsData,rankingsData,playerRankingsData,triviaData,players,stats,rankings,playerRankings,trivia,app,crownHistory,fs.readFileSync("dist/season-replay-data.js","utf8"),fs.readFileSync("dist/season-replay.js","utf8")].join('\n;\n').replace(/<\/script/gi,'<\\/script')}</script></body>`);
fs.writeFileSync('../UHC.html',html);
console.log('Created self-contained UHC.html');
require('./prepare-pages.cjs');
