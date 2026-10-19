const fs=require('fs'),p='prepare-data.cjs';let s=fs.readFileSync(p,'utf8');s=s.replace('version:r.F,seconds:',"version:id===22&&String(r.F)==='1.1'?'1.10':r.F,seconds:");fs.writeFileSync(p,s);
