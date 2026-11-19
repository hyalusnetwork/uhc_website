const fs=require('fs');const p='dist/ore-theme.css';let css=fs.readFileSync(p,'utf8');const start=css.indexOf('/* A compact two-line identity leaves the landscape open on the right. */');if(start<0)throw Error('Wordmark styles missing');css=css.slice(0,start)+`
/* Original hero typography, arranged as a compact two-row wordmark. */
.hero-with-photos{min-height:400px;box-sizing:border-box}
.hero-with-photos .hero-copy{max-width:460px}
.hero-with-photos .hero-copy-glass{width:52%}
.hero-with-photos .hero-wordmark{--wordmark-size:clamp(48px,5vw,66px);display:inline-grid;grid-template-columns:minmax(0,1fr);gap:3px;width:max-content;max-width:100%;margin:0;font-family:'Segoe UI',Arial,sans-serif;font-weight:750;line-height:1.06;text-shadow:none}
.hero-wordmark>.hero-wordmark-name,.hero-wordmark-bottom>.hero-wordmark-uhc{font:inherit;font-size:var(--wordmark-size);letter-spacing:-2.8px;line-height:1.06}
.hero-wordmark>.hero-wordmark-name{display:block;color:#f4f4f5}
.hero-wordmark-bottom{display:flex;justify-content:space-between;align-items:center;gap:18px;width:100%}
.hero-wordmark-bottom>.hero-wordmark-uhc{color:#a8c7ff}
.hero-wordmark-bottom>img{display:block;flex:none;width:56px;height:56px;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 3px 5px #0004)}
@media(max-width:850px){.hero-with-photos{min-height:0}.hero-with-photos .hero-copy{max-width:100%}.hero-with-photos .hero-copy-glass{width:calc(100% + 56px)}}
@media(max-width:450px){.hero-with-photos .hero-wordmark{--wordmark-size:52px}.hero-wordmark>.hero-wordmark-name,.hero-wordmark-bottom>.hero-wordmark-uhc{letter-spacing:-2px}.hero-wordmark-bottom>img{width:44px;height:44px}}
`;fs.writeFileSync(p,css);
