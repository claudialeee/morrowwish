// Produce additional real-gameplay footage for cinematic review trailers.
// Recording does NOT publish to social platforms. It never fabricates an achievement.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const dir=process.env.MW_V7_BROLL_DIR||path.join(process.env.RUNNER_TEMP||os.tmpdir(),'morrowwish-v7-broll');
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
  await mark('yard',3650);
  await page.evaluate(()=>UI.openRoster());
  await page.waitForSelector('#panel.open .card');
  await mark('raising',4900);
  // Actual cat management/training interface and in-game training transaction.
  const trained=await page.evaluate(()=>{
   const cat=State.S.cats[0],before=cat.level,oldXp=cat.xp;
   State.S.fish=Math.max(3,State.S.fish||0); // capture-only resource fixture
   UI.closeAll();UI.openCatDetail(cat);
   document.getElementById('cd-trainxp')?.click();
   return {visible:!!document.querySelector('#cat-detail #cd-trainxp'),before,after:cat.level,oldXp,newXp:cat.xp};
  });
  if(!trained.visible||(trained.after===trained.before&&trained.newXp<=trained.oldXp))
   throw Error('V8 real cat training was not shown '+JSON.stringify(trained));
  await mark('cat-upgrade',6750);
  const duoPanel=await page.evaluate(()=>{
   const cats=State.S.cats.slice(0,2);
   if(cats.length<2)throw Error('V8 cannot show duo with fewer than two cats');
   CatRelations.grow(cats[0],cats[1],35);
   CatRelations.choose(cats[0],cats[1]);UI.closeAll();UI.openBondPanel();
   return !!document.querySelector('#panel.open .duo-panel #duo-choose')&&
    !!document.querySelector('#panel.open .duo-picker');
  });
  if(!duoPanel)throw Error('V8 real cat duo partner panel missing');
  await mark('duo-partners',6750);
  await page.evaluate(()=>{UI.closeAll();UI.openWorkshop()});
  await page.waitForSelector('#panel.open .work-earn-header');
  await mark('work-before',3700);
  const assigned=await page.evaluate(()=>{
   document.getElementById('work-quick-start')?.click();
   const sun=Raising.stationsView().find(s=>s.type==='sun');
   return !!sun?.active;
  });
  if(!assigned)throw Error('V5 proof missing: actual cat assigned to earning station');
  await mark('work-after',3750);
  // Promo-only teaser framing. The native phone panel is stretched almost
  // full-screen and leaves a giant white blank below the tiny cat.
  // Fit it to actual live controls so the yard remains visible in the shot.
  await page.addStyleTag({content:'#panel.open:has(#tease-area){top:50px!important;bottom:59px!important;align-items:center!important;justify-content:center!important;padding:12px!important}#panel.open>.card:has(#tease-area){height:auto!important;min-height:0!important;max-height:510px!important;flex:0 0 auto!important;overflow:hidden!important;align-self:center!important}#panel.open .card:has(#tease-area) #tease-area{height:220px!important}'});
  await page.evaluate(()=>{UI.closeAll();UI.openTease()});
  await page.waitForSelector('#tease-area canvas');
  const playStart=stamp();
  for(let i=0;i<9;i++){
   await page.locator('#tease-area').click({position:{x:140+(i%3)*68,y:80+(i%2)*50}});
   await sleep(460);
  }
  shots.push({label:'tease',start:playStart,duration:stamp()-playStart-.08});
  await page.addStyleTag({content:'#panel.open:has(.map-destination){top:55px!important;bottom:65px!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:12px!important}#panel.open>.card:has(.map-destination){height:auto!important;min-height:0!important;max-height:650px!important;flex:0 0 auto!important;overflow:hidden!important;align-self:center!important}'});
  await page.evaluate(()=>{UI.closeAll();window.__game.openWorldMap()});
  await page.waitForSelector('#panel.open .map-destination');
  await mark('map-choice',5300);
  const entered=await page.evaluate(()=>{
   UI.closeAll();
   // The actual starting region is now the cherry-blossom woodland.
   // Select an unlocked real region instead of hardcoding the retired
   // 'home' opening; verify the new runtime is actively exploring it.
   const chosen=WorldMap.isUnlocked('sakura')?'sakura':
     WorldMap.REGIONS.find(r=>WorldMap.isUnlocked(r.id))?.id;
   if(!chosen)return{ok:false,reason:'no unlocked map'};
   const ok=WorldMap.enterRegion(chosen);
   window.__V4_CAMERA__.show(true);
   return{ok:!!ok&&window.__game.scene==='map'&&WorldMap.mode==='region',region:chosen,mode:WorldMap.mode};
  });
  if(!entered.ok)throw Error('V9 real exploration region not entered '+JSON.stringify(entered));
  console.log('V9 REAL CURRENT REGION '+JSON.stringify(entered));
  await mark('map-explore',4300);
  await page.evaluate(()=>{
   window.__V4_CAMERA__.show(false);window.__game.scene='yard';window.__game.showYardChrome();
   const cats=State.S.cats.slice(0,3);
   CatRelations.grow(cats[0],cats[1],75);CatRelations.choose(cats[0],cats[1]);
   State.S.battlePrefs={...(State.S.battlePrefs||{}),manualTutorialSeen:true,tutorialSeen:true,autoBattle:false};
   const wild=GameData.SPECIES.find(s=>s.rarity==='R')||GameData.SPECIES.find(s=>s.rarity==='N')||GameData.SPECIES[0];
   window.__game.startBattle(cats,wild);
   window.__V4_CAMERA__.setMode('arena');window.__V4_CAMERA__.show(true);
  });
  if(!await page.evaluate(()=>!!window.__game.battle?.duo))throw Error('V6 no actual two-cat combo');
  await mark('battle-intro',2650);
  const duo=await page.evaluate(()=>{
   const b=window.__game.battle;if(!b||b.done)return{cast:false,reason:'battle ended'};
   b.duoCharge=100;b.duoCd=0;const ready=b.duoReady();const status=b.team.map(f=>({id:f.cat.uid,alive:f.alive,hp:Math.round(f.hp)}));return{ready,status,cast:b.castDuo(),uses:b.duoUses,cinematic:!!b.duoCinematic};
  });
  if(!duo.cast||duo.uses<1||!duo.cinematic)throw Error('V6 real duo missing '+JSON.stringify(duo));
  await mark('duo',5100);
  const ult=await page.evaluate(()=>{
   const b=window.__game.battle;if(!b||b.done)return{cast:false,reason:'battle ended'};
   // In the current game only the TWO-CAT combo has a full-screen
   // cinematic. A solo ultimate is fired in place, with real elemental VFX.
   b.ult=100;b.ultCd=0;
   const skill=b.me()?.ultSkill;
   const cast=b.ultimate();
   const name=window.CatBondI18n?.translate?.(skill?.name)||skill?.name||'';
   return{cast,name,cooldown:b.ultCd>0,spent:b.ult===0,
    visible:!!b.ultCinematic||!!b.spotlightCinematic||
     b.flash>0||b.slowmo>0||b._ultResultBanner>0,
    hasChinese:/[\u3400-\u9fff]/.test(name)};
  });
  // A successful hit can immediately recharge energy; a zero meter is
  // NOT a valid post-cast invariant. Cooldown and real VFX prove the cast.
  if(!ult.cast||!ult.cooldown||!ult.visible||ult.hasChinese)
   throw Error('V11 genuine in-place elemental ultimate missing '+JSON.stringify(ult));
  await mark('ultimate',5800);
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
     // These labels are keyed to the real in-game near-miss counter,
     // which is set only after a guard spots the cat and loses sight.
     if(s.nearMisses>0){
      ctx.fillStyle='#302341db';ctx.fillRect(26,145,488,111);
      ctx.strokeStyle='#eac56f';ctx.lineWidth=3;ctx.strokeRect(26,145,488,111);
      ctx.fillStyle='#ffdd7c';ctx.font='bold 22px system-ui,sans-serif';
      ctx.fillText('ACHIEVEMENT UNLOCKED',43,183);
      ctx.fillStyle='#ffffff';ctx.font='bold 27px system-ui,sans-serif';
      ctx.fillText('NINE LIVES · NARROW ESCAPE!',43,220);
     }
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
   },[dx,dy]);await sleep(670);if(win.done)break;
  }
  if(!win?.won||win.got<3)throw Error('Continuous successful escape does not collect three real fish '+JSON.stringify(win));
  await sleep(1400);
  shots.push({label:'escape-attempt',start:first,duration:stamp()-first-.1});
  // Real narrow escape: approach the owner until alert, then break line of sight.
  // The published footage requires a genuine nearMisses increment.
  let nearMissProof=null,nearMissStart=0;
  for(let attempt=0;attempt<3&&!nearMissProof;attempt++){
   await page.evaluate(()=>window.__PAWSIBLY_TEST__.choose(0,false));
   const began=stamp();await sleep(650);
   let sighted=false,previous=[];
   for(let turn=0;turn<28;turn++){
    const q=await page.evaluate(({flee,previous})=>{
     const api=window.__PAWSIBLY_TEST__,s=api.getState();
     const options=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({
      dx,dy,x:s.cat.x+dx,y:s.cat.y+dy
     })).filter(p=>p.x>=0&&p.x<10&&p.y>=0&&p.y<7&&
      !['#','S'].includes(s.grid[p.y][p.x])&&!(p.x===s.human.x&&p.y===s.human.y));
     const distance=p=>Math.abs(p.x-s.human.x)+Math.abs(p.y-s.human.y);
     const visible=p=>{
      if(s.boxes.some(b=>b.x===p.x&&b.y===p.y))return false;
      const d=distance(p),h=s.human;
      if(d<=1)return true;
      if(d>3)return false;
      if(p.x===h.x){for(let y=Math.min(p.y,h.y)+1;y<Math.max(p.y,h.y);y++)
       if(['#','S'].includes(s.grid[y][p.x]))return false;return true}
      if(p.y===h.y){for(let x=Math.min(p.x,h.x)+1;x<Math.max(p.x,h.x);x++)
       if(['#','S'].includes(s.grid[p.y][x]))return false;return true}
      if(d===2&&Math.abs(p.x-h.x)===1)
       return !['#','S'].includes(s.grid[p.y][h.x])&&!['#','S'].includes(s.grid[h.y][p.x]);
      return false;
     };
     options.sort((a,b)=>{
      const score=p=>flee?
       (!visible(p)?100:0)+distance(p)*7+(s.boxes.some(v=>v.x===p.x&&v.y===p.y)?40:0)-(previous.includes(p.x+','+p.y)?5:0):
       (visible(p)?30:0)-Math.abs(distance(p)-2)*12-(previous.includes(p.x+','+p.y)?8:0);
      return score(b)-score(a);
     });
     if(!options.length)return null;
     const p=options[0];api.move(p.dx,p.dy);const next=api.getState();
     return {cat:next.cat,nearMisses:next.nearMisses,danger:next.dangerActive,
      lives:next.lives,done:next.done,steps:next.steps,exposure:next.exposure};
    },{flee:sighted,previous});
    if(!q||q.done||q.lives<3)break;
    previous.push(q.cat.x+','+q.cat.y);if(previous.length>5)previous.shift();
    sighted ||= q.danger || q.exposure>0;
    await sleep(550);
    if(q.nearMisses>0){nearMissStart=began;nearMissProof={sighted,steps:q.steps,nearMisses:q.nearMisses,lives:q.lives};break}
   }
  }
  if(!nearMissProof?.sighted||nearMissProof.nearMisses<1||nearMissProof.lives!==3)
   throw Error('V8 true narrowly escaped pursuit was not captured');
  const badgeEarned=await page.evaluate(()=>{
   const save=JSON.parse(localStorage.getItem('pawsibly-innocent-save-v1')||'{}');
   return save.achievements?.['near-miss']===true;
  });
  if(!badgeEarned)throw Error('The real Nine Lives achievement was not awarded');
  const nearMissEnd=stamp();await sleep(3450);
  // A chronological BEFORE/AFTER pair: the "achievement" title must never
  // appear over the starting board before the real badge is earned.
  // The game has already incremented nearMisses 550ms before nearMissEnd;
  // start the achievement clip once the real in-game badge is visible.
  const chaseStart=Math.max(nearMissStart,nearMissEnd-3.3);
  const badgeStart=nearMissEnd-.30;
  if(badgeStart-chaseStart<1.1)throw Error('V10 close call lacks readable pursuit footage');
  shots.push({label:'narrow-pursuit',start:chaseStart,duration:badgeStart-chaseStart-.1});
  shots.push({label:'narrow-achievement',start:badgeStart,duration:Math.min(3.15,stamp()-badgeStart-.1)});
  if(shots.at(-1).duration<3.05)throw Error('V11 badge must stay visible for three full seconds');
  console.log('V8 CAT NARROW ESCAPE VERIFIED '+JSON.stringify(nearMissProof));
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
   await sleep(590);
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
  // The three starting town choices are real gameplay. Show them ALL before
  // starting rather than skipping this distinct feature in the promo.
  await page.addStyleTag({content:'#intro .modal{padding:14px!important;max-height:95vh!important;overflow:hidden!important}#intro .intro-inner{font-size:33px!important;padding:8px!important;margin:7px 0 8px!important}#intro .intro-inner span{display:none!important}#intro .charter-select{gap:5px!important;margin:8px 0 12px!important}#intro .charter{padding:8px 5px!important;gap:5px!important;min-height:132px!important}#intro .charter b{font-size:15px!important;line-height:1.2!important}#intro .charter-flavor{font-size:11.5px!important;line-height:1.35!important}#intro .charter-bonus{display:none!important}#intro h2{margin:6px 0!important}#intro .intro-note{font-size:13px!important}#intro .modal-choices .button{min-height:43px!important}'});
  await page.waitForFunction(()=>{
   const cards=[...document.querySelectorAll('#intro.show #charterSelect .charter')];
   if(cards.length!==3||!cards.every(x=>x.getBoundingClientRect().width>85))return false;
   const modal=document.querySelector('#intro .modal'),start=document.querySelector('#introStart');
   const r=start?.getBoundingClientRect();
   return !!modal&&!!r&&r.bottom<=innerHeight-12&&modal.scrollHeight<=modal.clientHeight+3&&
    cards.every(x=>{const r=x.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight-90});
  },null,{timeout:8000});
  const introAt=stamp();await sleep(9850);
  const introShot={label:'opening-three-choices',start:introAt,duration:stamp()-introAt-.14};
  const introLabels=await page.locator('#intro .charter b').allTextContents();
  if(introLabels.length!==3||introLabels.some(x=>!x.trim()))throw Error('Town opening lacks one of its three choices');
  console.log('TOWN REAL THREE OPENING CHOICES '+JSON.stringify(introLabels));
  await page.locator('#introStart').click();
  // Marketing gameplay MUST show the real board. Avoid the zero-height flex collapse.
  await page.addStyleTag({content:'.arcade-return,.app>.header,.app>.progress,.app .town-tabs,.app #moveWish,.app .citizen-panel,.app .petition,.app .sidebar-head{display:none!important}.app{max-width:100vw!important;width:100vw!important;padding:0!important}.app .stage{display:flex!important;flex-direction:column!important;gap:6px!important;overflow:hidden!important}.app .map-panel{order:0!important;display:flex!important;flex:0 0 550px!important;height:550px!important;min-height:550px!important;max-height:550px!important;width:100%!important;padding:5px!important}.app .panel-top{display:none!important}.app .world{display:flex!important;align-items:center!important;justify-content:center!important;flex:0 0 495px!important;height:495px!important;min-height:495px!important;max-height:495px!important;padding:4px!important}.app .board{display:grid!important;flex:0 0 462px!important;height:462px!important;min-height:462px!important;width:462px!important;max-width:100%!important;aspect-ratio:1!important;gap:5px!important}.app .tile-icon{font-size:30px!important}.app .sidebar{display:contents!important}.app .cards{order:1!important;flex:0 0 122px!important;min-height:122px!important;max-height:122px!important;width:100%!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important}.app .wish-card{min-height:110px!important;max-height:120px!important}.app #preview{max-height:22px!important}.app .town-bubble{max-height:23px!important}.modal{width:min(96vw,520px)!important;max-height:88vh!important;overflow:auto!important}'});
  // The five actual resident faces and moods stay visible under the board.
  await page.addStyleTag({content:'.app .resident-ribbon{display:block!important;order:2!important;width:100%!important;min-height:112px!important;max-height:126px!important;flex:0 0 auto!important;margin:5px 0!important;z-index:3!important}.app .resident-avatar{min-height:65px!important}.app .resident-avatar .resident-face{font-size:28px!important}.app .cards{order:1!important}.app #residentRibbonPeople{display:grid!important}.app .resident-ribbon-heading{margin-bottom:5px!important}'});
  await page.addStyleTag({content:'#end.show .end-modal{box-sizing:border-box!important;width:96vw!important;max-width:96vw!important;height:88vh!important;max-height:88vh!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:center!important}#end.show #endArt{display:block!important;width:min(78vw,410px)!important;height:330px!important;max-height:330px!important;object-fit:contain!important}#end.show #endTitle{text-align:center!important;font-size:clamp(26px,5vw,40px)!important;line-height:1.1!important}#end.show #endLine{text-align:center!important;max-width:92%!important}#end.show #endStory,#end.show #endDetail,#end.show #endReason,#end.show #endLegacy,#end.show #endGoal,#end.show .feedback,#end.show .modal-choices{display:none!important}'});
  await page.waitForFunction(()=>{const e=document.querySelector('#board'),r=e?.getBoundingClientRect();return r&&r.width>=350&&r.height>=350&&r.top>=0&&r.bottom<=innerHeight-90&&getComputedStyle(e).display==='grid'},null,{timeout:8000});
  const started=stamp(),shots=[introShot,{label:'board',start:stamp(),duration:3.85}];
  // Hold each TRUE gameplay milestone before moving on, so successive cuts
  // never replay the same instant from overlapping time ranges.
  await sleep(4100);
  let comboAt=null,legendAt=null,endAt=null,buildLate=null,matureAt=null,neighborAt=null,residentAt=null,profileAt=null,placed=0;
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
    if(day===1){
      const count=await page.locator('#residentRibbonPeople [data-resident]').count();
      if(count!==5)throw Error('V7 resident faces missing '+count);
      residentAt=stamp();await sleep(4300);
      shots.push({label:'resident-reactions',start:residentAt,duration:4.0});
      await page.locator('#residentRibbonPeople [data-resident]').nth(1).click();
      await page.waitForFunction(()=>{const p=document.querySelector('#townInspector');return p&&!p.hidden&&/Likes|Dislikes/i.test(document.querySelector('#inspectorContent')?.textContent||'')},null,{timeout:6000});
      profileAt=stamp();await sleep(7100);
      shots.push({label:'resident-profile',start:profileAt,duration:6.75});
      await page.locator('#closeInspector').click();
      await page.waitForFunction(()=>document.querySelector('#townInspector')?.hidden===true,null,{timeout:5000});
    }
    await sleep(950); // see the intended board location before placing
   action.combo=await page.evaluate(pos=>{
    const tile=document.querySelector('#board .tile.target[data-pos="'+pos+'"]');
    if(!tile)throw Error('Town plot vanished before placement');
    tile.click();return Number(document.querySelector('#comboNum')?.textContent)||0;
   },action.pos);
   placed++;
   if(day===1){buildLate=stamp();await sleep(3950)}
   if(action.combo>0&&!comboAt){comboAt=stepStart;await sleep(4700)}
   if(day===6){matureAt=stamp();await sleep(3900)}
   if(day===3||day===4||day===5){
    if(!legendAt&&await page.evaluate(()=>!!document.querySelector('#cards .legendary-card')||document.querySelector('#tabLegends')?.textContent?.includes('1'))){legendAt=stamp();await sleep(3800)}
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
    if(state==='story'&&!neighborAt){
      const kicker=await page.locator('#storyKicker').textContent();
      if(/NEIGHBORS|STORY CONTINUES|居民|故事/i.test(kicker||'')){
        neighborAt=stamp();await sleep(7350);
        shots.push({label:'neighbor-story',start:neighborAt,duration:7.05});
      }
    }
    if((comboAt!==null&&Math.abs(stamp()-comboAt)<2)||state==='story')await sleep(450);
    await page.evaluate(mode=>{
     (mode==='story'?document.querySelector('#storyModal.show #storyChoices .button'):
      mode==='travel'?document.querySelector('.freedom-options:not([hidden]) [data-destination]'):
      document.querySelector('.freedom-adventure:not([hidden]) .freedom-finish'))?.click();
    },state);
    await sleep(280);
   }
   if(!legendAt&&await page.evaluate(()=>!!document.querySelector('#cards .legendary-card'))){legendAt=stamp();await sleep(3800)}
   if(await page.locator('#end.show').count()){endAt=stamp();await sleep(7550);break}
   await sleep(300);
  }
  const comboCount=Number(await page.locator('#comboNum').textContent())||0;
  const ending=await page.locator('#endTitle').textContent();
  if(placed!==7||!comboCount||!endAt||!ending)throw Error('V5 requires REAL 7-day town, combo and ending '+JSON.stringify({placed,comboCount,endAt,ending}));
  if(!legendAt||!buildLate||!matureAt||!neighborAt||!residentAt||!profileAt)throw Error('V7 requires real residents, profile, neighbor story, combo, legend and ending');
  const boardShot=shots.find(x=>x.label==='board');boardShot.duration=Math.min(boardShot.duration,Math.max(.85,stamp()-started));
  shots.push({label:'board-later',start:buildLate,duration:3.6});
  shots.push({label:'combination',start:comboAt,duration:4.35});
  shots.push({label:'legendary',start:legendAt,duration:3.55});
  if(matureAt)shots.push({label:'board-mature',start:matureAt,duration:3.65});
  shots.push({label:'ending',start:endAt,duration:7.0});
  console.log('V5 TOWN VERIFIED '+JSON.stringify({placed,comboCount,ending,legendAt}));
  return shots;
 }));
 result.push(await capture(browser,'elsewhere',async({page,stamp})=>{
  await page.goto(host+'/elsewhere/?lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.addStyleTag({content:'main{padding:0 13px!important}.top{height:54px!important}.game-top{height:39px!important}#game,#ending{margin:0 auto!important;width:100%!important;max-width:100%!important}.scene{display:block!important;height:auto!important;min-height:0!important}.scene-picture{height:200px!important;min-height:200px!important;max-height:200px!important;aspect-ratio:auto!important}.scene-body{height:auto!important;max-height:none!important;overflow:visible!important;padding:10px 15px!important}.scene-body>.story-line{font-size:12.5px!important;line-height:1.38!important;margin-bottom:7px!important}.scene-body>h2{font-size:18px!important;line-height:1.2!important;margin-bottom:7px!important}.scene .choice{min-height:48px!important;padding:7px 10px!important}.scene .choices{grid-template-columns:1fr!important;gap:5px!important}.scene .choice strong{font-size:12px!important}.scene-body .progress-track,.scene .case-objective,.scene .case-topline,.scene .case-previous{margin-bottom:5px!important}#ending .ending-art{height:185px!important;aspect-ratio:auto!important}#ending .ending-paper{padding:15px 17px!important}#ending .ending-paper h1{font-size:27px!important;line-height:1.13!important;margin:7px 0!important}#ending .ending-paper>p{font-size:14px!important;line-height:1.36!important;margin-bottom:9px!important}#ending .case-verdict{font-size:11px!important;margin:3px auto 9px!important}#ending .case-summary,#ending .end-actions{display:none!important}'});
  const check=async label=>page.evaluate(name=>{
    const r=document.querySelector('#game .scene')?.getBoundingClientRect();
    if(!r||r.top<0||r.left<0||r.right>innerWidth+1||r.bottom>innerHeight-8||document.documentElement.scrollWidth>innerWidth+2)throw Error('V7 phone story clipped '+name+' '+JSON.stringify(r&&{top:r.top,bottom:r.bottom,height:innerHeight}));
  },label);
  const shots=[],homeAt=stamp();await sleep(5200);
  shots.push({label:'choose-life',start:homeAt,duration:4.9});
  for(const world of ['paris','amalfi','tokyo']){
    await page.locator('[data-world="'+world+'"]').first().click();
    await check(world);
    const first=stamp();await sleep(world==='paris'?6900:5100);
    shots.push({label:world,start:first,duration:world==='paris'?6.55:4.8});
    await page.locator('#game [data-choice]').first().click();
    const reaction=stamp();await sleep(world==='paris'?4300:3150);
    shots.push({label:world+'-result',start:reaction,duration:world==='paris'?4.05:2.9});
    if(world==='paris'){
      await page.locator('#game [data-continue]').click();
      await check('paris-romance-chapter-2');
      const romance=stamp();await sleep(7800);
      shots.push({label:'paris-romance',start:romance,duration:7.5});
      await page.locator('#game [data-choice]').first().click();
      const moment=stamp();await sleep(4650);
      shots.push({label:'paris-love-moment',start:moment,duration:4.35});
      await page.locator('#game [data-continue]').click();
      await page.locator('#game [data-twist]').first().click();
      await check('paris-chapter-3');
      const chapter3=stamp();await sleep(7500);
      shots.push({label:'paris-chapter-3',start:chapter3,duration:7.2});
      await page.locator('#game [data-choice]').nth(1).click();
      await page.locator('#game [data-continue]').click();
      await check('paris-chapter-4');
      const chapter4=stamp();await sleep(7300);
      shots.push({label:'paris-chapter-4',start:chapter4,duration:7.0});
      await page.locator('#game [data-choice]').nth(1).click();
      await page.locator('#game [data-continue]').click();
      await page.locator('#game [data-twist]').first().click();
      await check('paris-finale');
      const finale=stamp();await sleep(7700);
      shots.push({label:'paris-finale',start:finale,duration:7.4});
      await page.locator('#game [data-choice]').nth(1).click();
      await page.locator('#game [data-continue]').click();
      await page.waitForFunction(()=>{const e=document.querySelector('#ending');return !!e&&!e.hidden&&!!e.querySelector('.ending-paper h1')?.textContent},null,{timeout:5000});
      const parisTitle=await page.locator('#ending .ending-paper h1').textContent();
      if(!/Paris|巴黎|恋爱|love|date|书店|认真/i.test(parisTitle||''))throw Error('Paris story did not earn a romantic conclusion '+parisTitle);
      const romanceEnding=stamp();await sleep(8750);
      shots.push({label:'paris-ending',start:romanceEnding,duration:8.45});
    }
    await page.evaluate(()=>document.querySelector('#game [data-home]')?.click());
    await sleep(250);
  }
  await page.locator('[data-world="moon"]').first().click();
  await check('moon');
  const started=stamp();await sleep(5850);
  shots.push({label:'moon-opening',start:started,duration:5.55});
  let reveals=0;
  for(let stage=0;stage<5;stage++){
    if(stage===2||stage===4){
      if(!await page.locator('#game [data-twist]').count())throw Error('V7 real surprise missing at chapter '+stage);
      await page.locator('#game [data-twist]').first().click();
      await page.waitForSelector('#game [data-choice]');
      await check('reveal-'+stage);
      const t=stamp();await sleep(6250);
      shots.push({label:stage===2?'moon-surprise':'moon-finale-surprise',start:t,duration:5.95});
      reveals++;
    }else if(stage===1||stage===3){
      await check('chapter-'+stage);
      const t=stamp();await sleep(6300);
      shots.push({label:stage===1?'moon-choice':'moon-consequence',start:t,duration:5.95});
    }
    await page.locator('#game [data-choice]').first().click();
    const t=stamp();await sleep(stage===4?1700:1100);
    if(stage===4)shots.push({label:'moon-last-result',start:t,duration:1.5});
    await page.locator('#game [data-continue]').click();
  }
  await page.waitForFunction(()=>{const el=document.querySelector('#ending');return el&&!el.hidden&&!!el.querySelector('.ending-paper h1')?.textContent},null,{timeout:6000});
  const title=await page.locator('#ending .ending-paper h1').textContent();
  if(reveals!==2||!title)throw Error('V7 moon story lacked two real reveals and earned ending');
  const endStart=stamp();await sleep(8450);shots.push({label:'moon-ending',start:endStart,duration:8.1});
  console.log('V7 REAL ELSEWHERE SURPRISES/ENDING '+JSON.stringify({reveals,title,shots:shots.length}));
  return shots;
 }));
 // Mini-games MUST show visible gameplay for at least 15 seconds before an earned loss.
 result.push(await capture(browser,'flip-dash',async({page,stamp})=>{
  await page.route('**/upgrade.js*',async route=>{
   const response=await route.fetch(),code=await response.text();
   const key='let sec=0,side=0,py=410,haz=[],stars=[],sp=.8,k=0,lastHazSide=1;';
   if(!code.includes(key))throw Error('V7 Flip observer does not match active game');
   const observer='window.__V7_FLIP__=()=>({sec,side,py,haz:haz.map(h=>({x:h.x,side:h.side,passed:h.passed})),stars:stars.map(g=>({x:g.x,side:g.side,got:g.got})),dodges:window.mwMiniStats?.dodges||0,flips:window.mwMiniStats?.flips||0,gems:window.mwMiniStats?.gems||0});';
   await route.fulfill({response,body:code.replace(key,key+observer),headers:{...response.headers(),'content-type':'application/javascript; charset=utf-8'}});
  });
  await page.goto(host+'/flip-dash/?lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.evaluate(()=>document.querySelector('#mw-mini-fullscreen')?.click());
  await page.waitForFunction(()=>window.MorrowwishArcadeViewport?.state?.portrait===true&&!!window.__V7_FLIP__,null,{timeout:8500});
  await page.locator('#play-btn').click();
  const start=stamp();let targetAt=null,dodged=0,collected=0,last=null,firstCoinAt=null;
  for(let tick=0;tick<220;tick++){
   const now=await page.evaluate(()=>({s:window.__V7_FLIP__(),dead:!document.querySelector('#overlay').hidden}));
   if(now.dead)throw Error('V7 Flip crashed before long survival '+JSON.stringify(now));
   const st=now.s,h=st.haz.filter(x=>!x.passed&&x.x>225).sort((x,y)=>x.x-y.x)[0];
   if(st.gems>0&&!firstCoinAt)firstCoinAt=stamp();
   if(st.sec>5.7&&st.gems<1)throw Error('Flip failed to take the FIRST gold coin at the start: '+JSON.stringify(st));
   if(st.sec>11.5&&st.gems<2)throw Error('Flip failed to collect a second early gold coin: '+JSON.stringify(st));
   if(st.sec>=15&&st.dodges>=8&&st.gems>=3){targetAt=stamp();dodged=st.dodges;collected=st.gems;break}
   const coin=st.stars.filter(x=>!x.got&&x.x>195).sort((x,y)=>x.x-y.x)[0];
   // Prioritize the NEAREST actual event. If a collectible is about to
   // reach us BEFORE the next pink block, stay in / move to its lane.
   // Never flip away from a coin because a more distant hazard appears.
   const collectNow=coin&&coin.x<555&&(!h||h.x>coin.x+70);
   if(collectNow&&st.side!==coin.side)await page.keyboard.press('Space');
   else if(!collectNow&&h&&h.x<550&&st.side===h.side)await page.keyboard.press('Space');
   last=st;await sleep(115);
  }
  if(!targetAt||!firstCoinAt)throw Error('V8 Flip must dodge eight obstacles AND genuinely collect >=3 gold coins during 15 seconds '+JSON.stringify(last));
  let collided=null,aimed=false;
  for(let tick=0;tick<160;tick++){
   const now=await page.evaluate(()=>({s:window.__V7_FLIP__(),dead:!document.querySelector('#overlay').hidden}));
   if(now.dead){collided=stamp();break}
   const st=now.s,h=st.haz.filter(x=>!x.passed&&x.x>225).sort((x,y)=>x.x-y.x)[0];
   if(h&&h.x<525&&!aimed){
    // Only NOW, after sustained evasion, select the dangerous lane once.
    if(st.side!==h.side)await page.keyboard.press('Space');
    aimed=true;
   }
   await sleep(115);
  }
  if(!collided||!aimed)throw Error('V7 Flip lacks verified final player mistake');
  const k=await page.locator('#overlay-kicker').textContent();
  if(!/GAME OVER|本局结束/i.test(k)||dodged<8||collected<3)throw Error('V8 Flip must collect three coins before a genuine crash');
  await sleep(3200);
  const openingAt=Math.max(start,firstCoinAt-1.6);
  const openingEnd=Math.min(firstCoinAt+1.6,targetAt-7.5);
  if(openingEnd-openingAt<2.4)throw Error('First coin was not visible long enough for an opening hook');
  console.log('V9 FLIP EARLY COIN VERIFIED '+JSON.stringify({collected,dodged,firstCoinAt,openingAt,seconds:targetAt-start}));
  return [{label:'first-coin',start:openingAt,duration:openingEnd-openingAt-.08},
    {label:'coin-collect',start:openingEnd,duration:Math.min(10.6,targetAt-openingEnd-.15)},
    {label:'danger',start:targetAt,duration:Math.min(2.7,collided-targetAt-.1)},
    {label:'crash',start:collided,duration:2.8}];
 }));
 result.push(await capture(browser,'parcel-panic',async({page,stamp})=>{
  await page.route('**/upgrade.js*',async route=>{
   const response=await route.fetch(),code=await response.text();
   const key='let time=0,boxes=[],spawn=.42,life=4,count=0,delivered=0,press=null,drag=null,feedback=null;';
   if(!code.includes(key))throw Error('V7 active Parcel Panic mode changed');
   const observer='window.__V7_PARCELS__=()=>({boxes:boxes.map(x=>({y:x.y,color:x.color})),life,delivered,streak:window.mwMiniStats?.streak||0});';
   await route.fulfill({response,body:code.replace(key,key+observer),headers:{...response.headers(),'content-type':'application/javascript; charset=utf-8'}});
  });
  await page.goto(host+'/parcel-panic/?lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.evaluate(()=>document.querySelector('#mw-mini-fullscreen')?.click());
  await page.waitForFunction(()=>window.MorrowwishArcadeViewport?.state?.portrait===true&&!!window.__V7_PARCELS__,null,{timeout:8500});
  await page.locator('#play-btn').click();
  const started=stamp();
  async function send(right){
   // A visible package must fall into the center of the screen first.
   await page.waitForFunction(()=>{const s=window.__V7_PARCELS__?.();return (s?.boxes[0]&&s.boxes[0].y>=245)||!document.querySelector('#overlay').hidden},null,{timeout:6000,polling:100});
   const state=await page.evaluate(()=>({s:window.__V7_PARCELS__(),dead:!document.querySelector('#overlay').hidden}));
   if(state.dead||!state.s.boxes.length)throw Error('V7 missing live package before action '+JSON.stringify(state));
   const color=state.s.boxes[0].color;
   // Allow the viewer to recognize the package's color and the chosen lane.
   // This is actual active gameplay, not freeze-framed or slowed post-production.
   if(!right)await sleep(375);
   await page.keyboard.press(String(right?color+1:(color+1)%3+1));
   await sleep(460);
  }
  for(let n=0;n<8;n++)await send(true);
  const goodAt=stamp(),proof=await page.evaluate(()=>window.__V7_PARCELS__());
  if(proof.life!==4||proof.delivered<8||goodAt-started<8)throw Error('V7 Parcel needs slow, readable 8-package streak '+JSON.stringify({proof,seconds:goodAt-started}));
  const errorsAt=stamp();
  for(let n=0;n<4;n++){await send(false);if(await page.evaluate(()=>!document.querySelector('#overlay').hidden))break}
  const died=stamp(),end=await page.evaluate(()=>({mode:window.__V7_PARCELS__(),over:!document.querySelector('#overlay').hidden,title:document.querySelector('#overlay-kicker')?.textContent}));
  if(!end.over||end.mode.life>0||!/GAME OVER|本局结束/i.test(end.title)||died-errorsAt<3.8)throw Error('V7 Parcel needs real mistake sequence and game over '+JSON.stringify(end));
  await sleep(3350);
  return [{label:'deliveries',start:started,duration:Math.min(12.8,goodAt-started-.1)},
    {label:'mistakes',start:errorsAt,duration:Math.min(6.8,died-errorsAt-.2)},
    {label:'game-over',start:died+.10,duration:3.0}];
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
  const first=stamp(),foods=page.locator('.food');let moreAt=null;
  for(let n=0;n<6;n++){
   if(n===3){moreAt=stamp();await sleep(1200)}
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
   await sleep(620);
  }
  const proof=await page.evaluate(()=>window.__V6_FISH__());
  if(proof.score<75||proof.fed<6)throw Error('Aquarium real scoring missing '+JSON.stringify(proof));
  console.log('V6 AQUARIUM REAL FEEDING '+JSON.stringify({score:proof.score,fed:proof.fed}));
  const played=stamp();
  await page.waitForFunction(()=>Number(document.querySelector('#time')?.textContent||100)<=7,null,{timeout:70000});
  const murkyAt=stamp(),quality=Number((await page.locator('#waterTxt').textContent()).replace('%',''));
  await page.waitForFunction(()=>!document.querySelector('#overlay').hidden,null,{timeout:14000});
  const timeout=stamp(),finalQ=Number((await page.locator('#waterTxt').textContent()).replace('%',''));
  const grade=await page.locator('#modalTip').textContent(),score=Number(await page.locator('#score').textContent());
  if(score>=220||score<75||!/Grade\s+[CD]/i.test(grade))throw Error('V6 must show real feeding, cloudy water and actual low grade '+JSON.stringify({quality,finalQ,score,grade}));
  await sleep(3400);
  if(!moreAt||played-moreAt<2.8)throw Error('V7 aquarium must show six genuine feeds across two phases');
  return [{label:'feeding',start:first,duration:Math.min(4.7,moreAt-first-.12)},
   {label:'more-feeding',start:moreAt,duration:Math.min(6.0,played-moreAt-.12)},
   {label:'water-cloudy',start:Math.max(played,murkyAt-5.1),duration:Math.min(4.8,timeout-Math.max(played,murkyAt-5.1)-.12)},
   {label:'timeout',start:Math.max(murkyAt,timeout-.65),duration:3.3}];
 }));
 const manifest={createdAt:new Date().toISOString(),kind:'V7-all-seven-authentic-chronological-gameplay-not-posted',broll:result};
 fs.writeFileSync(path.join(dir,'broll-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
}finally{
 if(browser)await browser.close();server.kill('SIGTERM');
}
