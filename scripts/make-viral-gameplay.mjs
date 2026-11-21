// Real-gameplay full-bleed portrait shorts: no shrunk landscape frame or invented scenes.
import {chromium} from 'playwright';
import {promoTrack} from './promo-audio.mjs';
import {spawn,execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mw-reel-v2-'));
const server=spawn('python3',['-m','http.server','8769','--bind','127.0.0.1','--directory','public'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
// Each game uses its OWN licensed recording; never fall back to one song.
const outputName='hook-v3-20261121';
async function session(browser,slug){
 const dir=path.join(root,slug);fs.mkdirSync(dir,{recursive:true});
 const c=await browser.newContext({viewport:{width:540,height:960},deviceScaleFactor:1,
   recordVideo:{dir,size:{width:540,height:960}},locale:'en-US',reducedMotion:'no-preference'});
 await c.route('**/api/session**',r=>r.abort('blockedbyclient'));
 const born=Date.now(),p=await c.newPage();
 p.on('pageerror',e=>console.log(slug+' browser warning: '+e.message.slice(0,130)));
 return{c,p,born};
}
function followCatCanvas(){
 const source=document.getElementById('board');
 if(!source)throw Error('Real cat game canvas missing');
 const mirror=document.createElement('canvas');
 mirror.width=540;mirror.height=960;mirror.id='mw-fullbleed-live-camera';
 Object.assign(mirror.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',
   zIndex:'2147483647',pointerEvents:'none',background:'#f5e6da'});
 document.body.appendChild(mirror);
 const ctx=mirror.getContext('2d',{alpha:false});
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 window.__MW_FOCUS__='cat';
 let cx=0;
 const render=()=>{
   const state=window.__PAWSIBLY_TEST__?.getState();
   if(state&&source.width&&source.height){
     const vis=588*(540/960);
     const a=state.cat||{x:2},b=state.human||{x:7};
     const x=window.__MW_FOCUS__==='human'?b.x:window.__MW_FOCUS__==='both'?.42*a.x+.58*b.x:a.x;
     const desired=Math.max(0,Math.min(840-vis,(x+.5)*84-vis/2));
     cx+=(desired-cx)*.25;
     const scale=source.width/840;
     ctx.drawImage(source,cx*scale,0,vis*scale,source.height,0,0,540,960);
   }
   requestAnimationFrame(render);
 };
 requestAnimationFrame(render);
}
async function heist(browser){
 const {c,p,born}=await session(browser,'pawsibly-innocent');
 await p.goto('http://127.0.0.1:8769/pawsibly-innocent/?platform=crazygames&lang=en',{waitUntil:'domcontentloaded',timeout:30000});
 await p.waitForFunction(()=>!!window.__PAWSIBLY_TEST__?.getState(),null,{timeout:15000});
 await p.evaluate(followCatCanvas);await sleep(300);
 const began=Date.now();
 // The owner nearly spots the cat in the REAL room, then we retry tactically.
 await p.evaluate(()=>window.__MW_FOCUS__='both');
 for(let k=0;k<4;k++){await p.evaluate(()=>window.__PAWSIBLY_TEST__.move(1,0));await sleep(280);}
 await sleep(250);
 const danger=(Date.now()-began)/1000;
 // A real thrown yarn ball causes the human to cross the room.
 await p.evaluate(()=>{
   const api=window.__PAWSIBLY_TEST__;
   api.choose(0,false);window.__MW_FOCUS__='human';api.throwYarn();
   if(!api.throwYarnTo({x:9,y:1}))throw Error('Throw rejected by real rules');
 });
 await p.waitForFunction(()=>!window.__PAWSIBLY_TEST__.isChasing(),null,{timeout:8500});
 await sleep(260);const lure=(Date.now()-began)/1000;
 await p.evaluate(()=>window.__MW_FOCUS__='cat');
 // Real legal player moves: collect 3 fish, escape. No forced victory state.
 const moves=[[1,0],[0,1],[0,1],[0,1],[1,0],[1,0],[1,0],[1,0],[1,0],[0,-1],[1,0],[0,1],[1,0]];
 let s;
 for(const m of moves){
   s=await p.evaluate(([x,y])=>{
     window.__PAWSIBLY_TEST__.move(x,y);
     const v=window.__PAWSIBLY_TEST__.getState();
     return{cat:v.cat,fish:v.got,won:v.winning,done:v.done,yarn:v.yarnThrows};
   },m);
   await sleep(250);
   if(s.done)break;
 }
 if(!s?.won||s.fish<3||s.yarn<1)throw Error('No authentic 3-fish victory: '+JSON.stringify(s));
 const finished=(Date.now()-began)/1000;
 // This label is derived only from the verified genuine win. Never fake a victory.
 await p.evaluate(()=>{
  const el=document.createElement('div');el.textContent='3 / 3 FISH  ·  ESCAPED!';
  Object.assign(el.style,{position:'fixed',bottom:'14%',left:'3%',width:'94%',zIndex:'2147483647',
    padding:'20px 8px',boxSizing:'border-box',borderRadius:'17px',textAlign:'center',
    font:'900 30px/1.25 system-ui',color:'#fff1ce',background:'rgba(26,30,47,.88)'});
  document.body.appendChild(el);
 });
 await sleep(2300);const ended=Date.now();const v=p.video();await c.close();
 console.log('HEIST VERIFIED: '+JSON.stringify(s));
 return{slug:'pawsibly-innocent',raw:await v.path(),offset:(began-born)/1000,duration:(ended-began)/1000,
  clips:[{start:finished,duration:1.9,caption:'3 FISH. I ESCAPED.'},
    {start:0,duration:Math.max(.8,Math.min(1.4,danger)),caption:'HE ALMOST CAUGHT ME.'},
    {start:danger,duration:Math.max(1.0,Math.min(2.3,lure-danger)),caption:'SO I THREW THE YARN.'},
    {start:lure,duration:Math.max(1.3,Math.min(2.8,finished-lure)),caption:'THEN RAN FOR IT.'},
    {start:finished,duration:1.9,caption:'CAN YOU ESCAPE?'}],
  evidence:{kind:'real-victory',fish:s.fish,won:s.won,score:s.score,yarnThrows:s.yarn}};
}
async function catBond(browser){
 const {c,p,born}=await session(browser,'cat-bond');
 await p.addInitScript(()=>{
  window.__MW_PROMO_CJK__=[];
  const original=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(message,...args){
   const text=String(message);
   if(/[\u3400-\u9fff]/.test(text)&&window.__MW_PROMO_CJK__.length<40)window.__MW_PROMO_CJK__.push(text);
   return original.call(this,message,...args);
  };
 });
 await p.goto('http://127.0.0.1:8769/cat-bond/?autodev&lang=en',{waitUntil:'domcontentloaded',timeout:30000});
 await p.waitForFunction(()=>!!window.__game&&!!window.State&&window.State.S.cats.length>=3,null,{timeout:19000});
 await p.evaluate(()=>{
  // Crop the REAL arena with equal scale factors: the previous page-wide
  // portrait recording made combat unreadably small.
  const source=document.getElementById('scene'),mirror=document.createElement('canvas');
  if(!source)throw Error('Live Cat Bond scene canvas missing');
  mirror.width=540;mirror.height=960;
  Object.assign(mirror.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',
    zIndex:'2147483647',pointerEvents:'none',background:'#221b33'});
  document.body.appendChild(mirror);const ctx=mirror.getContext('2d',{alpha:false});
  const frame=()=>{
   if(source.width&&source.height){
    const aspect=540/960,sw=source.width,sh=source.height;
    if(sw/sh>aspect){const crop=sh*aspect;ctx.drawImage(source,(sw-crop)/2,0,crop,sh,0,0,540,960);}
    else {const crop=sw/aspect;ctx.drawImage(source,0,Math.max(0,(sh-crop)/2),sw,Math.min(sh,crop),0,0,540,960);}
   }
   requestAnimationFrame(frame);
  };requestAnimationFrame(frame);
 });
 await sleep(450);const began=Date.now();
 // Prepare a legitimate advanced-gameplay state; all footage is the actual
 // in-engine duo cinematic and ultimate, NOT fake effect overlays.
 const duo=await p.evaluate(()=>{
   const cats=State.S.cats.slice(0,3);
   CatRelations.grow(cats[0],cats[1],75);CatRelations.choose(cats[0],cats[1]);
   State.S.battlePrefs={...(State.S.battlePrefs||{}),manualTutorialSeen:true,tutorialSeen:true,autoBattle:false};
   const opponent=GameData.SPECIES.find(x=>x.rarity==='SSR')||GameData.SPECIES.at(-1);
   window.__game.startBattle(cats,opponent);
   const b=window.__game.battle;b.duoCharge=100;
   return{cast:b.castDuo(),enemy:opponent.id,art:b.duo?.name,duo:b.duoUses};
 });
 if(!duo.cast||duo.duo<1)throw Error('Real duo attack unavailable: '+JSON.stringify(duo));
 await sleep(3150);const duoDone=(Date.now()-began)/1000;
 const ult=await p.evaluate(()=>{
   const b=window.__game.battle;
   if(!b||b.done)return{cast:false,why:'Battle ended'};
   b.ult=100;b.ultCd=0;
   const cast=b.ultimate(),name=b.ultCinematic?.name;return{cast,cinematic:!!b.ultCinematic,name,lang:document.documentElement.lang,hasChinese:/[\u3400-\u9fff]/.test(name||'')};
 });
 if(!ult.cast||!ult.cinematic)throw Error('Real ultimate not shown: '+JSON.stringify(ult));
 if(ult.hasChinese)throw Error('English gameplay cinematic leaked Chinese: '+JSON.stringify(ult));
 await sleep(3250);const finish=(Date.now()-began)/1000;
 await sleep(1050);const ended=Date.now();const v=p.video();await c.close();
 const langAudit=await p.evaluate(()=>({
  canvasText:[...new Set(window.__MW_PROMO_CJK__||[])],
  visibleDOM:[...document.querySelectorAll('body *')].filter(el=>{
   const r=el.getBoundingClientRect();
   return !el.children.length&&r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden'&&
     /[\u3400-\u9fff]/.test(el.textContent||'');
  }).map(el=>el.textContent.trim().slice(0,90)).slice(0,30)
 }));
 if(langAudit.canvasText.length||langAudit.visibleDOM.length)
   throw Error('REJECT English Cat Bond video: Chinese text painted/visible '+JSON.stringify(langAudit));
 console.log('BATTLE HIGHLIGHTS VERIFIED: '+JSON.stringify({duo,ult,langAudit}));
 return{slug:'cat-bond',raw:await v.path(),offset:(began-born)/1000,duration:(ended-began)/1000,
  clips:[{start:duoDone,duration:Math.min(2.8,finish-duoDone),caption:'THAT FINISHER!'},
    {start:0,duration:Math.min(2.8,duoDone),caption:'TWO CATS. ONE COMBO.'},
    {start:duoDone,duration:Math.min(2.5,finish-duoDone),caption:'WHICH TWO WOULD YOU PICK?'}],
  evidence:{kind:'real-duo-and-ultimate',duoUses:duo.duo,ultimateName:ult.name,englishNameVerified:!ult.hasChinese}};
}
function render(r){
 const dir=path.join('public','promo',r.slug);fs.mkdirSync(dir,{recursive:true});
 const out=path.join(dir,outputName+'.mp4'),cover=path.join(dir,outputName+'.jpg');
 if(!r.clips?.length||!r.evidence)throw Error('Missing gameplay proof or editorial beats');
 const filters=r.clips.map((beat,i)=>{
  if(beat.start<0||beat.duration<=.6||beat.start+beat.duration>r.duration+.18)
   throw Error('Clip outside genuine recording '+r.slug+': '+JSON.stringify(beat));
  return '[0:v]trim=start='+(r.offset+beat.start).toFixed(3)+':duration='+beat.duration.toFixed(3)+
   ',setpts=PTS-STARTPTS,fps=30,scale=1080:1920:flags=lanczos,setsar=1,format=yuv420p[v'+i+']';
 });
 const combined=r.clips.map((_,i)=>'[v'+i+']').join('')+'concat=n='+r.clips.length+':v=1:a=0[joined]';
 let at=0;const captions=[];
 for(let i=0;i<r.clips.length;i++){
  const c=r.clips[i],f=path.join(root,r.slug+'-text-'+i+'.txt');fs.writeFileSync(f,c.caption);
  captions.push('drawtext=fontfile='+font+':textfile='+f+
    ':fontcolor=white:fontsize=47:box=1:boxcolor=black@0.60:boxborderw=15:x=(w-text_w)/2:y=115'+
    ":enable='between(t,"+at.toFixed(3)+','+(at+c.duration).toFixed(3)+")'");
  at+=c.duration;
 }
 const cta=path.join(root,r.slug+'-cta.txt');fs.writeFileSync(cta,'PLAY FREE  ·  LINK IN BIO');
 captions.push('drawtext=fontfile='+font+':textfile='+cta+':fontcolor=white:fontsize=39:box=1:boxcolor=black@0.5:boxborderw=12:x=(w-text_w)/2:y=1745'+
 ":enable='gte(t,"+Math.max(0,at-2).toFixed(3)+")'");
 const filter=filters.join(';')+';'+combined+';[joined]'+captions.join(',')+',format=yuv420p[v]';
 execFileSync('ffmpeg',['-nostdin','-y','-hide_banner','-loglevel','error',
  '-i',r.raw,'-stream_loop','-1','-i',promoTrack(r.slug),
  '-filter_complex',filter,'-map','[v]','-map','1:a:0','-t',at.toFixed(3),'-r','30',
  '-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k',
  '-af','volume=0.25,afade=t=out:st='+Math.max(0,at-.6).toFixed(3)+':d=0.6',
  '-movflags','+faststart',out],{stdio:'inherit',timeout:180000});
 execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss','0.65','-i',out,'-frames:v','1','-q:v','3',cover],{stdio:'inherit'});
 const streams=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-of','json',out],{encoding:'utf8'})).streams;
 const bytes=fs.statSync(out).size;
 if(!streams.some(v=>v.codec_type==='video'&&v.width===1080&&v.height===1920)||!streams.some(v=>v.codec_type==='audio')||bytes<110000||bytes>25000000)
  throw Error('Failed portrait/audio/size QA for '+r.slug+': '+bytes);
 const review=[];
 for(const [i,t] of [0.8,at*.46,at-1.0].entries()){
  const name='hook-v3-review-'+(i+1)+'.jpg',file=path.join(dir,name);
  execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss',Math.max(0,t).toFixed(3),'-i',out,'-frames:v','1','-q:v','3',file],{stdio:'inherit'});
  if(fs.statSync(file).size<11000)throw Error('Review thumbnail too small '+file);
  review.push('/promo/'+r.slug+'/'+name);
 }
 console.log('HOOK V3 ACTUAL-GAME PLAYBACK: '+JSON.stringify({slug:r.slug,proof:r.evidence,duration:at,bytes,review}));
}

let browser;
try{
 await sleep(1200);
 promoTrack('pawsibly-innocent');promoTrack('cat-bond');
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 render(await heist(browser));
 render(await catBond(browser));
}finally{
 try{if(browser)await browser.close()}catch{}
 server.kill('SIGTERM');
 fs.rmSync(root,{recursive:true,force:true});
}