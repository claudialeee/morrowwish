// Five more Morrow Wish short-form reels. Real gameplay and gameplay UI only.
// All simulations use legitimate clicks/keys; cannot upload fake scores or scenes.
import {chromium} from 'playwright';
import {spawn,execFileSync} from 'node:child_process';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
const home='http://127.0.0.1:8771',dir=fs.mkdtempSync(path.join(os.tmpdir(),'morrowwish-5-reels-'));
const server=spawn('python3',['-m','http.server','8771','--bind','127.0.0.1','--directory','public'],{stdio:'ignore'});
const audio='public/audio/cat-happy-clappy.ogg',font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function addCleanView(mode){
  const canvas=document.querySelector(mode==='aquarium'?'#sea':'#game');
  if(!canvas)throw Error('Game canvas not found');
  if(mode==='aquarium'){
    const tank=document.getElementById('tank');
    Object.assign(tank.style,{position:'fixed',left:'0',top:'0',width:'100vw',height:'100vh',minHeight:'100vh',margin:'0',padding:'0',zIndex:'99999',borderRadius:'0'});
    Object.assign(canvas.style,{width:'100%',height:'100%',display:'block'});
    window.dispatchEvent(new Event('resize'));
  }else{
    document.documentElement.classList.add('mw-mini-fullscreen-on');
    document.querySelector('.game-frame').classList.add('mw-mini-arcade-frame','mw-mini-portrait');
    window.MorrowwishArcadeViewport?.sync();
    Object.assign(canvas.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',zIndex:'99999',display:'block',borderRadius:'0',margin:'0'});
  }
}
async function session(browser,slug){
  const folder=path.join(dir,slug);fs.mkdirSync(folder,{recursive:true});
  const context=await browser.newContext({viewport:{width:540,height:960},deviceScaleFactor:1,
     recordVideo:{dir:folder,size:{width:540,height:960}},locale:'en-US'});
  await context.route('**/api/session**',r=>r.abort('blockedbyclient'));
  await context.route('**/api/elsewhere-collect**',r=>r.abort('blockedbyclient'));
  const page=await context.newPage();
  page.on('pageerror',e=>console.log(slug+' console warning: '+e.message.slice(0,150)));
  return{context,page};
}
async function capture(browser,slug,record){
 const {context,page}=await session(browser,slug);
 if(slug==='parcel-panic')await page.addInitScript(()=>{Math.random=()=>0.348;});
 if(slug==='pocket-aquarium'){
   // Read-only promo instrumentation. This changes NO game logic or scoring.
   await page.route('**/pocket-aquarium/**',async route=>{
     if(!route.request().isNavigationRequest())return route.continue();
     const response=await route.fetch();
     const html=await response.text();
     const marker='function init(){';
     if(!html.includes(marker))throw Error('Aquarium instrumentation needs a reviewed game version');
     const edited=html.replace(marker,'function init(){window.__MW_FISH__=()=>fish.map(f=>({x:f.x,y:f.y,type:f.type,wait:f.wait}));');
     await route.fulfill({response,body:edited,headers:{...response.headers(),'content-type':'text/html; charset=utf-8'}});
   });
 }
 await page.goto(home+'/'+slug+'/?lang=en',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForTimeout(300);
 let marks=[],proof={};
 const begin=Date.now();
 if(slug==='flip-dash'){
   await page.locator('#play-btn').click();await page.evaluate(addCleanView,'arcade');
   let flips=0,failures=0;
   for(let n=0;n<26;n++){
     if(n%2===0){await page.keyboard.press('Space');flips++;}
     await sleep(330);
     const info=await page.evaluate(()=>({score:Number(document.querySelector('#score')?.textContent)||0,over:!document.querySelector('#overlay')?.hidden}));
     if(info.over){failures++;await page.evaluate(()=>document.getElementById('play-btn').click());}
   }
   proof={flips,failures,score:await page.locator('#score').textContent()};
   if(flips<8)throw Error('Flip Dash actual interactions missing');
   marks=[[0,'ONE BUTTON.'],[2.7,'EVERY FLIP COUNTS.'],[6,'THINK YOU CAN LAST?']];
 }else if(slug==='parcel-panic'){
   await page.locator('#play-btn').click();await page.evaluate(addCleanView,'arcade');
   await sleep(650);
   for(let n=0;n<11;n++){await page.keyboard.press('2');await sleep(720);}
   const score=Number(await page.locator('#score').textContent());
   proof={score,realSorts:score>0};
   if(score<=0)throw Error('No real packages sorted in recording');
   marks=[[0,'THEY KEEP COMING.'],[2.5,'THREE LANES. ONE MISTAKE.'],[6,'CAN YOU KEEP UP?']];
 }else if(slug==='pocket-aquarium'){
   await page.locator('#start').click();await page.evaluate(addCleanView,'aquarium');
   let moves=0;
   for(let k=0;k<9;k++){
     const fish=await page.evaluate(()=>window.__MW_FISH__?.()||[]);
     const hungry=fish.filter(f=>f.wait<.9);
     const target=(hungry.length?hungry:fish)[k%Math.max(1,(hungry.length?hungry:fish).length)];
     if(!target)break;
     await page.evaluate(({type,x,y})=>{
       document.querySelectorAll('.food')[type].click();
       const el=document.getElementById('sea'),r=el.getBoundingClientRect();
       el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:r.left+x,clientY:r.top+y-16,pointerId:3,pointerType:'touch'}));
     },target);moves++;
     await sleep(850);
   }
   const score=Number(await page.locator('#score').textContent());
   proof={score,feedsAttempted:moves};
   if(score<=0)throw Error('Aquarium reel failed to show successful fish feeding');
   marks=[[0,'FEED THE RIGHT FISH.'],[2.6,'KEEP THE COMBO ALIVE.'],[5.4,'60 SECONDS. READY?']];
 }else if(slug==='tiny-town'){
   await page.locator('#introStart').click();
   await page.addStyleTag({content:'.arcade-return,.app>.header,.stats,.sidebar .sidebar-head,.sidebar .citizen-panel,.sidebar .petition,.sidebar .pick-hint,.stage .map-panel .city-extras,.app>.progress{display:none!important}.app{padding:0!important;width:100vw!important;max-width:100vw!important}.stage{display:block!important}.map-panel{display:block!important;width:100vw!important;padding:8px!important;border:0!important;box-shadow:none!important}.world{height:690px!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:10px!important}.board{max-width:100%!important;width:100%!important;gap:6px!important}.tile-icon{font-size:36px!important}.tile-name{font-size:12px!important}.modal{width:96vw!important}.overlay{padding:0!important}.sidebar{display:none!important}.town-bubble,#guide{font-size:17px!important}'});
   let placed=0,stories=0,ending=false;
   // The legal actions are choose offered wish, place it on an available plot,
   // then resolve actual neighbor/legend/journey overlays.
   for(let turn=0;turn<7;turn++){
     const outcome=await page.evaluate(()=>{
       const cards=[...document.querySelectorAll('#cards .wish-card')];
       if(!cards.length)return{ready:false};
       cards[0].click();
       const plots=[...document.querySelectorAll('#board .tile.target')];
       if(!plots.length)return{ready:false};
       // Nearby wishes trigger the game's own secret combo discovery.
       const target=plots.sort((a,b)=>Math.abs(Number(a.dataset.pos)-12)-Math.abs(Number(b.dataset.pos)-12))[0];
       target.click();return{ready:true,position:target.dataset.pos};
     });
     if(!outcome.ready)break;
     placed++;await sleep(500);
     for(let j=0;j<8;j++){
       const modal=await page.evaluate(()=>{
         const cover=document.querySelector('#storyModal.show'),freedom=document.querySelector('.freedom-options:not([hidden])'),adventure=document.querySelector('.freedom-adventure:not([hidden])');
         if(freedom){const b=freedom.querySelector('[data-destination]');if(b){b.click();return 'journey';}}
         if(adventure){const buttons=[...adventure.querySelectorAll('[data-memory]')];buttons.slice(0,3).forEach(x=>x.click());const finish=adventure.querySelector('.freedom-finish');if(finish)finish.click();return 'journey-end';}
         if(cover){const b=cover.querySelector('#storyChoices .button');if(b){b.click();return 'story';}}
         return null;
       });
       if(!modal)break;
       if(modal==='story')stories++;
       await sleep(modal==='story'?460:240);
     }
     if(await page.locator('#end.show').count()){ending=true;await sleep(950);break;}
   }
   proof={placed,stories,ending,day:await page.locator('#day').textContent()};
   if(placed<3)throw Error('Tiny Town recording did not construct enough actual wishes: '+JSON.stringify(proof));
   marks=[[0,'NOBODY HAS TO WORK.'],[2.8,'WHAT WOULD YOU BUILD?'],[6.6,'EVERY WISH CHANGES THE TOWN.']];
 }else if(slug==='elsewhere'){
   // A rapid reel of actual illustrated alternate lives and their decisions.
   await page.addStyleTag({content:'.topbar,.game-top,.intro-actions,.footer,.home-audio{display:none!important}.scene-picture{height:540px!important;min-height:540px!important}.scene-picture .dream-art{width:100%!important;height:100%!important}.scene-body{padding:13px!important}.story-line{display:-webkit-box!important;-webkit-line-clamp:3!important;-webkit-box-orient:vertical!important;overflow:hidden!important}.game-place{display:none!important}.choices .choice{min-height:45px!important}.intro{padding:15px!important}.game{padding:0!important}'});
   const ids=['maldives','paris','moon','tokyo'];
   let seen=0,choices=0,twists=0;
   for(const world of ids){
     await page.evaluate(w=>{
       const home=document.querySelector('#home');
       if(home.hidden){document.querySelector('[data-home]')?.click();}
       document.querySelector('[data-world="'+w+'"]')?.click();
     },world);
     const isOn=await page.locator('#game:not([hidden])').count();
     if(!isOn)continue;seen++;await sleep(1250);
     for(let step=0;step<3;step++){
       const a=await page.evaluate(()=>{
         const twist=document.querySelector('#game [data-twist]');
         if(twist){twist.click();return 'twist';}
         const choice=document.querySelector('#game [data-choice]');
         if(choice){choice.click();return 'choice';}
         const next=document.querySelector('#game [data-continue]');
         if(next){next.click();return 'next';}
         return null;
       });
       if(a==='choice')choices++;
       if(a==='twist')twists++;
       await sleep(300);
     }
   }
   proof={worldsOpened:seen,choices,twists};
   if(seen<3||choices<3)throw Error('Elsewhere changed-life footage was not successfully recorded: '+JSON.stringify(proof));
   marks=[[0,'I INHERITED AN ISLAND.'],[3.0,'NEXT LIFE? PARIS.'],[6,'NOW I OWN A HOTEL ON THE MOON.']];
 }
 const dur=(Date.now()-begin)/1000;
 await sleep(600);
 const video=page.video();
 await context.close();
 console.log('ACTUAL GAMEPLAY VERIFIED '+slug+' '+JSON.stringify(proof)+' elapsed '+dur.toFixed(1));
 return{slug,raw:await video.path(),duration:dur+.6,marks};
}
function encode(r){
 const folder=path.join('public','promo',r.slug);fs.mkdirSync(folder,{recursive:true});
 const dest=path.join(folder,'highlight-20261121.mp4'),poster=path.join(folder,'highlight-20261121.jpg');
 const overlay=[];
 for(let i=0;i<r.marks.length;i++){
   const [start,caption]=r.marks[i],end=r.marks[i+1]?.[0]??r.duration;
   const t=path.join(dir,r.slug+'-'+i+'.txt');fs.writeFileSync(t,caption);
   overlay.push('drawtext=fontfile='+font+':textfile='+t+':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=130:box=1:boxcolor=black@0.54:boxborderw=16'+
     ":enable='between(t,"+start.toFixed(2)+','+end.toFixed(2)+")'");
 }
 const voice='drawtext=fontfile='+font+":text='PLAY FREE - LINK IN BIO':fontcolor=white:fontsize=33:x=(w-text_w)/2:y=1758:box=1:boxcolor=black@0.45:boxborderw=10:"+
   "enable='gte(t,"+Math.max(0,r.duration-1.8).toFixed(2)+")'";
 const args=['-nostdin','-y','-hide_banner','-loglevel','error','-i',r.raw,
   '-stream_loop','-1','-i',audio,'-vf','fps=30,scale=1080:1920:flags=lanczos,setsar=1,'+overlay.join(',')+','+voice+',format=yuv420p',
   '-map','0:v:0','-map','1:a:0','-t',r.duration.toFixed(2),'-r','30','-c:v','libx264','-crf','21','-preset','veryfast','-pix_fmt','yuv420p',
   '-c:a','aac','-b:a','128k','-af','volume=0.32,afade=t=out:st='+Math.max(0,r.duration-.65).toFixed(2)+':d=.65','-movflags','+faststart',dest];
 execFileSync('ffmpeg',args,{stdio:'inherit',timeout:120000});
 execFileSync('ffmpeg',['-nostdin','-y','-hide_banner','-loglevel','error','-ss',Math.min(1.3,r.duration*.2).toFixed(2),'-i',dest,'-frames:v','1','-q:v','3',poster],{stdio:'inherit'});
 const streams=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-of','json',dest],{encoding:'utf8'})).streams;
 const bytes=fs.statSync(dest).size;
 if(!streams.some(s=>s.codec_type==='video'&&s.width===1080&&s.height===1920)||!streams.some(s=>s.codec_type==='audio')||bytes<100000||bytes>30000000)throw Error('Invalid final reel '+dest+' '+bytes);
 console.log('RENDERED '+JSON.stringify({slug:r.slug,dest,poster,bytes,duration:r.duration}));
}
let browser;
try{
 await sleep(1200);
 if(!fs.existsSync(audio))throw Error('Licensed background track missing');
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const slug of ['tiny-town','elsewhere','flip-dash','parcel-panic','pocket-aquarium'])encode(await capture(browser,slug));
}finally{
 if(browser)await browser.close();
 server.kill('SIGTERM');fs.rmSync(dir,{recursive:true,force:true});
}
