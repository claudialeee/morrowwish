// Pawsibly Innocent V11: suspense, not a solution walkthrough.
// Recut recent V9 verified live-gameplay footage; no synthetic victories, no social posting.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const slug='pawsibly-innocent';
const base='public/promo/'+slug;
const prior=JSON.parse(fs.readFileSync('public/promo/v10-review.json','utf8'));
const previous=JSON.parse(fs.readFileSync('public/promo/v9-review.json','utf8'));
const original=previous.trailers.find(t=>t.slug===slug);
if(!original || !original.video.includes('/trailer-v9-') || !Array.isArray(original.shots))
 throw Error('Expected verified V9 authentic game recording');
const input='public'+original.video;
if(!fs.existsSync(input) || fs.statSync(input).size<200000)throw Error('V9 source video unavailable');
const scenes=new Map();let position=0;
for(const sh of original.shots){
 if(sh.scene){if(scenes.has(sh.scene))throw Error('Duplicate source scene '+sh.scene);scenes.set(sh.scene,{offset:position,length:sh.seconds});}
 position+=sh.seconds;
}
const required=['escape-attempt','narrow-pursuit','narrow-achievement','room-kitchen','room-library','room-garden','caught-attempt'];
for(const name of required)if(!scenes.has(name))throw Error('Missing original real gameplay '+name);
const finalCatch=scenes.get('caught-attempt');
if(original.shots.at(-1)?.source!=='cover')throw Error('Unexpected V9 scene structure');

// Clips deliberately jump between different moments and maps, never showing
// a continuous start-to-finish route. End on a genuine caught state, not an ad card.
const plan=[
 {scene:'narrow-pursuit',source:'narrow-pursuit',relative:.10,seconds:2.35},
 {scene:'narrow-achievement',source:'narrow-achievement',relative:0,seconds:3.35},
 {scene:'fish-tease',source:'escape-attempt',relative:8.30,seconds:1.35},
 {scene:'room-kitchen',source:'room-kitchen',relative:.22,seconds:1.45},
 {scene:'room-library',source:'room-library',relative:.30,seconds:1.45},
 {scene:'room-garden',source:'room-garden',relative:.25,seconds:1.35},
 {scene:'caught-attempt',source:'caught-attempt',relative:finalCatch.length-2.93,seconds:2.72}
];
if(plan[0].scene!=='narrow-pursuit'||plan[1].scene!=='narrow-achievement'||
   plan.at(-1).scene!=='caught-attempt'||plan.some(x=>x.source==='cover'))
 throw Error('Suspense ordering must begin with a narrow escape and end with a catch');
const spans=plan.map(sh=>{
 const clip=scenes.get(sh.source);
 if(!clip || sh.relative<0 || sh.relative+sh.seconds>clip.length+.001)
  throw Error('Invalid source span for '+sh.scene);
 return {...sh,start:clip.offset+sh.relative};
});
const total=plan.reduce((sum,x)=>sum+x.seconds,0);
if(total<13||total>16||plan.filter(x=>x.source==='escape-attempt').reduce((n,x)=>n+x.seconds,0)>1.5)
 throw Error('Spoiler protection or short-form pace invalid');
const output=base+'/trailer-v11-20261121.mp4';
const poster=base+'/trailer-v11-20261121.jpg';
const fmt=n=>n.toFixed(3);
const filters=spans.map((s,i)=>`[0:v]trim=start=${fmt(s.start)}:duration=${fmt(s.seconds)},setpts=PTS-STARTPTS,fps=30,setsar=1,format=yuv420p[v${i}]`);
filters.push(spans.map((_,i)=>`[v${i}]`).join('')+`concat=n=${spans.length}:v=1:a=0,format=yuv420p[vout]`);
const cmd=['-nostdin','-y','-hide_banner','-loglevel','error','-i',input,
 '-filter_complex',filters.join(';'),'-map','[vout]','-map','0:a:0','-t',fmt(total),
 '-r','30','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',
 '-c:a','aac','-b:a','144k','-af',`afade=t=in:st=0:d=0.15,afade=t=out:st=${fmt(total-.22)}:d=0.22`,
 '-movflags','+faststart',output];
execFileSync('ffmpeg',cmd,{stdio:'inherit',timeout:240000});
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type,width,height','-of','json',output],{encoding:'utf8'}));
const duration=+probe.format.duration;
if(Math.abs(duration-total)>.25 || !probe.streams.some(s=>s.codec_type==='video'&&s.width===1080&&s.height===1920) ||
 !probe.streams.some(s=>s.codec_type==='audio')||fs.statSync(output).size<220000)
 throw Error('Video export format failed QA '+JSON.stringify({duration,streams:probe.streams}));
const jpg=(seconds,target)=>{
 execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss',fmt(seconds),'-i',output,'-frames:v','1','-q:v','3',target],{timeout:20000});
 if(fs.statSync(target).size<11000)throw Error('Unusable review frame '+target);
};
jpg(.85,poster);
const review=[];
for(const [index,second] of [.85,total*.52,total-.48].entries()){
 const target=base+'/v11-review-'+(index+1)+'.jpg';jpg(second,target);review.push('/promo/'+slug+'/v11-review-'+(index+1)+'.jpg');
}
const trailer={slug,kind:'suspense-cliffhanger-teaser',video:'/promo/'+slug+'/trailer-v11-20261121.mp4',
 poster:'/promo/'+slug+'/trailer-v11-20261121.jpg',review,duration:+duration.toFixed(1),
 shots:spans.map(s=>({source:'v9-authentic-gameplay-cut',scene:s.scene,seconds:s.seconds,caption:''})),
 sourceClips:'Verified V9 gameplay; real narrow-escape badge and real caught result, noncontiguous anti-spoiler edits',
 transitions:'Hard cuts across separate attempts and rooms; no winning route, no end card after the catch',
 aspect:'1080x1920 portrait',approved:false,published:false};
const retained=prior.trailers.map(t=>t.slug===slug?trailer:{...t,approved:false,published:false,retainedFrom:t.retainedFrom||'V10'});
if(retained.length!==7||retained.filter(t=>t.slug===slug).length!==1)
 throw Error('Seven-game review must remain intact');
const manifest={...prior,version:'V11',createdAt:new Date().toISOString(),approval:'NOT APPROVED — REVIEW ONLY',
 socialAutopublish:false,readabilityChecked:true,trailers:retained};
const prevAudit=JSON.parse(fs.readFileSync('public/promo/readability-audit-v10.json','utf8'));
const audit={...prevAudit,version:'readability-review-v11',createdAt:manifest.createdAt,
 method:'Short noncontiguous mystery edit: authentic narrow-escape reward held 3.35s; 1.35s max successful-route fragment; final failure only',
 scenes:[...(prevAudit.scenes||[]).filter(s=>s.game!==slug),
 ...spans.map(s=>({game:slug,scene:s.scene,seconds:s.seconds,
  requiredSeconds:s.scene==='narrow-achievement'?3.2:s.scene==='caught-attempt'?2.6:0.9,
  passed:s.seconds+0.03>=(s.scene==='narrow-achievement'?3.2:s.scene==='caught-attempt'?2.6:0.9)}))]};
if(audit.scenes.some(s=>!s.passed))throw Error('V11 reading audit failed');
fs.writeFileSync('public/promo/v11-review.json',JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync('public/promo/readability-audit-v11.json',JSON.stringify(audit,null,2)+'\n');
console.log('V11 CLIFFHANGER REVIEW ONLY '+JSON.stringify({video:trailer.video,duration,shots:trailer.shots}));
