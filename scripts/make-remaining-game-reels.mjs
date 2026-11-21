// Five more Morrow Wish short-form reels. Real gameplay and gameplay UI only.
// All simulations use legitimate clicks/keys; cannot upload fake scores or scenes.
import {chromium} from 'playwright';
import {promoTrack} from './promo-audio.mjs';
import {spawn,execFileSync} from 'node:child_process';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
const home='http://127.0.0.1:8771',dir=fs.mkdtempSync(path.join(os.tmpdir(),'morrowwish-5-reels-'));
const server=spawn('python3',['-m','http.server','8771','--bind','127.0.0.1','--directory','public'],{stdio:'ignore'});
const font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function addCleanView(mode){
 // Use the actual native portrait fullscreen controller. NEVER display the
 // original 960x540 landscape bitmap inside a forced 9:16 CSS box.
 if(mode==='aquarium'){
  const button=document.querySelector('#mw-mini-fullscreen');
  if(!button)throw Error('Aquarium native fullscreen control missing');
  button.click();
  const frame=document.querySelector('.mw-mini-aquarium-frame');
  if(!frame||!frame.classList.contains('mw-mini-fullscreen-fallback'))
   throw Error('Native aquarium portrait fullscreen did not activate');
  return;
 }
 const button=document.querySelector('#mw-mini-fullscreen');
 if(!button)throw Error('Arcade native fullscreen control missing');
 button.click();
 const canvas=document.getElementById('game');
 const view=window.MorrowwishArcadeViewport?.state;
 if(!view||!view.portrait||canvas.width!==540||canvas.height!==960)
  throw Error('Native 540x960 vertical game bitmap was not activated '+JSON.stringify(view));
 const rect=canvas.getBoundingClientRect(),ratio=rect.width/rect.height;
 if(!(rect.width>200&&rect.height>300&&Math.abs(ratio-9/16)<.035))
  throw Error('Portrait CSS/bitmap aspect mismatch, do not record stretched video '+ratio);
}

