const fs=require('node:fs');let v=fs.readFileSync('verify.cjs','utf8').replace("['graphs',6]","['graphs',7]").replace('and 6 graphs in separate views','and 7 graphs in separate views');v+=`
const weekdays=ctx.window.UHC_STATS.graphs.find(g=>g.id==='day-of-week');assert.equal(weekdays.data.length,7);assert.equal(weekdays.data.reduce((n,r)=>n+r.count,0),36);assert.equal(new Set(weekdays.data.flatMap(r=>Array.from(r.seasons))).size,36);
vm.runInContext("statsTab='day-of-week';statsGraph()",ctx);assert(els['stats-content'].innerHTML.includes('DAY OF WEEK DISTRIBUTION'));assert(!els['stats-content'].innerHTML.includes('NaN'));console.log('Verified weekday donut: '+weekdays.data.map(r=>r.day+' '+r.count).join(', '));
`;fs.writeFileSync('verify.cjs',v);
