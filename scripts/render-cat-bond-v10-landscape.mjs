// 16:9 recreation of the exact published V12/V10 portrait review timeline.
// All 21 shots use the same source labels, lengths, captions, and real live game events.
// In particular the original 3.1-second Blossomfire Pawdance move MUST be
// followed by the same fight's aftermath and earned capture, without another cast.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {promoTrack} from './promo-audio.mjs';

const dir=process.env.MW_V7_BROLL_DIR||path.join(process.env.RUNNER_TEMP||os.tmpdir(),'morrowwish-v10-landscape-broll');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mw-v10-wide-edit-'));
const font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const base='public/promo/cat-bond';
const output=base+'/trailer-v10-landscape-20261122.mp4';
const poster=base+'/trailer-v10-landscape-20261122.jpg';
const metadata=base+'/trailer-v10-landscape-20261122.json';
const fmt=n=>Math.max(0,n).toFixed(3);
function probe(file){
 const d=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_type,width,height','-of','json',file],{encoding:'utf8'}));
 return{duration:Number(d.format.duration),bytes:Number(d.format.size),streams:d.streams||[]};
}
try{
 const original=JSON.parse(fs.readFileSync('public/promo/v12-review.json','utf8')).trailers.find(x=>x.slug==='cat-bond');
 if(!original||original.video!=='/promo/cat-bond/trailer-v10-20261121.mp4'||
   original.shots?.length!==21||original.duration!==59.6)throw Error('Exact reference V12/V10 film has changed: stop, do not substitute');
 const broll=JSON.parse(fs.readFileSync(path.join(dir,'broll-manifest.json'),'utf8')).broll.find(x=>x.slug==='cat-bond');
 if(!broll||broll.errors?.length||!fs.existsSync(broll.file))throw Error('Missing native horizontal re-record of ORIGINAL 21 shots');
 const raw=probe(broll.file);
 if(!raw.streams.some(s=>s.codec_type==='video'&&s.width===1280&&s.height===720))
  throw Error('Source not native widescreen 1280x720: '+JSON.stringify(raw));
 const required=original.shots.filter(x=>x.source==='broll').map(x=>x.scene);
 if(new Set(required).size!==20||broll.shots.filter(x=>required.includes(x.label)).length!==20)
  throw Error('Missing or duplicate reference shots in native 16:9 recording');
 const duo=original.shots.filter(x=>x.scene==='duo');
 if(duo.length!==1||duo[0].seconds!==3.1)throw Error('Not the single exact 3.1-second source duet');
 const events=['rare-encounter','battle-hud','battle-skills','duo','rare-aftermath','rare-capture'];
 if(events.some((s,i)=>required.indexOf(s)===-1||(i&&required.indexOf(s)<=required.indexOf(events[i-1]))))
  throw Error('Rare cat real-fight narrative out of original order');
 fs.mkdirSync(base,{recursive:true});
 const cover=path.join(root,'end-card.png');
 // A native wide typeset outro (same title/studio/CTA as source portrait).
 // The 16:9 shape is deliberate: no portrait matte or side borders.
 const color=execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi',
  '-i','color=c=0x241A37:s=1920x1080:r=30','-frames:v','1',cover],{timeout:30000});
 const audio=promoTrack('cat-bond');
 const args=['-nostdin','-y','-hide_banner','-loglevel','error',
  '-i',broll.file,'-loop','1','-framerate','30','-i',cover,
  '-stream_loop','-1','-i',audio];
 const filters=[],shotData=[];
 let time=0;
 for(let i=0;i<original.shots.length;i++){
  const s=original.shots[i],isOutro=s.source==='cover';
  let input=isOutro?'1:v':'0:v',dur=s.seconds;
  let start=0,actual=null;
  if(!isOutro){
   actual=broll.shots.find(x=>x.label===s.scene);
   if(!actual||actual.duration+.075<dur||actual.start+dur>raw.duration+.02)
    throw Error('True source shot unavailable: '+JSON.stringify({scene:s.scene,want:dur,recorded:actual,raw}));
   start=actual.start;
  }
  let vf='['+input+']'+(isOutro?
    'trim=duration='+fmt(dur)+',setpts=PTS-STARTPTS,':
    'trim=start='+fmt(start)+':duration='+fmt(dur)+',setpts=PTS-STARTPTS,')+
    'fps=30,scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p';
  if(isOutro){
   const labelFile=path.join(root,'outro-'+i+'.txt');
   const lines=[
    ['MORROW WISH',46,230,'0xE7BDA3'],
    ['CAT BOND',104,395,'white'],
    ['PLAY FREE',70,670,'white'],
    ['LINK IN DESCRIPTION',40,790,'0xE7BDA3']
   ];
   vf+=',drawbox=x=620:y=345:w=680:h=5:color=0xE7BDA3:t=fill';
   for(let n=0;n<lines.length;n++){
    const [txt,size,y,color]=lines[n],fn=path.join(root,'end-'+n+'.txt');
    fs.writeFileSync(fn,txt);
    vf+=',drawtext=fontfile='+font+':textfile='+fn+':fontcolor='+color+':fontsize='+size+
      ':x=(w-text_w)/2:y='+y;
   }
  }else if(s.caption){
   const txt=path.join(root,'caption-'+i+'.txt');
   fs.writeFileSync(txt,s.caption);
   const y=['rare-encounter','battle-hud','battle-skills','duo','rare-capture'].includes(s.scene)?885:945;
   vf+=',drawtext=fontfile='+font+':textfile='+txt+
     ':fontcolor=white:fontsize=50:x=(w-text_w)/2:y='+y+
     ':shadowcolor=black@0.85:shadowx=2:shadowy=3:box=1:boxcolor=black@0.42:boxborderw=13';
  }
  filters.push(vf+',settb=AVTB[v'+i+']');
  shotData.push({scene:s.scene||'end-card',source:s.source,caption:s.caption,seconds:dur,startAt:Number(time.toFixed(3)),recordingAt:isOutro?null:start});
  time+=dur;
 }
 const concat=original.shots.map((_,i)=>'[v'+i+']').join('')+
  'concat=n='+original.shots.length+':v=1:a=0,format=yuv420p[vout]';
 const cmd=[...args,'-filter_complex',filters.join(';')+';'+concat,
  '-map','[vout]','-map','2:a:0','-t',fmt(time),'-r','30',
  '-c:v','libx264','-preset','veryfast','-crf','22','-pix_fmt','yuv420p',
  '-c:a','aac','-b:a','144k','-af','volume=0.34,afade=t=in:st=0:d=0.3,afade=t=out:st='+fmt(time-.7)+':d=0.7',
  '-movflags','+faststart',output];
 execFileSync('ffmpeg',cmd,{stdio:'inherit',timeout:360000});
 const result=probe(output);
 if(result.duration<59.3||result.duration>59.8||
  !result.streams.some(x=>x.codec_type==='video'&&x.width===1920&&x.height===1080)||
  !result.streams.some(x=>x.codec_type==='audio')||result.bytes<400000)
    throw Error('Finished identical 16:9 source edit is malformed: '+JSON.stringify(result));
 execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss','2',
  '-i',output,'-frames:v','1','-q:v','3',poster],{timeout:30000});
 const frames=[];
 for(const [label,idx] of [['opening',0],['quarrel',5],['duo',16],['capture',18],['end',20]]){
  const sh=shotData[idx],mid=Math.min(result.duration-.25,sh.startAt+Math.min(1.4,sh.seconds*.5));
  const out=base+'/v10-landscape-'+label+'-proof.jpg';
  execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss',fmt(mid),'-i',output,
    '-frames:v','1','-q:v','3',out],{timeout:30000});
  if(fs.statSync(out).size<7000)throw Error('Invalid scene frame '+label);
  frames.push('/promo/cat-bond/'+path.basename(out));
 }
 const m={kind:'cat-bond-landscape-source-matched',sourceReview:'V12',sourceVideo:original.video,
  title:'Cat Bond',aspect:'16:9',width:1920,height:1080,
  duration:result.duration,bytes:result.bytes,
  identicalSourceShotCount:original.shots.length,shots:shotData,frames,
  proof:'Fresh native horizontal capture following original V10 actual game actions, one cinematic Blossomfire Pawdance, same battle capture',
  sourceRuntime:broll.file,readyForCreativeReview:true,youtubePublished:false,
  video:'/promo/cat-bond/'+path.basename(output),poster:'/promo/cat-bond/'+path.basename(poster),
  createdAt:new Date().toISOString()};
 fs.writeFileSync(metadata,JSON.stringify(m,null,2)+'\n');
 console.log('EXACT 21 SCENE LANDSCAPE V10 QA PASS',JSON.stringify({duration:result.duration,bytes:result.bytes,frames,source:original.video}));
}finally{fs.rmSync(root,{recursive:true,force:true})}
