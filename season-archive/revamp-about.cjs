const fs=require('node:fs');
const section=(id,n,label,title,body)=>`<section id="about-${id}" class="about-section"><div class="about-section-title"><span>${n} /</span><div><p class="eyebrow">${label}</p><h2>${title}</h2></div></div>${body}</section>`;
const img=(name,size=64)=>`<img src="icons/${name}.webp" width="${size}" height="${size}" alt="">`;
const principle=(icon,title,text)=>`<article>${img(icon,44)}<div><h3>${title}</h3><p>${text}</p></div></article>`;
const rule=(n,title,text)=>`<article><span>${n}</span><div><h3>${title}</h3><p>${text}</p></div></article>`;
const mode=(icon,label,title,text,extra='')=>`<article class="${extra}"><div class="about-mode-art">${img(icon,76)}</div><div><p class="eyebrow">${label}</p><h3>${title}</h3>${text}</div></article>`;
const gallery=`<section id="about-game" class="about-section about-gallery" aria-labelledby="about-game-heading">
  <div class="about-gallery-scenes">
    <img src="images/uhc-nether.webp" width="1600" height="900" alt="An armored player in the Nether, surrounded by lava and soul fire.">
    <img src="images/uhc-party.webp" width="1600" height="900" alt="A group of armed Minecraft players and horses assembled at night.">
    <img src="images/uhc-battle.webp" width="1600" height="900" alt="Armored players on horseback face a wave of hostile mobs under the moon.">
  </div>
  <div class="about-game-intro"><div class="about-section-title"><span aria-hidden="true">01 /</span><h2 id="about-game-heading">Ultra Hardcore.</h2></div><p>Players compete, often in teams, to be the last standing inside a World Border. <strong>Lost health does not regenerate naturally.</strong></p></div>
  <div class="about-slates" aria-live="off">
    <div class="about-slate"><p class="eyebrow">SURVIVAL &amp; VICTORY</p>
      ${principle('apple','Healing','Golden Apples and Health Potions restore health. A full hunger bar won’t. Strength and Regeneration Potions cannot be crafted.')}
      ${principle('diamond-sword','Winning as a Team','The last team with a living player wins. All teammates share the win, even those who died.')}
      ${principle('helmet','The Ironman Award','The last player to take damage earns Ironman.')}
    </div>
    <div class="about-slate" inert><p class="eyebrow">MATCH SETTINGS</p>
      ${principle('diamond-block','World Border','The border sets the playable area and gradually shrinks during the match, bringing players closer together.')}
      ${principle('ender-eye','Locator Bar','The locator bar starts off. When it activates later in the match, markers show the direction of other players.')}
      ${principle('armor','Grace Period','At the start, players have time to gather supplies and prepare before PvP begins.')}
    </div>
  </div>
  <button class="about-slate-arrow about-slate-prev" type="button" data-slate-step="-1" aria-label="Previous rules panel" hidden><span aria-hidden="true"></span></button>
  <button class="about-slate-arrow about-slate-next" type="button" data-slate-step="1" aria-label="Next rules panel" hidden><span aria-hidden="true"></span></button>
</section>`;
let html=`<section id="about-view" class="about-page" hidden>
<header class="about-hero"><div><p class="eyebrow">RULES, TRADITIONS &amp; GAMEMODES</p><h1>About Hyalus <em>UHC.</em></h1></div><div class="about-heart-art" aria-hidden="true"><img src="hardcore-heart.webp" width="180" height="180" alt=""></div></header>
<nav class="about-index" aria-label="About sections"><a class="about-bevel" href="#about-game"><span aria-hidden="true">01</span>The Essentials</a><a class="about-bevel" href="#about-crown"><span aria-hidden="true">02</span>The Crown</a><a class="about-bevel" href="#about-modes"><span aria-hidden="true">03</span>Special Gamemodes</a></nav>
${gallery}
<section id="about-crown" class="about-section about-crown-section"><div class="about-crown-intro"><div class="about-section-title"><span>02 /</span><div><p class="eyebrow">A TRADITION SINCE SEASON 1</p><h2>The Crown.</h2></div></div><p class="about-lead">A match ends.<br>The title lives on.</p><p>The Crown follows its holder from season to season. It can pass <strong>only once per season.</strong></p><div class="about-crown-art" aria-hidden="true">${img('crown',168)}<span>ONE TITLE. A LONG HISTORY.</span></div></div><div class="about-crown-body"><div class="about-crown-guide" id="crown-rules">${rule('01','Defeat the holder.','Kill the Crown holder in PVP and the Crown passes to you.')}${rule('02','Survive to keep it.','If the holder survives, they retain the Crown. If they miss consecutive matches, it transfers retroactively in the first match they missed.')}${rule('03','If the world claims the holder…','When the holder dies outside combat, the Crown goes to a winner who is still alive. Ties are resolved in this order:')}<ol class="about-tiebreakers"><li>Most kills</li><li>Most health</li><li>Most damage dealt to players</li><li>Coin flip</li></ol><button class="about-bevel crown-history-button" type="button" id="crown-history-start" aria-controls="crown-history"><img src="icons/crown.webp" width="22" height="14" alt=""> Watch Crown History</button></div>
  <div id="crown-history" class="crown-history" hidden>
    <header class="crown-history-heading"><div><p class="eyebrow">THE LINE OF SUCCESSION</p><h3 id="crown-history-title" tabindex="-1">Crown History</h3></div><span id="crown-history-progress"></span></header>
    <div class="crown-history-event" aria-live="off"><strong id="crown-history-event-title"></strong><p id="crown-history-reason"></p></div>
    <div class="crown-history-viewport" aria-label="Crown holder trail" tabindex="0"><div class="crown-history-stage"><svg aria-hidden="true" class="crown-history-path"><path></path></svg><ol class="crown-history-grid"></ol><img class="crown-history-token" src="icons/crown.webp" width="27" height="17" alt="" hidden></div></div>
    <div class="crown-history-actions"><button class="about-bevel" id="crown-history-rules" type="button">Back to Rules</button><button class="about-bevel" id="crown-history-skip" type="button">Skip to End</button><button class="about-bevel" id="crown-history-replay" type="button" hidden>Replay History</button></div>
  </div></div></section>
<section id="about-dragon" class="about-dragon-section"><figure class="about-portal"><img src="images/end-portal.webp" width="1920" height="1080" alt="An activated End Portal glows teal inside a stone-brick stronghold."><figcaption>THE OTHER WAY TO WIN <span>X: 0 / Z: 0</span></figcaption></figure><div class="about-dragon-copy"><div class="about-section-title"><span>03 /</span><div><p class="eyebrow">AN ALTERNATIVE WIN CONDITION</p><h2>Enter the End.<br>Slay the Dragon.</h2></div></div><div><p class="about-lead">You don’t always have to be the last team standing.</p><p>In Ender Dragon games, an End Portal Frame waits at spawn, <strong>X: 0, Z: 0</strong>. All but three or four frames already hold Eyes of Ender.</p></div><ol class="about-dragon-steps"><li><span>01</span>Collect the missing Eyes of Ender.</li><li><span>02</span>Complete the portal and enter the End.</li><li><span>03</span>Kill the Ender Dragon to win.</li></ol><div class="about-dragon-rule">${img('ender-eye',36)}<p><strong>Two routes. One victory.</strong><br>Slaying the Dragon wins even while rival teams are alive. Being the last team standing still ends the game; the Dragon does not have to die.</p></div></div></section>
${section('modes','04','FAMILIAR WORLD. DIFFERENT GAME.','A twist in the rules.',`<p class="about-lead">Who you trust, who you find, and who you fight can change from one season to the next.</p><div class="about-modes">${mode('creeper-spawn-egg','HIDDEN ALLEGIANCES','Moles','<p>Your teammate might be playing for someone else. In these games, all or most teams have a mole on a secret team.</p><p>Teams are spread normally. <strong>20 minutes in</strong>, moles are randomly and secretly selected. A quiet message reveals their role and fellow moles. They keep their original team color to blend in.</p><p>The mole team wins like any other: be the last team standing.</p>','about-mole')}${mode('diamond-sword','TWO SIDES. ONE WINNER.','War','<p>Just two teams, pitted against each other. Choose your battles and keep your teammates alive.</p>')}${mode('helmet','STRANGERS TO TEAMMATES','Find Your Team','<p>Everyone starts alone and teamless. When two players run into each other, a team forms. The team limit is set before the match—typically two or three players.</p>')}${mode('bow','A PLACE FOR THE EXTRA PLAYER','Roamer','<p>When player numbers don’t divide neatly into teams, a roamer may start alone and be spread separately. They join the first team they come across.</p>')}${mode('blindness-potion','HIDDEN TEAM IDENTITIES','Mystery Teams','<p>Starting alone, players receive notice of what team he or she is on at the end of the grace period based on the Banners received in the inventory. The catch? No one else knows what team other players are on as names will remain uncolored. Every stranger encountered may be friend or may be foe, but does the Banner in his hand really tell you so?</p>')}</div>`)}
<div class="about-outro"><img src="hardcore-heart.webp" width="38" height="38" alt=""><div><p class="eyebrow">NOW YOU KNOW THE GAME.</p><h2>Discover the stories.</h2></div><a class="about-text-link" href="#seasons">Explore the seasons <span aria-hidden="true">→</span></a></div></section>`;
// Keep the Dragon feature intact within the alternative gamemodes section.
const dragonStart=html.indexOf('<section id="about-dragon"');
const dragonEnd=html.indexOf('</section>',dragonStart)+'</section>'.length;
const dragon=html.slice(dragonStart,dragonEnd).replace('<span>03 /</span>','');
html=html.slice(0,dragonStart)+html.slice(dragonEnd);
html=html.replace('<div class="about-modes">',dragon+'<div class="about-modes">');
html=html.replace('<span>04 /</span>','<span>03 /</span>');
fs.writeFileSync('about-page.html',html+'\n');
const path='dist/index.html',current=fs.readFileSync(path,'utf8'),start=current.indexOf('<section id="about-view"'),end=current.indexOf('<section id="placeholder-view"',start);
if(start<0||end<0)throw Error('About boundaries not found');
let updated=current.slice(0,start)+html+'\n'+current.slice(end);
if(!updated.includes('href="about.css"'))updated=updated.replace('</head>','<link rel="stylesheet" href="about.css">\n</head>');
if(!updated.includes('src="crown-history.js"'))updated=updated.replace('</head>','<script defer src="crown-history.js"></script>\n</head>');
fs.writeFileSync(path,updated);
