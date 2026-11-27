import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
const out='artifacts/starbell-story-trailer',assets='public/cat-bond/assets',portrait=assets+'/mobile-portrait';
const proof=JSON.parse(fs.readFileSync(out+'/capture-evidence.json','utf8'));
for(const id of ['chase','glide','battle'])if(!proof.clips.some(x=>x.id===id))throw Error('Fresh capture required: '+id);
const ff=args=>execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});
const fps=30,W=1080,H=1920;
// All paintings are the new native portrait game assets from the checked-out
// current Starbell art integration. No previous promotional video is an input.
const shots=[
 {id:'hook',d:4,src:assets+'/cinematics/prologue/garden-at-dawn.webp',heroCrop:true,en:'“How do you know\nthat old tune?”',zh:'“这首老曲子，你怎么会唱？”'},
 {id:'wake',d:3,src:portrait+'/windchime-town-tall.webp',en:'“I don’t even remember\nmy own name.”',zh:'“我连自己的名字都不记得。”'},
 {id:'journey',d:3,src:portrait+'/rootsleep-forest.webp',en:'You thought this was\na brand-new journey.',zh:'你以为，\n这是一段全新的旅程。'},
 {id:'wonder',d:3,src:portrait+'/skyspine-isles.webp'},
 {id:'glide',d:4,game:true},
 {id:'friends',d:4,src:portrait+'/story-cloud-tea.webp',en:'“Ring twice. I’ll hear you.”',zh:'“转角看不见就摇两下。\n我听得见。”'},
 {id:'chase',d:3,game:true},
 {id:'battle',d:4,game:true},
 {id:'duo',d:3,src:portrait+'/duo/dark-light-tier-3.webp'},
 {id:'secret',d:5,src:assets+'/canon22-final-art/garden-route-map.webp',map:true,en:'But the story began\nlong before you woke up.',zh:'却不知道，\n故事早在你醒来之前\n就已经开始。'},
 {id:'end',d:4,src:portrait+'/title-bell-sanctuary.webp',title:true}
];
const total=shots.reduce((a,s)=>a+s.d,0);
const enc=['-an','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-r','30','-threads','4'];
// Locked camera: every painting is a composed still, with no zoompan,
// animated transforms, fractional crop, or simulated camera shake.
// Browser typography reuses the game's actual self-hosted typefaces.
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1,reducedMotion:'reduce'});
const contentRoot=path.resolve('public/cat-bond');
const mimetype={'.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2','.ttf':'font/ttf'};
await page.route('https://trailer.local/**',async route=>{
 const url=new URL(route.request().url());
 if(url.pathname==='/'){await route.fulfill({contentType:'text/html',body:'<!doctype html><html><head></head><body></body></html>'});return;}
 const f=path.resolve(contentRoot,'.'+decodeURIComponent(url.pathname));
 if(!f.startsWith(contentRoot+'/')||!fs.existsSync(f)){await route.fulfill({status:404,body:'missing'});return;}
 await route.fulfill({path:f,contentType:mimetype[path.extname(f)]||'application/octet-stream'});
});
await page.goto('https://trailer.local/');
await page.addStyleTag({url:'https://trailer.local/css/rpg-storybook-type.css'});
await page.addStyleTag({content:
 'html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#20323b;}'+
 'body{font-family:"Cat Bond Fraunces",Georgia,serif;position:relative;color:#fff8e9;}'+
 '.art{position:absolute;inset:0;background-position:center;background-size:cover;background-repeat:no-repeat;}'+
 '.mapback{background:radial-gradient(ellipse at 50% 39%,#435052,#1e3038 75%);}'+
 '.map{position:absolute;top:30%;left:50%;transform:translateX(-50%);width:880px;height:auto;filter:drop-shadow(0 10px 30px #0d1b2280);}'+
 '.scrim{position:absolute;left:0;right:0;bottom:0;height:680px;background:linear-gradient(transparent,rgba(21,29,34,.15) 27%,rgba(21,29,34,.76) 78%,rgba(21,29,34,.84));}'+
 '.caption{position:absolute;bottom:300px;left:104px;right:104px;font-weight:450;font-size:57px;line-height:1.29;letter-spacing:.005em;white-space:pre-line;text-align:center;text-shadow:0 2px 12px #101c2670;}'+
 '.zh .caption{font-family:"Cat Bond WenKai GB",serif;font-weight:400;font-size:56px;letter-spacing:.035em;line-height:1.4;}'+
 '.mapback+.caption{bottom:280px;}'+
 '.brand{position:absolute;left:0;right:0;top:100px;text-align:center;font-family:"Cat Bond Nunito",sans-serif;font-size:25px;letter-spacing:.34em;font-weight:650;color:#785b3c;}'+
 '.title{position:absolute;top:164px;left:92px;right:92px;color:#67462e;text-align:center;font-size:83px;font-weight:650;line-height:1.02;letter-spacing:-.035em;}'+
 '.title .small{font-size:40px;letter-spacing:.035em;font-weight:450;margin-bottom:7px;}'+
 '.zh .title{font-family:"Cat Bond WenKai GB",serif;font-weight:400;letter-spacing:.13em;font-size:112px;line-height:1.15;}'+
 '.zh .title .small{font-family:"Cat Bond Fraunces",serif;font-weight:550;font-size:33px;letter-spacing:.025em;margin-top:12px;}'+
 '.endrule{position:absolute;left:415px;width:250px;top:350px;height:1px;background:linear-gradient(90deg,transparent,#9a6d39,transparent);}'+
 '.cta{position:absolute;bottom:220px;left:88px;right:88px;text-align:center;color:#fff4dc;font-family:"Cat Bond Nunito",sans-serif;font-weight:700;font-size:44px;letter-spacing:.035em;line-height:1.2;}'+
 '.zh .cta{font-family:"Cat Bond WenKai GB",serif;font-size:53px;font-weight:400;letter-spacing:.06em;}'+
 '.site{font-family:"Cat Bond Nunito",sans-serif;font-size:30px;font-weight:550;letter-spacing:.04em;color:#fff4dc;margin-top:19px;}'
});
const rel=p=>'/'+p.replace(/^public\/cat-bond\//,'');
const allShots=[];
try {
 for(const lang of ['en','zh']){
  const seq=[];
  for(const s of shots){
   const file=out+'/'+lang+'-'+s.id+'.mp4';
   if(s.game){
    // Capture timestamps are resampled onto a uniform frame grid; do not
    // amplify movements or apply transitions to the actual game UI.
    ff(['-framerate','30','-i',out+'/'+s.id+'/sample-%05d.jpg','-t',String(s.d),'-vf','scale=1080:1920:force_original_aspect_ratio=decrease:flags=lanczos,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x14252d,setsar=1,format=yuv420p',...enc,file]);
   }else{
    if(!fs.existsSync(s.src))throw Error('Missing art: '+s.src);
    await page.evaluate(({lang,s,src})=>{
     document.body.className=lang;
     document.body.replaceChildren();
     const el=(cls,txt,host=document.body)=>{const n=document.createElement('div');n.className=cls;if(txt)n.textContent=txt;host.append(n);return n;};
     const art=el('art'+(s.map?' mapback':''));
     if(s.map){const m=document.createElement('img');m.className='map';m.src=src;art.append(m);}
     else {art.style.backgroundImage='url("'+src+'")';if(s.heroCrop)art.style.backgroundPosition='70% center';}
     if(s[lang]){el('scrim');el('caption',s[lang]);}
     if(s.title){
      el('brand','MORROW WISH');
      const t=el('title');
      if(lang==='en'){el('small','Echoes of the',t);el('','Starbell',t);}
      else{el('','星铃回响',t);el('small','Echoes of the Starbell',t);}
      el('endrule');el('scrim');
      const c=el('cta',lang==='en'?'Play the free demo':'免费开启你的冒险');el('site','morrowwish.vercel.app',c);
     }
    },{lang,s,src:rel(s.src)});
    await page.evaluate(async()=>{await document.fonts.ready;const images=[...document.images];await Promise.all(images.map(i=>i.decode()));const bg=getComputedStyle(document.querySelector('.art')).backgroundImage.match(/url\("(.*)"\)/);if(bg){const i=new Image();i.src=bg[1];await i.decode();}});
    const still=out+'/'+lang+'-'+s.id+'-frame.png';
    await page.screenshot({path:still,animations:'disabled'});
    ff(['-loop','1','-framerate','30','-i',still,'-t',String(s.d),'-vf','setsar=1,format=yuv420p',...enc,file]);
    allShots.push({lang,id:s.id,locked:true,frame:still});
   }
   seq.push(file);
  }
  const manifest=out+'/timeline-'+lang+'.txt';
  fs.writeFileSync(manifest,seq.map(s=>"file '"+path.basename(s)+"'").join('\n')+'\n');
  const clean=out+'/clean-'+lang+'.mp4';
  ff(['-f','concat','-safe','0','-i',manifest,'-c:v','copy',clean]);
  const video=out+'/Echoes-of-the-Starbell-Story-Trailer-'+lang.toUpperCase()+'.mp4';
  ff(['-i',clean,'-i',out+'/bell-cues.wav','-stream_loop','-1','-i',assets+'/audio/sky.mp3','-t',String(total),'-filter_complex',
 "[2:a]atrim=duration="+total+",afade=t=in:st=0:d=0.5,volume='if(between(t,31,35),0.22,0.72)':eval=frame,afade=t=out:st="+(total-1.5)+":d=1.5[m];[m][1:a]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.9,loudnorm=I=-16:TP=-1.5:LRA=11[a]",
 '-map','0:v:0','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',video]);
 const info=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',video],{encoding:'utf8'}));
 const v=info.streams.find(s=>s.codec_type==='video'),a=info.streams.find(s=>s.codec_type==='audio');
 if(v.width!==1080||v.height!==1920||!a||Math.abs(Number(info.format.duration)-total)>.5)throw Error('Delivery format invalid '+lang);
 ff(['-i',video,'-vf','fps=1/3,scale=270:480,tile=5x3','-frames:v','1',out+'/contact-'+lang+'.jpg']);
 ff(['-i',video,'-f','null','-']);
 fs.writeFileSync(out+'/proof-'+lang+'.json',JSON.stringify({capture:proof,shots,video:info.format,source:process.env.GITHUB_SHA,technicalValidation:'1080x1920, audio stream, complete decode',visualReview:'Fixed camera and branded fonts; individual frames and contact sheets available for review.',lockedArtwork:allShots.filter(x=>x.lang===lang),typography:'Fraunces / WenKai GB / Nunito'},null,2));
 console.log('RENDERED NEW STORY TRAILER',lang,total,video);
}
}finally{await browser.close();}
