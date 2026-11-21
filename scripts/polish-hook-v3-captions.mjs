// Polish the editorial captions of authentic game videos; keep real footage and unique soundtracks.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
const font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const specs={
 'flip-dash':{color:'0x291f48',lines:[[0,1.7,'ONE WRONG FLIP.'],[1.7,5.1,'JUST ONE BUTTON.'],[5.1,7.1,'BEAT MY RUN?']]},
 'parcel-panic':{color:'0x291f48',lines:[[0,1.6,'ONE WRONG LANE.'],[1.6,4.7,'KEEP THE STREAK.'],[4.7,6.7,'BEAT MY SCORE?']]},
 'pocket-aquarium':{color:'0x064e58',lines:[[0,2.3,'GRADE B. NOT S.'],[2.3,5.6,'MATCH THE FOOD.'],[5.6,7.5,'KEEP THE COMBO.'],[7.5,9.5,'CAN YOU GET AN S?']]},
 'elsewhere':{color:'0x334c68',lines:[[0,3.6,'A NEW LOVE IN PARIS.'],[3.6,6.1,'I WOKE UP IN PARIS.'],[6.1,8,'ONE DECISION.'],[8,10,'A DIFFERENT FUTURE.'],[10,13.2,'WOULD YOU CHOOSE THIS LIFE?']]}
};
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mw-caption-polish-'));
try{
 for(const [slug,spec] of Object.entries(specs)){
  const folder=path.join('public','promo',slug),file=path.join(folder,'hook-v3-20261121.mp4');
  if(!fs.existsSync(file))throw Error('Missing verified real game video '+file);
  const output=path.join(tmp,slug+'.mp4');
  const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file],{encoding:'utf8'}).trim());
  if(!Number.isFinite(duration)||duration<spec.lines.at(-1)[1]-.5)throw Error('Unexpected video duration '+slug+' '+duration);
  const parts=['drawbox=x=0:y=106:w=iw:h=155:color='+spec.color+'@0.97:t=fill'];
  for(let i=0;i<spec.lines.length;i++){
   const [start,end,txt]=spec.lines[i],name=path.join(tmp,slug+'-'+i+'.txt');
   fs.writeFileSync(name,txt);
   parts.push('drawtext=fontfile='+font+':textfile='+name+':fontcolor=white:fontsize=49:x=(w-text_w)/2:y=149'+":enable='between(t,"+start+','+end+")'");
  }
  execFileSync('ffmpeg',['-nostdin','-y','-hide_banner','-loglevel','error','-i',file,
   '-vf',parts.join(','),'-map','0:v:0','-map','0:a:0','-c:v','libx264','-crf','19','-preset','veryfast',
   '-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',output],{timeout:180000,stdio:'inherit'});
  const streams=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-of','json',output],{encoding:'utf8'})).streams;
  if(!streams.some(s=>s.codec_type==='video'&&s.width===1080&&s.height===1920)||
     !streams.some(s=>s.codec_type==='audio'))throw Error('Invalid edited video '+slug);
  fs.copyFileSync(output,file);
  for(const [n,second] of [0.8,duration*.47,duration-1].entries()){
   const shot=path.join(folder,'hook-v3-review-'+(n+1)+'.jpg');
   execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss',second.toFixed(3),'-i',file,'-frames:v','1','-q:v','3',shot],{timeout:40000,stdio:'inherit'});
   if(fs.statSync(shot).size<13000)throw Error('Review JPEG invalid '+shot);
  }
  execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss','0.8','-i',file,'-frames:v','1','-q:v','3',path.join(folder,'hook-v3-20261121.jpg')],{timeout:40000});
  console.log('CAPTION POLISH PASSED '+JSON.stringify({slug,seconds:duration,bytes:fs.statSync(file).size,frames:3}));
 }
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
