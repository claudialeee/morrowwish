// Social-replacement candidate only: 10-second REAL V13 Cat Bond footage.
// One authentic painted duo attack, its SAME battle aftermath, earned rare
// capture and CTA. Never splice in historical V3/V10 footage or auto-publish.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {promoTrack} from './promo-audio.mjs';

const base='public/promo/cat-bond';
const input=base+'/trailer-v13-20261122.mp4';
const output=base+'/hook-v13-original-duo-20261122.mp4';
const poster=base+'/hook-v13-original-duo-20261122.jpg';
const report=base+'/hook-v13-original-duo-20261122.json';
const review=JSON.parse(fs.readFileSync('public/promo/v13-review.json','utf8'));
const cat=review.trailers.find(x=>x.slug==='cat-bond');
if(cat?.video!=='/promo/cat-bond/trailer-v13-20261122.mp4'||
  cat.originalDuoArtMode!=='63-original-painted-storyboards'||
  !cat.originalDuoArtSource?.includes('duo-storyboard-21x3-v3.webp'))
 throw Error('Refuse old/unverified duo animation for social teaser');
const shots=cat.shots||[];
const sums=new Map();let elapsed=0;
for(const s of shots){sums.set(s.scene||'end-card',{start:elapsed,duration:s.seconds});elapsed+=s.seconds;}
const keys=['rare-encounter','duo','rare-aftermath','rare-capture','end-card'];
if(shots.filter(s=>s.scene==='duo').length!==1||keys.some(k=>!sums.has(k)))
 throw Error('Missing the single duo -> earned capture story');
const picks=[
  {scene:'rare-encounter',duration:1.10,offset:.35},
  {scene:'duo',duration:3.10,offset:0},
  {scene:'rare-aftermath',duration:1.15,offset:0},
  {scene:'rare-capture',duration:3.20,offset:.08},
  {scene:'end-card',duration:1.20,offset:0},
];
const fmt=n=>Number(n).toFixed(3);
const filter=[];
for(const [i,cut] of picks.entries()){
 const shot=sums.get(cut.scene);
 if(cut.duration+cut.offset>shot.duration+.002)
  throw Error('Source shot too short: '+cut.scene+' '+JSON.stringify(shot));
 const from=shot.start+cut.offset;
 filter.push('[0:v]trim=start='+fmt(from)+':end='+fmt(from+cut.duration)+
   ',setpts=PTS-STARTPTS,fps=30,scale=1080:1920:flags=lanczos,setsar=1[v'+i+']');
}
filter.push(picks.map((_,i)=>'[v'+i+']').join('')+
  'concat=n='+picks.length+':v=1:a=0,format=yuv420p[vout]');
const length=picks.reduce((n,p)=>n+p.duration,0);
execFileSync('ffmpeg',['-nostdin','-y','-hide_banner','-loglevel','error',
  '-i',input,'-stream_loop','-1','-i',promoTrack('cat-bond'),
  '-filter_complex',filter.join(';'),'-map','[vout]','-map','1:a:0',
  '-t',fmt(length),'-r','30','-c:v','libx264','-preset','veryfast',
  '-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k',
  '-af','volume=0.37,afade=t=in:st=0:d=0.2,afade=t=out:st='+fmt(length-.5)+':d=0.5',
  '-movflags','+faststart',output],{stdio:'inherit',timeout:240000});
const info=JSON.parse(execFileSync('ffprobe',['-v','error',
 '-show_entries','format=duration,size:stream=codec_type,width,height','-of','json',output],{encoding:'utf8'}));
const duration=Number(info.format.duration);
if(Math.abs(duration-length)>.16||
 !info.streams.some(x=>x.codec_type==='video'&&x.width===1080&&x.height===1920)||
 !info.streams.some(x=>x.codec_type==='audio')||
 Number(info.format.size)<300_000)throw Error('Native short master failed QA');
for(const [file,at] of [[poster,3.0],[base+'/hook-v13-original-duo-proof.jpg',3.0],
 [base+'/hook-v13-rare-result-proof.jpg',7.9]]){
 execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss',fmt(at),'-i',output,
   '-frames:v','1','-q:v','2',file],{timeout:25000});
 if(fs.statSync(file).size<15000)throw Error('Blank proof '+file);
}
const meta={
 sourceVideo:cat.video,originalDuoArtMode:cat.originalDuoArtMode,
 originalDuoArtSource:cat.originalDuoArtSource,
 newGameplayCapture:true,oldHookReused:false,originalDuoCasts:1,
 scenes:picks,earnedRareCapture:true,socialAutopublish:false,approved:false,published:false,
 width:1080,height:1920,duration,bytes:Number(info.format.size),
 video:'/promo/cat-bond/'+path.basename(output),poster:'/promo/cat-bond/'+path.basename(poster)
};
fs.writeFileSync(report,JSON.stringify(meta,null,2)+'\n');
console.log('CAT BOND V13 ORIGINAL PAINTED 10S SOCIAL MASTER',JSON.stringify(meta));
