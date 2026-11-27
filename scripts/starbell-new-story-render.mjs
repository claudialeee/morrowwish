import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const out='artifacts/starbell-story-trailer',assets='public/cat-bond/assets',portrait=assets+'/mobile-portrait';
const proof=JSON.parse(fs.readFileSync(out+'/capture-evidence.json','utf8'));
for(const id of ['chase','glide','battle'])if(!proof.clips.some(x=>x.id===id))throw Error('Fresh capture required: '+id);
const ff=args=>execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});
const font='/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc';
const sans='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';
for(const p of [font,sans])if(!fs.existsSync(p))throw Error('Missing font '+p);
const fps=30,W=1080,H=1920;
// All paintings are the new native portrait game assets from the checked-out
// current Starbell art integration. No previous promotional video is an input.
const shots=[
 {id:'hook',d:4,src:portrait+'/windchime-town-tall.webp',en:'“Hardly anyone knows\nthat old tune.”',zh:'“老曲子没几只猫会唱。”'},
 {id:'wake',d:3,src:portrait+'/prologue-garden.webp',en:'“But I’ve never learned it.”',zh:'“我可没学过呀。”'},
 {id:'journey',d:3,src:portrait+'/rootsleep-forest.webp',en:'You thought this was\na brand-new journey.',zh:'你以为，这是一段全新的旅程。'},
 {id:'wonder',d:3,src:portrait+'/skyspine-isles.webp'},
 {id:'glide',d:4,game:true},
 {id:'friends',d:4,src:portrait+'/story-cloud-tea.webp'},
 {id:'chase',d:3,game:true},
 {id:'battle',d:4,game:true},
 {id:'duo',d:3,src:portrait+'/duo/dark-light-tier-3.webp'},
 {id:'secret',d:5,src:assets+'/canon22-final-art/garden-route-map.webp',map:true,en:'But the story began\nlong before you woke up.',zh:'却不知道，故事早在你醒来之前\n就已经开始。'},
 {id:'end',d:4,src:portrait+'/title-bell-sanctuary.webp',title:true}
];
const total=shots.reduce((a,s)=>a+s.d,0);
const enc=['-an','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-r','30','-threads','4'];
// Native vertical composition, gentle camera movement, no old blurred panels.
for(const s of shots){
 const file=out+'/'+s.id+'-clean.mp4';
 if(s.game){
  ff(['-f','concat','-safe','0','-i',out+'/'+s.id+'/frames.txt','-t',String(s.d),'-vf','fps=30,scale=1080:1920:force_original_aspect_ratio=decrease:flags=lanczos,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x14252d,setsar=1,tpad=stop_mode=clone:stop_duration=1,format=yuv420p',...enc,file]);
 }else{
  if(!fs.existsSync(s.src))throw Error('Missing new artwork: '+s.src);
  const n=s.d*fps;
  const filter=s.map?
   "scale=1600:1600:force_original_aspect_ratio=decrease:flags=lanczos,pad=1600:2844:(ow-iw)/2:(oh-ih)/2:color=0x182a32,zoompan=z='1.0+0.035*on/"+n+"':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d="+n+":s=1080x1920:fps=30,setsar=1":
   "scale=1440:2560:force_original_aspect_ratio=increase:flags=lanczos,crop=1440:2560,zoompan=z='1.015+0.055*on/"+n+"':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d="+n+":s=1080x1920:fps=30,setsar=1";
  ff(['-i',s.src,'-vf',filter,'-t',String(s.d),...enc,file]);
 }
}
fs.writeFileSync(out+'/timeline.txt',shots.map(s=>"file '"+s.id+"-clean.mp4'").join('\n')+'\n');
const clean=out+'/clean.mp4';
ff(['-f','concat','-safe','0','-i',out+'/timeline.txt','-c:v','copy',clean]);
const cue=(lang,name,text)=>{const p=out+'/'+lang+'-'+name+'.txt';fs.writeFileSync(p,text);return p;};
const draw=(txt,fontPath,size,y,st,et,color='0xfff6df')=>"drawtext=fontfile="+fontPath+":textfile="+txt+":fontsize="+size+":fontcolor="+color+":x=(w-tw)/2:y="+y+":line_spacing=20:shadowcolor=0x07151d@0.9:shadowx=2:shadowy=4:enable='between(t,"+st+","+et+")'";
for(const lang of ['en','zh']){
 let pos=0;const filters=[];
 for(const s of shots){
  if(s[lang]){
   const txt=cue(lang,s.id,s[lang]);
   filters.push(draw(txt,font,lang==='zh'?50:55,s.map?1380:1465,pos+.16,pos+s.d-.12));
  }
  if(s.title){
   const lines=lang==='en'?[['ECHOES OF THE',43,365],['STARBELL',100,440],['A story-rich fantasy RPG',37,1410],['PLAY THE FREE DEMO',44,1510],['morrowwish.vercel.app',30,1600]]:[['星铃回响',100,405],['ECHOES OF THE STARBELL',37,550],['一场值得亲自经历的奇幻冒险',42,1410],['免费试玩现已开放',45,1510],['morrowwish.vercel.app',30,1600]];
   for(let i=0;i<lines.length;i++){const [t,size,y]=lines[i];filters.push(draw(cue(lang,'title'+i,t),i<2?font:sans,size,y,pos+.10,total-.06));}
  }
  pos+=s.d;
 }
 const video=out+'/Echoes-of-the-Starbell-Story-Trailer-'+lang.toUpperCase()+'.mp4';
 ff(['-i',clean,'-i',out+'/bell-cues.wav','-stream_loop','-1','-i',assets+'/audio/sky.mp3','-t',String(total),'-filter_complex',
 "[0:v]"+filters.join(',')+",format=yuv420p[v];[2:a]atrim=duration="+total+",afade=t=in:st=0:d=0.5,volume='if(between(t,31,35),0.22,0.72)':eval=frame,afade=t=out:st="+(total-1.5)+":d=1.5[m];[m][1:a]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.9,loudnorm=I=-16:TP=-1.5:LRA=11[a]",
 '-map','[v]','-map','[a]','-c:v','libx264','-preset','veryfast','-crf','18','-threads','4','-c:a','aac','-b:a','192k','-movflags','+faststart',video]);
 const info=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',video],{encoding:'utf8'}));
 const v=info.streams.find(s=>s.codec_type==='video'),a=info.streams.find(s=>s.codec_type==='audio');
 if(v.width!==1080||v.height!==1920||!a||Math.abs(Number(info.format.duration)-total)>.5)throw Error('Delivery format invalid '+lang);
 ff(['-i',video,'-vf','fps=1/3,scale=270:480,tile=5x3','-frames:v','1',out+'/contact-'+lang+'.jpg']);
 ff(['-i',video,'-f','null','-']);
 fs.writeFileSync(out+'/proof-'+lang+'.json',JSON.stringify({capture:proof,shots,video:info.format,source:process.env.GITHUB_SHA,technicalValidation:'1080x1920, audio stream, complete decode',visualReview:'Contact sheets available; human visual and listening review not asserted.'},null,2));
 console.log('RENDERED NEW STORY TRAILER',lang,total,video);
}
