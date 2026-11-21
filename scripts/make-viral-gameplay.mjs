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
const outputName='viral-gameplay-20261121';
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
 await sleep(850);const ended=Date.now();const v=p.video();await c.close();
 console.log('HEIST VERIFIED: '+JSON.stringify(s));
 return{slug:'pawsibly-innocent',raw:await v.path(),offset:(began-born)/1000,duration:(ended-began)/1000,
  captions:[['HE ALMOST CAUGHT ME.',0,danger],['SO I THREW THE YARN.',danger,lure],
    ['I STOLE ALL THREE.',lure,finished],['PLAY THE HEIST · LINK IN BIO',finished,(ended-began)/1000]]};
}
async function catBond(browser){
 const {c,p,born}=await session(browser,'cat-bond');
 await p.goto('http://127.0.0.1:8769/cat-bond/?autodev&lang=en',{waitUntil:'domcontentloaded',timeout:30000});
 await p.waitForFunction(()=>!!window.__game&&!!window.State&&window.State.S.cats.length>=3,null,{timeout:19000});
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
   return{cast:b.ultimate(),cinematic:!!b.ultCinematic,name:b.ultCinematic?.name};
 });
 if(!ult.cast||!ult.cinematic)throw Error('Real ultimate not shown: '+JSON.stringify(ult));
 await sleep(3250);const finish=(Date.now()-began)/1000;
 await sleep(1050);const ended=Date.now();const v=p.video();await c.close();
 console.log('BATTLE HIGHLIGHTS VERIFIED: '+JSON.stringify({duo,ult}));
 return{slug:'cat-bond',raw:await v.path(),offset:(began-born)/1000,duration:(ended-began)/1000,
  captions:[['THEY HAVE A TEAM ATTACK?!',0,duoDone],['WAIT FOR THE FINISHER.',duoDone,finish],
    ['BUILD YOUR CAT SQUAD.',finish,finish+.22],['PLAY FREE · LINK IN BIO',finish+.22,(ended-began)/1000]]};
}
function render(r){
 const dir=path.join('public','promo',r.slug);fs.mkdirSync(dir,{recursive:true});
 const out=path.join(dir,outputName+'.mp4'),cover=path.join(dir,outputName+'.jpg');
 const captions=r.captions.map(([phrase,start,end],i)=>{
   const file=path.join(root,r.slug+'-'+i+'.txt');
   fs.writeFileSync(file,phrase);
   const bottom=i===r.captions.length-1;
   return 'drawtext=fontfile='+font+':textfile='+file+
    ':fontcolor=white:fontsize='+(bottom?45:52)+
    ':box=1:boxcolor=black@0.48:boxborderw=16'+
    ':x=(w-text_w)/2:y='+(bottom?1715:110)+
    ":enable='between(t,"+start.toFixed(2)+','+end.toFixed(2)+")'";
 });
 const filter='fps=30,scale=1080:1920:flags=lanczos,setsar=1,'+captions.join(',')+',format=yuv420p';
 execFileSync('ffmpeg',['-nostdin','-y','-hide_banner','-loglevel','error',
   '-ss',Math.max(0,r.offset).toFixed(2),'-i',r.raw,'-stream_loop','-1','-i',promoTrack(r.slug),
   '-vf',filter,'-map','0:v:0','-map','1:a:0','-t',r.duration.toFixed(2),'-r','30',
   '-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p',
   '-c:a','aac','-b:a','128k',
   '-af','volume=0.32,afade=t=out:st='+Math.max(0,r.duration-.6).toFixed(2)+':d=0.6',
   '-movflags','+faststart',out],{stdio:'inherit',timeout:180000});
 execFileSync('ffmpeg',['-nostdin','-y','-hide_banner','-loglevel','error',
   '-ss','1.1','-i',out,'-frames:v','1','-q:v','3',cover],{stdio:'inherit'});
 const streams=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-of','json',out],{encoding:'utf8'})).streams;
 if(!streams.some(s=>s.codec_type==='video'&&s.width===1080&&s.height===1920)||
    !streams.some(s=>s.codec_type==='audio'))throw Error('Invalid final social reel: '+out);
 const bytes=fs.statSync(out).size;
 if(bytes<100000||bytes>25000000)throw Error('Unusual social clip size: '+bytes);
 console.log('FULL-BLEED REAL GAMEPLAY V2 READY '+JSON.stringify({slug:r.slug,out,cover,bytes,duration:r.duration}));
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