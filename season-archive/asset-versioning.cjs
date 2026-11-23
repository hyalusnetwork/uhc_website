const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dist=path.join(__dirname,'dist');
function mapAssets(html,transform){
 return html.replace(/<(?:script|link)\b[^>]*>/g,tag=>{
  if(tag.startsWith('<link')&&!/\brel="stylesheet"/.test(tag))return tag;
  return tag.replace(/\b(src|href)="([^"?]+\.(?:js|css))(?:\?[^"\s]*)?"/g,(original,attribute,url)=>{
   if(/^(?:[a-z]+:|\/)/i.test(url))return original;
   const file=path.resolve(dist,url);
   if(!file.startsWith(dist+path.sep))throw Error('Asset outside dist: '+url);
   return `${attribute}="${transform(url,file)}"`;
  });
 });
}
function versionAssets(html){
 const hashes=new Map();
 return mapAssets(html,(url,file)=>{
  if(!hashes.has(file))hashes.set(file,crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,12));
  return url+'?v='+hashes.get(file);
 });
}
const stripAssetVersions=html=>mapAssets(html,url=>url);
module.exports={versionAssets,stripAssetVersions};
