// Captures current playable versions, then turns authentic gameplay into two short vertical reels.
// No fabricated scenes, unlocks or screenshots. Telemetry is blocked for automated sessions.
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin='http://127.0.0.1:8769';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mw-reel-'));
const server=spawn('python3',['-m','http.server','8769','--bind','127.0.0.1','--directory','public'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const soundtrack='public/audio/cat-happy-clappy.ogg';
const font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

async function capture(browser,slug) {
 const folder=path.join(root,slug);fs.mkdirSync(folder,{recursive:true});
 const context=await browser.newContext({viewport:{width:1000,height:720},deviceScaleFactor:1,
  recordVideo:{dir:folder,size:{width:1000,height:720}},locale:'en-US'});
 await context.route('**/api/session**',route=>route.abort('blockedbyclient'));
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 if(slug==='pawsibly-innocent'){
  await page.goto(origin+'/pawsibly-innocent/?platform=crazygames&lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.__PAWSIBLY_TEST__?.getState(),null,{timeout:20000});
  await page.waitForTimeout(650);
  const toss=await page.evaluate(()=>{const api=window.__PAWSIBLY_TEST__;api.throwYarn();return api.throwYarnTo({x:9,y:1});});
  if(!toss)throw Error('Genuine yarn throw failed');
  await page.waitForFunction(()=>!window.__PAWSIBLY_TEST__.isChasing(),null,{timeout:8500});
  await page.waitForTimeout(240);
  const moves=[[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[0,1],[0,1],[1,0],[1,0],[0,1]];
  for(const [dx,dy] of moves){
   const before=await page.evaluate(()=>{const s=window.__PAWSIBLY_TEST__.getState();return {cat:s.cat,got:s.got,done:s.done};});
   if(before.done)break;
   await page.evaluate(([x,y])=>window.__PAWSIBLY_TEST__.move(x,y),[dx,dy]);
   await page.waitForTimeout(420);
  }
  const result=await page.evaluate(()=>{const s=window.__PAWSIBLY_TEST__.getState();return {fish:s.got,won:s.winning,done:s.done,steps:s.steps,yarnThrows:s.yarnThrows};});
  console.log('Current-game cat heist proof: '+JSON.stringify(result));
  if(result.yarnThrows<1||result.fish<1)throw Error('Gameplay footage lacked a real cat heist');
  await page.waitForTimeout(1300);
 } else {
  await page.goto(origin+'/cat-bond/?autodev&lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.__game&&!!window.State&&window.State.S.cats.length>=3,null,{timeout:24000});
  await page.waitForTimeout(1700);
  await page.evaluate(()=>{
   const g=window.__game;
   const opponent=GameData.SPECIES.find(s=>!State.S.cats.some(c=>c.id===s.id))||GameData.SPECIES[1];
   g.startBattle(State.S.cats.slice(0,2),opponent);
  });
  await page.waitForFunction(()=>window.__game.scene==='battle',null,{timeout:12000});
  await page.waitForTimeout(700);
  await page.locator('#btn-auto').click({timeout:4000}).catch(()=>{});
  await page.waitForTimeout(12500);
  console.log('Current-game Cat Bond arena captured in live game browser.');
 }
 const vid=page.video();await context.close();const src=await vid.path();
 if(errors.length)console.log(slug+' browser warning: '+errors.slice(0,5).join(' / '));
 return src;
}
function make(slug,source) {
 const outdir=path.join('public','promo',slug);fs.mkdirSync(outdir,{recursive:true});
 const output=path.join(outdir,'viral-gameplay-20261121.mp4');
 const cover=path.join(outdir,'viral-gameplay-20261121.jpg');
 const labels=slug==='pawsibly-innocent'
  ? ['HE FELL FOR THE YARN.','THREE FISH. ONE ESCAPE.','WOULD YOU GET CAUGHT?','THE CAT HEIST']
  : ['THIS STRAY HAS BACKUP.','TWO CATS. ONE BATTLE.','WHO WOULD YOU RECRUIT?','CAT BOND'];
 const txt=labels.map((v,i)=>{const f=path.join(root,slug+'-'+i+'.txt');fs.writeFileSync(f,v);return f;});
 const draw=(file,y,size,start,end,color='white')=>'drawtext=fontfile='+font+':textfile='+file+
 ':fontcolor='+color+':fontsize='+size+':x=(w-text_w)/2:y='+y+
 ":enable='between(t,"+start+','+end+")'";
 const vf='[0:v]fps=30,scale=1010:740:force_original_aspect_ratio=decrease,'+
 'pad=1010:740:(ow-iw)/2:(oh-ih)/2:color=0x1b1725,setsar=1[game];'+
 '[2:v][game]overlay=35:480:shortest=1,'+
 'drawbox=x=26:y=472:w=1028:h=756:color=0xf1b6cb@0.86:t=5,'+
 'drawbox=x=0:y=0:w=1080:h=420:color=0x251b36:t=fill,'+
 'drawbox=x=0:y=1260:w=1080:h=660:color=0x251b36:t=fill,'+
 draw(txt[0],178,57,0,5.4)+','+
 draw(txt[1],178,49,5.4,10.2)+','+
 draw(txt[2],178,52,10.2,16)+','+
 draw(txt[3],1360,56,0,16,'0xffd3e2')+','+
 "drawtext=fontfile="+font+":text='7 FREE BROWSER GAMES':fontcolor=white:fontsize=37:x=(w-text_w)/2:y=1460,"+
 "drawtext=fontfile="+font+":text='PLAY FREE · LINK IN BIO':fontcolor=0xffd8b5:fontsize=35:x=(w-text_w)/2:y=1690,"+
 "drawtext=fontfile="+font+":text='MORROW WISH':fontcolor=white@0.70:fontsize=26:x=(w-text_w)/2:y=1834,"+
 'format=yuv420p[v]';
 execFileSync('ffmpeg',['-nostdin','-y','-hide_banner','-loglevel','error',
  '-i',source,'-stream_loop','-1','-i',soundtrack,
  '-f','lavfi','-i','color=c=0x251b36:s=1080x1920:r=30',
  '-filter_complex',vf,'-map','[v]','-map','1:a:0','-t','16',
  '-r','30','-c:v','libx264','-preset','veryfast','-crf','23',
  '-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-af','volume=0.25,afade=t=out:st=15.3:d=0.7',
  '-movflags','+faststart',output],{stdio:'inherit',timeout:180000});
 execFileSync('ffmpeg',['-nostdin','-y','-hide_banner','-loglevel','error',
  '-ss','0.6','-i',output,'-frames:v','1','-q:v','3',cover],{stdio:'inherit'});
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-of','json',output],{encoding:'utf8'}));
 if(!probe.streams.some(x=>x.codec_type==='audio')||!probe.streams.some(x=>x.codec_type==='video'&&x.width===1080&&x.height===1920))
  throw Error('Reel failed video/audio validation');
 const bytes=fs.statSync(output).size;
 if(bytes>25000000)throw Error('Reel too large for studio hosting '+bytes);
 console.log('READY '+output+' '+bytes+' bytes, original game capture; cover '+cover);
}
let browser;
try {
 await sleep(1800);
 if(!fs.existsSync(soundtrack))throw Error('Missing CC0 music');
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const slug of ['pawsibly-innocent','cat-bond']) {
  const source=await capture(browser,slug);
  make(slug,source);
 }
} finally {
 if(browser)await browser.close();
 server.kill('SIGTERM');
 fs.rmSync(root,{recursive:true,force:true});
}
