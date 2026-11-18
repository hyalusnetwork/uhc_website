const fs=require('fs');let s=fs.readFileSync('dist/season-replay.js','utf8');
s=s.replace('let frame=0,last=0;','let frame=0,last=0,lastPaint=0;');
s=s.replace("const before=new Map([...st.rows].map(([n,r])=>[n,r.getBoundingClientRect().top]));","const before=new Map([...st.rows].map(([n,r])=>[n,r.getBoundingClientRect().top]));");
s=s.replace("const label=st.time>=data.end?", "const label=st.time>=data.end?");
s=s.replace('paint(st);}\n if([...states.values()]','if(now-lastPaint>=100||!st.playing)paint(st);}\n if(now-lastPaint>=100)lastPaint=now;\n if([...states.values()]');
s=s.replace("if(!document.getElementById('season-'+st.id)?.isConnected||document.getElementById('seasons-view').hidden){st.playing=false;continue;}","if(!document.getElementById('season-'+st.id)?.isConnected){st.playing=false;continue;}if(document.getElementById('seasons-view').hidden){st.playing=false;paint(st,false);continue;}");
fs.writeFileSync('dist/season-replay.js',s);
let html=fs.readFileSync('dist/index.html','utf8');html=html.replace('<script defer src="app.js"></script>','<script defer src="app.js"></script><script defer src="season-replay-data.js"></script><script defer src="season-replay.js"></script>');fs.writeFileSync('dist/index.html',html);
let m=fs.readFileSync('make-html.cjs','utf8');m=m.replace("html=html.replace('</body>'","html=html.replace(/<script defer src=\"season-replay(?:-data)?\\.js\"><\\/script>/g,'');\nhtml=html.replace('</body>'");fs.writeFileSync('make-html.cjs',m);
