// Build the CrazyGames portrait from real CURRENT Cat Bond watercolor duo
// gameplay, not the old generic cat illustration. The existing media packer
// derives matching wide + square formats and both silent native-aspect videos.
import fs from 'node:fs';
import sharp from 'sharp';

const frame='.check/crazygames/cat-bond-original-duo-portrait.png';
const manifest='.check/crazygames/cat-bond-trim-portrait.json';
const target='public/promo/cat-bond/cover-portrait.png';
if(!fs.existsSync(frame)||!fs.existsSync(manifest))
  throw Error('Missing verified live original-63 watercolor duo screenshot');
const proof=JSON.parse(fs.readFileSync(manifest,'utf8'));
if(proof.originalArt!==true||proof.originalSceneCount!==63||
   !proof.artSource?.includes('duo-storyboard-21x3-v3.webp'))
  throw Error('Wrong duo art source: refuse cover generation');
const {width,height}=await sharp(frame).metadata();
if(width!==1080||height!==1620)
  throw Error('Expected real native portrait game art 1080x1620; got '+width+'x'+height);
const w=800,h=1200;
const bg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><defs>'+
  '<linearGradient id="paper" x1="0" y1="0" x2=".35" y2="1">'+
  '<stop stop-color="#e4eddc"/><stop offset=".47" stop-color="#f4dfe0"/><stop offset="1" stop-color="#f1e9db"/></linearGradient>'+
  '<radialGradient id="glow" cx=".5" cy=".48" r=".7"><stop stop-color="#fff8dd" stop-opacity=".66"/>'+
  '<stop offset="1" stop-color="#fff8dd" stop-opacity="0"/></radialGradient></defs>'+
  '<rect width="800" height="1200" fill="url(#paper)"/><rect width="800" height="1200" fill="url(#glow)"/></svg>');
// Use the entire real portrait duo, not a random six-second post-battle
// frame cropped from landscape. Preserve both complete painted cats.
const crop=await sharp(frame).resize(780,975,{
  fit:'contain',background:{r:244,g:237,b:222,alpha:0}
}).ensureAlpha().png().toBuffer();
const fade=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="780" height="975">'+
  '<defs><radialGradient id="a" cx=".5" cy=".5" r=".74">'+
  '<stop offset="0" stop-color="#fff" stop-opacity="1"/>'+
  '<stop offset=".55" stop-color="#fff" stop-opacity=".99"/>'+
  '<stop offset=".82" stop-color="#fff" stop-opacity=".72"/>'+
  '<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>'+
  '<rect width="780" height="975" fill="url(#a)"/></svg>');
const softened=await sharp(crop).composite([{input:fade,blend:'dest-in'}]).png().toBuffer();
const result=await sharp(bg).composite([{input:softened,left:10,top:125}])
  .png({compressionLevel:9}).toFile(target);
const info=await sharp(target).metadata();
if(info.width!==w||info.height!==h)throw Error('Bad portrait cover dimensions');
console.log('CAT BOND ACTUAL WATERCOLOR COVER GENERATED',JSON.stringify({name:target,bytes:result.size,source:frame}));
