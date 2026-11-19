const fs=require('fs');let h=fs.readFileSync('dist/index.html','utf8');h=h.replace('<span class="hero-wordmark-name">HYALUS</span>','<span class="hero-wordmark-name"><span class="hero-wordmark-letters">HYALUS</span></span>').replace('<span class="hero-wordmark-uhc">UHC</span>','<span class="hero-wordmark-uhc"><span class="hero-wordmark-letters">UHC</span></span>');fs.writeFileSync('dist/index.html',h);
let a=fs.readFileSync('dist/app.js','utf8');a+=`
function fitHeroWordmark(){
 const mark=document.querySelector('.hero-wordmark'),intro=document.querySelector('.hero-copy .intro');if(!mark||!intro)return;
 const text=[...intro.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim()).at(-1);if(!text)return;
 const range=document.createRange();range.selectNodeContents(text);const rects=[...range.getClientRects()],last=rects.at(-1);if(!last)return;
 const width=Math.min(intro.getBoundingClientRect().width,last.right-mark.getBoundingClientRect().left);
 if(width<160)return;mark.style.width=width+'px';
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),heart=mark.querySelector('img'),gap=parseFloat(getComputedStyle(mark.querySelector('.hero-wordmark-bottom')).gap)||18;
 for(const selector of ['.hero-wordmark-name','.hero-wordmark-uhc']){
  const line=mark.querySelector(selector),style=getComputedStyle(line),letters=line.querySelector('.hero-wordmark-letters');ctx.font=style.fontWeight+' '+style.fontSize+' '+style.fontFamily;
  const target=selector==='.hero-wordmark-name'?width:width-heart.getBoundingClientRect().width-gap;
  const spacing=(target-ctx.measureText(letters.textContent).width)/(letters.textContent.length-1);
  line.style.setProperty('--wordmark-tracking',spacing+'px');
 }
}
document.fonts.ready.then(fitHeroWordmark);
window.addEventListener('resize',fitHeroWordmark);
fitHeroWordmark();
`;fs.writeFileSync('dist/app.js',a);