// Promotional-only result card: real gameplay status, without displaying
// share panels, settings, long achievements or tiny text at the hook.
function showRealResultCard(title,subline,kind){
 const original=document.getElementById('overlay');
 if(!original||original.hidden)throw Error('No actual finished game state to show');
 original.style.setProperty('display','none','important');
 const card=document.createElement('div');card.className='mw-v3-real-outcome';
 card.textContent=title;
 const note=document.createElement('div');note.textContent=subline;
 Object.assign(card.style,{position:'fixed',zIndex:'2147483646',bottom:'12%',left:'5%',width:'90%',
   boxSizing:'border-box',font:'900 34px/1.25 system-ui',color:'#fff5e7',textAlign:'center',
   padding:'15px 10px',borderRadius:'20px',
   background:kind==='aqua'?'rgba(4,63,65,.88)':'rgba(34,23,61,.88)',
   boxShadow:'0 6px 23px rgba(0,0,0,.23)'});
 Object.assign(note.style,{font:'750 22px/1.4 system-ui',color:'#f7eac7',marginTop:'5px'});
 card.appendChild(note);document.body.appendChild(card);
}
async function session(browser,slug){
  const folder=path.join(dir,slug);fs.mkdirSync(folder,{recursive:true});
  const context=await browser.newContext({viewport:{width:540,height:960},deviceScaleFactor:1,
     recordVideo:{dir:folder,size:{width:540,height:960}},locale:'en-US',isMobile:true,hasTouch:true});
  await context.route('**/api/session**',r=>r.abort('blockedbyclient'));
  await context.route('**/api/elsewhere-collect**',r=>r.abort('blockedbyclient'));
  const born=Date.now();const page=await context.newPage();
  page.on('pageerror',e=>console.log(slug+' console warning: '+e.message.slice(0,150)));
  return{context,page,born};
}
async function capture(browser,slug,record){
 const {context,page,born}=await session(browser,slug);
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
 let marks=[],proof={},chapters={};
 const begin=Date.now();
 if(slug==='flip-dash'){
   await page.evaluate(addCleanView,'arcade');await page.locator('#play-btn').click();
   chapters.action=(Date.now()-begin)/1000;
   for(let n=0;n<5;n++){await page.keyboard.press('Space');await sleep(540);}
   await page.waitForFunction(()=>!document.getElementById('overlay').hidden,null,{timeout:25000});
   chapters.result=(Date.now()-begin)/1000;
   proof=await page.evaluate(()=>({score:Number(document.querySelector('#score')?.textContent)||0,
     outcome:document.querySelector('#overlay-title')?.textContent,gameOver:!document.getElementById('overlay').hidden,
     portrait:window.MorrowwishArcadeViewport?.state}));
   if(!proof.gameOver||proof.portrait?.width!==540)throw Error('Missing genuine portrait failure screen '+JSON.stringify(proof));
   await page.evaluate(showRealResultCard,proof.score+' POINTS · CRASHED','CAN YOU LAST LONGER?','arcade');
   await sleep(2500);
   marks=[[chapters.result,1.7,'ONE WRONG FLIP.'],[chapters.action,3.4,'JUST ONE BUTTON.'],[chapters.result,2.0,'BEAT MY RUN?']];
 }else if(slug==='parcel-panic'){
   await page.evaluate(addCleanView,'arcade');await page.locator('#play-btn').click();
   chapters.action=(Date.now()-begin)/1000;
   let score=0;
   for(let n=0;n<14;n++){await sleep(1110);await page.keyboard.press('2');score=Number(await page.locator('#score').textContent());if(score>=55)break;}
   if(score<25)throw Error('Actual sorting streak absent: '+score);
   chapters.streak=(Date.now()-begin)/1000;
   for(let n=0;n<17;n++){
    await sleep(1050);await page.keyboard.press('1');
    if(await page.evaluate(()=>!document.getElementById('overlay').hidden))break;
   }
   if(await page.evaluate(()=>document.getElementById('overlay').hidden))throw Error('No real game-over after missed packages');
   chapters.result=(Date.now()-begin)/1000;
   proof=await page.evaluate(()=>({score:Number(document.querySelector('#score')?.textContent)||0,
     outcome:document.querySelector('#overlay-title')?.textContent,
     portrait:window.MorrowwishArcadeViewport?.state,gameOver:!document.getElementById('overlay').hidden}));
   await page.evaluate(showRealResultCard,proof.score+' POINTS · GAME OVER','ONE WRONG DELIVERY ENDS THE STREAK','arcade');
   await sleep(2300);
   marks=[[chapters.result,1.6,'ONE WRONG LANE.'],[chapters.action,3.1,'KEEP THE STREAK.'],[chapters.result,2.0,'BEAT MY SCORE?']];
 }else if(slug==='pocket-aquarium'){
   await page.locator('#start').click();await page.evaluate(addCleanView,'aquarium');
   chapters.action=(Date.now()-begin)/1000;let peak=chapters.action,combo=0;
   for(let k=0;k<15;k++){
     const fish=await page.evaluate(()=>window.__MW_FISH__?.()||[]);
     const hungry=fish.filter(f=>f.wait<1.7);
     const options=hungry.length?hungry:fish;
     const target=options[k%Math.max(1,options.length)];if(!target)break;
     await page.evaluate(({type,x,y})=>{
       document.querySelectorAll('.food')[type].click();
       const el=document.getElementById('sea'),r=el.getBoundingClientRect();
       el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:r.left+x,clientY:r.top+y-16,pointerId:3,pointerType:'touch'}));
     },target);
     await sleep(890);
     const current=Number((await page.locator('#comboTxt').textContent()).replace(/\D/g,''))||0;
     if(current>combo){combo=current;peak=(Date.now()-begin)/1000;}
   }
   await page.waitForFunction(()=>!document.getElementById('overlay').hidden,null,{timeout:75000});
   chapters.result=(Date.now()-begin)/1000;
   proof=await page.evaluate(()=>({score:Number(document.querySelector('#score')?.textContent)||0,
     grade:document.querySelector('#modalTip')?.textContent,ending:document.querySelector('#modalTitle')?.textContent,
     done:!document.getElementById('overlay').hidden}));
   proof.bestCombo=combo;
   if(!proof.done||proof.score<90||!proof.grade)throw Error('No genuine aquarium achievement and ending '+JSON.stringify(proof));
   const gradeMatch=(proof.grade||'').match(/Grade\s+([A-D]|S)/i);
   const grade=gradeMatch?.[1]||'?';
   await page.evaluate(showRealResultCard,'GRADE '+grade+' · '+proof.score+' POINTS',
     'BEST COMBO ×'+proof.bestCombo,'aqua');
   await sleep(2800);
   marks=[[chapters.result,2.3,'WHAT GRADE DID I GET?'],[chapters.action,3.3,'MATCH THE FOOD.'],[Math.max(chapters.action,peak-1.2),1.9,'KEEP THE COMBO.'],[chapters.result,2.0,'BEAT MY GRADE?']];
 }else if(slug==='tiny-town'){
   await page.locator('#introStart').click();
   await page.addStyleTag({content:'.arcade-return,.app>.header,.stats,.sidebar .sidebar-head,.sidebar .citizen-panel,.sidebar .petition,.sidebar .pick-hint,.stage .map-panel .city-extras,.app>.progress{display:none!important}.app{padding:0!important;width:100vw!important;max-width:100vw!important}.stage{display:block!important}.map-panel{display:block!important;width:100vw!important;padding:8px!important;border:0!important;box-shadow:none!important}.world{height:690px!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:10px!important}.board{max-width:100%!important;width:100%!important;gap:6px!important}.tile-icon{font-size:36px!important}.tile-name{font-size:12px!important}.modal{width:96vw!important}.overlay{padding:0!important}.sidebar{display:none!important}.town-bubble,#guide{font-size:17px!important}'});
   let placed=0,stories=0,ending=false;chapters.action=(Date.now()-begin)/1000;
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
       if(modal==='story'){stories++;if(!chapters.story){chapters.story=(Date.now()-begin)/1000;await sleep(2100);}}
       await sleep(modal==='story'?460:240);
     }
     if(await page.locator('#end.show').count()){
       ending=true;
       // Playwright-only cinematic framing: retain real end artwork & name,
       // remove tiny paragraphs and achievement tables that hid the scene.
       await page.addStyleTag({content:'#end{overflow:hidden!important;padding:0!important}#end .end-modal{box-sizing:border-box!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;overflow:hidden!important;padding:14px!important;margin:0!important;border:0!important;border-radius:0!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;background:#fffaf5!important}#end .kicker,#end .close-ending,#end #endLine,#end #endStory,#end #endDetail,#end #endReason,#end #endLegacy,#end #endGoal,#end .modal-choices,#end .feedback{display:none!important}#end #endArt{order:0!important;display:block!important;width:100%!important;height:720px!important;flex:0 0 720px!important;overflow:hidden!important}#end #endArt .end-hero-art{height:700px!important;min-height:700px!important;width:100%!important;max-width:100%!important;border-radius:23px!important}#end #endTitle{order:1!important;font-size:30px!important;line-height:1.17!important;max-width:100%!important;margin:16px 0!important;text-align:center!important;color:#51395f!important}'});
       chapters.result=(Date.now()-begin)/1000;await sleep(3600);break;}
   }
   proof={placed,stories,ending,day:await page.locator('#day').textContent()};
   if(placed<6||!ending)throw Error('Missing real 7-day town ending: '+JSON.stringify(proof));
   marks=[[chapters.result,3.0,'NO JOBS. SEVEN DAYS.'],[chapters.action,3.2,'WHAT WOULD YOU BUILD?'],
     ...(chapters.story?[[chapters.story,2.2,'THEN THIS HAPPENED.']]:[]),
     [chapters.result,3.0,'YOUR TOWN. YOUR ENDING.']];
 }else if(slug==='elsewhere'){
   // One COMPLETE life, not four incomprehensible menus flashing for 0.3s.
   await page.addStyleTag({content:'.top,.topbar,.footer,.game-top,.case-topline,.moment-pips,.case-previous,.case-summary,.end-actions,.ending-route-label{display:none!important}#game,#ending{margin:0!important;width:100%!important;max-width:100%!important;padding:0!important}.scene-picture{height:350px!important;min-height:350px!important;max-height:350px!important;overflow:hidden!important}.scene-picture svg{width:100%!important;height:100%!important}.scene-body{padding:14px 18px!important}.scene-body h2{font-size:24px!important;line-height:1.2!important;margin:7px 0!important}.story-line{font-size:19px!important;line-height:1.35!important;max-height:86px!important;overflow:hidden!important}.case-objective{font-size:15px!important;line-height:1.35!important}.choices .choice{font-size:18px!important;min-height:62px!important}.choice strong{font-size:17px!important}.impact p{font-size:20px!important;line-height:1.4!important}.ending-art{height:480px!important;min-height:480px!important}.ending-paper{padding:20px!important;min-height:390px!important}.ending-paper h1{font-size:34px!important;line-height:1.2!important}.ending-paper>p{font-size:19px!important;line-height:1.4!important}'});
   await page.locator('[data-world="paris"]').first().click({timeout:10000});
   chapters.action=(Date.now()-begin)/1000;await sleep(2500);
   for(let n=0;n<5;n++){
     if(n===2||n===4){await page.locator('#game [data-twist]').first().click({timeout:8000});await sleep(n===2?1100:400);}
     await page.locator('#game [data-choice]').first().waitFor({timeout:11000});
     if(n===0){chapters.choice=(Date.now()-begin)/1000;await sleep(2000);}
     await page.locator('#game [data-choice]').first().click();
     if(n===0){chapters.effect=(Date.now()-begin)/1000;await sleep(2100);}
     await page.locator('#game [data-continue]').click({timeout:8000});
     await sleep(510);
   }
   await page.locator('#ending .ending-paper h1').waitFor({timeout:10000});
   chapters.result=(Date.now()-begin)/1000;
   proof={world:'paris',choices:5,ending:await page.locator('#ending .ending-paper h1').textContent(),grade:await page.locator('#ending .case-grade').textContent()};
   if(!proof.ending)throw Error('No genuine interactive Paris ending');
   await sleep(4300);
   marks=[[chapters.result,3.6,'I CHANGED MY LIFE.'],[chapters.action,2.5,'I WOKE UP IN PARIS.'],
     [chapters.choice,1.9,'ONE CHOICE.'],[chapters.effect,2.0,'A NEW FUTURE.'],
     [chapters.result,3.2,'WHICH ENDING IS YOURS?']];
 }
 const dur=(Date.now()-begin)/1000;
 await sleep(600);
 const video=page.video();
 await context.close();
 console.log('ACTUAL GAMEPLAY VERIFIED '+slug+' '+JSON.stringify(proof)+' elapsed '+dur.toFixed(1));
 return{slug,raw:await video.path(),offset:(begin-born)/1000,duration:dur+.6,marks,proof};
}
function encode(r){
 const folder=path.join('public','promo',r.slug);fs.mkdirSync(folder,{recursive:true});
 const dest=path.join(folder,'hook-v3-20261121.mp4');
 const poster=path.join(folder,'hook-v3-20261121.jpg');
 if(!r.marks?.length||!r.proof)throw Error('Missing proof or marketing beats');
 const clips=r.marks.map(([start,duration,caption],i)=>{
  if(duration<.75||start<0||start+duration>r.duration+.2)throw Error('Invalid verified highlight range '+JSON.stringify({start,duration,r}));
  return '[0:v]trim=start='+(r.offset+start).toFixed(3)+':duration='+duration.toFixed(3)+
    ',setpts=PTS-STARTPTS,fps=30,scale=1080:1920:flags=lanczos,setsar=1,format=yuv420p[v'+i+']';
 });
 const concat=r.marks.map((_,i)=>'[v'+i+']').join('')+'concat=n='+r.marks.length+':v=1:a=0[joined]';
 const draw=[];let elapsed=0;
 for(let i=0;i<r.marks.length;i++){
  const [start,dur,caption]=r.marks[i],file=path.join(dir,r.slug+'-beat-'+i+'.txt');fs.writeFileSync(file,caption);
  draw.push('drawtext=fontfile='+font+':textfile='+file+':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=126:box=1:boxcolor=black@0.58:boxborderw=15'+
    ":enable='between(t,"+elapsed.toFixed(3)+','+(elapsed+dur).toFixed(3)+")'");
  elapsed+=dur;
 }
 const f=path.join(dir,r.slug+'-cta.txt');fs.writeFileSync(f,'PLAY FREE  ·  LINK IN BIO');
 draw.push('drawtext=fontfile='+font+':textfile='+f+':fontcolor=white:fontsize=38:x=(w-text_w)/2:y=1745:box=1:boxcolor=black@0.56:boxborderw=13'+
    ":enable='gte(t,"+Math.max(0,elapsed-2).toFixed(3)+")'");
 const filter=clips.join(';')+';'+concat+';[joined]'+draw.join(',')+',format=yuv420p[v]';
 execFileSync('ffmpeg',['-nostdin','-y','-hide_banner','-loglevel','error',
  '-i',r.raw,'-stream_loop','-1','-i',promoTrack(r.slug),
  '-filter_complex',filter,'-map','[v]','-map','1:a:0','-t',elapsed.toFixed(3),'-r','30',
  '-c:v','libx264','-crf','20','-preset','veryfast','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k',
  '-af','volume=0.28,afade=t=out:st='+Math.max(0,elapsed-.6).toFixed(3)+':d=0.6',
  '-movflags','+faststart',dest],{stdio:'inherit',timeout:180000});
 execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss','0.75','-i',dest,'-frames:v','1','-q:v','3',poster],{stdio:'inherit'});
 const streams=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-of','json',dest],{encoding:'utf8'})).streams;
 const bytes=fs.statSync(dest).size;
 if(!streams.some(q=>q.codec_type==='video'&&q.width===1080&&q.height===1920)||!streams.some(q=>q.codec_type==='audio')||bytes<120000||bytes>30000000)throw Error('Invalid real portrait reel '+dest+' '+bytes);
 const review=[];
 for(let i=0;i<3;i++){
  const sec=i===0?.8:i===1?elapsed*.47:elapsed-1,file=path.join(folder,'hook-v3-review-'+(i+1)+'.jpg');
  execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss',Math.max(0,sec).toFixed(3),'-i',dest,'-frames:v','1','-q:v','3',file],{stdio:'inherit'});
  if(fs.statSync(file).size<11000)throw Error('Unusable QC frame '+file);
  review.push('/promo/'+r.slug+'/hook-v3-review-'+(i+1)+'.jpg');
 }
 console.log('HOOK V3 ACTUAL-GAME REVIEW '+JSON.stringify({slug:r.slug,seconds:elapsed,bytes,proof:r.proof,review}));
}
let browser;
try{
 await sleep(1200);
 for(const slug of ['tiny-town','elsewhere','flip-dash','parcel-panic','pocket-aquarium'])promoTrack(slug);
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const slug of ['tiny-town','elsewhere','flip-dash','parcel-panic','pocket-aquarium'])encode(await capture(browser,slug));
}finally{
 if(browser)await browser.close();
 server.kill('SIGTERM');fs.rmSync(dir,{recursive:true,force:true});
}
