'use strict';
// Shared-effects regression for recorded historical performance only.
 function cholesky(matrix){
  const n=matrix.length,l=Array.from({length:n},()=>new Float64Array(n));
  for(let i=0;i<n;i++)for(let j=0;j<=i;j++){
   let value=matrix[i][j];for(let k=0;k<j;k++)value-=l[i][k]*l[j][k];
   if(i===j){if(!(value>0))throw Error('Contribution fit is not positive definite.');l[i][j]=Math.sqrt(value);}else l[i][j]=value/l[j][j];
  }
  return l;
 }
 function solve(l,b){
  const n=l.length,y=new Float64Array(n),x=new Float64Array(n);
  for(let i=0;i<n;i++){let v=b[i];for(let j=0;j<i;j++)v-=l[i][j]*y[j];y[i]=v/l[i][i];}
  for(let i=n-1;i>=0;i--){let v=y[i];for(let j=i+1;j<n;j++)v-=l[j][i]*x[j];x[i]=v/l[i][i];}
  return x;
 }
 function fit(rows,allNames){
  if(!rows.length)return null;
  const keys=[],index=new Map(),penalties=[];
  const term=(key,penalty)=>{if(!index.has(key)){index.set(key,keys.length);keys.push(key);penalties.push(penalty);}return index.get(key);};
  term('intercept',1e-8);
  for(const name of allNames){term('A:'+name,5);term('H:'+name,20);}
  const modeCounts=new Map();for(const row of rows)modeCounts.set(row.mode,(modeCounts.get(row.mode)||0)+1);
  const meanField=rows.reduce((s,r)=>s+r.fieldSize,0)/rows.length,meanSize=rows.reduce((s,r)=>s+r.teamSize,0)/rows.length;
  const designs=rows.map(r=>{
   const x=[[0,1],[term('A:'+r.name,5),1],[term('match:'+r.season,4),1],[term('team:'+r.season+':'+r.team,4),1]];
   for(const teammate of r.teammates)x.push([term('H:'+teammate,20),1/r.teammates.length]);
   if(modeCounts.size>1)x.push([term('mode:'+r.mode,5),1]);
   x.push([term('field',5),(r.fieldSize-meanField)/10],[term('size',5),(r.teamSize-meanSize)/3],[term('opponents',5),(r.opponentStrength||0)/10]);
   return x;
  });
  const n=keys.length,matrix=Array.from({length:n},()=>new Float64Array(n)),b=new Float64Array(n);
  for(let j=0;j<n;j++)matrix[j][j]=penalties[j];
  designs.forEach((x,i)=>{for(const [a,va] of x){b[a]+=va*rows[i].score;for(const [c,vc] of x)matrix[a][c]+=va*vc;}});
  const l=cholesky(matrix),beta=solve(l,b),predict=x=>x.reduce((sum,[j,v])=>sum+v*beta[j],0);
  let squared=0,df=0;
  designs.forEach((x,i)=>{squared+=(rows[i].score-predict(x))**2;const rhs=new Float64Array(n);for(const [j,v] of x)rhs[j]+=v;const solved=solve(l,rhs);df+=x.reduce((sum,[j,v])=>sum+v*solved[j],0);});
  // Conditional Gaussian intervals; floor avoids artificial certainty in tiny/constant samples.
  const sigma2=Math.max(1,squared/Math.max(1,rows.length-df));
  const estimates=new Map();
  const estimate=name=>{
   if(estimates.has(name))return estimates.get(name);
   const a=index.get('A:'+name),h=index.get('H:'+name),ea=new Float64Array(n),eh=new Float64Array(n);ea[a]=1;eh[h]=1;
   const ca=solve(l,ea),ch=solve(l,eh);
   const result={individual:beta[a],influence:beta[h],total:beta[a]+beta[h],individualSE:Math.sqrt(sigma2*ca[a]),influenceSE:Math.sqrt(sigma2*ch[h]),totalSE:Math.sqrt(Math.max(0,sigma2*(ca[a]+ch[h]+2*ca[h])))};
   estimates.set(name,result);return result;
  };
  return {estimate,baseline:beta[0],sigma:Math.sqrt(sigma2),context:r=>{
   const i=rows.indexOf(r),x=designs[i];
   const received=r.teammates.length?r.teammates.reduce((s,t)=>s+beta[index.get('H:'+t)],0)/r.teammates.length:0;
   const conditions=x.filter(([j])=>!keys[j].startsWith('A:')&&!keys[j].startsWith('H:')&&j!==0).reduce((s,[j,v])=>s+v*beta[j],0);
   return {received,conditions,adjusted:r.score-received-conditions-beta[0]};
  }};
 }


function historicalModels(players,seasons,enduranceRecords){
 const bySeason=new Map(),meta=new Map(seasons.map(s=>[s.id,s]));
 for(const p of players)for(const h of p.history){if(!bySeason.has(h.season))bySeason.set(h.season,[]);bySeason.get(h.season).push({p,h});}
 const rows=[],coverage=new Map(players.map(p=>[p.name,{games:0,teammates:new Set()}]));
 for(const [id,roster] of bySeason){
  const season=meta.get(id),changing=season&&(/mole|find your team/i.test(season.mode||'')||season.hasRoamers||(season.teamJoins||[]).length>0);
  const key=r=>!changing&&season?.teamSize!==1&&!r.h.roamer&&!r.h.moleFor&&!r.h.joinedAt&&(r.h.color||r.h.team)&&! /^(not recorded|none|n\/a|solo)$/i.test(r.h.color||r.h.team)?String(r.h.color||r.h.team):'individual:'+r.p.name;
  for(const r of roster){
   const peers=roster.filter(o=>o.p.name!==r.p.name&&key(o)===key(r)).map(o=>o.p.name),c=coverage.get(r.p.name);
   if(peers.length){c.games++;for(const peer of peers)c.teammates.add(peer);}
   rows.push({name:r.p.name,season:id,team:key(r),teammates:peers,mode:season?.mode||'Historical',fieldSize:roster.length,teamSize:peers.length+1,h:r.h,durability:enduranceRecords.get(r.p.name).find(e=>e.season===id)?.rate});
  }
 }
 const names=players.map(p=>p.name),values={combat:r=>r.h.kills,victories:r=>Number(!!r.h.win),ironman:r=>Number(!!r.h.iron),survival:r=>Number(!r.h.death&&!r.h.type),durability:r=>r.durability};
 const models=Object.fromEntries(Object.entries(values).map(([key,value])=>[key,fit(rows.filter(r=>value(r)!=null).map(r=>({...r,score:value(r)})),names)]));
 return {models,coverage};
}

module.exports={fit,historicalModels};
