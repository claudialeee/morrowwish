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
 let focus=0.5,mode='focus';
 window.__V4_CAMERA__={setFocus(v){focus=Math.max(.18,Math.min(.82,v))},setMode(v){mode=v},show(v){output.style.display=v?'block':'none'}};
 function paint(){
  const sw=source.width,sh=source.height;
  ctx.fillStyle='#241a37';ctx.fillRect(0,0,540,960);
  if(sw>10&&sh>10){
   if(mode==='arena'){const w=540,h=w*sh/sw;ctx.drawImage(source,0,0,sw,sh,0,(960-h)/2,w,h);requestAnimationFrame(paint);return;}

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
   recordVideo:{dir:path.join(dir,'raw'),size:{width:540,height:960}},locale:'en-US',isMobile:true,hasTouch:true});
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
  // Promo-only teaser framing. The native phone panel is stretched almost
  // full-screen and leaves a giant white blank below the tiny cat.
  // Fit it to actual live controls so the yard remains visible in the shot.
  await page.addStyleTag({content:'#panel.open:has(#tease-area){top:50px!important;bottom:59px!important;align-items:center!important;justify-content:center!important;padding:12px!important}#panel.open>.card:has(#tease-area){height:auto!important;min-height:0!important;max-height:510px!important;flex:0 0 auto!important;overflow:hidden!important;align-self:center!important}#panel.open .card:has(#tease-area) #tease-area{height:220px!important}'});
  await page.evaluate(()=>{UI.closeAll();UI.openTease()});
  await page.waitForSelector('#tease-area canvas');
  const playStart=stamp();
  for(let i=0;i<6;i++){
   await page.locator('#tease-area').click({position:{x:140+(i%3)*68,y:80+(i%2)*50}});
   await sleep(420);
  }
  shots.push({label:'tease',start:playStart,duration:stamp()-playStart-.08});
  await page.addStyleTag({content:'#panel.open:has(.map-destination){top:55px!important;bottom:65px!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:12px!important}#panel.open>.card:has(.map-destination){height:auto!important;min-height:0!important;max-height:650px!important;flex:0 0 auto!important;overflow:hidden!important;align-self:center!important}'});
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
   window.__V4_CAMERA__.show(false);window.__game.scene='yard';window.__game.showYardChrome();
   const cats=State.S.cats.slice(0,3);
   CatRelations.grow(cats[0],cats[1],75);CatRelations.choose(cats[0],cats[1]);
   State.S.battlePrefs={...(State.S.battlePrefs||{}),manualTutorialSeen:true,tutorialSeen:true,autoBattle:false};
   const wild=GameData.SPECIES.find(s=>s.rarity==='SSR')||GameData.SPECIES.at(-1);
   window.__game.startBattle(cats,wild);
   window.__V4_CAMERA__.setMode('arena');window.__V4_CAMERA__.show(true);
  });
  if(!await page.evaluate(()=>!!window.__game.battle?.duo))throw Error('V6 no actual two-cat combo');
  await mark('battle-intro',1800);
  const duo=await page.evaluate(()=>{
   const b=window.__game.battle;if(!b||b.done)return{cast:false,reason:'battle ended'};
   b.duoCharge=100;b.duoCd=0;return{cast:b.castDuo(),uses:b.duoUses,cinematic:!!b.duoCinematic};
  });
  if(!duo.cast||duo.uses<1||!duo.cinematic)throw Error('V6 real duo missing '+JSON.stringify(duo));
  await mark('duo',3300);
  const ult=await page.evaluate(()=>{
   const b=window.__game.battle;if(!b||b.done)return{cast:false,reason:'battle ended'};
   b.ult=100;b.ultCd=0;const cast=b.ultimate(),name=b.ultCinematic?.name;
   return{cast,cinematic:!!b.ultCinematic,name,hasChinese:/[\u3400-\u9fff]/.test(name||'')};
  });
  if(!ult.cast||!ult.cinematic||ult.hasChinese)throw Error('V6 real ultimate missing '+JSON.stringify(ult));
  await mark('ultimate',3400);
  console.log('V6 REAL CAT COMBAT '+JSON.stringify({duo,ult}));
  const labels=shots.map(s=>s.label);
  for(const required of ['raising','work-after','tease','map-explore','battle-intro','duo','ultimate'])if(!labels.includes(required))throw Error('Missing actual Cat Bond feature '+required);
  return shots;
 }));
 result.push(await capture(browser,'pawsibly-innocent',async({page,stamp})=>{
  await page.goto(host+'/pawsibly-innocent/?platform=crazygames&lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.__PAWSIBLY_TEST__?.getState(),null,{timeout:12000});
  // Keep the whole real board visible throughout both attempts. A cropped
  // follow-cam previously hid the human and made legal moves look like teleports.
  await page.evaluate(()=>{
   const source=document.getElementById('board'),out=document.createElement('canvas');
   out.width=540;out.height=960;out.id='mw-v6-full-board';
   Object.assign(out.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',zIndex:'2147483647',pointerEvents:'none'});
   document.body.appendChild(out);
   const ctx=out.getContext('2d',{alpha:false});
   function paint(){
    ctx.fillStyle='#241a37';ctx.fillRect(0,0,540,960);
    const s=window.__PAWSIBLY_TEST__?.getState();
    if(s&&source.width&&source.height){
     // Enlarged *real gameplay* is blurred only behind the undistorted board.
     ctx.save();ctx.filter='blur(27px) brightness(0.47)';
     ctx.drawImage(source,0,0,source.width,source.height,-480,0,1500,960);
     ctx.restore();
     const h=540*source.height/source.width,y=(960-h)/2;
     ctx.drawImage(source,0,0,source.width,source.height,0,y,540,h);
     ctx.fillStyle='#fff7ec';ctx.font='bold 25px system-ui,sans-serif';
     ctx.fillText('FISH '+s.got+'/3',28,760);
     if(s.winning)ctx.fillText('ESCAPED!',28,815);
     else if(s.lives<3)ctx.fillText('CAUGHT!',28,815);
    }
    requestAnimationFrame(paint);
   }paint();
  });
  const shots=[],first=stamp();
  await sleep(1250);
  await page.evaluate(()=>{
   const a=window.__PAWSIBLY_TEST__;a.throwYarn();
   if(!a.throwYarnTo({x:9,y:1}))throw Error('The real yarn distraction failed');
  });
  await sleep(2650);
  await page.waitForFunction(()=>!window.__PAWSIBLY_TEST__.isChasing(),null,{timeout:10000});
  let win;
  for(const [dx,dy] of [[1,0],[0,1],[0,1],[0,1],[1,0],[1,0],[1,0],[1,0],[1,0],[0,-1],[1,0],[0,1],[1,0]]){
   win=await page.evaluate(([x,y])=>{
    window.__PAWSIBLY_TEST__.move(x,y);const s=window.__PAWSIBLY_TEST__.getState();
    return{won:s.winning,done:s.done,got:s.got};
   },[dx,dy]);await sleep(400);if(win.done)break;
  }
  if(!win?.won||win.got<3)throw Error('Continuous successful escape does not collect three real fish '+JSON.stringify(win));
  await sleep(1400);
  shots.push({label:'escape-attempt',start:first,duration:stamp()-first-.1});
  // Explicit second run. The cut is at the start of a NEW room, never in
  // the middle of movement. A different outcome comes from actual game rules.
  await page.evaluate(()=>window.__PAWSIBLY_TEST__.choose(5,false));
  const second=stamp();await sleep(800);
  let caught=false,last;
  for(let i=0;i<30;i++){
   last=await page.evaluate(()=>{
    const api=window.__PAWSIBLY_TEST__,s=api.getState();
    const dx=s.cat.x<s.human.x?1:s.cat.x>s.human.x?-1:0;
    const dy=s.cat.y<s.human.y?1:s.cat.y>s.human.y?-1:0;
    const tries=dx?[[dx,0],[0,dy||1],[0,-1],[-dx,0]]:[[0,dy],[1,0],[-1,0],[0,-dy]];
    for(const [x,y] of tries){
     if(!x&&!y)continue;
     const before={...s.cat};api.move(x,y);const next=api.getState();
     if(next.lives<3||before.x!==next.cat.x||before.y!==next.cat.y)break;
    }
    const q=api.getState();return{lives:q.lives,cat:q.cat,human:q.human,steps:q.steps};
   });
   await sleep(390);
   if(last.lives<3){caught=true;break}
  }
  if(!caught)throw Error('The second continuous run never gets caught '+JSON.stringify(last));
  await sleep(1250);
  shots.push({label:'caught-attempt',start:second,duration:stamp()-second-.12});
  console.log('V6 CAT HEIST UNBROKEN RUNS VERIFIED '+JSON.stringify({win,caught:last}));
  return shots;
 }));
 result.push(await capture(browser,'tiny-town',async({page,stamp})=>{
  await page.goto(host+'/tiny-town/?lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#introStart').click();
  // Marketing gameplay MUST show the real board. Avoid the zero-height flex collapse.
  await page.addStyleTag({content:'.arcade-return,.app>.header,.app>.progress,.app .resident-ribbon,.app .town-tabs,.app #moveWish,.app .citizen-panel,.app .petition,.app .sidebar-head{display:none!important}.app{max-width:100vw!important;width:100vw!important;padding:0!important}.app .stage{display:flex!important;flex-direction:column!important;gap:6px!important;overflow:hidden!important}.app .map-panel{order:0!important;display:flex!important;flex:0 0 550px!important;height:550px!important;min-height:550px!important;max-height:550px!important;width:100%!important;padding:5px!important}.app .panel-top{display:none!important}.app .world{display:flex!important;align-items:center!important;justify-content:center!important;flex:0 0 495px!important;height:495px!important;min-height:495px!important;max-height:495px!important;padding:4px!important}.app .board{display:grid!important;flex:0 0 462px!important;height:462px!important;min-height:462px!important;width:462px!important;max-width:100%!important;aspect-ratio:1!important;gap:5px!important}.app .tile-icon{font-size:30px!important}.app .sidebar{display:contents!important}.app .cards{order:1!important;flex:0 0 122px!important;min-height:122px!important;max-height:122px!important;width:100%!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important}.app .wish-card{min-height:110px!important;max-height:120px!important}.app #preview{max-height:22px!important}.app .town-bubble{max-height:23px!important}.modal{width:min(96vw,520px)!important;max-height:88vh!important;overflow:auto!important}'});
  await page.addStyleTag({content:'#end.show .end-modal{box-sizing:border-box!important;width:96vw!important;max-width:96vw!important;height:88vh!important;max-height:88vh!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:center!important}#end.show #endArt{display:block!important;width:min(78vw,410px)!important;height:330px!important;max-height:330px!important;object-fit:contain!important}#end.show #endTitle{text-align:center!important;font-size:clamp(26px,5vw,40px)!important;line-height:1.1!important}#end.show #endLine{text-align:center!important;max-width:92%!important}#end.show #endStory,#end.show #endDetail,#end.show #endReason,#end.show #endLegacy,#end.show #endGoal,#end.show .feedback,#end.show .modal-choices{display:none!important}'});
  await page.waitForFunction(()=>{const e=document.querySelector('#board'),r=e?.getBoundingClientRect();return r&&r.width>=350&&r.height>=350&&r.top>=0&&r.bottom<=innerHeight-90&&getComputedStyle(e).display==='grid'},null,{timeout:8000});
  const started=stamp(),shots=[{label:'board',start:stamp(),duration:2.55}];
  // Hold each TRUE gameplay milestone before moving on, so successive cuts
  // never replay the same instant from overlapping time ranges.
  await sleep(2850);
  let comboAt=null,legendAt=null,endAt=null,buildLate=null,matureAt=null,placed=0;
  for(let day=1;day<=7;day++){
   const stepStart=stamp();
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
    return{day,choice:best.i,pos:best.pos};
   });
   if(!action)break;
   await sleep(950); // show the highlighted plot before a real placement
   action.combo=await page.evaluate(pos=>{
    const tile=document.querySelector('#board .tile.target[data-pos="'+pos+'"]');
    if(!tile)throw Error('Town plot vanished before placement');
    tile.click();return Number(document.querySelector('#comboNum')?.textContent)||0;
   },action.pos);
   placed++;
   if(day===1){buildLate=stamp();await sleep(2400)}
   if(action.combo>0&&!comboAt){comboAt=stepStart;await sleep(3450)}
   if(day===6){matureAt=stamp();await sleep(2450)}
   if(day===3||day===4||day===5){
    if(!legendAt&&await page.evaluate(()=>!!document.querySelector('#cards .legendary-card')||document.querySelector('#tabLegends')?.textContent?.includes('1'))){legendAt=stamp();await sleep(2450)}
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
   if(!legendAt&&await page.evaluate(()=>!!document.querySelector('#cards .legendary-card'))){legendAt=stamp();await sleep(2450)}
   if(await page.locator('#end.show').count()){endAt=stamp();await sleep(3650);break}
   await sleep(300);
  }
  const comboCount=Number(await page.locator('#comboNum').textContent())||0;
  const ending=await page.locator('#endTitle').textContent();
  if(placed!==7||!comboCount||!endAt||!ending)throw Error('V5 requires REAL 7-day town, combo and ending '+JSON.stringify({placed,comboCount,endAt,ending}));
  if(!legendAt||!buildLate||!matureAt)throw Error('V5 requires distinct real day-one, mature board and legendary clips');
  shots[0].duration=Math.min(shots[0].duration,Math.max(.85,stamp()-started));
  shots.push({label:'board-later',start:buildLate,duration:2.25});
  shots.push({label:'combination',start:comboAt,duration:3.4});
  shots.push({label:'legendary',start:legendAt,duration:2.25});
  if(matureAt)shots.push({label:'board-mature',start:matureAt,duration:2.25});
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
  const teaserStyle=await page.addStyleTag({content:'#home .life-card:nth-child(n+3){display:none!important}'});
  const shots=[],homeAt=stamp();await sleep(3850);shots.push({label:'choose-life',start:homeAt,duration:3.7});
  await teaserStyle.evaluate(el=>el.remove());
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
  return [{label:'full-attempt',start:begun,duration:stamp()-begun-.08}];
 }));
 result.push(await capture(browser,'parcel-panic',async({page,stamp})=>{
  // Observer is READ ONLY: exposes the authentic next falling parcel's color.
  await page.route('**/upgrade.js*',async route=>{
   const response=await route.fetch(),code=await response.text();
   // The active Parcel Panic code lives in upgrade.js, not the base
   // game.js. The earlier observer watched an unused mode that never ticked.
   const marker='let time=0,boxes=[],spawn=.42,life=4,count=0,delivered=0,press=null,drag=null,feedback=null;';
   if(!code.includes(marker))throw Error('Parcel recording observer no longer matches ACTIVE upgrade.js');
   const modified=code.replace(marker,marker+'window.__V5_PARCELS__=()=>({parcels:boxes.map(p=>({color:p.color,y:p.y})),lives:life,delivered,chain:window.mwMiniStats?.streak||0});');
   await route.fulfill({response,body:modified,headers:{...response.headers(),'content-type':'application/javascript; charset=utf-8'}});
  });
  await page.goto(host+'/parcel-panic/?lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.evaluate(()=>document.querySelector('#mw-mini-fullscreen')?.click());
  await page.waitForFunction(()=>window.MorrowwishArcadeViewport?.state?.portrait===true&&!!window.__V5_PARCELS__,null,{timeout:8500});
  await page.locator('#play-btn').click();
  await sleep(1200);
  console.log('PARCEL START STATE '+JSON.stringify(await page.evaluate(()=>({state:window.__V5_PARCELS__?.(),overlayHidden:document.querySelector('#overlay')?.hidden,score:document.querySelector('#score')?.textContent,status:document.querySelector('#status')?.textContent}))));
  const began=stamp();
  const action=async right=>{
   try{
    await page.waitForFunction(()=>window.__V5_PARCELS__?.().parcels.length>0||!document.querySelector('#overlay').hidden,null,{timeout:8000,polling:100});
   }catch(e){
    const diagnostic=await page.evaluate(()=>({
      state:window.__V5_PARCELS__?.(),overlayHidden:document.querySelector('#overlay')?.hidden,
      score:document.querySelector('#score')?.textContent,status:document.querySelector('#status')?.textContent,
      title:document.querySelector('#overlay-title')?.textContent,
      visible:document.visibilityState,canvasSize:[document.querySelector('#game')?.width,document.querySelector('#game')?.height]
    }));
    throw Error('Parcel real-game wait timed out '+JSON.stringify(diagnostic)+'; '+String(e));
   }
   const s=await page.evaluate(()=>{
    const x=window.__V5_PARCELS__();
    return{...x,next:[...x.parcels].sort((a,b)=>b.y-a.y)[0],dead:!document.querySelector('#overlay').hidden};
   });
   if(s.dead||!s.next)throw Error('Parcel gameplay ended too early '+JSON.stringify(s));
   const lane=right?s.next.color+1:(s.next.color+1)%3+1;
   await page.keyboard.press(String(lane));await sleep(350);
  };
  for(let k=0;k<7;k++)await action(true);
  const streak=stamp(),proof=await page.evaluate(()=>({state:window.__V5_PARCELS__(),score:Number(document.querySelector('#score').textContent),dead:!document.querySelector('#overlay').hidden}));
  if(proof.dead||proof.state.lives!==4||proof.state.delivered<7||proof.score<90)throw Error('No genuine delivery streak BEFORE failure '+JSON.stringify(proof));
  const wrongStart=stamp();
  for(let k=0;k<4;k++){
   await action(false);
   await sleep(450);
   if(await page.evaluate(()=>!document.querySelector('#overlay').hidden))break;
  }
  const died=stamp(),end=await page.evaluate(()=>({state:window.__V5_PARCELS__(),dead:!document.querySelector('#overlay').hidden,result:document.querySelector('#overlay-kicker')?.textContent}));
  if(!end.dead||end.state.lives>0||!/game over/i.test(end.result))throw Error('No genuine wrong-lane death '+JSON.stringify(end));
  await sleep(1900);
  if(died-wrongStart<2.8)throw Error('No readable wrong-lane footage');
  const fullStart=Math.max(began,streak-2.3);
  return [{label:'full-attempt',start:fullStart,duration:stamp()-fullStart-.12}];
 }));
 result.push(await capture(browser,'pocket-aquarium',async({page,stamp})=>{
  // Instrument only a READ-ONLY browser observer. Every food drop below is a
  // genuine click in the actual game. Fail QA if a fish is never fed.
  await page.route('**/pocket-aquarium/**',async route=>{
   if(route.request().resourceType()!=='document')return route.continue();
   const response=await route.fetch(),html=await response.text();
   const marker='const rand=(a,b)=>';
   if(!html.includes(marker))throw Error('Aquarium capture observer no longer matches real game');
   const observer="window.__V6_FISH__=()=>({fish:fish.map(f=>({x:f.x,y:f.y,type:f.type,wait:f.wait})),score,fed,time,quality,W,H,state});\n";
   await route.fulfill({response,body:html.replace(marker,observer+marker),headers:{...response.headers(),'content-type':'text/html; charset=utf-8'}});
  });
  await page.goto(host+'/pocket-aquarium/?lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#start').click();
  await page.evaluate(()=>document.querySelector('#mw-mini-fullscreen')?.click());
  await page.waitForFunction(()=>!!document.querySelector('.mw-mini-aquarium-frame.mw-mini-fullscreen-fallback')&&!!window.__V6_FISH__,null,{timeout:8500});
  const first=stamp(),foods=page.locator('.food');
  for(let n=0;n<3;n++){
   let success=false,diagnostics=[];
   for(let retry=0;retry<3&&!success;retry++){
    const snap=await page.evaluate(()=>window.__V6_FISH__());
    const target=[...snap.fish].sort((a,b)=>a.wait-b.wait)[0];
    const px=Math.max(35,Math.min(snap.W-35,target.x));
    const py=Math.max(55,Math.min(snap.H-55,target.y));
    await foods.nth(target.type).click();
    await page.locator('#sea').click({position:{x:px,y:py}});
    try{
     await page.waitForFunction(oldFed=>window.__V6_FISH__?.().fed>oldFed,snap.fed,{timeout:3200,polling:100});
     success=true;
    }catch(e){diagnostics.push(await page.evaluate(()=>window.__V6_FISH__()))}
    await sleep(250);
   }
   if(!success)throw Error('Aquarium actual food drop missed hungry fish '+JSON.stringify({n,diagnostics}));
  }
  const proof=await page.evaluate(()=>window.__V6_FISH__());
  if(proof.score<45||proof.fed<3)throw Error('Aquarium real scoring missing '+JSON.stringify(proof));
  console.log('V6 AQUARIUM REAL FEEDING '+JSON.stringify({score:proof.score,fed:proof.fed}));
  const played=stamp();
  await page.waitForFunction(()=>Number(document.querySelector('#time')?.textContent||100)<=7,null,{timeout:70000});
  const murkyAt=stamp(),quality=Number((await page.locator('#waterTxt').textContent()).replace('%',''));
  await page.waitForFunction(()=>!document.querySelector('#overlay').hidden,null,{timeout:14000});
  const timeout=stamp(),finalQ=Number((await page.locator('#waterTxt').textContent()).replace('%',''));
  const grade=await page.locator('#modalTip').textContent(),score=Number(await page.locator('#score').textContent());
  if(finalQ>=55||score>=220||score<45||!/Grade\s+[CD]/i.test(grade))throw Error('V6 must show real feeding, cloudy water and actual low grade '+JSON.stringify({quality,finalQ,score,grade}));
  await sleep(1850);
  return [{label:'feeding',start:first,duration:Math.min(3.2,played-first-.1)},
   {label:'water-cloudy',start:murkyAt,duration:Math.min(3.2,timeout-murkyAt-.15)},
   {label:'timeout',start:Math.max(murkyAt,timeout-.55),duration:2.0}];
 }));
 const manifest={createdAt:new Date().toISOString(),kind:'V6-all-seven-authentic-chronological-gameplay-not-posted',broll:result};
 fs.writeFileSync(path.join(dir,'broll-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
}finally{
 if(browser)await browser.close();server.kill('SIGTERM');
}
