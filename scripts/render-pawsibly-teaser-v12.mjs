// A single-room 9:16 story: clear fish theft -> genuine narrow escape ->
// same-room final attempt -> REAL in-game failure results. No solutions,
// teleporting through a tour of rooms, or synthetic game-over card.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const slug='pawsibly-innocent',base='public/promo/'+slug;
const captureDir=process.env.MW_PAWSIBLY_V12_DIR||path.join(process.env.RUNNER_TEMP||os.tmpdir(),'morrowwish-pawsibly-v12');
const live=JSON.parse(fs.readFileSync(path.join(captureDir,'manifest.json'),'utf8'));
if(!live.noCheats||!live.noArtificialResult||live.proof?.done!==true||
 live.proof?.winning!==false||live.proof?.lives!==0||
 live.proof?.room!=='The Sunny Lounge'||
 !/Caught red-pawed/i.test(live.proof?.result||'')||
 !fs.existsSync('public/promo/pawsibly-innocent/v12-real-failure-result-proof.png'))
 throw Error('Real single-room full game-over result not captured');
const reviewV9=JSON.parse(fs.readFileSync('public/promo/v9-review.json','utf8'));
const old=reviewV9.trailers.find(t=>t.slug===slug);
const src=old&&'public'+old.video;
if(!old||!fs.existsSync(src)||!fs.existsSync(live.file))throw Error('Required genuine video missing');
let cumulative=0;const v9=new Map();
for(const shot of old.shots){
 if(shot.scene)v9.set(shot.scene,{start:cumulative,length:shot.seconds});
 cumulative+=shot.seconds;
}
const native=new Map(live.shots.map(s=>[s.label,s]));
const sequence=[
 {scene:'first-fish',clip:'new',label:'intro-fish',duration:2.32},
 {scene:'narrow-pursuit',clip:'v9',label:'narrow-pursuit',duration:2.3},
 {scene:'narrow-achievement',clip:'v9',label:'narrow-achievement',duration:3.32},
 {scene:'last-chase',clip:'new',label:'last-chase',duration:2.8},
 {scene:'failure-result',clip:'new',label:'real-failure-result',duration:2.90}
];
const ordered=sequence.map(s=>{
 const ref=s.clip==='v9'?v9.get(s.label):native.get(s.label);
 if(!ref)throw Error('Real source missing '+s.label);
 const length=s.clip==='v9'?ref.length:ref.duration;
 if(length<s.duration-.02)throw Error('Not enough real gameplay for '+s.label+': '+length);
 return {...s,start:(s.clip==='v9'?ref.start:ref.start)+Math.max(0,length-s.duration)};
});
if(ordered.some(s=>/room-(kitchen|library|garden)/.test(s.scene))||
 ordered.at(-1)?.scene!=='failure-result'||
 ordered.find(s=>s.scene==='narrow-achievement')?.duration<3.2)
 throw Error('V12 narrative or native-result protection failed');
const total=ordered.reduce((n,s)=>n+s.duration,0);
if(total<12||total>18)throw Error('V12 short form duration invalid: '+total);
const fmt=n=>n.toFixed(3);
const filters=ordered.map((s,i)=>{
 const from=s.clip==='v9'?0:1;
 let chain='['+from+':v]trim=start='+fmt(s.start)+':duration='+fmt(s.duration)+
  ',setpts=PTS-STARTPTS,fps=30,scale=1080:1920:flags=lanczos,setsar=1,format=yuv420p';
 // Narration is limited to beginning & new attempt; do not cover native badge or result.
 if(s.scene==='first-fish'){
   const a=path.join(captureDir,'hook-1.txt'),b=path.join(captureDir,'hook-2.txt');
   fs.writeFileSync(a,'STEAL THREE FISH.');fs.writeFileSync(b,'DON\'T GET CAUGHT.');
   chain+=',drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:textfile='+a+
    ':fontcolor=white:fontsize=52:x=(w-text_w)/2:y=205:shadowcolor=black@0.8:shadowx=3:shadowy=3:box=1:boxcolor=black@0.50:boxborderw=14';
   chain+=',drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:textfile='+b+
    ':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=285:shadowcolor=black@0.8:shadowx=3:shadowy=3:box=1:boxcolor=black@0.45:boxborderw=12';
 }
 if(s.scene==='last-chase'){
   const file=path.join(captureDir,'twist.txt');fs.writeFileSync(file,'NOT SO LUCKY THIS TIME...');
   chain+=',drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:textfile='+file+
    ':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=205:shadowcolor=black@0.8:shadowx=3:shadowy=3:box=1:boxcolor=black@0.46:boxborderw=12';
 }
 return chain+'[v'+i+']';
});
filters.push(ordered.map((_,i)=>'[v'+i+']').join('')+
 'concat=n='+ordered.length+':v=1:a=0,format=yuv420p[vout]');
