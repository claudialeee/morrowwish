// Regression for the Work playtest of 2026-11-27. Browser fixtures isolate
// layout and the exact battle/gate code paths; this is not a full player run.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 for(const [width,height,touch,lang] of [[390,844,true,'zh'],[360,740,true,'en'],[1180,760,false,'en']]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,deviceScaleFactor:1});
  const page=await context.newPage(); const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+'/cat-bond/?lang='+lang,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.__game&&!!window.CatRelations&&!!window.WorldMap);
  const before=await page.evaluate(()=>{
    document.getElementById('intro-start').click();window.UI.closeAll();
    const State=window.State,g=window.__game;
    const a=State.makeCat('tangyuan',{affinity:90}), b=State.makeCat('xiaohui',{affinity:90});
    State.S.cats=[a,b];State.S.catchCount=1;
    window.CatRelations.choose(a,b);window.CatRelations.pair(a,b).value=26;
    State.S.firstDuoShowcasePending=true;
    State.S.battlePrefs={...(State.S.battlePrefs||{}),autoBattle:false,modeChosen:true,
      manualTutorialSeen:false,tutorialSeen:true,teamUids:[a.uid,b.uid]};
    g.startBattle([a,b],window.GameData.speciesById('jinwu'));
    const initial={duo:!!g.battle.duo,charge:g.battle.duoCharge,coach:!!g.battle.coach,help:g.battleHelpOpen};
    g.battle.toggleAuto();g.battle.toggleAuto();
    return {...initial,afterToggleCoach:!!g.battle.coach,afterToggleHelp:g.battleHelpOpen,touchAssist:g.touchAutoFire};
  });
  assert.equal(before.duo,true);assert.equal(before.charge,100);
  assert.equal(before.coach,false);assert.equal(before.help,false);
  assert.equal(before.afterToggleCoach,false);assert.equal(before.afterToggleHelp,false);
  if(touch)assert.equal(before.touchAssist,true);
  assert.equal(await page.locator('#btn-debug').isVisible(),false,'Normal players must never see debug');
  assert.equal(await page.locator('#battle-hint').isVisible(),false,'Duplicate coach banner must be hidden');
  const button=page.locator('#duo-burst'), card=page.locator('#battle-coach-card');
  assert.equal(await button.isEnabled(),true,'First Duo must be ready immediately');
  assert.equal(await card.isVisible(),true,'Compact Duo prompt must be visible');
  const [a,b]=await Promise.all([button.boundingBox(),card.boundingBox()]);
  assert.ok(a&&b&&(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y),'Duo prompt overlaps button');
  assert.ok(a.x>=0&&a.x+a.width<=width+1&&a.y>=0&&a.y+a.height<=height+1,'Duo button outside viewport');
  await button.click();await page.waitForFunction(()=>window.__game.battle.duoUses>0);
  const gate=await page.evaluate(()=>{
    const State=window.State,g=window.__game;
    const roster=Array.from({length:6},(_,i)=>State.makeCat(i===0?'tangyuan':'xiaohui'));
    roster.forEach((c,i)=>{c.level=i<5?3:1;});
    State.S.cats=roster;State.S.battlePrefs.teamUids=roster.slice(0,5).map(c=>c.uid);
    State.S.worldmap.unlocked.sakura=false;
    const w=window.WorldMap,first=w.teamAvgLevel(),open=w.isUnlocked('sakura');
    roster[0].level=2;const below=w.teamAvgLevel(),locked=!w.isUnlocked('sakura');
    roster[0].level=4;roster[1].level=2;const mixed=w.teamAvgLevel(),mixedOpen=w.isUnlocked('sakura');
    return {first,open,below,locked,mixed,mixedOpen};
  });
  assert.deepEqual(gate,{first:3,open:true,below:2.8,locked:true,mixed:3,mixedOpen:true});
  // A later first manual encounter must offer optional practice, not another
  // mandatory four-page lesson. Normal play starts with one button press.
  const lesson=await page.evaluate(()=>{
    const State=window.State,g=window.__game;
    const [a,b]=State.S.cats;State.S.firstDuoShowcasePending=false;
    State.S.battlePrefs.manualTutorialSeen=false;State.S.battlePrefs.autoBattle=false;
    g.startBattle([a,b],window.GameData.speciesById('jinwu'));
    return {paused:g.battleHelpOpen,coach:!!g.battle.coach};
  });
  assert.deepEqual(lesson,{paused:true,coach:true});
  assert.equal(await page.locator('#battle-tutorial-practice').isVisible(),true);
  await page.locator('#battle-help-start').click();
  assert.equal(await page.locator('#battle-help').isVisible(),false);
  assert.equal(await page.evaluate(()=>!!window.__game.battle.coach),false);
  assert.deepEqual(errors,[],'Unexpected runtime error');
  console.log('PASS '+width+'x'+height+' '+lang+': ready duo, mode toggle, no debug, no overlap, real button cast, roster average');
  await context.close();
 }
} finally { await browser.close(); }
