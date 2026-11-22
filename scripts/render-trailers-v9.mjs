// Cinematic V5 promo reels. Feature-led, complete phone UI, chronological real attempts.
// All visuals are recorded current-game footage and current game-owned cover art.
// No generated gameplay, no spoilers in the opening, no social posting.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {promoTrack} from './promo-audio.mjs';
const brollDir=process.env.MW_V7_BROLL_DIR||path.join(process.env.RUNNER_TEMP||os.tmpdir(),'morrowwish-v9-broll');
const work=fs.mkdtempSync(path.join(os.tmpdir(),'mw-edit-v7-'));
const font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const hero=new Set(['pawsibly-innocent','cat-bond','tiny-town','elsewhere']);
const manifest={version:'V9',createdAt:new Date().toISOString(),approval:'NOT APPROVED — REVIEW ONLY',
 socialAutopublish:false,historicalVideoViewsExcluded:true,readabilityChecked:true,pausedPromoGames:[],trailers:[]};
const readingAudit={createdAt:manifest.createdAt,version:'readability-review-v9',
 method:'Caption words at 3.1 words/sec + 0.8 sec orientation; scene-specific minimums for dense menus and story; three choices shown together.',
 pausedPromoGames:[],scenes:[]};
const MIN_READING={
 'cat-bond':{'cat-upgrade':3.0,'duo-partners':2.6,'duo-promise':3.7,
   'ssr-showcase':3.4,'rare-capture':2.8},
 'pawsibly-innocent':{'narrow-achievement':3.2},
 'tiny-town':{'opening-three-choices':6.6,'resident-profile':4.5,'neighbor-story':4.7,'ending':4.9},
 'elsewhere':{'choose-life':3.0,'paris':4.0,'paris-romance':4.6,
  'paris-ending':5.2,'amalfi':2.6,'tokyo':2.45,'moon-opening':3.0,
  'moon-surprise':2.7,'moon-ending':5.0},
 'flip-dash':{'first-coin':3.0,'crash':2.5},
 'parcel-panic':{'game-over':2.7},
 'pocket-aquarium':{'timeout':2.9}
};
const choose=(src,start,duration,caption='',label='')=>({src,start,duration,caption,label});
const cover=(duration,caption='',label='')=>choose('cover',0,duration,caption,label);
const game=(start,duration,caption='',label='')=>choose('game',start,duration,caption,label);
const broll=(label,duration,caption='')=>choose('broll',0,duration,caption,label);
const playlists={
 'cat-bond':[
  broll('yard',2.7,'A WORLD FULL OF CATS.'),
  broll('raising',2.25,'MEET YOUR CAT TEAM.'),
  broll('cat-upgrade',3.25,'LEVEL UP WITH ONE TAP.'),
  broll('duo-partners',2.85,'CHOOSE YOUR CAT DUO.'),
  broll('duo-map-walk',1.8),
  broll('duo-promise',3.85,'A SECRET PROMISE UNDER PETALS.'),
  broll('work-before',2.5,'SEND CATS OUT TO WORK.'),
  broll('work-after',2.25,'EARN COINS TO GROW.'),
  broll('tease',2.45,'PLAY WITH YOUR CATS.'),
  broll('map-choice',2.8,'DISCOVER NEW PLACES.'),
  broll('map-explore',2.7,'EXPLORE A LIVING WORLD.'),
  broll('map-management',2.25,'MANAGE CATS ANYWHERE.'),
  broll('auto-team-saved',2.5,'AUTO-DEPLOY YOUR BEST TEAM.'),
  broll('battle-hud',2.5,'REAL-TIME HEALTH AND BATTLE.'),
  broll('battle-skills',3.0,'USE DIFFERENT SKILLS.'),
  broll('duo',4.25,'ONE POWERFUL DUO FINISHER!'),
  broll('rare-encounter',2.05,'A RARE CAT APPEARS!'),
  broll('rare-capture',3.45,'A NEW FRIEND JOINS YOU.'),
  broll('ssr-showcase',3.9,'MEET A LEGENDARY SSR CAT!'),
  cover(3.6,'PLAY FREE')
 ],
 'pawsibly-innocent':[
  broll('escape-attempt',24,'STEAL THREE FISH. ESCAPE!'),
  broll('narrow-pursuit',2.65,'SPOTTED! HIDE FAST!'),
  broll('narrow-achievement',3.4),
  broll('room-kitchen',2.25,'SNEAK THROUGH THE KITCHEN.'),
  broll('room-laundry',2.25,'DODGE THE LAUNDRY PATROL.'),
  broll('room-library',2.65,'A LIBRARY FULL OF SECRETS.'),
  broll('room-garden',2.25,'ESCAPE THROUGH THE GARDEN.'),
  broll('caught-attempt',14,'ONE WRONG TURN... CAUGHT!'),
  cover(3.6,'PLAY FREE')
 ],
 'tiny-town':[
  // Faster editorial rhythm; show ALL three real opening choices, cut the
  // redundant second board montage instead of making text unreadable.
  broll('opening-three-choices',7.0),
  broll('board',3.0,'NO JOBS. BUILD YOUR TOWN.'),
  broll('resident-reactions',2.9,'FIVE NEIGHBORS. FIVE DREAMS.'),
  broll('resident-profile',4.7,'THEY HAVE THEIR OWN OPINIONS.'),
  broll('combination',3.5,'TWO WISHES BECOME ONE!'),
  broll('neighbor-story',5.0,'THE NEIGHBORS HAVE STORIES.'),
  broll('legendary',3.2,'UNLOCK A LEGENDARY WONDER.'),
  broll('board-mature',2.6,'WATCH THE WHOLE TOWN CHANGE.'),
  broll('ending',5.2,'SEVEN DAYS. YOUR OWN ENDING.'),
  cover(3.1,'PLAY FREE')
 ],
 'elsewhere':[
  // Keep the romance as ONE memorable life, not the entire advertisement.
  // Three Paris beats only: a new encounter, a meaningful choice, the ending.
  // Let a second life supply the surprising payoff for better variety.
  broll('choose-life',3.2),
  broll('amalfi',2.75,'A VILLA ON THE AMALFI COAST.'),
  broll('tokyo',2.6,'BE A SUPERSTAR TONIGHT.'),
  broll('moon-opening',3.1,'OR OWN A HOTEL ON THE MOON.'),
  broll('moon-surprise',2.9,'SURPRISES IN EVERY LIFE.'),
  broll('moon-ending',5.35,'EVERY LIFE HAS AN ENDING.'),
  broll('paris',4.25,'A NEW LOVE STORY IN PARIS.'),
  broll('paris-romance',4.9,'YOUR STORY. YOUR CHOICES.'),
  broll('paris-ending',5.5,'YOUR CHOICES. YOUR ENDING.'),
  cover(3.1,'PLAY FREE')
 ],
 'flip-dash':[
  broll('first-coin',3.5,'GRAB GOLD FROM THE START!'),
  broll('coin-collect',10.2,'COLLECT GOLD. DODGE PINK.'),
  broll('danger',2.45),
  broll('crash',2.7,'CAN YOU LAST LONGER?'),
  cover(3.6,'PLAY FREE')
 ],
 'parcel-panic':[
  broll('deliveries',12.4,'MATCH THE PARCEL COLOR.'),
  broll('mistakes',6.3,'NOW WATCH THE MISTAKES...'),
  broll('game-over',2.9,'BEAT MY DELIVERY STREAK!'),
  cover(3.6,'PLAY FREE')
 ],
 'pocket-aquarium':[
  broll('feeding',4.55,'FEED THE HUNGRY FISH.'),
  broll('more-feeding',5.8,'KEEP PLAYING. BUILD A SCORE.'),
  broll('water-cloudy',4.65,'TIME IS RUNNING OUT.'),
  broll('timeout',3.1,'TIME UP. BEAT THE GRADE!'),
  cover(3.6,'PLAY FREE')
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
 if(new Set(playlists[slug].filter(x=>x.src==='broll').map(x=>x.label)).size!==playlists[slug].filter(x=>x.src==='broll').length)throw Error('V9 repeated footage label detected for '+slug);
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
  if(shot.src==='game')throw Error('V9 forbids old cut-together V3 footage '+slug);
  chosen.push(shot);
 }
 for(const shot of chosen){
   const words=(shot.caption||'').trim().split(/\s+/).filter(Boolean).length;
   const captionMinimum=words?Math.max(2,0.8+words/3.1):0;
   const sceneMinimum=shot.src==='cover'?(slug==='tiny-town'||slug==='elsewhere'?3.0:3.5):(MIN_READING[slug]?.[shot.label]||0);
   const required=Math.max(captionMinimum,sceneMinimum);
   const passed=shot.duration+.05>=required;
   readingAudit.scenes.push({game:slug,scene:shot.label||'end-card',seconds:Number(shot.duration.toFixed(2)),
    captionWords:words,requiredSeconds:Number(required.toFixed(2)),passed});
   if(!passed)throw Error('READABILITY QA failed: '+slug+'/'+(shot.label||'end-card')+
     ' readable '+shot.duration.toFixed(2)+'s but requires '+required.toFixed(2)+'s');
  }
 const n=chosen.length;
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
   if(sh.caption.length>31)throw Error('V9 subtitle exceeds phone-safe width '+slug+'/'+sh.label+': '+sh.caption);
    const txtFile=path.join(work,slug+'-'+i+'.txt');fs.writeFileSync(txtFile,sh.caption);
   f+=',drawtext=fontfile='+font+':textfile='+txtFile+
      ':fontcolor=white:fontsize='+fontSize+':x=(w-text_w)/2:y='+(slug==='elsewhere'?1650:slug==='pawsibly-innocent'?110:slug==='pocket-aquarium'?1360:1705)+
      ':shadowcolor=black@0.8:shadowx=2:shadowy=3:box=1:boxcolor=black@0.40:boxborderw=12';
   captionsUsed++;
  }
  filters.push(f+'[v'+i+']');
 }
 // Hard cuts preserve readable UI: fades blend text, subtitles and overlays.
 // All gameplay segments remain entirely visible without double-exposure.
 const timeline=chosen.reduce((sum,sh)=>sum+sh.duration,0);
 filters.push(chosen.map((_,i)=>'[v'+i+']').join('')+
   'concat=n='+n+':v=1:a=0,format=yuv420p[vout]');
 const output=base+'/trailer-v9-20261121.mp4',poster=base+'/trailer-v9-20261121.jpg';
 const command=[...args,'-filter_complex',filters.join(';'),'-map','[vout]',
  '-map',musicIndex+':a:0','-t',fmt(timeline),'-r','30',
  '-c:v','libx264','-preset','veryfast','-crf','22','-pix_fmt','yuv420p',
  '-c:a','aac','-b:a','144k','-af','volume=0.34,afade=t=in:st=0:d=0.3,afade=t=out:st='+fmt(timeline-0.7)+':d=0.7',
  '-movflags','+faststart',output];
 execFileSync('ffmpeg',command,{stdio:'inherit',timeout:330000});
 const meta=ffprobe(output),bytes=fs.statSync(output).size;
 const isHero=hero.has(slug);
 const minimumSeconds={'cat-bond':33,'pawsibly-innocent':19,'tiny-town':30,'elsewhere':35,'flip-dash':15,'parcel-panic':15,'pocket-aquarium':13};
  if(meta.seconds<(minimumSeconds[slug]||10)||meta.seconds>(hero.has(slug)?100:40)||
  !meta.streams.some(x=>x.codec_type==='video'&&x.width===1080&&x.height===1920)||
  !meta.streams.some(x=>x.codec_type==='audio')||bytes<220000)
   throw Error('Video format, genuine runtime or sound QA failed '+JSON.stringify({slug,meta,bytes}));
 execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss','0.9','-i',output,'-frames:v','1','-q:v','3',poster],{timeout:24000});
 const review=[];
 for(const [i,seconds] of [1.1,meta.seconds*.50,Math.max(0,meta.seconds-0.85)].entries()){
  const file=base+'/v9-review-'+(i+1)+'.jpg';
  execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss',fmt(seconds),'-i',output,'-frames:v','1','-q:v','3',file],{timeout:24000});
  if(fs.statSync(file).size<12000)throw Error('Blank review thumbnail '+file);
  review.push('/promo/'+slug+'/v9-review-'+(i+1)+'.jpg');
 }
 const result={slug,kind:isHero?'cinematic-story-trailer':'challenge-failure-ad',
  video:'/promo/'+slug+'/trailer-v9-20261121.mp4',poster:'/promo/'+slug+'/trailer-v9-20261121.jpg',
  review,duration:Number(meta.seconds.toFixed(1)),shots:chosen.map(x=>({source:x.src,scene:x.label||null,caption:x.caption,seconds:x.duration})),
  sourceClips:'V9 freshly recorded live game actions with in-game catch/achievement outcomes; no simulated rewards, social posting disabled',transitions:'clean cuts, no ghosted or blended gameplay UI',
  aspect:'native 9:16, game shot aspect unchanged',approved:false,published:false};
 manifest.trailers.push(result);
 console.log('CINEMATIC V9 REVIEW ONLY '+JSON.stringify({slug,seconds:result.duration,kind:result.kind,bytes,captionsUsed,shots:n}));
}

