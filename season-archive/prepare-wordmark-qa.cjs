const fs=require('fs');let q=fs.readFileSync('qa-hero-carousel.cjs','utf8');q=q.replace("assert(await evaluate(\"[...document.querySelectorAll('.hero-photo-group img')]", "assert(await evaluate(\"[...document.querySelectorAll('.hero-photo-group img')]");
q=q.replace("let shot=await send", "assert.equal(await evaluate(\"document.querySelectorAll('.hero-art').length\"),0);assert.equal(await evaluate(\"document.querySelector('.hero-wordmark').getAttribute('aria-label')\"),'Hyalus UHC');\nlet shot=await send");
q=q.replaceAll('hero-carousel-preview.png','hero-wordmark-preview.png').replaceAll('hero-carousel-mobile.png','hero-wordmark-mobile.png');
fs.writeFileSync('qa-hero-wordmark.cjs',q);