const output=base+'/trailer-v12-20261121.mp4';
const poster=base+'/trailer-v12-20261121.jpg';
execFileSync('ffmpeg',['-nostdin','-y','-hide_banner','-loglevel','error',
 '-i',src,'-i',live.file,'-filter_complex',filters.join(';'),
 '-map','[vout]','-map','0:a:0','-t',fmt(total),'-r','30',
 '-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p',
 '-c:a','aac','-b:a','144k','-af',
 'afade=t=in:st=0:d=0.15,afade=t=out:st='+fmt(total-.25)+':d=0.25',
 '-movflags','+faststart',output],{stdio:'inherit',timeout:300000});
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type,width,height','-of','json',output],{encoding:'utf8'}));
const duration=+probe.format.duration;
if(Math.abs(duration-total)>.22||!probe.streams.some(s=>s.codec_type==='video'&&s.width===1080&&s.height===1920)||
 !probe.streams.some(s=>s.codec_type==='audio')||fs.statSync(output).size<220000)
 throw Error('V12 export formatting failed '+JSON.stringify(probe));
const jpg=(at,file)=>{
 execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss',fmt(at),'-i',output,
 '-frames:v','1','-q:v','3',file],{timeout:20000});
 if(fs.statSync(file).size<10500)throw Error('Unreadable/blank QA screenshot '+file);
};
jpg(.78,poster);
const review=[];
for(const [i,sec] of [1.1,6.3,duration-.8].entries()){
 const file=base+'/v12-review-'+(i+1)+'.jpg';jpg(sec,file);
 review.push('/promo/'+slug+'/v12-review-'+(i+1)+'.jpg');
}
const trailer={slug,kind:'coherent-single-room-stealth-cliffhanger',
 video:'/promo/'+slug+'/trailer-v12-20261121.mp4',
 poster:'/promo/'+slug+'/trailer-v12-20261121.jpg',review,duration:+duration.toFixed(1),
 shots:ordered.map(s=>({source:s.clip==='new'?'fresh-real-gameplay':'verified-v9-gameplay',
 scene:s.scene,seconds:s.duration,caption:''})),
 sourceClips:'One real Sunny Lounge room, genuine collected fish and earned Narrow Escape badge; three real captures lead to native Caught red-pawed result modal',
 transitions:'Only same-room continuity with new-try narrative cue, no random map switches, no solution path, native final result',
 aspect:'1080x1920 portrait',approved:false,published:false};
const oldManifest=JSON.parse(fs.readFileSync('public/promo/v11-review.json','utf8'));
const trailers=oldManifest.trailers.map(t=>t.slug===slug?trailer:{...t,approved:false,published:false});
const manifest={...oldManifest,version:'V12',createdAt:new Date().toISOString(),
 approval:'NOT APPROVED — REVIEW ONLY',socialAutopublish:false,readabilityChecked:true,trailers};
const oldAudit=JSON.parse(fs.readFileSync('public/promo/readability-audit-v11.json','utf8'));
const audit={...oldAudit,version:'readability-review-v12',createdAt:manifest.createdAt,
 method:'Narrative continuity & real game settlement. One room; native 3.32s achievement; 2.9s real failure modal.',
 scenes:[...(oldAudit.scenes||[]).filter(x=>x.game!==slug),
 ...ordered.map(s=>({game:slug,scene:s.scene,seconds:s.duration,
 requiredSeconds:s.scene==='narrow-achievement'?3.2:s.scene==='failure-result'?2.8:1.8,
 passed:s.duration+.04>=(s.scene==='narrow-achievement'?3.2:s.scene==='failure-result'?2.8:1.8)}))]};
if(audit.scenes.some(s=>!s.passed))throw Error('Readability audit failed');
fs.writeFileSync('public/promo/v12-review.json',JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync('public/promo/readability-audit-v12.json',JSON.stringify(audit,null,2)+'\n');
console.log('V12 ONE-ROOM PROMO REVIEW ONLY '+JSON.stringify({duration,video:trailer.video,scenes:trailer.shots}));
