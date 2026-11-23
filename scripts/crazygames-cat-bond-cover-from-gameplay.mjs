// Build the CrazyGames portrait from real CURRENT Cat Bond watercolor duo
// gameplay, not the old generic cat illustration. The existing media packer
// derives matching wide + square formats and both silent native-aspect videos.
import fs from 'node:fs';
import sharp from 'sharp';
import {execFileSync} from 'node:child_process';

const input='.check/crazygames/cat-bond-gameplay-landscape.webm';
const frame='.check/crazygames/cat-bond-watercolor-live-frame.png';
const target='public/promo/cat-bond/cover-portrait.png';
if(!fs.existsSync(input))throw Error('Missing new real-engine Cat Bond recording');
execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error',
  '-ss','6','-i',input,'-frames:v','1','-update','1',frame],{timeout:50000});
const {width,height}=await sharp(frame).metadata();
if(width!==1920||height!==1080)throw Error('Expected native landscape Cat Bond frame; got '+width+'x'+height);
const w=800,h=1200;
const bg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><defs>'+
  '<linearGradient id="paper" x1="0" y1="0" x2=".35" y2="1">'+
  '<stop stop-color="#e4eddc"/><stop offset=".47" stop-color="#f4dfe0"/><stop offset="1" stop-color="#f1e9db"/></linearGradient>'+
  '<radialGradient id="glow" cx=".5" cy=".48" r=".7"><stop stop-color="#fff8dd" stop-opacity=".66"/>'+
  '<stop offset="1" stop-color="#fff8dd" stop-opacity="0"/></radialGradient></defs>'+
  '<rect width="800" height="1200" fill="url(#paper)"/><rect width="800" height="1200" fill="url(#glow)"/></svg>');
const crop=await sharp(frame).extract({left:360,top:145,width:1160,height:710})
  .resize(780,700,{fit:'cover',position:'centre'}).ensureAlpha().png().toBuffer();
const fade=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="780" height="700">'+
  '<defs><radialGradient id="a" cx=".5" cy=".5" r=".74">'+
  '<stop offset="0" stop-color="#fff" stop-opacity="1"/>'+
  '<stop offset=".55" stop-color="#fff" stop-opacity=".99"/>'+
  '<stop offset=".82" stop-color="#fff" stop-opacity=".72"/>'+
  '<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>'+
  '<rect width="780" height="700" fill="url(#a)"/></svg>');
const softened=await sharp(crop).composite([{input:fade,blend:'dest-in'}]).png().toBuffer();
const result=await sharp(bg).composite([{input:softened,left:10,top:240}])
  .png({compressionLevel:9}).toFile(target);
const info=await sharp(target).metadata();
if(info.width!==w||info.height!==h)throw Error('Bad portrait cover dimensions');
console.log('CAT BOND ACTUAL WATERCOLOR COVER GENERATED',JSON.stringify({name:target,bytes:result.size,source:frame}));
