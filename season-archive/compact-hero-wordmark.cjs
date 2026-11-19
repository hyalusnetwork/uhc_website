const fs=require('fs');let html=fs.readFileSync('dist/index.html','utf8');
const old='<h1>Every season.<br>Every <em>last heart.</em></h1>';
if(!html.includes(old))throw Error('Hero headline missing');
html=html.replace(old,'<h1 class="hero-wordmark" aria-label="Hyalus UHC"><img src="hardcore-heart.webp" alt="" width="108" height="108"><span class="hero-wordmark-text"><span class="hero-wordmark-name">Hyalus</span><span class="hero-wordmark-uhc">UHC</span></span></h1>');
html=html.replace('<div class="hero-art" aria-hidden="true"><img class="pixel-heart" src="hardcore-heart.webp" alt="" width="216" height="216"><span>ONE LIFE. NO REGEN.</span></div>','');
fs.writeFileSync('dist/index.html',html);
