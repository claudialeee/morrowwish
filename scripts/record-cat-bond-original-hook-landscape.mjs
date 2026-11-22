// Actual 8.1s 2026-11-21 Cat Bond YouTube Short reproduced in native 16:9.
// Critically, this script serves the EXACT original source commit from the
// published hook-v3 capture. The contemporary game no longer contains its
// fullscreen single-cat Claw Cyclone cinematic and MUST NOT be used here.
// This makes zero modifications to the current production game.
import {chromium} from 'playwright';
import {promoTrack} from './promo-audio.mjs';
import {spawn,execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ORIGINAL_GAME_COMMIT='968ba9c6d711e406c0817a65787cacc89a75a4d2';
const refRoot=path.resolve(process.env.MW_HOOK_V3_GAME_ROOT||'.reference-hook-v3');
const historical=path.join(refRoot,'public');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mw-real-hook-wide-'));
const outDir=path.resolve('public/promo/cat-bond');
const output=path.join(outDir,'hook-v3-landscape-original-20261122.mp4');
const metaFile=path.join(outDir,'hook-v3-landscape-original-20261122.json');
const cover=path.join(outDir,'hook-v3-landscape-original-20261122.jpg');
const port=8769,host='http://127.0.0.1:'+port, font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser,context,server;
const originalCuts=[
  {from:'ultimate',duration:2.8,caption:'THAT FINISHER!'},
  {from:'duo',duration:2.8,caption:'TWO CATS. ONE COMBO.'},
  {from:'ultimate',duration:2.5,caption:'WHICH TWO WOULD YOU PICK?'}
];
try{
 if(!fs.existsSync(path.join(historical,'cat-bond','index.html'))||
   !fs.existsSync(path.join(historical,'cat-bond','js','battle.js')))
  throw Error('Historical reference source not checked out. Do not use current live game.');
 const code=fs.readFileSync(path.join(historical,'cat-bond','js','battle.js'),'utf8');
 if(!code.includes('this.ultCinematic = {')||!code.includes('Claw Cyclone'))
  throw Error('Wrong historical game engine: exact original fullscreen solo ultimate unavailable');
 fs.mkdirSync(outDir,{recursive:true});
 server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',historical],{stdio:'ignore'});
 for(let i=0;i<60;i++){
  try{if((await fetch(host+'/cat-bond/')).ok)break}catch{}
  if(i===59)throw Error('Historical game source server failed');
  await sleep(250);
 }
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,
  recordVideo:{dir,size:{width:1280,height:720}},locale:'en-US',reducedMotion:'no-preference'});
 await context.route('**/api/session**',r=>r.abort('blockedbyclient'));
 const page=await context.newPage(),born=Date.now(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(host+'/cat-bond/?autodev&lang=en',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>!!window.__game&&!!window.State&&window.State.S.cats.length>=3,null,{timeout:19000});
 // Match the exact original hook-v3 camera, but with a genuine 16:9 canvas:
 // same game scene, no stretched portrait and no black bars.
 const camera=await page.evaluate(()=>{
  const source=document.getElementById('scene'),mirror=document.createElement('canvas');
  if(!source)throw Error('Original Cat Bond canvas missing');
  mirror.width=1280;mirror.height=720;mirror.id='mw-original-hook-wide-camera';
  Object.assign(mirror.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',
    zIndex:'2147483647',pointerEvents:'none',background:'#b1c7a0'});
  document.body.appendChild(mirror);
  const ctx=mirror.getContext('2d',{alpha:false});
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const draw=()=>{
   if(source.width&&source.height){
    const aspect=1280/720,sw=source.width,sh=source.height;
    if(sw/sh>aspect){const crop=sh*aspect;ctx.drawImage(source,(sw-crop)/2,0,crop,sh,0,0,1280,720);}
    else {const crop=sw/aspect;ctx.drawImage(source,0,Math.max(0,(sh-crop)/2),sw,Math.min(sh,crop),0,0,1280,720);}
   }
   requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
  return{srcWidth:source.width,srcHeight:source.height,mirrorWidth:1280,mirrorHeight:720};
 });
 await sleep(450);const began=Date.now();
 const duo=await page.evaluate(()=>{
  const cats=State.S.cats.slice(0,3);
  CatRelations.grow(cats[0],cats[1],75);
  CatRelations.choose(cats[0],cats[1]);
  State.S.battlePrefs={...(State.S.battlePrefs||{}),manualTutorialSeen:true,tutorialSeen:true,autoBattle:false};
  const opponent=GameData.SPECIES.find(x=>x.rarity==='SSR')||GameData.SPECIES.at(-1);
  window.__game.startBattle(cats,opponent);
  const b=window.__game.battle;b.duoCharge=100;
  const cast=b.castDuo();
  return{cast,enemy:opponent.id,art:b.duo?.name,duoUses:b.duoUses,
    duoName:b.duoCinematic?.name,duoCinematic:!!b.duoCinematic};
 });
 if(!duo.cast||duo.duoUses!==1||!duo.duoCinematic)
  throw Error('Original duo cinematic not reproduced: '+JSON.stringify(duo));
 await sleep(3150);const duoDone=(Date.now()-began)/1000;
 const ultimate=await page.evaluate(()=>{
  const b=window.__game.battle;
  if(!b||b.done)return{cast:false,reason:'enemy died before original finisher'};
  b.ult=100;b.ultCd=0;
  const cast=b.ultimate(),name=b.ultCinematic?.name;
  return{cast,cinematic:!!b.ultCinematic,name,lang:document.documentElement.lang,
    uses:b.duoUses};
 });
 if(!ultimate.cast||!ultimate.cinematic||ultimate.name!=='Claw Cyclone'||ultimate.lang!=='en'||ultimate.uses!==1)
  throw Error('The EXACT ORIGINAL Claw Cyclone full-screen ultimate is missing: '+JSON.stringify(ultimate));
 await sleep(3250);const finish=(Date.now()-began)/1000;
 await sleep(1050);const ended=Date.now();
 const v=page.video();
 await context.close();context=null;
 const raw=await v.path();
 if(errors.length)throw Error('Original game has browser exceptions: '+errors.join(' | '));
 const beats=originalCuts.map(c=>({start:c.from==='duo'?0:duoDone,
  duration:c.duration,caption:c.caption,from:c.from}));
 const length=beats.reduce((s,c)=>s+c.duration,0);
 if(Math.abs(length-8.1)>.01||finish-duoDone<2.5||duoDone<2.8)
  throw Error('Cannot reproduce published 8.1s edit exactly '+JSON.stringify({duoDone,finish}));
 const fmt=n=>n.toFixed(3);
 const filter=beats.map((c,i)=>{
  const start=(began-born)/1000+c.start;
  const f=path.join(dir,'text-'+i+'.txt');fs.writeFileSync(f,c.caption);
  return '[0:v]trim=start='+fmt(start)+':duration='+fmt(c.duration)+
   ',setpts=PTS-STARTPTS,fps=30,scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p'+
   ',drawtext=fontfile='+font+':textfile='+f+
   ':fontcolor=white:fontsize=55:box=1:boxcolor=black@0.57:boxborderw=14'+
   ':x=(w-text_w)/2:y=80[v'+i+']';
 });
 const cat=beats.map((_,i)=>'[v'+i+']').join('')+'concat=n='+beats.length+':v=1:a=0[vout]';
 const cta=path.join(dir,'cta.txt');fs.writeFileSync(cta,'PLAY FREE  |  LINK IN DESCRIPTION');
 // Same three cuts as original hook-v3: solo ultimate, duo, solo ultimate.
 // Place the CTA near the bottom during the last two seconds only.
 const final=filter.join(';')+';'+cat+';[vout]drawtext=fontfile='+font+
   ':textfile='+cta+':fontcolor=white:fontsize=37:box=1:boxcolor=black@0.52:boxborderw=11'+
   ':x=(w-text_w)/2:y=1015:enable=gte(t\\,6.1),format=yuv420p[v]';
 execFileSync('ffmpeg',['-nostdin','-y','-hide_banner','-loglevel','error',
  '-i',raw,'-stream_loop','-1','-i',promoTrack('cat-bond'),
  '-filter_complex',final,'-map','[v]','-map','1:a:0','-t',fmt(length),'-r','30',
  '-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',
  '-c:a','aac','-b:a','128k','-af','volume=0.25,afade=t=out:st=7.5:d=0.6',
  '-movflags','+faststart',output],{stdio:'inherit',timeout:240000});
 const info=JSON.parse(execFileSync('ffprobe',['-v','error',
  '-show_entries','stream=codec_type,width,height:format=duration,size',
  '-of','json',output],{encoding:'utf8'}));
 const video=info.streams.find(x=>x.codec_type==='video');
 const audio=info.streams.find(x=>x.codec_type==='audio');
 const duration=Number(info.format.duration),bytes=fs.statSync(output).size;
 if(video?.width!==1920||video?.height!==1080||!audio||
   duration<8||duration>8.25||bytes<100000)
  throw Error('Published hook native wide playback QA failed '+JSON.stringify(info));
 const imgs=[];
 for(const [i,time] of [0.8,4.25,7.2].entries()){
  const file=path.join(outDir,'hook-v3-landscape-original-review-'+(i+1)+'.jpg');
  execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss',fmt(time),
   '-i',output,'-frames:v','1','-q:v','3',file],{stdio:'inherit',timeout:30000});
  if(fs.statSync(file).size<9000)throw Error('Blank proof frame '+i);
  imgs.push('/promo/cat-bond/'+path.basename(file));
 }
 fs.copyFileSync(path.join(outDir,'hook-v3-landscape-original-review-1.jpg'),cover);
 const result={
  kind:'exact-published-hook-v3-native-horizontal',sourceVideo:'/promo/cat-bond/hook-v3-20261121.mp4',
  sourceYoutubeShort:'https://www.youtube.com/shorts/ELv02K9K294',
  sourceHistoricalGameCommit:ORIGINAL_GAME_COMMIT,
  originalPublishedDurationSeconds:8.1,originalCutOrder:originalCuts.map(c=>({from:c.from,caption:c.caption,duration:c.duration})),
  actualNativeWideCutOrder:beats,duo,ultimate,camera,
  screen:'native 1920x1080 16:9',duration,bytes,
  proofShots:imgs,
  hasFullScreenClawCyclone:true,hasCorrectDoubleCast:true,
  published:false,video:'/promo/cat-bond/'+path.basename(output),
  poster:'/promo/cat-bond/'+path.basename(cover),
  createdAt:new Date().toISOString()
 };
 fs.writeFileSync(metaFile,JSON.stringify(result,null,2)+'\n');
 console.log('CORRECT SOURCE-MATCHED 8.1 SEC HOOK',JSON.stringify(result));
}finally{
 await context?.close().catch(()=>{});
 await browser?.close().catch(()=>{});
 server?.kill('SIGTERM');
 fs.rmSync(dir,{recursive:true,force:true});
}
