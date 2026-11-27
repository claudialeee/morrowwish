import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
const out='artifacts/starbell-story-trailer',assets='public/cat-bond/assets',portrait=assets+'/mobile-portrait';
const proof=JSON.parse(fs.readFileSync(out+'/capture-evidence.json','utf8'));
const clips=new Map(proof.clips.map(x=>[x.id,x]));
for(const id of ['garden','chase','glide','battle'])if(!clips.has(id))throw Error('Missing live gameplay '+id);
const ff=args=>execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});
const shots=[
{id:'hook',d:3,src:assets+'/cinematics/prologue/garden-at-dawn.webp',pos:'70% center',caption:'You thought this was\na new journey.',motion:true},
{id:'garden',d:2,game:'garden',caption:'A world you’ve never seen.'},
{id:'sky',d:2,src:portrait+'/skyspine-isles.webp',caption:'A world you’ve never seen.',motion:true},
{id:'melody',d:4,game:clips.has('melody')?'melody':null,src:portrait+'/windchime-town-tall.webp',caption:'A melody you’ve\nnever learned.',motion:true},
{id:'friends',d:3,src:assets+'/story-art/cloud-lookout.jpg',pos:'50% center',caption:'Friends you’ll never\nwant to forget.',motion:true},
{id:'chase',d:3,game:'chase',offset:.25},
{id:'glide',d:5,game:'glide',offset:.5},
{id:'battle',d:4,game:'battle',offset:1.5},
{id:'duo',d:2,src:portrait+'/duo/dark-light-tier-3.webp',motion:true},
{id:'secret',d:4,src:portrait+'/prologue-garden.webp',map:assets+'/canon22-final-art/garden-route-map.webp',caption:'But your story began\nlong before you woke up.',motion:true},
{id:'end',d:4,src:portrait+'/title-bell-sanctuary.webp',title:true,motion:true}
];
const total=shots.reduce((a,s)=>a+s.d,0);if(total!==36)throw Error('Timeline '+total);
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
const contentRoot=path.resolve('public/cat-bond');
const mime={'.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2','.ttf':'font/ttf'};
await page.route('https://trailer.local/**',async route=>{
 const url=new URL(route.request().url());if(url.pathname==='/'){await route.fulfill({contentType:'text/html',body:'<!doctype html><html><head></head><body></body></html>'});return;}
 const f=path.resolve(contentRoot,'.'+decodeURIComponent(url.pathname));if(!f.startsWith(contentRoot+'/')||!fs.existsSync(f)){await route.fulfill({status:404});return;}
 await route.fulfill({path:f,contentType:mime[path.extname(f)]||'application/octet-stream'});
});
await page.goto('https://trailer.local/');
await page.addStyleTag({url:'https://trailer.local/css/rpg-storybook-type.css'});
await page.addStyleTag({content:
'html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:transparent;}body{position:relative;color:#fff8e9;font-family:"Cat Bond Fraunces",Georgia,serif;}'+
'.art{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat;}'+
'.shade{position:absolute;top:0;left:0;right:0;height:630px;background:linear-gradient(#16292edb 0%,#16292e8c 47%,#16292e00 100%);}'+
'.caption{position:absolute;top:186px;left:94px;right:125px;text-align:center;font-size:76px;font-weight:550;line-height:1.13;letter-spacing:-.025em;white-space:pre-line;text-shadow:0 3px 16px #13252a88;}'+
'.map{position:absolute;left:115px;top:650px;width:850px;filter:drop-shadow(0 20px 38px #20303288);}'+
'.secretshade{position:absolute;inset:0;background:#263e3b44;}'+
'.brand{position:absolute;top:86px;left:0;right:0;text-align:center;color:#785b3c;font-family:"Cat Bond Nunito",sans-serif;font-size:27px;letter-spacing:.28em;font-weight:700;}'+
'.title{position:absolute;top:146px;left:90px;right:90px;text-align:center;font-size:118px;font-weight:650;line-height:.98;color:#67462e;letter-spacing:-.035em;}'+
'.small{font-size:55px;font-weight:450;letter-spacing:.01em;line-height:1.15;margin-bottom:7px;}'+
'.bottomshade{position:absolute;bottom:0;left:0;right:0;height:640px;background:linear-gradient(transparent,#1a2d2d99 50%,#1a2d2ddd); }'+
'.cta{position:absolute;bottom:270px;left:95px;right:125px;text-align:center;font-family:"Cat Bond Nunito",sans-serif;font-size:59px;line-height:1.15;font-weight:750;color:#fff6dc;}'+
'.site{font-size:37px;margin-top:23px;font-weight:600;letter-spacing:.015em;}'
});
const rel=p=>'/'+p.replace(/^public\/cat-bond\//,'');
const enc=['-c:v','libx264','-preset','veryfast','-crf','17','-pix_fmt','yuv420p','-r','30','-threads','4','-an'];
const frames=[];
try{
 const seq=[];
 for(const s of shots){
  const dest=out+'/'+s.id+'-shot.mp4',overlay=out+'/'+s.id+'-frame.png';
  await page.evaluate(({s,src,map})=>{
   document.body.replaceChildren();
   const el=(cls,t,host=document.body)=>{const x=document.createElement('div');x.className=cls;if(t)x.textContent=t;host.append(x);return x;};
   if(!s.game){const a=el('art');a.style.backgroundImage='url("'+src+'")';a.style.backgroundPosition=s.pos||'center';}
   if(s.map){el('secretshade');const m=document.createElement('img');m.className='map';m.src=map;document.body.append(m);}
   if(s.caption){el('shade');const caption=el('caption',s.caption);if(caption.scrollWidth>caption.clientWidth)throw Error('Caption overflow');}
   if(s.title){el('brand','MORROW WISH');const title=el('title');el('small','Echoes of the',title);el('','Starbell',title);el('bottomshade');const c=el('cta','Play the free demo');el('site','morrowwish.vercel.app',c);}
  },{s,src:s.src?rel(s.src):null,map:s.map?rel(s.map):null});
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));const a=document.querySelector('.art');if(a){const url=getComputedStyle(a).backgroundImage.match(/url\("(.*)"\)/)?.[1];if(url){const im=new Image();im.src=url;await im.decode();}}});
  await page.screenshot({path:overlay,omitBackground:true,animations:'disabled'});
  if(s.game){
    const clip=clips.get(s.game),crop=clip.rect;
    let vf='scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,setsar=1';
    if(crop&&crop.width>100&&crop.height>100){
     const x=Math.max(0,Math.floor(crop.x/crop.vw*1080/2)*2),y=Math.max(0,Math.floor(crop.y/crop.vh*1920/2)*2);
     const cw=Math.min(1080-x,Math.floor(crop.width/crop.vw*1080/2)*2),ch=Math.min(1920-y,Math.floor(crop.height/crop.vh*1920/2)*2);
     if(ch/cw>1.15)vf='scale=1080:1920,crop='+cw+':'+ch+':'+x+':'+y+',scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,setsar=1';
    }
    ff(['-framerate','30','-start_number',String(Math.round((s.offset||0)*30)),'-i',out+'/'+s.game+'/sample-%05d.jpg','-loop','1','-i',overlay,'-t',String(s.d),'-filter_complex_threads','2','-filter_complex','[0:v]'+vf+',tpad=stop_mode=clone:stop_duration=1[v];[v][1:v]overlay=0:0:shortest=1,format=yuv420p',...enc,dest]);
  }else if(s.motion){
    ff(['-loop','1','-framerate','30','-i',overlay,'-i',out+'/sparkles.mov','-t',String(s.d),'-filter_complex_threads','2','-filter_complex','[0:v][1:v]overlay=0:0:shortest=1,setsar=1,format=yuv420p',...enc,dest]);
  }else ff(['-loop','1','-framerate','30','-i',overlay,'-t',String(s.d),'-vf','setsar=1,format=yuv420p',...enc,dest]);
  const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',dest],{encoding:'utf8'}));
  if(Math.abs(duration-s.d)>.1)throw Error('Shot duration '+s.id+' '+duration);
  seq.push(dest);frames.push({id:s.id,seconds:s.d,live:!!s.game,caption:s.caption||null});console.log('SHOT',s.id,duration,s.game?'LIVE':'ART');
 }
 fs.writeFileSync(out+'/timeline.txt',seq.map(s=>"file '"+path.basename(s)+"'").join('\n')+'\n');
 const file=out+'/Echoes-of-the-Starbell-Official-Trailer-EN.mp4';
 ff(['-f','concat','-safe','0','-i',out+'/timeline.txt','-i',out+'/score.wav','-t','36','-map','0:v:0','-map','1:a:0','-c:v','copy','-af','loudnorm=I=-15:TP=-1.5:LRA=9','-c:a','aac','-b:a','256k','-movflags','+faststart',file]);
 ff(['-i',file,'-vf','fps=1/2,scale=270:480,tile=6x3','-frames:v','1',out+'/contact-en.jpg']);
 ff(['-i',file,'-frames:v','1',out+'/first-frame.png']);
 ff(['-i',file,'-f','null','-']);
 const info=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
 if(Math.abs(+info.format.duration-36)>.1||info.streams[0].width!==1080||info.streams[0].height!==1920||!info.streams.some(s=>s.codec_type==='audio'))throw Error('Invalid output');
 fs.writeFileSync(out+'/proof-en.json',JSON.stringify({live:proof,shots:frames,firstCaption:shots[0].caption,format:info.format},null,2));console.log('TRAILER COMPLETE',file);
}finally{await browser.close();}
