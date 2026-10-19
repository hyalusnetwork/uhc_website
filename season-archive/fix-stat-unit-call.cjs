const fs=require('node:fs');let s=fs.readFileSync('dist/stats.js','utf8');s=s.replace("+unit+", "+unit(count)+");fs.writeFileSync('dist/stats.js',s);
