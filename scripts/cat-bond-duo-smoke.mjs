// Real browser regression for duo personalities, kinetic claw art and
// four-step pre-battle manual controls on both phone and desktop.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true});
const errors=[];
try{
 for(const profile of [
  {name:'phone',width:390,height:844,mobile:true,touch:true},
  {name:'desktop',width:1180,height:760,mobile:false,touch:false}
 ]){
  const context=await browser.newContext({
   viewport:{width:profile.width,height:profile.height},
   isMobile:profile.mobile,hasTouch:profile.touch,deviceScaleFactor:1
  });
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(profile.name+': '+e.message));
  await page.goto(origin+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.__game&&!!window.CatBondDuoHero&&!!window.CatRelations&&!!window.State);
  const entry=await page.evaluate(()=>{
   const g=window.__game,State=window.State;
   const a=State.makeCat('tangyuan',{affinity:90});
   const b=State.makeCat('xiaohui',{affinity:90});
   a.personality='gentle';b.personality='shy';
   State.S.cats=[a,b];
   window.CatRelations.choose(a,b);
   window.CatRelations.pair(a,b).value=95;
   State.S.battlePrefs={...(State.S.battlePrefs||{}),autoBattle:false,modeChosen:true,
      manualTutorialSeen:false,tutorialSeen:false};
   g.startBattle([a,b],window.GameData.speciesById('jinwu'));
   return {manual:!g.battle.autoMode,paused:g.battleHelpOpen,coach:!!g.battle.coach};
  });
  assert.equal(entry.manual,true,'must enter manual battle');
  assert.equal(entry.paused,true,'manual tutorial must pause the arena before first input');
  assert.equal(entry.coach,true,'guided action practice must exist');
  for(let step=0;step<4;step++){
   const content=await page.locator('#battle-help-body').innerText();
   assert.match(content,/手机|触屏|Phone/,'tutorial must explain touch controls');
   assert.match(content,/电脑|键鼠|Computer/,'tutorial must explain desktop controls');
   if(step===1)assert.match(content,/WASD|方向键/);
   if(step===2)assert.match(content,/Space|空格/);
   if(step===3)assert.match(content,/20|60|90/);
   await page.locator('#battle-help-start').click();
  }
  assert.equal(await page.locator('#battle-help').isVisible(),false,
   'last tutorial step resumes playable fight');
  const result=await page.evaluate(()=>{
   const g=window.__game,State=window.State;
   const [a,b]=State.S.cats;
   const first=g.battle;
   first.coach=null;first.t=5;
   const shy=first.team[1];
   shy.hp=shy.maxhp*.55;
   first.hurtMe(12,shy.x,shy.y,shy);
   const guard=first.bondEvents?.guard||0;
   first.t+=1;
   first.tickBondStory();
   const courage=first.bondEvents?.courage||0;
   // Existing clever cats must also use the new feint; not only newly caught
   // mischievous kittens. The enemy AI has a real temporary focus target.
   a.personality='clever';b.personality='gentle';
   first._bondNextFeint=first.t;
   first.enemies.forEach(e=>{e.alive=true;e.x=first.team[0].x+72;e.y=first.team[0].y;e.hp=e.maxhp;});
   first.tickBondStory();
   const feint=first.bondEvents?.feint||0;
   const focus=first.enemies.some(e=>e._bondLureUid===a.uid&&e._bondLureUntil>first.t);
   first.t+=1;
   first.tickBondStory();
   const ambush=first.bondEvents?.ambush||0;
   // Snapshot a tier-3 duo cut-in through the real battle canvas.
   first.duoCharge=100;first.duoCd=0;first.coach=null;
   const cast=first.castDuo();
   if(first.duoCinematic)first.duoCinematic.t=first.duoCinematic.max-.95;
   const ctx=document.getElementById('scene').getContext('2d');
   let cutin=0;const before=window.CatBondDuoHero.draw;
   window.CatBondDuoHero.draw=function(...args){cutin++;return before(...args);};
   first.draw(ctx);
   window.CatBondDuoHero.draw=before;
   // Check the responsive guidance continues during actual controlled practice.
   const card=document.getElementById('battle-coach-card');
   return {guard,courage,feint,focus,ambush,cast,cutin,tier:first.duoCinematic?.tier,
      variant:first.duoCinematic?.variant,cardPresent:!!card,hero:typeof window.CatBondDuoHero.draw};
  });
  assert.ok(result.guard>=1,'gentle partner must actually defend vulnerable shy cat');
  assert.ok(result.courage>=1,'rescued shy cat must counterattack');
  assert.ok(result.feint>=1&&result.focus,'clever or mischievous cat must redirect enemy AI');
  assert.ok(result.ambush>=1,'partner must actually follow up with ambush damage');
  assert.equal(result.cast,true,'duo should be castable at full meter');
  assert.ok(result.cutin>=1,'game must draw new moving kitten art');
  assert.equal(result.tier,3,'90+ trust yields tier-3 art');
  assert.equal(result.variant,'finale','high trust must unlock finishing claw variant');
  assert.equal(result.cardPresent,true);
  await page.screenshot({path:'/tmp/cat-bond-'+profile.name+'-duo.png'});
  console.log('DUO BOND PASS '+profile.name+' '+JSON.stringify(result));
  await context.close();
 }
 assert.deepEqual(errors,[],'uncaught browser errors');
}catch(err){console.error('DUO BOND FAIL',err);console.error('Browser errors',errors);process.exitCode=1;
}finally{await browser.close();}
