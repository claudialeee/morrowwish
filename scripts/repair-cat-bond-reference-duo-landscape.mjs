// Do NOT synthesize or re-perform the dual-cat finisher.
// Reuse the exact 3.1s + 1.2s original V12-referenced portrait video
// but reframe it to 16:9. All OTHER 55.27s are authentic native wide
// game footage; the original source action is never reanimated.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
const src='public/promo/cat-bond/trailer-v10-20261121.mp4';
const native='public/promo/cat-bond/trailer-v10-landscape-20261122.mp4';
const dir='public/promo/cat-bond';
const output=dir+'/trailer-v10-landscape-exact-duo-20261122.mp4';
const meta=dir+'/trailer-v10-landscape-exact-duo-20261122.json';
const poster=dir+'/trailer-v10-landscape-exact-duo-20261122.jpg';
const font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mw-v10-original-duo-'));
const times=[45.4,46.0,47.2,47.7,48.3];
function probe(file){
 return JSON.parse(execFileSync('ffprobe',['-v','error',
  '-show_entries','format=duration,size:stream=codec_type,width,height','-of','json',file],{encoding:'utf8'}));
}
try{
 const manifest=JSON.parse(fs.readFileSync('public/promo/v12-review.json','utf8'));
 const orig=manifest.trailers.find(t=>t.slug==='cat-bond');
 if(!orig||orig.video!=='/promo/cat-bond/trailer-v10-20261121.mp4'||orig.shots.length!==21)
  throw Error('Review page source changed: refuse alternate duo footage');
 const s=orig.shots;
 let start=0;
 for(let i=0;i<16;i++)start+=s[i].seconds;
 const cinematic=s[16],aftermath=s[17];
 if(cinematic.scene!=='duo'||cinematic.seconds!==3.1||
    aftermath.scene!=='rare-aftermath'||aftermath.seconds!==1.2||
    Math.abs(start-44.7)>.001)throw Error('Original approved-for-review cinematic reference changed');
 const cut=start+cinematic.seconds+aftermath.seconds;
 const p=probe(src),w=probe(native);
 if(p.streams.find(x=>x.codec_type==='video')?.width!==1080||
    p.streams.find(x=>x.codec_type==='video')?.height!==1920||
    w.streams.find(x=>x.codec_type==='video')?.width!==1920||
    w.streams.find(x=>x.codec_type==='video')?.height!==1080)
   throw Error('Wrong reference source or native horizontal master');
 const end=Number(w.format.duration);
 if(end<59.45||end>59.8||cut>=end)throw Error('Source footage duration mismatch');
 const label=path.join(tmp,'duo-title.txt'),name=path.join(tmp,'move-title.txt');
 fs.writeFileSync(label,'ONE POWERFUL DUO FINISHER!');
 fs.writeFileSync(name,'Blossomfire Pawdance');
 // The original 540x960 storyboard has the two cats move vertically during
 // the cut. This authentic camera tracks those poses and keeps both ears,
 // tails and paws within a full-width 16:9 movie. Never stretch pixels.
 // Portrait scene: source t=44.7..49.0 -> output t=44.7..49.0.
 const cropY='900-250*sin(PI*t/4.3)'; // preserve full paws at entrance and exit while tracking ears mid-move
 const filters=[
  '[0:v]trim=start=0:duration='+start.toFixed(3)+
   ',setpts=PTS-STARTPTS,fps=30,scale=1920:1080,setsar=1,format=yuv420p[before]',
  '[1:v]trim=start='+start.toFixed(3)+':duration=4.300'+
   ',setpts=PTS-STARTPTS,fps=30,crop=1080:608:0:'+cropY+
   ',scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p'+
   ',drawtext=fontfile='+font+':textfile='+label+
   ':fontsize=57:fontcolor=white:box=1:boxcolor=black@0.46:boxborderw=15:x=(w-text_w)/2:y=75'+
   ',drawtext=fontfile='+font+':textfile='+name+
   ':fontsize=51:fontcolor=white:shadowcolor=black@0.8:shadowx=2:shadowy=3:x=(w-text_w)/2:y=975[realDuo]',
  '[0:v]trim=start='+cut.toFixed(3)+':duration='+(end-cut).toFixed(3)+
   ',setpts=PTS-STARTPTS,fps=30,scale=1920:1080,setsar=1,format=yuv420p[after]',
  '[before][realDuo][after]concat=n=3:v=1:a=0[v]'
 ];
 execFileSync('ffmpeg',['-nostdin','-y','-hide_banner','-loglevel','error',
   '-i',native,'-i',src,'-filter_complex',filters.join(';'),
   '-map','[v]','-map','0:a:0','-r','30','-c:v','libx264','-crf','20',
   '-preset','veryfast','-pix_fmt','yuv420p','-c:a','aac','-b:a','144k',
   '-movflags','+faststart',output],{stdio:'inherit',timeout:240000});
 const result=probe(output),duration=Number(result.format.duration);
 if(duration<59.4||duration>59.8||
   result.streams.find(x=>x.codec_type==='video')?.width!==1920||
   result.streams.find(x=>x.codec_type==='video')?.height!==1080||
   !result.streams.find(x=>x.codec_type==='audio')||
   Number(result.format.size)<400000)
  throw Error('Final corrected cinematic invalid '+JSON.stringify(result));
 const proof=[];
 for(const t of times){
  const file=dir+'/v10-exact-duo-'+t.toFixed(1)+'s.jpg';
  execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss',t.toFixed(3),
   '-i',output,'-frames:v','1','-q:v','3',file],{stdio:'inherit',timeout:30000});
  if(fs.statSync(file).size<8000)throw Error('Bad corrected duo proof at '+t);
  proof.push('/promo/cat-bond/'+path.basename(file));
 }
 execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss','2',
  '-i',output,'-frames:v','1','-q:v','3',poster],{stdio:'inherit',timeout:30000});
 const m={
  kind:'original-V12-visual-animation-duo-widescreen',
  sourceReview:'/promo/latest-review.json',
  sourceVideo:orig.video,
  sourceDuo:{start,seconds:3.1,source:'actual original V12 portrait MP4 frames'},
  sourceAftermath:{start:start+3.1,seconds:1.2,source:'same reference battle'},
  otherGameFootage:'native 1920x1080 real gameplay',
  method:'Original source animated frames reframed to 16:9, no replacement or synthesized duo attack',
  stretch:false,sideBars:false,duoCount:1,seconds:duration,
  shots:s.length,proof,
  video:'/promo/cat-bond/'+path.basename(output),
  poster:'/promo/cat-bond/'+path.basename(poster),
  youtubePublished:false,createdAt:new Date().toISOString()
 };
 fs.writeFileSync(meta,JSON.stringify(m,null,2)+'\n');
 console.log('TRUE REFERENCE DUO CINEMATIC VERIFIED',JSON.stringify(m));
}finally{
 fs.rmSync(tmp,{recursive:true,force:true});
}
