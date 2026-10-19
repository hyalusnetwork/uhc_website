const fs=require('fs'),vm=require('vm'),window={};vm.runInNewContext(fs.readFileSync('dist/stats-data.js','utf8'),{window});console.log(window.UHC_STATS.graphs.find(g=>g.id==='game-version').data);
