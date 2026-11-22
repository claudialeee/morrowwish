// Verify that every pre-battle choice (yard, map, pre-encounter) exposes
// meaningful, accurate cat stats on phone and desktop before the fight starts.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const errors=[];
try{
 for(const device of [
  {name:'phone',width:390,height:844,touch:true},
  {name:'desktop',width:1180,height:760,touch:false}
 ]){
  const context=await browser.newContext({
   viewport:{width:device.width,height:device.height},
   isMobile:device.touch,hasTouch:device.touch
  });
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(device.name+': '+e.message));
  await page.goto(origin+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.UI&&!!window.State&&!!window.__game);
  await page.locator('#intro-start').click();
  await page.evaluate(()=>{
   window.UI.closeAll();
   // This suite explicitly verifies an INJURED veteran. Casual now fully
   // heals between battles by design; only hardcore persists wounds.
   State.setDifficulty('hardcore');
   const veteran=State.makeCat('xianluo',{affinity:70});
   const beginner=State.makeCat('tangyuan',{affinity:25});
   const partner=State.makeCat('sanhua',{affinity:50});
   veteran.level=7;
   veteran.stats={pow:22,agi:19,vit:20,cha:14};
   State.setBattleHealth(veteran,.44);
   beginner.level=1;
   beginner.stats={pow:6,agi:4,vit:8,cha:7};
   State.S.cats=[veteran,beginner,partner];
   State.S.catchCount=3;
   State.S.battlePrefs={autoBattle:false,teamUids:[beginner.uid,veteran.uid,partner.uid]};
   window.MorrowwishI18n.get=()=> 'zh';
   // CASUAL mode auto-heals carried expedition wounds by design. Use
   // HARDCORE to verify the exact wounded-HP UI rather than asserting an
   // impossible wound against the casual game rules.
   State.setDifficulty('hardcore');
   if(State.catHpFraction(veteran)>.90)
     throw Error('The veteran wound failed to persist in hardcore mode');
   window.UI.openMapSquad();
  });
  const summary=await page.locator('#panel .map-squad-choice').allTextContents();
  assert.equal(summary.length,3,'expedition must show all owned cats');
  assert.ok(summary.some(t=>/(?:Lv\.?\s*7|等级\s*7)/.test(t)&&/SR/.test(t)&&/(战力|Power)/.test(t)&&/(负伤|Injured)/.test(t)),
    'veteran must show correct level, rarity, power and carried wound: '+JSON.stringify(summary));
  assert.ok(summary.some(t=>/(?:Lv\.?\s*1|等级\s*1)/.test(t)&&/N/.test(t)&&/(生命|HP)/.test(t)),
    'new kitten must show actual level, rarity and HP: '+JSON.stringify(summary));
  const leaderBefore=await page.locator('#panel .battle-order-item.field').first().innerText();
  assert.match(leaderBefore,/(?:Lv\.?\s*1|等级\s*1)/, 'first starter must be identifiable by level');
  // Promote veteran to lead, with its level shown again in the ordered list.
  await page.locator('#panel [data-order-index="1"][data-order-shift="-1"]').click();
  const leaderAfter=await page.locator('#panel .battle-order-item.field').first().innerText();
  assert.match(leaderAfter,/(?:Lv\.?\s*7|等级\s*7)/,'reordered lead displays its new level and power');
  await page.screenshot({path:'/tmp/cat-bond-squad-'+device.name+'-map.png'});
  await page.evaluate(()=>{
   const team=UI.getPreferredBattleTeam();
   UI.openBattleModePrompt(team,{...GameData.speciesById('moqiu'),encounterLevel:4},{origin:'map'});
  });
  const encounter=await page.locator('#panel').innerText();
  const encounterCards=await page.locator('#panel .map-squad-choice').allTextContents();
  assert.match(encounter,/(?:Lv\.?\s*4|等级\s*4)/,
    'enemy level visible before fight: '+encounter.slice(0,450));
  assert.equal(encounterCards.length,3,
    'map encounter must provide three selectable team members: '+encounter.slice(0,450));
  assert.ok(encounterCards.some(t=>/(?:Lv\.?\s*7|等级\s*7)/.test(t)),
    'team levels must remain visible during encounter: '+JSON.stringify(encounterCards));
  await page.screenshot({path:'/tmp/cat-bond-squad-'+device.name+'-encounter.png'});
  await page.evaluate(()=>{
   UI.openCapturePrep({...GameData.speciesById('doudou'),encounterLevel:2});
  });
  const captureCards=await page.locator('#cp-roster .chip').allTextContents();
  assert.ok(captureCards.some(t=>/(?:Lv\.?\s*7|等级\s*7)/.test(t)&&/SR/.test(t)&&/(负伤|Injured)/.test(t)),
    'yard selection must display the injured veteran and rarity');
  assert.ok(captureCards.some(t=>/(?:Lv\.?\s*1|等级\s*1)/.test(t)&&/(战力|Power)/.test(t)),
    'yard selection must display the beginner level and combat power');
  assert.ok(captureCards.every(t=>/⚔/.test(t)&&/❤/.test(t)),
    'every capture candidate displays attack and HP');
  // Capture roster is deliberately behind a collapsed <details> disclosure.
  // An actual player opens "Battle team · edit" before tapping a chip.
  // Clicking a hidden button without opening it was a stale test bug.
  await page.locator('#battle-team-details > summary').click();
  await page.locator('#cp-roster .chip').last().click();
  const pressed=await page.locator('#cp-roster .chip').last().getAttribute('aria-pressed');
  assert.ok(['true','false'].includes(pressed),'yard picker remains accessible');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+5);
  assert.equal(overflow,false,'prebattle stats must fit device width');
  await page.screenshot({path:'/tmp/cat-bond-squad-'+device.name+'-yard.png'});
  console.log('SQUAD SELECTION STATS PASS '+device.name+
    JSON.stringify({mapChoices:summary.length,enemyLevel:4,ranked:leaderAfter,
      captureChoices:captureCards.length}));
  await context.close();
 }
 assert.deepEqual(errors,[],'no uncaught browser exceptions');
}catch(e){console.error('SQUAD SELECTION STATS FAIL',e,errors);process.exitCode=1}
finally{await browser.close()}
