import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root='artifacts/starbell-trailer',assets='public/cat-bond/assets';
const proof=JSON.parse(fs.readFileSync(root+'/capture-evidence.json','utf8'));
const clips=new Set(proof.clips.map(x=>x.id));
const font='/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf',sans='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const esc=s=>s.replaceAll(':','\\:').replaceAll("'","’");
function ff(args){execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});}
const seq=[];
const card=(id,source,sec,heading,sub='',title=false)=>{
 const out=root+'/'+id+'.mp4';const n=sec*30;
 // Keep the entire original painting in a framed composition, with a soft
 // enlarged background derived from the same image; never crop off the cats.
 const fg="scale=1000:1180:force_original_aspect_ratio=decrease:flags=lanczos,setsar=1";
 const bg="scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=38,eq=brightness=-0.15:saturation=0.87";
 const label=title?'ECHOES OF THE':'MORROW WISH  /  A NEW ADVENTURE';
 const f="[0:v]split=2[back][front];[back]"+bg+"[bg];[front]"+fg+"[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,drawbox=x=0:y=0:w=iw:h=260:color=0x182b2b@0.45:t=fill,drawbox=x=0:y=1450:w=iw:h=470:color=0x182b2b@0.70:t=fill,drawtext=fontfile="+sans+":text='"+esc(label)+"':fontsize="+(title?42:23)+":fontcolor=0xf8dcab:x=(w-tw)/2:y=184,drawtext=fontfile="+font+":text='"+esc(heading)+"':fontsize="+(title?94:48)+":fontcolor=0xfff4db:x=(w-tw)/2:y="+(title?284:1525)+":shadowcolor=black@0.5:shadowx=2:shadowy=3,drawtext=fontfile="+sans+":text='"+esc(sub)+"':fontsize=31:fontcolor=0xffe7bb:x=(w-tw)/2:y="+(title?1560:1608)+",drawbox=x=420:y="+(title?1640:1700)+":w=240:h=3:color=0xf5cc83:t=fill,zoompan=z='1+0.035*on/"+n+"':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1080x1920:fps=30,fade=t=in:st=0:d=0.28,fade=t=out:st="+(sec-.28)+":d=0.28,format=yuv420p";
 ff(['-loop','1','-i',assets+'/'+source,'-t',String(sec),'-filter_complex_threads','2','-filter_complex',f,'-an','-c:v','libx264','-preset','fast','-crf','17','-movflags','+faststart',out]);seq.push(out);
};
const game=(id,sec,line)=>{
 const out=root+'/'+id+'.mp4';
 const f="fps=30,scale=1080:1920:force_original_aspect_ratio=decrease:flags=lanczos,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x172b2b,setsar=1,drawbox=x=100:y=175:w=880:h=95:color=0x182b2b@0.78:t=fill,drawtext=fontfile="+font+":text='"+esc(line)+"':fontsize=42:fontcolor=0xfff4db:x=(w-tw)/2:y=199,fade=t=in:st=0:d=0.18,fade=t=out:st="+(sec-.18)+":d=0.18,format=yuv420p";
 ff(['-f','concat','-safe','0','-i',root+'/'+id+'/frames.txt','-vf',f,'-t',String(sec),'-an','-c:v','libx264','-preset','fast','-crf','17',out]);seq.push(out);
};
card('opening','garden/title-bell-sanctuary.webp',4,'A forgotten melody.','A world waiting to be remembered.');
const ordered=['chase','glide','lantern','battle'].filter(x=>clips.has(x));
game(ordered[0],4,{chase:'Follow the runaway chime',glide:'Ride the wind',lantern:'Bring light to the city',battle:'Stand together'}[ordered[0]]);
card('companions','story-art/cloud-lookout.jpg',4,'Companions worth finding.','A little courage. A little magic.');
game(ordered[1],4,{chase:'Follow the runaway chime',glide:'Ride the wind',lantern:'Bring light to the city',battle:'Stand together'}[ordered[1]]);
if(ordered[2])game(ordered[2],4,{chase:'Follow the runaway chime',glide:'Ride the wind',lantern:'Bring light to the city',battle:'Stand together'}[ordered[2]]);
else card('forest','canon22-final-art/forest-root-bridge.webp',4,'Explore six magical regions.','');
if(ordered[3])game(ordered[3],4,{chase:'Follow the runaway chime',glide:'Ride the wind',lantern:'Bring light to the city',battle:'Stand together'}[ordered[3]]);
else card('mystery','core-art-remaster/leads/muling.webp',4,'What have you forgotten?','');
card('end','garden/title-bell-sanctuary.webp',6,'STARBELL','Free playable preview  ·  morrowwish.vercel.app',true);
fs.writeFileSync(root+'/timeline.txt',seq.map(s=>"file '"+path.basename(s)+"'").join('\n')+'\n');
const file=root+'/Echoes-of-the-Starbell-Teaser.mp4';
ff(['-f','concat','-safe','0','-i',root+'/timeline.txt','-i',assets+'/audio/atlas.mp3','-map','0:v:0','-map','1:a:0','-c:v','copy','-af','loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.5,afade=t=out:st=28:d=2','-c:a','aac','-b:a','192k','-t','30','-movflags','+faststart',file]);
const info=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
const v=info.streams.find(s=>s.codec_type==='video'),a=info.streams.find(s=>s.codec_type==='audio');if(v.width!==1080||v.height!==1920||!a||Number(info.format.duration)<29.5)throw Error('Final video contract failed');
ff(['-i',file,'-vf','fps=1/3,scale=270:480,tile=5x2','-frames:v','1',root+'/contact-sheet.jpg']);
execFileSync('ffmpeg',['-v','error','-i',file,'-f','null','-'],{stdio:'inherit'});
fs.writeFileSync(root+'/render-proof.json',JSON.stringify({source:proof,clips:ordered,output:info.format,video:{width:v.width,height:v.height,codec:v.codec_name},audio:a.codec_name,score:'Morrow Wish original atlas.mp3',limitations:['Developer chapter checkpoints are used only for filming; UI actions captured as they happen.','No external footage or invented visuals.','No claim of manual visual/audio review until review of final artifact.']},null,2));
console.log('TRAILER RENDERED',file);