try{
  // V9 is a targeted fresh rerecord of TWO updated cat games.
  // The other five V7 trailers are retained byte-for-byte.
  const old=JSON.parse(fs.readFileSync('public/promo/v7-review.json','utf8'));
  const active=['cat-bond','pawsibly-innocent'];
  if(Object.keys(proofs).length!==2||active.some(slug=>!proofs[slug]))
    throw Error('V9 must capture exactly Cat Bond and Pawsibly Innocent');
  for(const slug of active)edit(slug);
  for(const slug of ['tiny-town','elsewhere','flip-dash','parcel-panic','pocket-aquarium']){
    const retained=old.trailers?.find(t=>t.slug===slug);
    if(!retained?.video||!retained?.poster||!fs.existsSync('public'+retained.video)||
       !fs.existsSync('public'+retained.poster))
      throw Error('Missing previous V7 trailer for untouched game '+slug);
    manifest.trailers.push({...retained,approved:false,published:false,retainedFrom:'V7'});
  }
  if(manifest.trailers.length!==7||manifest.trailers.some(t=>t.paused))throw Error('Invalid V9 review roster');
  const oldAudit=JSON.parse(fs.readFileSync('public/promo/readability-audit.json','utf8'));
  readingAudit.scenes.push(...(oldAudit.scenes||[]).filter(x=>!active.includes(x.game)));
  if(readingAudit.scenes.some(x=>!x.passed))throw Error('Previous reading audit has failures');
  fs.writeFileSync('public/promo/v9-review.json',JSON.stringify(manifest,null,2)+'\n');
  fs.writeFileSync('public/promo/readability-audit-v9.json',JSON.stringify(readingAudit,null,2)+'\n');
  console.log('V9 TARGETED TWO-GAME TRAILERS READY FOR OWNER REVIEW, NOT PUBLISHED');
}finally{fs.rmSync(work,{recursive:true,force:true})}
