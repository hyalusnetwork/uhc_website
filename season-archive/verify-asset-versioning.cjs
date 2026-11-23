const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {versionAssets,stripAssetVersions}=require('./asset-versioning.cjs');
for(const page of ['index','players','stats','rankings','trivia','about']){
 const html=fs.readFileSync('dist/'+page+'.html','utf8');
 const tags=html.match(/<(?:script|link)\b[^>]*>/g)||[];
 let count=0;
 for(const tag of tags){
  if(tag.startsWith('<link')&&!tag.includes('rel="stylesheet"'))continue;
  const asset=tag.match(/\b(?:src|href)="([^"?]+\.(?:js|css))(?:\?([^"\s]*))?"/);
  if(!asset||/^(?:[a-z]+:|\/)/i.test(asset[1]))continue;
  const hash=crypto.createHash('sha256').update(fs.readFileSync('dist/'+asset[1])).digest('hex').slice(0,12);
  assert.equal(asset[2],'v='+hash,page+': '+asset[1]);count++;
 }
 assert(count>20,'All hosted scripts and styles versioned');
 assert.equal(versionAssets(html),html,'Versioning is idempotent');
 assert(!/<(?:script|link)\b[^>]*(?:src|href)="[^"?]+\.(?:js|css)\?/.test(stripAssetVersions(html)));
}
const offline=fs.readFileSync('../UHC.html','utf8');
assert(!/<script\b[^>]*\bsrc="/.test(offline),'Offline archive embeds its scripts');
assert(!/<link\b[^>]*rel="stylesheet"/.test(offline),'Offline archive embeds its styles');
console.log('Passed: all six hosted pages use current asset hashes; offline archive remains self-contained.');
