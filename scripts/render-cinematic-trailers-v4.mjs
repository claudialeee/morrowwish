// Cinematic V4 promo reels. 4 story trailers (~25-30s) and 3 challenge ads (~11s).
// All visuals are recorded current-game footage and current game-owned cover art.
// No generated gameplay, no spoilers in the opening, no social posting.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {promoTrack} from './promo-audio.mjs';
const brollDir=process.env.MW_V4_BROLL_DIR||path.join(process.env.RUNNER_TEMP||os.tmpdir(),'morrowwish-v4-broll');
const work=fs.mkdtempSync(path.join(os.tmpdir(),'mw-edit-v4-'));
const font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const hero=new Set(['pawsibly-innocent','cat-bond','tiny-town','elsewhere']);
const manifest={version:'V4',createdAt:new Date().toISOString(),approval:'NOT APPROVED — REVIEW ONLY',
 socialAutopublish:false,historicalVideoViewsExcluded:true,trailers:[]};
const choose=(src,start,duration,caption='',label='')=>({src,start,duration,caption,label});
const cover=(duration,caption='',label='')=>choose('cover',0,duration,caption,label);
const game=(start,duration,caption='',label='')=>choose('game',start,duration,caption,label);
const broll=(label,duration,caption='')=>choose('broll',0,duration,caption,label);
const playlists={
 'pawsibly-innocent':[
  broll('sneak',2.2,'THREE FISH. ONE CAT.'),
  game(1.91,1.20),
  broll('decoy',2.3,'A YARN BALL CHANGES EVERYTHING.'),
  cover(2.2),
  game(3.35,1.8),
  broll('steal',3.6,'NOW STEAL THE FISH.'),
  game(5.66,2.1),
  broll('steal',3.2),
  game(7.65,1.4),
  broll('sneak',2.2),
  game(8.47,1.5),
  cover(3.3,'PLAY FREE')
 ],
 'cat-bond':[
  broll('yard',3.6,'MEET YOUR CAT CREW.'),
  cover(2.5),
  broll('battle',3.0,'THE STRAYS FIGHT BACK.'),
  game(2.85,2.3),
  broll('yard-late',2.45),
  cover(2.25),
  broll('battle-late',2.6,'FIGHT WITH TWO CATS.'),
  game(0.14,2.4),
  broll('battle',2.4),
  game(5.65,2.1),
  cover(3.4,'PLAY FREE')
 ],
 'tiny-town':[
  broll('build',3.5,'NO WORK. BUILD WHAT YOU WANT.'),
  broll('build-late',3.9),
  game(6.48,1.9),
  cover(2.6),
  broll('build',3.45,'THE TOWN KEEPS CHANGING.'),
  game(6.50,2.0),
  broll('build-late',3.5),
  game(8.43,2.6),
  cover(3.3,'PLAY FREE')
 ],
 'elsewhere':[
  game(3.64,2.3),
  broll('maldives',3.6,'OR WAKE UP ON AN ISLAND.'),
  broll('maldives-result',1.55),
  cover(2.45),
  game(6.13,1.85),
  broll('tokyo',3.65,'ANOTHER CITY. ANOTHER YOU.'),
  broll('tokyo-result',1.55),
  broll('moon',3.65,'A HOTEL ON THE MOON?'),
  broll('moon-result',1.55),
  game(8.12,1.85),
  game(10.16,2.3),
  cover(3.2,'PLAY FREE')
 ],
 'flip-dash':[
  game(0.05,1.45),
  game(1.75,3.05),
  game(4.3,1.25),
  game(5.25,1.55),
  cover(2.6,'PLAY FREE')
 ],
 'parcel-panic':[
  game(0.05,1.30),
  game(1.65,2.35),
  game(3.65,1.5),
  game(5.08,1.36),
  cover(2.55,'PLAY FREE')
 ],
 'pocket-aquarium':[
  game(0.06,1.75),
  game(2.35,2.5),
  game(5.65,1.75),
  game(7.63,1.5),
  cover(2.7,'PLAY FREE')
 ]
};
const brollManifest=JSON.parse(fs.readFileSync(path.join(brollDir,'broll-manifest.json'),'utf8'));
const proofs=Object.fromEntries(brollManifest.broll.map(x=>[x.slug,x]));
function ffprobe(file){
 const result=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type,width,height','-of','json',file],{encoding:'utf8',timeout:12000}));
 return {seconds:Number(result.format?.duration)||0,streams:result.streams||[]};
}
function edit(slug){
 const base='public/promo/'+slug,master=base+'/hook-v3-20261121.mp4',
       coverFile=base+'/cover-portrait.png',music=promoTrack(slug),b=proofs[slug]||null;
 if(!fs.existsSync(master)||!fs.existsSync(coverFile))throw Error('Missing real V3 gameplay or official game cover for '+slug);
 const masterInfo=ffprobe(master),chosen=[];
 const rawInfo=b?ffprobe(b.file):null;
 for(const item of playlists[slug]){
  const shot={...item};
  if(shot.src==='broll'){
   if(!b||!rawInfo?.seconds)throw Error('Missing extra recorded game scenes for '+slug);
   const scene=b.shots.find(x=>x.label===shot.label);
   if(!scene)throw Error('Real broll scene missing '+slug+'/'+shot.label);
   shot.start=scene.start;
   shot.duration=Math.min(shot.duration,scene.duration);
   if(shot.start+shot.duration>rawInfo.seconds-0.08)throw Error('Broll segment overruns video '+slug+'/'+shot.label);
  }
  if(shot.src==='game'&&shot.start+shot.duration>masterInfo.seconds-0.07)throw Error('Game cut exceeds actual live video '+slug+'/'+JSON.stringify(shot)+' / '+masterInfo.seconds);
  chosen.push(shot);
 }
 const clipOverlap=0.22,n=chosen.length;
 const args=['-nostdin','-y','-hide_banner','-loglevel','error',
  '-i',master];
 let coverIndex=1,brollIndex=null,musicIndex;
 if(b){brollIndex=1;args.push('-i',b.file);coverIndex=2;}
 args.push('-loop','1','-framerate','30','-i',coverFile);
 musicIndex=coverIndex+1;args.push('-stream_loop','-1','-i',music);
 const filters=[];
 const fmt=n=>Math.max(0,n).toFixed(3);
 const fontSize=hero.has(slug)?43:47;
 let captionsUsed=0;
 for(let i=0;i<chosen.length;i++){
  const sh=chosen[i],input=sh.src==='game'?0:sh.src==='broll'?brollIndex:coverIndex;
  if(input==null)throw Error('Missing broll input for '+slug);
  let f='['+input+':v]';
  if(sh.src!=='cover')f+='trim=start='+fmt(sh.start)+':duration='+fmt(sh.duration)+',setpts=PTS-STARTPTS,';
  else f+='trim=duration='+fmt(sh.duration)+',setpts=PTS-STARTPTS,';
  f+='fps=30,';
  if(sh.src==='cover'){
   // Gentle Ken-Burns motion, never stretched; official artwork only.
   f+="scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,"+
      "zoompan=z='min(1.0+on*0.00042,1.055)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30,";
  }else {
   f+='scale=1080:1920:flags=lanczos,';
   // Existing V3 Cat Bond captured a few orange pixels on source edges.
   // Crop only ~1.7% symmetrically, keeping an exact 9:16 aspect ratio.
   if(slug==='cat-bond'&&sh.src==='game')f+='crop=1044:1856:18:32,scale=1080:1920:flags=lanczos,';
  }
  f+='setsar=1,format=yuv420p,settb=AVTB';
  // Prior versions had two overlapping caption layers on every shot.
  // V3 gameplay already contains its own caption. Keep it untouched;
  // use V4 captions ONLY for clean newly captured b-roll + final CTA.
  const isFinalTitle=sh.src==='cover'&&i===chosen.length-1;
  const addLabel=(sh.src==='broll'&&!!sh.caption&&!/result$/.test(sh.label))||isFinalTitle;
  if(addLabel){
   const label=isFinalTitle?'PLAY FREE · LINK IN BIO':sh.caption;
   const txtFile=path.join(work,slug+'-'+i+'.txt');fs.writeFileSync(txtFile,label);
   const y=sh.src==='broll'?1705:1760;
   f+=',drawtext=fontfile='+font+':textfile='+txtFile+
      ':fontcolor=white:fontsize='+(isFinalTitle?36:fontSize)+':x=(w-text_w)/2:y='+y+
      ':shadowcolor=black@0.8:shadowx=2:shadowy=3:box=1:boxcolor=black@0.31:boxborderw=12';
   captionsUsed++;
  }
  filters.push(f+'[v'+i+']');
 }
 let timeline=chosen[0].duration,prev='v0';
 for(let i=1;i<n;i++){
  const next='x'+i;
  const types=['fade','fade','smoothleft','fade','wipeup','fade'];
  const transition=types[(i+slug.length)%types.length];
  filters.push('['+prev+'][v'+i+']xfade=transition='+transition+
    ':duration='+fmt(clipOverlap)+':offset='+fmt(timeline-clipOverlap)+'['+next+']');
  timeline+=chosen[i].duration-clipOverlap;
  prev=next;
 }
 filters.push('['+prev+']format=yuv420p[vout]');
 const output=base+'/trailer-v4-20261121.mp4',poster=base+'/trailer-v4-20261121.jpg';
 const command=[...args,'-filter_complex',filters.join(';'),'-map','[vout]',
  '-map',musicIndex+':a:0','-t',fmt(timeline),'-r','30',
  '-c:v','libx264','-preset','veryfast','-crf','22','-pix_fmt','yuv420p',
  '-c:a','aac','-b:a','144k','-af','volume=0.34,afade=t=in:st=0:d=0.3,afade=t=out:st='+fmt(timeline-0.7)+':d=0.7',
  '-movflags','+faststart',output];
 execFileSync('ffmpeg',command,{stdio:'inherit',timeout:330000});
 const meta=ffprobe(output),bytes=fs.statSync(output).size;
 const isHero=hero.has(slug);
 if(meta.seconds<(isHero?23:8.0)||meta.seconds>(isHero?40:16.5)||
  !meta.streams.some(x=>x.codec_type==='video'&&x.width===1080&&x.height===1920)||
  !meta.streams.some(x=>x.codec_type==='audio')||bytes<220000)
   throw Error('Video format, genuine runtime or sound QA failed '+JSON.stringify({slug,meta,bytes}));
 execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss','0.9','-i',output,'-frames:v','1','-q:v','3',poster],{timeout:24000});
 const review=[];
 for(const [i,seconds] of [1.1,meta.seconds*.50,Math.max(0,meta.seconds-2.2)].entries()){
  const file=base+'/v4-review-'+(i+1)+'.jpg';
  execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss',fmt(seconds),'-i',output,'-frames:v','1','-q:v','3',file],{timeout:24000});
  if(fs.statSync(file).size<12000)throw Error('Blank review thumbnail '+file);
  review.push('/promo/'+slug+'/v4-review-'+(i+1)+'.jpg');
 }
 const result={slug,kind:isHero?'cinematic-story-trailer':'challenge-failure-ad',
  video:'/promo/'+slug+'/trailer-v4-20261121.mp4',poster:'/promo/'+slug+'/trailer-v4-20261121.jpg',
  review,duration:Number(meta.seconds.toFixed(1)),shots:chosen.map(x=>({source:x.src,scene:x.label||null,caption:x.caption,seconds:x.duration})),
  sourceClips:'current live gameplay and actual studio cover',transitions:'action cuts + gentle xfade + cover zoom',
  aspect:'native 9:16, game shot aspect unchanged',approved:false,published:false};
 manifest.trailers.push(result);
 console.log('CINEMATIC V4 REVIEW ONLY '+JSON.stringify({slug,seconds:result.duration,kind:result.kind,bytes,captionsUsed,shots:n}));
}
try{
 for(const slug of ['cat-bond','pawsibly-innocent','tiny-town','elsewhere','flip-dash','parcel-panic','pocket-aquarium'])edit(slug);
 fs.writeFileSync('public/promo/v4-review.json',JSON.stringify(manifest,null,2)+'\n');
 console.log('V4 TRAILERS RENDERED FOR REVIEW, NO SOCIAL POSTING: '+manifest.trailers.length);
}finally{fs.rmSync(work,{recursive:true,force:true})}
