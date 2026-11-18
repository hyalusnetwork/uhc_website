const fs=require('fs');let s=fs.readFileSync('dist/season-replay.js','utf8');
s=s.replace('Health, highest first','Health, healthiest at bottom');
s=s.replace('if(x.dead!==y.dead)return x.dead?1:-1;','if(x.dead!==y.dead)return x.dead?-1:1;').replace("st.order==='health'?y.health+y.abs-x.health-x.abs:0","st.order==='health'?x.health+x.abs-y.health-y.abs:0");
s=s.replace('<button type="button" data-replay-action="close" data-replay-id="'+ "'+id+'" +'">Final results</button>','');
s=s.replace("card.querySelector('.season-animation-launch').setAttribute('aria-expanded','true');", "card.querySelector('.season-animation-launch').setAttribute('aria-expanded','true');card.querySelector('.season-animation-launch').dataset.replayAction='close';card.querySelector('.season-animation-launch').textContent='Show Final Results';");
s=s.replace("card.querySelector('.season-animation-launch').setAttribute('aria-expanded','false');", "card.querySelector('.season-animation-launch').setAttribute('aria-expanded','false');card.querySelector('.season-animation-launch').dataset.replayAction='open';card.querySelector('.season-animation-launch').textContent='Season Animation';");
s=s.replace("if(action==='open'){document.getElementById('season-'+id).querySelector('[data-replay-action=\"toggle\"]').focus();}", "if(action==='open'){st.playing=true;}");
fs.writeFileSync('dist/season-replay.js',s);
let a=fs.readFileSync('dist/app.js','utf8').replace('title="Click to show season information"','data-season-hint="Season information"').replace('title="Click to show videos for this season"','data-season-hint="Click to show season videos"');fs.writeFileSync('dist/app.js',a);
