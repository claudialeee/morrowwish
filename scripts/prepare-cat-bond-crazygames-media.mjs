// Convert EXISTING owned Cat Bond artwork and real gameplay into CrazyGames
// submission candidates. This does not change player-facing gameplay.
// Run: node scripts/prepare-cat-bond-crazygames-media.mjs
// The generated media STILL needs human visual/rights review before QA approval.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';

const dir=process.env.CAT_BOND_MEDIA_DIR||'public/promo/cat-bond';
const image=path.join(dir,'cover-portrait.png');
const sourceVideo=path.join(dir,'trailer-v10-20261121.mp4');
const required=['cover-landscape.png','cover-portrait.png','cover-square.png',
  'real-gameplay-landscape.mp4','real-gameplay-portrait.mp4'];
const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
assert(fs.existsSync(image),'Missing original Cat Bond portrait artwork');
assert(fs.existsSync(sourceVideo),'Missing existing Cat Bond gameplay trailer');
const md=await sharp(image).metadata();
assert(md.width>=400&&md.height>=600,'Cover source is too small: '+md.width+'x'+md.height);

const readCover=()=>sharp(image,{failOn:'error'});
// Keep the source painting sharp. Use a softly tinted extension *behind* it,
// rather than stretching a portrait into a landscape image.
const bg=async(w,h)=>readCover().resize(w,h,{fit:'cover',position:'attention'})
  .blur(28).modulate({brightness:0.84,saturation:0.85}).png().toBuffer();
const safeTitle=(x,y,size)=>Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${x}" height="${y}"><style>
    text{font-family:Georgia,serif;font-weight:800;paint-order:stroke;stroke:#34483b;stroke-width:3px}
  </style><text x="50%" y="54%" font-size="${size}" fill="#fffaf0"
    text-anchor="middle" dominant-baseline="central">Cat Bond</text></svg>`);
const landscape=path.join(dir,'cover-landscape.png');
const square=path.join(dir,'cover-square.png');
const portrait=path.join(dir,'cover-portrait.png');
if(md.width!==800||md.height!==1200){
  const resized=await readCover().resize(800,1200,{fit:'cover',position:'attention'})
    .png().toBuffer();
  fs.writeFileSync(portrait,resized);
}
const landArt=await sharp(portrait).resize(770,1060,{fit:'contain'})
  .png().toBuffer();
await sharp(await bg(1920,1080))
  .composite([
    {input:landArt,left:120,top:10},
    {input:safeTitle(930,400,136),left:890,top:305},
  ]).png({compressionLevel:9}).toFile(landscape);
const squareArt=await sharp(portrait).resize(680,1020,{fit:'cover',position:'attention'})
  .extract({left:0,top:100,width:680,height:800}).png().toBuffer();
await sharp(await bg(800,800))
  .composite([{input:squareArt,left:60,top:0},
    {input:safeTitle(760,170,96),left:20,top:585}])
  .png({compressionLevel:9}).toFile(square);

// Crop real gameplay to the required portal frame without stretching. Remove
// soundtrack completely and stay within the platform's 20-second maximum.
// A human must still reject footage containing social overlays, fake gameplay,
// black intros or promotional captions before approval.
function runVideo(w,h,name){
  const out=path.join(dir,name);
  const filter=`scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1,fps=30`;
  execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',sourceVideo,
    '-t','18','-vf',filter,'-an','-c:v','libx264','-preset','veryfast',
    '-crf','26','-pix_fmt','yuv420p','-movflags','+faststart',out],{stdio:'pipe',timeout:180000});
}
runVideo(1920,1080,'real-gameplay-landscape.mp4');
runVideo(1080,1620,'real-gameplay-portrait.mp4');
for(const [f,w,h] of [['cover-landscape.png',1920,1080],
  ['cover-portrait.png',800,1200],['cover-square.png',800,800]]){
  const info=await sharp(path.join(dir,f)).metadata();
  assert(info.width===w&&info.height===h,f+' invalid dimensions');
}
for(const [f,w,h] of [['real-gameplay-landscape.mp4',1920,1080],
  ['real-gameplay-portrait.mp4',1080,1620]]){
  const info=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries',
    'stream=width,height:format=duration','-of','json',path.join(dir,f)],{encoding:'utf8'}));
  assert(info.streams?.[0]?.width===w&&info.streams?.[0]?.height===h,f+' invalid aspect');
  assert(Number(info.format?.duration)>0&&Number(info.format.duration)<=20.1,f+' invalid duration');
  assert(fs.statSync(path.join(dir,f)).size<50e6,f+' exceeds 50MB');
}
for(const f of required) assert(fs.statSync(path.join(dir,f)).size>1000,'Empty media '+f);
console.log('CAT BOND CRAZYGAMES MEDIA TECHNICAL CHECK PASS',JSON.stringify({
  assets:required.map(f=>({name:f,bytes:fs.statSync(path.join(dir,f)).size})),
  visualReview:'REQUIRED',rightsReview:'REQUIRED'
}));
