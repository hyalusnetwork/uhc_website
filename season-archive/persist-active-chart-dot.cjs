const fs=require('node:fs');let p=fs.readFileSync('dist/players.js','utf8');
p=p.replace("activeChartTarget?.removeAttribute('aria-describedby');activeChartTarget=null;", "activeChartTarget?.removeAttribute('aria-describedby');activeChartTarget?.classList.remove('chart-active');activeChartTarget=null;");
p=p.replace("if(activeChartTarget&&activeChartTarget!==target)activeChartTarget.removeAttribute('aria-describedby');activeChartTarget=target;", "if(activeChartTarget&&activeChartTarget!==target){activeChartTarget.removeAttribute('aria-describedby');activeChartTarget.classList.remove('chart-active');}activeChartTarget=target;target.classList.add('chart-active');");
const start=p.indexOf("document.addEventListener('pointermove',event=>"),end=p.indexOf("document.addEventListener('pointerdown'",start);
p=p.slice(0,start)+`function chartPointerElement(event){return event.pointerType==='touch'?document.elementFromPoint(event.clientX,event.clientY):event.target;}
function pointerInsideActiveChart(event){const graph=activeChartTarget?.closest('svg');if(!graph)return false;const r=graph.getBoundingClientRect();return event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom;}
document.addEventListener('pointermove',event=>{
 const element=chartPointerElement(event),target=element?.closest('[data-chart-tip]');
 if(target)displayChartTooltip(target,event);
 else if(activeChartTarget){if(pointerInsideActiveChart(event))displayChartTooltip(activeChartTarget,event);else hideChartTooltip();}
});
document.addEventListener('pointerout',event=>{
 if(!activeChartTarget)return;
 const next=event.relatedTarget?.closest?.('[data-chart-tip]');
 if(next){displayChartTooltip(next,event);return;}
 const graph=activeChartTarget.closest('svg');
 if(graph&&event.relatedTarget&&graph.contains(event.relatedTarget)){clearTimeout(chartTooltipHideTimer);return;}
 if(!event.relatedTarget||graph)hideChartTooltip();else if(!activeChartTarget.contains(event.relatedTarget))deferChartTooltipHide();
});
`+p.slice(end);
fs.writeFileSync('dist/players.js',p);
