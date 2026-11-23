const fs=require('node:fs');
const photos=JSON.parse(fs.readFileSync('references/profile-photos.json','utf8'));
const ids=new Set();
for(const photo of photos){
 if(ids.has(photo.id)||photo.id===26||!photo.players.length)throw Error('Invalid photo '+photo.id);
 ids.add(photo.id);
 photo.src=`images/hero-season-${photo.id}.webp`;
 if(!fs.existsSync('dist/'+photo.src))throw Error('Missing photo '+photo.id);
}
fs.writeFileSync('dist/profile-photos-data.js','window.UHC_PROFILE_PHOTOS = '+JSON.stringify(photos)+';');
let html=fs.readFileSync('dist/index.html','utf8');
const duplicate='data:image/webp;base64,'+fs.readFileSync('dist/images/hero-season-26.webp').toString('base64');
html=html.replace(/<img\b[^>]*>/g,img=>img.includes('src="'+duplicate+'"')||img.includes('src="images/hero-season-26.webp"')?'':img);
if(!html.includes('src="profile-photos-data.js"'))html=html.replace('<script defer src="players.js"></script>','<script defer src="profile-photos-data.js"></script><script defer src="players.js"></script>');
fs.writeFileSync('dist/index.html',html);
module.exports=photos;
