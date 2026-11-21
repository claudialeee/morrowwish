// Cinematic V5 promo reels. Feature-led, complete phone UI, chronological real attempts.
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
const manifest={version:'V5',createdAt:new Date().toISOString(),approval:'NOT APPROVED — REVIEW ONLY',
 socialAutopublish:false,historicalVideoViewsExcluded:true,trailers:[]};
const choose=(src,start,duration,caption='',label='')=>({src,start,duration,caption,label});
const cover=(duration,caption='',label='')=>choose('cover',0,duration,caption,label);
const game=(start,duration,caption='',label='')=>choose('game',start,duration,caption,label);
const broll=(label,duration,caption='')=>choose('broll',0,duration,caption,label);
const playlists={
 'cat-bond':[
  broll('yard',2.5,'MEET YOUR NEW CAT FAMILY.'),
  broll('raising',2.45,'RAISE YOUR OWN CAT CREW.'),
  broll('work-before',1.55,'SEND CATS TO WORK.'),
  broll('work-after',2.35,'EARN COINS TOGETHER.'),
  broll('tease',2.45,'PLAY WITH YOUR CATS.'),
  broll('map-choice',1.95,'DISCOVER FIVE REGIONS.'),
  broll('map-explore',2.7,'EXPLORE BEYOND THE YARD.'),
  broll('battle',3.1,'FIGHT AS A TEAM.'),
  cover(1.9,'PLAY FREE')
 ],
 'pawsibly-innocent':[
  broll('sneak',1.4,'THREE FISH. ONE SNEAKY CAT.'),
  broll('distraction',2.35,'DISTRACT THE HUMAN.'),
  broll('escape-run',2.9,'RUN FOR THE EXIT.'),
  broll('escaped',1.05,'A NARROW ESCAPE!'),
  broll('caught-chase',2.85,'NEXT ROOM. ONE BAD MOVE...'),
  broll('caught',1.3,'CAUGHT!'),
  cover(1.9,'PLAY FREE')
 ],
 'tiny-town':[
  broll('board',2.5,'NO JOBS. JUST FREEDOM.'),
  broll('board-later',2.35,'PLACE YOUR OWN DREAMS.'),
  broll('combination',2.65,'NEIGHBORING DREAMS COMBINE.'),
  broll('legendary',2.2,'UNLOCK LEGENDARY WISHES.'),
  broll('board-mature',2.2,'WATCH YOUR TOWN TRANSFORM.'),
  broll('ending',3.1,'SEVEN DAYS. YOUR OWN ENDING.'),
  cover(1.9,'PLAY FREE')
 ],
 'elsewhere':[
  broll('choose-life',2.25,'WAKE UP TO A NEW LIFE.'),
  broll('paris',3.0,'FALL IN LOVE IN PARIS.'),
  broll('paris-result',1.4),
  broll('amalfi',3.0,'OWN A SEASIDE VILLA.'),
  broll('amalfi-result',1.4),
  broll('tokyo',3.0,'LIVE AS A SUPERSTAR.'),
  broll('tokyo-result',1.4),
  broll('moon',3.0,'OR OWN A HOTEL ON THE MOON.'),
  broll('moon-result',1.4),
  cover(1.9,'PLAY FREE')
 ],
 'flip-dash':[
  broll('play',3.55,'ONE BUTTON. ONE WRONG FLIP.'),
  broll('collision',0.6),
  broll('game-over',1.4,'CRASHED. BEAT MY SCORE?'),
  cover(2.35,'PLAY FREE')
 ],
 'parcel-panic':[
  broll('deliver',3.3,'KEEP THE DELIVERIES GOING.'),
  broll('wrong-lane',2.15,'ONE WRONG LANE...'),
  broll('game-over',1.85,'GAME OVER. BEAT MY RUN?'),
  cover(1.7,'PLAY FREE')
 ],
 'pocket-aquarium':[
  broll('feeding',2.9,'FEED THE RIGHT FISH.'),
  broll('water-cloudy',3.0,'THE WATER IS GETTING CLOUDY.'),
  broll('timeout',1.9,'TIME UP. CAN YOU GET AN A?'),
  cover(1.7,'PLAY FREE')
 ]
};
const brollManifest=JSON.parse(fs.readFileSync(path.join(brollDir,'broll-manifest.json'),'utf8'));
const proofs=Object.fromEntries(brollManifest.broll.map(x=>[x.slug,x]));
function ffprobe(file){
 const result=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type,width,height','-of','json',file],{encoding:'utf8',timeout:12000}));
 return {seconds:Number(result.format?.duration)||0,streams:result.streams||[]};
}
function edit(slug){
 const base='public/promo/'+slug,coverFile=base+'/cover-portrait.png',music=promoTrack(slug),b=proofs[slug]||null;
 if(!b||!fs.existsSync(coverFile))throw Error('Missing newly recorded authentic scene or official cover for '+slug);
 const chosen=[];
 const rawInfo=b?ffprobe(b.file):null;
 if(b?.errors?.length)throw Error('Browser errors in recorded game: '+slug);
 if(new Set(playlists[slug].filter(x=>x.src==='broll').map(x=>x.label)).size!==playlists[slug].filter(x=>x.src==='broll').length)throw Error('V5 repeated footage label detected for '+slug);
 for(const item of playlists[slug]){
  const shot={...item};
  if(shot.src==='broll'){
   if(!b||!rawInfo?.seconds)throw Error('Missing extra recorded game scenes for '+slug);
   const scene=b.shots.find(x=>x.label===shot.label);
   if(!scene)throw Error('Real broll scene missing '+slug+'/'+shot.label);
   shot.start=scene.start;
   shot.duration=Math.min(shot.duration,scene.duration);
   if(shot.start+shot.duration>rawInfo.seconds-0.04)throw Error('Broll segment overruns video '+slug+'/'+shot.label);
  }
  if(shot.src==='game')throw Error('V5 forbids old cut-together V3 footage '+slug);
  chosen.push(shot);
 }
 const clipOverlap=0.22,n=chosen.length;
 const args=['-nostdin','-y','-hide_banner','-loglevel','error',
  '-i',b.file];
 let coverIndex=1,brollIndex=0,musicIndex;
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
   // Source posters contain baked, partly cropped headlines. Never render
   // those incomplete words; use a neutral background and typeset CTA.
   f+='scale=1080:1920:flags=lanczos,drawbox=x=0:y=0:w=iw:h=ih:color=0x241A37@1:t=fill,';
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
  if(isFinalTitle){
   const names={
     'pawsibly-innocent':'PAWSIBLY INNOCENT!',
     'cat-bond':'CAT BOND',
     'tiny-town':'NO MORE MONDAYS',
     'elsewhere':'ELSEWHERE',
     'flip-dash':'FLIP DASH',
     'parcel-panic':'PARCEL PANIC',
     'pocket-aquarium':'POCKET AQUARIUM'
   };
   const title=names[slug];
   if(!title)throw Error('Missing end card title: '+slug);
   const titleFile=path.join(work,slug+'-end-title.txt'),
         studioFile=path.join(work,slug+'-studio.txt'),
         actionFile=path.join(work,slug+'-action.txt'),
         destinationFile=path.join(work,slug+'-destination.txt');
   for(const [file,txt] of [[titleFile,title],[studioFile,'MORROW WISH'],[actionFile,'PLAY FREE'],[destinationFile,'LINK IN BIO']])fs.writeFileSync(file,txt);
   const titleSize=title.length>=16?58:title.length>=12?70:84;
   f+=',drawbox=x=230:y=735:w=620:h=5:color=0xE7BDA3:t=fill';
   for(const [file,size,y,col] of [[studioFile,40,660,'0xE7BDA3'],[titleFile,titleSize,810,'white'],[actionFile,56,1065,'white'],[destinationFile,36,1170,'0xE7BDA3']]){
     f+=',drawtext=fontfile='+font+':textfile='+file+':fontcolor='+col+':fontsize='+size+':x=(w-text_w)/2:y='+y;
   }
   captionsUsed+=4;
  }else if(sh.src==='broll'&&!!sh.caption&&!/result$/.test(sh.label)){
   const txtFile=path.join(work,slug+'-'+i+'.txt');fs.writeFileSync(txtFile,sh.caption);
   f+=',drawtext=fontfile='+font+':textfile='+txtFile+
      ':fontcolor=white:fontsize='+fontSize+':x=(w-text_w)/2:y='+(slug==='elsewhere'||slug==='pawsibly-innocent'?110:slug==='pocket-aquarium'?1360:1705)+
      ':shadowcolor=black@0.8:shadowx=2:shadowy=3:box=1:boxcolor=black@0.40:boxborderw=12';
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
 const output=base+'/trailer-v5-20261121.mp4',poster=base+'/trailer-v5-20261121.jpg';
 const command=[...args,'-filter_complex',filters.join(';'),'-map','[vout]',
  '-map',musicIndex+':a:0','-t',fmt(timeline),'-r','30',
  '-c:v','libx264','-preset','veryfast','-crf','22','-pix_fmt','yuv420p',
  '-c:a','aac','-b:a','144k','-af','volume=0.34,afade=t=in:st=0:d=0.3,afade=t=out:st='+fmt(timeline-0.7)+':d=0.7',
  '-movflags','+faststart',output];
 execFileSync('ffmpeg',command,{stdio:'inherit',timeout:330000});
 const meta=ffprobe(output),bytes=fs.statSync(output).size;
 const isHero=hero.has(slug);
 if(meta.seconds<(isHero?11.0:7.1)||meta.seconds>(isHero?40:16.5)||
  !meta.streams.some(x=>x.codec_type==='video'&&x.width===1080&&x.height===1920)||
  !meta.streams.some(x=>x.codec_type==='audio')||bytes<220000)
   throw Error('Video format, genuine runtime or sound QA failed '+JSON.stringify({slug,meta,bytes}));
 execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss','0.9','-i',output,'-frames:v','1','-q:v','3',poster],{timeout:24000});
 const review=[];
 for(const [i,seconds] of [1.1,meta.seconds*.50,Math.max(0,meta.seconds-0.85)].entries()){
  const file=base+'/v5-review-'+(i+1)+'.jpg';
  execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss',fmt(seconds),'-i',output,'-frames:v','1','-q:v','3',file],{timeout:24000});
  if(fs.statSync(file).size<12000)throw Error('Blank review thumbnail '+file);
  review.push('/promo/'+slug+'/v5-review-'+(i+1)+'.jpg');
 }
 const result={slug,kind:isHero?'cinematic-story-trailer':'challenge-failure-ad',
  video:'/promo/'+slug+'/trailer-v5-20261121.mp4',poster:'/promo/'+slug+'/trailer-v5-20261121.jpg',
  review,duration:Number(meta.seconds.toFixed(1)),shots:chosen.map(x=>({source:x.src,scene:x.label||null,caption:x.caption,seconds:x.duration})),
  sourceClips:'new verified game-controlled chronological V5 scenes and separate typeset end card',transitions:'new game-controlled scenes with gentle xfade, no stale V3 caption overlays',
  aspect:'native 9:16, game shot aspect unchanged',approved:false,published:false};
 manifest.trailers.push(result);
 console.log('CINEMATIC V5 REVIEW ONLY '+JSON.stringify({slug,seconds:result.duration,kind:result.kind,bytes,captionsUsed,shots:n}));
}
try{
 for(const slug of ['cat-bond','pawsibly-innocent','tiny-town','elsewhere','flip-dash','parcel-panic','pocket-aquarium'])edit(slug);
 fs.writeFileSync('public/promo/v5-review.json',JSON.stringify(manifest,null,2)+'\n');
 console.log('V5 TRAILERS RENDERED FOR REVIEW, NO SOCIAL POSTING: '+manifest.trailers.length);
}finally{fs.rmSync(work,{recursive:true,force:true})}
