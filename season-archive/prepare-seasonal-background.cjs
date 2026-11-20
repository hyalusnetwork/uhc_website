// Build a repeatable block mosaic from the user's installed Minecraft 26.3 textures.
const fs=require('node:fs');
const groups={
 winter:['snow','blue_ice','packed_ice'],
 fall:['red_poplar_leaves','yellow_poplar_leaves','orange_poplar_leaves'],
 spring:['moss_block','azalea_leaves','flowering_azalea_leaves'],
 summer:['terracotta','sand','sandstone_top']
};
const seeds=[
 [1,2,'winter'],[9,0,'spring'],[17,3,'fall'],
 [5,8,'summer'],[12,7,'winter'],[19,11,'spring'],
 [0,14,'fall'],[9,15,'spring'],[15,17,'summer'],[3,20,'winter']
];
const hash=(x,y,s=0)=>{let n=Math.imul(x+37,374761393)^Math.imul(y+91,668265263)^Math.imul(s+1,1274126177);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0;};
const defs=Object.values(groups).flat().map(name=>`<image id="${name}" width="16" height="16" href="data:image/png;base64,${fs.readFileSync('dist/images/seasonal-blocks/'+name+'.png').toString('base64')}"/>`).join('');
let blocks='';
for(let y=0;y<20;y++)for(let x=0;x<20;x++){
 // Periodic distances allow the clumps to continue naturally across repeat seams.
 const distance=([sx,sy])=>{const dx=Math.min(Math.abs(x-sx),20-Math.abs(x-sx)),dy=Math.min(Math.abs(y-sy),20-Math.abs(y-sy));return dx*dx+dy*dy;};
 const ordered=[...seeds].sort((a,b)=>distance(a)-distance(b));
 const group=groups[ordered[0][2]],name=group[hash(x,y)%3];
 const px=x*64,py=y*64;
 blocks+=`<g transform="translate(${px} ${py})"><rect width="64" height="64" fill="#30442b"/><use href="#${name}" transform="scale(4)"/></g>`;
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1280" viewBox="0 0 1280 1280" style="image-rendering:pixelated"><title>Seasonal Minecraft block clusters</title><defs>${defs}</defs><rect width="1280" height="1280" fill="#252e32"/>${blocks}</svg>`;
fs.writeFileSync('dist/images/seasonal-block-clusters.svg',svg);
console.log('Built seasonal background with all 12 block textures.');
