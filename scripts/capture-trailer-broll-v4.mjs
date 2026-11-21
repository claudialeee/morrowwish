// Produce additional real-gameplay footage for cinematic review trailers.
// Recording does NOT publish to social platforms. It never fabricates an achievement.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const dir=process.env.MW_V4_BROLL_DIR||path.join(process.env.RUNNER_TEMP||os.tmpdir(),'morrowwish-v4-broll');
const host='http://127.0.0.1:8795';
fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(path.join(dir,'raw'),{recursive:true});
const server=spawn('python3',['-m','http.server','8795','--bind','127.0.0.1','--directory','public'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function realVerticalCamera(id){
 const source=document.getElementById(id);
 if(!source)throw Error('Cannot frame real gameplay scene '+id);
 const output=document.createElement('canvas');output.id='mw-v5-camera';output.width=540;output.height=960;output.style.display='none';
 Object.assign(output.style,{position:'fixed',inset:'0',height:'100vh',width:'100vw',
 zIndex:'2147483647',pointerEvents:'none',background:'#241a37'});
 document.body.appendChild(output);
 const ctx=output.getContext('2d',{alpha:false});
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 let focus=0.5;
 window.__V4_CAMERA__={setFocus(v){focus=Math.max(.18,Math.min(.82,v))},show(v){output.style.display=v?'block':'none'}};
 function paint(){
  const sw=source.width,sh=source.height;
  ctx.fillStyle='#241a37';ctx.fillRect(0,0,540,960);
  if(sw>10&&sh>10){
   // Trim 3% safe margins to remove any edge artifacts while retaining
   // exact 9:16 pixel aspect; never stretch a landscape game.
   const ch=sh*0.80,cw=ch*540/960,available=sw*.94;
   const w=Math.min(cw,available),h=w*960/540;
   const sx=Math.max(sw*.03,Math.min(sw*.97-w,sw*focus-w/2));
   const sy=Math.max(0,Math.min(sh-h,sh*.64-h/2));
   ctx.drawImage(source,sx,sy,w,h,0,0,540,960);
  }
  requestAnimationFrame(paint);
 }requestAnimationFrame(paint);
}
async function capture(browser,slug,fn){
 const context=await browser.newContext({viewport:{width:540,height:960},deviceScaleFactor:1,
   recordVideo:{dir:path.join(dir,'raw'),size:{width:540,height:960}},locale:'en-US'});
 const page=await context.newPage(),born=Date.now(),errors=[];
 page.on('pageerror',e=>errors.push(e.message.slice(0,180)));
 await context.route('**/api/session**',r=>r.abort('blockedbyclient'));
 const stamp=()=>+(Date.now()-born)/1000;
 const shots=await fn({page,stamp});
 const video=page.video();await context.close();
 const src=await video.path(),dst=path.join(dir,slug+'.webm');
 fs.renameSync(src,dst);
 if(errors.length)throw Error('Unreviewed browser errors during '+slug+': '+errors.join(' | '));const data={slug,file:dst,shots,errors};
 console.log('REAL BROLL '+JSON.stringify({slug,shots,errors}));
 return data;
}
let browser;
try{
 await sleep(1300);
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 // Use OFFICIAL current game art in the trailer, not invented game scenes.
 // No stretched landscape art: the cover is composed with CSS object-fit:cover.
 const coverPage=await browser.newPage({viewport:{width:540,height:960},deviceScaleFactor:1});
 const svg=fs.readFileSync('public/art/cat-bond-scene.svg').toString('base64');
 await coverPage.setContent('<!doctype html><html><body style="margin:0;overflow:hidden;background:linear-gradient(160deg,#25193e 0%,#503466 46%,#c78c77 100%);display:flex;align-items:center;justify-content:center;width:100vw;height:100vh"><img style="width:125vw;height:85vh;object-fit:cover;object-position:center;border-radius:32px;box-shadow:0 25px 45px #170c2477" src="data:image/svg+xml;base64,'+svg+'"></body></html>');
 await coverPage.waitForTimeout(550);
 fs.mkdirSync('public/promo/cat-bond',{recursive:true});
 await coverPage.screenshot({path:'public/promo/cat-bond/cover-portrait.png'});
 await coverPage.close();
 const result=[];
 // Every scene below is a new browser recording. Fail rather than substitute an
 // unrelated old V3 edit or a synthetic, unearned gameplay achievement.
 result.push(await capture(browser,'cat-bond',async({page,stamp})=>{
  await page.goto(host+'/cat-bond/?autodev&lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.__game?.yard&&window.State?.S?.cats?.length>=3,{timeout:19000});
  await page.evaluate(realVerticalCamera,'scene');
  const shots=[];
  const mark=async(label,ms)=>{
   const start=stamp();await sleep(ms);shots.push({label,start,duration:(stamp()-start)-.08});
  };
  await mark('yard',2650);
  await page.evaluate(()=>UI.openRoster());
  await page.waitForSelector('#panel.open .card');
  await mark('raising',2600);
  await page.evaluate(()=>{UI.closeAll();UI.openWorkshop()});
  await page.waitForSelector('#panel.open .work-earn-header');
  await mark('work-before',1700);
  const assigned=await page.evaluate(()=>{
   document.getElementById('work-quick-start')?.click();
   const sun=Raising.stationsView().find(s=>s.type==='sun');
   return !!sun?.active;
  });
  if(!assigned)throw Error('V5 proof missing: actual cat assigned to earning station');
  await mark('work-after',2550);
  await page.evaluate(()=>{UI.closeAll();UI.openTease()});
  await page.waitForSelector('#tease-area canvas');
  const playStart=stamp();
  for(let i=0;i<6;i++){
   await page.locator('#tease-area').click({position:{x:140+(i%3)*68,y:80+(i%2)*50}});
   await sleep(420);
  }
  shots.push({label:'tease',start:playStart,duration:stamp()-playStart-.08});
  await page.evaluate(()=>{UI.closeAll();window.__game.openWorldMap()});
  await page.waitForSelector('#panel.open .map-destination');
  await mark('map-choice',2100);
  const entered=await page.evaluate(()=>{
   UI.closeAll();const ok=WorldMap.enterRegion('home');
   window.__V4_CAMERA__.show(true);return ok&&window.__game.scene==='map';
  });
  if(!entered)throw Error('V5 proof missing: entered a real explorable region');
  await mark('map-explore',2850);
  await page.evaluate(()=>{
   window.__V4_CAMERA__.show(false);
   window.__game.scene='yard';window.__game.showYardChrome();
   State.S.battlePrefs={...(State.S.battlePrefs||{}),manualTutorialSeen:true,tutorialSeen:true,autoBattle:true};
   const wild=GameData.SPECIES.find(s=>s.rarity==='SR')||GameData.SPECIES.at(-1);
   window.__game.startBattle(State.S.cats.slice(0,3),wild);
   window.__V4_CAMERA__.show(true);
  });
  await mark('battle',3350);
  const labels=shots.map(s=>s.label);
  for(const required of ['raising','work-after','tease','map-explore','battle'])if(!labels.includes(required))throw Error('Missing actual Cat Bond feature '+required);
  return shots;
 }));
 result.push(await capture(browser,'pawsibly-innocent',async({page,stamp})=>{
  await page.goto(host+'/pawsibly-innocent/?platform=crazygames&lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.__PAWSIBLY_TEST__?.getState(),{timeout:12000});
  await page.evaluate(()=>{
   const source=document.getElementById('board'),out=document.createElement('canvas');
   out.id='mw-v5-chase-camera';out.width=540;out.height=960;
   Object.assign(out.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',zIndex:'2147483647',pointerEvents:'none'});
   document.body.appendChild(out);
   const ctx=out.getContext('2d');ctx.imageSmoothingEnabled=true;
   window.__V5_FOCUS__='both';
   window.__V5_SHOW__=on=>out.style.display=on?'block':'none';
   let cx=0;
   function draw(){
    const s=window.__PAWSIBLY_TEST__?.getState();
    if(s&&source.width&&source.height){
     const vis=588*540/960,a=s.cat||{x:2},h=s.human||{x:7};
     const mid=window.__V5_FOCUS__==='human'?h.x:window.__V5_FOCUS__==='cat'?a.x:.47*a.x+.53*h.x;
     const want=Math.max(0,Math.min(840-vis,(mid+.5)*84-vis/2));
     cx+=(want-cx)*.18;
     ctx.drawImage(source,cx*source.width/840,0,vis*source.width/840,source.height,0,0,540,960);
    }
    requestAnimationFrame(draw);
   }draw();
  });
  const shots=[],api=()=>window.__PAWSIBLY_TEST__;
  const sneak=stamp();
  // Keep the successful attempt continuous: do NOT move four squares and
  // silently restart before the yarn throw (that broke the previous advert).
  await sleep(1570);
  shots.push({label:'sneak',start:sneak,duration:stamp()-sneak-.07});
  const decoy=stamp();
  await page.evaluate(()=>{
   const a=window.__PAWSIBLY_TEST__;a.throwYarn();if(!a.throwYarnTo({x:9,y:1}))throw Error('Real yarn distraction rejected');
   window.__V5_FOCUS__='human';
  });
  await sleep(2600);shots.push({label:'distraction',start:decoy,duration:2.48});
  await page.waitForFunction(()=>!window.__PAWSIBLY_TEST__.isChasing(),null,{timeout:10000});
  await page.evaluate(()=>window.__V5_FOCUS__='cat');
  const escape=stamp();
  let state;
  for(const [dx,dy] of [[1,0],[0,1],[0,1],[0,1],[1,0],[1,0],[1,0],[1,0],[1,0],[0,-1],[1,0],[0,1],[1,0]]){
   state=await page.evaluate(([x,y])=>{
    window.__PAWSIBLY_TEST__.move(x,y);const s=window.__PAWSIBLY_TEST__.getState();
    return{won:s.winning,done:s.done,got:s.got,yarn:s.yarnThrows};
   },[dx,dy]);await sleep(300);if(state.done)break;
  }
  if(!state?.won||state.got<3)throw Error('V5 escape must be earned by 3 genuine collected fish: '+JSON.stringify(state));
  const escapedAt=stamp();
  shots.push({label:'escape-run',start:escape,duration:Math.min(3.3,escapedAt-escape-.07)});
  await page.evaluate(()=>window.__V5_SHOW__(false));
  await sleep(1250);
  shots.push({label:'escaped',start:escapedAt,duration:1.12});
  // Explicitly separate this from the win: a different attempt, no jump cut
  // disguised as one continuous run.
  // A separate, explicitly labelled LATER ROOM for the caught sequence.
  // A legal misplay in level six is more convincing than faking a loss in the
  // forgiving tutorial level. The two runs are never presented as one run.
  await page.evaluate(()=>{window.__PAWSIBLY_TEST__.choose(5,false);window.__V5_SHOW__(true);window.__V5_FOCUS__='both'});
  const caughtRun=stamp();let caughtAt=null,lastLoss=null;
  for(let i=0;i<28;i++){
   lastLoss=await page.evaluate(()=>{
    const api=window.__PAWSIBLY_TEST__,s=api.getState();
    const dx=s.cat.x<s.human.x?1:s.cat.x>s.human.x?-1:0;
    const dy=s.cat.y<s.human.y?1:s.cat.y>s.human.y?-1:0;
    // Legal directional moves only; the game itself enforces sight,
    // enemy pursuit, invincibility and catching.
    const tries=dx?[[dx,0],[0,dy||1],[0,-1],[-dx,0]]:[[0,dy],[1,0],[-1,0],[0,-dy]];
    for(const [x,y] of tries){
      if(!x&&!y)continue;
      const before={...s.cat};
      api.move(x,y);
      const t=api.getState();
      if(t.lives<3||before.x!==t.cat.x||before.y!==t.cat.y)break;
    }
    const q=api.getState();
    return{lives:q.lives,cat:q.cat,human:q.human,exposure:q.exposure,steps:q.steps};
   });
   await sleep(260);
   if(lastLoss.lives<3){caughtAt=stamp();break}
  }
  if(!caughtAt)throw Error('V5 missing real caught state; no fake failure is allowed '+JSON.stringify(lastLoss));
  shots.push({label:'caught-chase',start:caughtRun,duration:Math.max(.65,Math.min(3.3,caughtAt-caughtRun-.75))});
  shots.push({label:'caught',start:Math.max(caughtRun,caughtAt-.70),duration:1.45});
  await sleep(1050);
  return shots;
 }));
 result.push(await capture(browser,'tiny-town',async({page,stamp})=>{
  await page.goto(host+'/tiny-town/?lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#introStart').click();
  // Keep the complete board and ALL actual combination/unlock/end dialogs visible.
  await page.addStyleTag({content:'.arcade-return,.app>.header,.app>.progress,.sidebar .citizen-panel,.sidebar .petition,.sidebar .sidebar-head{display:none!important}.app{max-width:100vw!important;width:100vw!important;padding:0!important}.stage{display:block!important}.map-panel{width:100%!important;padding:8px!important}.world{height:615px!important;padding:5px!important}.board{max-width:510px!important;width:100%!important;gap:5px!important}.tile-icon{font-size:36px!important}.sidebar{width:100%!important}.wish-card{min-height:84px!important}.modal{width:min(96vw,520px)!important;max-height:88vh!important;overflow:auto!important}'});
  const started=stamp(),shots=[{label:'board',start:stamp(),duration:2.75}];
  let comboAt=null,legendAt=null,endAt=null,buildLate=null,placed=0;
  for(let day=1;day<=7;day++){
   const action=await page.evaluate(()=>{
    const cards=[...document.querySelectorAll('#cards .wish-card')];
    let best=null;
    for(let i=0;i<cards.length;i++){
     cards[i].click();
     const targets=[...document.querySelectorAll('#board .tile.target')];
     const winning=targets.find(t=>t.classList.contains('jackpot'));
     const match=(cards[i].textContent||'').match(/Imagination\s*\+\s*(\d+)/i);
     const val=(winning?500:0)+(match?Number(match[1]):0);
     if(targets.length&&(!best||val>best.val))best={i,val,pos:(winning||targets[Math.floor(targets.length/2)]).dataset.pos};
    }
    if(!best)return null;
    cards[best.i].click();
    const target=document.querySelector('#board .tile.target[data-pos="'+best.pos+'"]');
    if(!target)throw Error('Actual selected town plot disappeared');
    target.click();
    return{day,choice:best.i,pos:best.pos,combo:Number(document.querySelector('#comboNum')?.textContent)||0};
   });
   if(!action)break;placed++;
   if(day===2)buildLate=stamp();
   if(action.combo>0&&!comboAt)comboAt=stamp();
   if(day===3||day===4||day===5){
    if(!legendAt&&await page.evaluate(()=>!!document.querySelector('#cards .legendary-card')||document.querySelector('#tabLegends')?.textContent?.includes('1')))legendAt=stamp();
   }
   await sleep(850);
   for(let j=0;j<13;j++){
    const state=await page.evaluate(()=>{
     if(document.querySelector('#storyModal.show #storyChoices .button'))return 'story';
     if(document.querySelector('.freedom-options:not([hidden]) [data-destination]'))return 'travel';
     if(document.querySelector('.freedom-adventure:not([hidden]) .freedom-finish'))return 'finish';
     return null;
    });
    if(!state)break;
    if((comboAt!==null&&Math.abs(stamp()-comboAt)<2)||state==='story')await sleep(450);
    await page.evaluate(mode=>{
     (mode==='story'?document.querySelector('#storyModal.show #storyChoices .button'):
      mode==='travel'?document.querySelector('.freedom-options:not([hidden]) [data-destination]'):
      document.querySelector('.freedom-adventure:not([hidden]) .freedom-finish'))?.click();
    },state);
    await sleep(280);
   }
   if(!legendAt&&await page.evaluate(()=>!!document.querySelector('#cards .legendary-card')))legendAt=stamp();
   if(await page.locator('#end.show').count()){endAt=stamp();await sleep(3650);break}
   await sleep(300);
  }
  const comboCount=Number(await page.locator('#comboNum').textContent())||0;
  const ending=await page.locator('#endTitle').textContent();
  if(placed!==7||!comboCount||!endAt||!ending)throw Error('V5 requires REAL 7-day town, combo and ending '+JSON.stringify({placed,comboCount,endAt,ending}));
  if(!legendAt)throw Error('V5 requires actual legendary unlock footage, not an invented unlock');
  shots[0].duration=Math.min(shots[0].duration,Math.max(.85,stamp()-started));
  shots.push({label:'board-later',start:buildLate||started+3,duration:2.5});
  shots.push({label:'combination',start:Math.max(started,comboAt-.35),duration:2.8});
  shots.push({label:'legendary',start:Math.max(started,legendAt-.25),duration:2.85});
  shots.push({label:'ending',start:endAt,duration:3.35});
  console.log('V5 TOWN VERIFIED '+JSON.stringify({placed,comboCount,ending,legendAt}));
  return shots;
 }));
 result.push(await capture(browser,'elsewhere',async({page,stamp})=>{
  await page.goto(host+'/elsewhere/?lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.addStyleTag({content:'main{padding:0 13px!important}.top{height:54px!important}.game-top{height:39px!important}#game{margin:0 auto!important;width:100%!important;max-width:100%!important}.scene{display:block!important;height:auto!important;min-height:0!important}.scene-picture{height:210px!important;min-height:210px!important;max-height:210px!important;aspect-ratio:auto!important}.scene-body{height:auto!important;max-height:none!important;overflow:visible!important;padding:12px 15px 15px!important}.scene-body>.story-line{font-size:13px!important;line-height:1.4!important;margin-bottom:11px!important}.scene-body>h2{font-size:19px!important;line-height:1.22!important;margin-bottom:8px!important}.scene .choice{min-height:52px!important;padding:8px 11px!important}.scene .choices{grid-template-columns:1fr!important;gap:6px!important}.scene .choice strong{font-size:12.5px!important}.scene-body .progress-track{margin-bottom:7px!important}.scene-body .moment-pips{margin-bottom:5px!important}.scene .case-objective{margin-bottom:7px!important}.scene .case-topline{margin-bottom:6px!important}.scene .case-previous{margin-bottom:6px!important}'});
  const checkFull=async world=>await page.evaluate(id=>{
    const el=document.querySelector('#game .scene'),choices=[...document.querySelectorAll('#game [data-choice]')],r=el?.getBoundingClientRect();
    if(!r||!choices.length||r.top<0||r.left<0||r.right>innerWidth+1||r.bottom>innerHeight-10||document.documentElement.scrollWidth>innerWidth+2)throw Error('V5 native Elsewhere phone UI clipped for '+id+' '+JSON.stringify({rect:r&&{top:r.top,bottom:r.bottom,left:r.left,right:r.right},height:innerHeight,width:innerWidth,choices:choices.length}));
    if(choices.some(c=>{const x=c.getBoundingClientRect();return x.bottom>innerHeight||x.right>innerWidth}))throw Error('V5 Elsewhere choice off screen '+id);
  },world);
  const shots=[],homeAt=stamp();await sleep(2500);shots.push({label:'choose-life',start:homeAt,duration:2.3});
  for(const world of ['paris','amalfi','tokyo','moon']){
   await page.locator('[data-world="'+world+'"]').first().click({timeout:9000});
   await sleep(350);await checkFull(world);
   const begin=stamp();await sleep(3250);
   shots.push({label:world,start:begin,duration:3.1});
   await page.locator('#game [data-choice]').first().click();
   await sleep(260);
   const resultAt=stamp();await sleep(1600);
   shots.push({label:world+'-result',start:resultAt,duration:1.45});
   await page.evaluate(()=>document.querySelector('#game [data-home]')?.click());
   await sleep(300);
  }
  return shots;
 }));
 // Mini-game ads: chronological actual play -> genuine impact -> resulting
 // failure or timer ending. Re-record from native portrait game, never reuse
 // V3's baked "already dead" captions.
 result.push(await capture(browser,'flip-dash',async({page,stamp})=>{
  await page.goto(host+'/flip-dash/?lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.evaluate(()=>document.querySelector('#mw-mini-fullscreen')?.click());
  await page.waitForFunction(()=>window.MorrowwishArcadeViewport?.state?.portrait===true,{timeout:8500});
  await page.locator('#play-btn').click();
  const begun=stamp();
  for(let i=0;i<5;i++){await page.keyboard.press('Space');await sleep(540)}
  await page.waitForFunction(()=>!document.querySelector('#overlay').hidden,null,{timeout:25000});
  const died=stamp();
  if(died-begun<1.2)throw Error('V5 flip collision has no preceding gameplay');
  await sleep(1700);
  return [{label:'play',start:begun,duration:Math.min(4.1,died-begun-.4)},
    {label:'crash',start:Math.max(begun,died-.7),duration:2.0}];
 }));
 result.push(await capture(browser,'parcel-panic',async({page,stamp})=>{
  await page.addInitScript(()=>{Math.random=()=>.348});
  await page.goto(host+'/parcel-panic/?lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.evaluate(()=>document.querySelector('#mw-mini-fullscreen')?.click());
  await page.waitForFunction(()=>window.MorrowwishArcadeViewport?.state?.portrait===true,{timeout:8500});
  await page.locator('#play-btn').click();
  const began=stamp();let score=0;
  for(let n=0;n<14;n++){await sleep(1110);await page.keyboard.press('2');score=Number(await page.locator('#score').textContent());if(score>=55)break}
  if(score<25)throw Error('V5 parcel run has no verified successful deliveries '+score);
  const streak=stamp();
  for(let n=0;n<17;n++){await sleep(1050);await page.keyboard.press('1');if(await page.evaluate(()=>!document.querySelector('#overlay').hidden))break}
  if(await page.evaluate(()=>document.querySelector('#overlay').hidden))throw Error('V5 parcel run has no real missed-delivery ending');
  const failed=stamp();await sleep(1750);
  return [{label:'deliver',start:Math.max(began,streak-3.8),duration:Math.min(3.5,streak-began)},
    {label:'wrong-lane',start:Math.max(streak,failed-2.65),duration:Math.min(2.3,failed-streak-.1)},
    {label:'game-over',start:Math.max(streak,failed-.6),duration:1.95}];
 }));
 result.push(await capture(browser,'pocket-aquarium',async({page,stamp})=>{
  await page.goto(host+'/pocket-aquarium/?lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#start').click();
  await page.evaluate(()=>document.querySelector('#mw-mini-fullscreen')?.click());
  await page.waitForFunction(()=>!!document.querySelector('.mw-mini-aquarium-frame.mw-mini-fullscreen-fallback'),{timeout:8500});
  const first=stamp();
  const foods=page.locator('.food');
  for(let n=0;n<4;n++){await foods.nth(n%3).click();await page.locator('#sea').click({position:{x:120+n*45,y:190+(n%2)*40}});await sleep(650)}
  const played=stamp();await page.waitForFunction(()=>Number(document.querySelector('#time')?.textContent||100)<=7,null,{timeout:70000});
  const murkyAt=stamp(),quality=Number((await page.locator('#waterTxt').textContent()).replace('%',''));
  await page.waitForFunction(()=>!document.querySelector('#overlay').hidden,null,{timeout:14000});
  const timeout=stamp(),finalQ=Number((await page.locator('#waterTxt').textContent()).replace('%',''));
  const grade=await page.locator('#modalTip').textContent(),score=Number(await page.locator('#score').textContent());
  if(finalQ>=55||score>=220||!/Grade\s+[CD]/i.test(grade))throw Error('V5 aquarium must show actual cloudy water and low grade '+JSON.stringify({quality,finalQ,score,grade}));
  await sleep(1850);
  return [{label:'feeding',start:first,duration:Math.min(3.2,played-first-.1)},
    {label:'water-cloudy',start:murkyAt,duration:Math.min(3.2,timeout-murkyAt-.15)},
    {label:'timeout',start:Math.max(murkyAt,timeout-.55),duration:2.0}];
 }));
 const manifest={createdAt:new Date().toISOString(),kind:'V5-all-seven-authentic-chronological-gameplay-not-posted',broll:result};
 fs.writeFileSync(path.join(dir,'broll-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
}finally{
 if(browser)await browser.close();server.kill('SIGTERM');
}
