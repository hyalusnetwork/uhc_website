const fs=require('node:fs');let p=fs.readFileSync('dist/players.js','utf8');const start=p.indexOf('  const r=target.getBoundingClientRect(),x=event?.clientX'),end=p.indexOf('\n}',start);if(start<0||end<0)throw Error('Positioning block missing');
p=p.slice(0,start)+`  const viewport=window.visualViewport,margin=10;
  const viewLeft=viewport?.offsetLeft||0,viewTop=viewport?.offsetTop||0;
  const viewWidth=viewport?.width||document.documentElement.clientWidth,viewHeight=viewport?.height||window.innerHeight;
  // Set width before measuring: auto sizing at the old right-edge position can change after placement.
  tip.style.boxSizing='border-box';tip.style.width=Math.min(310,viewWidth-margin*2)+'px';
  tip.style.minWidth='0';tip.style.maxWidth=Math.max(1,viewWidth-margin*2)+'px';
  tip.style.maxHeight=Math.max(1,viewHeight-margin*2)+'px';tip.style.overflowY='auto';
  const r=target.getBoundingClientRect(),x=event?.clientX??r.left+r.width/2,y=event?.clientY??r.top;
  const bounds=tip.getBoundingClientRect(),right=viewLeft+viewWidth-margin,bottom=viewTop+viewHeight-margin;
  const desiredLeft=x+14+bounds.width>right?x-bounds.width-14:x+14;
  const desiredTop=y+14+bounds.height>bottom?y-bounds.height-14:y+14;
  tip.style.left=Math.max(viewLeft+margin,Math.min(right-bounds.width,desiredLeft))+'px';
  tip.style.top=Math.max(viewTop+margin,Math.min(bottom-bounds.height,desiredTop))+'px';`+p.slice(end);fs.writeFileSync('dist/players.js',p);
