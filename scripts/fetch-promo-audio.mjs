// Licensed, individually recorded music for each game's video.
// No silent fallback to one generic background loop.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import crypto from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync('promotion/promo-music-catalog.json','utf8'));
const dir=process.env.MW_PROMO_AUDIO_DIR || path.join(process.env.RUNNER_TEMP || os.tmpdir(),'morrowwish-promo-audio');
fs.mkdirSync(dir,{recursive:true});
const all=Object.entries(manifest.tracks);
if(all.length!==7)throw Error('Expected seven different music selections');
const titles=new Set(),sources=new Set(),sums=new Set();
for(const [slug,track] of all){
 if(titles.has(track.title))throw Error('Duplicated song title '+track.title);
 titles.add(track.title);
 const source=track.localFile || track.sourceUrl;
 if(sources.has(source))throw Error('Duplicated recording source '+source);
 sources.add(source);
 const out=path.join(dir,slug+'.ogg'),download=path.join(dir,slug+'.source');
 try{
  if(track.localFile){
   if(!fs.existsSync(track.localFile))throw Error('Missing licensed local source '+track.localFile);
   fs.copyFileSync(track.localFile,download);
  }else{
   if(!/^https:\/\//.test(track.sourceUrl)||!track.license||!track.licenseUrl)throw Error('Music credit/source missing for '+slug);
   execFileSync('curl',['-fLsS','--retry','1','--connect-timeout','8','--max-time','40','-A','MorrowWishPromoRenderer/1.0','-o',download,track.sourceUrl],{timeout:50000,stdio:'inherit'});
  }
  const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','json',download],{encoding:'utf8',timeout:15000}));
  if(!(Number(meta.format?.duration)>12))throw Error('Music duration under 12 seconds '+slug);
  execFileSync('ffmpeg',['-y','-nostdin','-v','error','-i',download,'-t','70','-vn','-ar','48000','-ac','2','-c:a','libopus','-b:a','72k',out],{timeout:95000,stdio:'inherit'});
  if(fs.statSync(out).size<20000)throw Error('Music result too small '+slug);
  const digest=crypto.createHash('sha256').update(fs.readFileSync(out)).digest('hex');
  if(sums.has(digest))throw Error('Two games got IDENTICAL soundtrack bytes, reject render!');
  sums.add(digest);
  console.log('Verified distinct licensed music: '+slug+' → '+track.title+' ('+track.license+')');
 }finally{
  if(fs.existsSync(download))fs.rmSync(download);
 }
}
console.log('Validated '+sums.size+' UNIQUE recorded soundtracks. Files in '+dir);
