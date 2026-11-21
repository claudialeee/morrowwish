// Starter region progression and fight-earned XP regression.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const base=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
try{
 const page=await browser.newPage({viewport:{width:1024,height:700}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/cat-bond/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__game&&window.State&&window.Battle?.CaptureBattle);
 const result=await page.evaluate(()=>{
   const g=window.__game,State=window.State;
   const a=State.makeCat('tangyuan'),b=State.makeCat('xiaohui');
   State.S.cats=[a,b];State.S.catchCount=25; // returning player to first map
   const species=GameData.speciesById('doudou');
   const trials=[];
   for(let i=0;i<20;i++){
     g.scene='map';g._battleTheme={region:'sakura'};
     const first=new Battle.CaptureBattle(g,[a,b],species);
     trials.push({level:first.wildLevel,pack:first.enemies.length,
       enemyDmg:first.enemies[0].dmg,enemyHp:first.enemies[0].maxhp,
       dmgRatio:first.enemyDmgMult,playerDmg:first.playerDmgMult});
   }
   g._battleTheme={region:'ruins'};
   const later=new Battle.CaptureBattle(g,[a,b],species);
   return {trials,laterLevel:later.wildLevel};
 });
 assert.ok(result.trials.every(t=>t.level>=1&&t.level<=3),
   'First map must never spawn a level-6 cat after 25 captures');
 assert.ok(result.trials.every(t=>t.pack===1),
   'First map should not spawn a three-cat pack against two starters');
 assert.ok(result.trials.every(t=>t.dmgRatio<=1.08&&t.playerDmg>=.94),
   'Starter wild cats should not have overwhelming level-gap multipliers');
 assert.ok(result.laterLevel>=3,
   'Late regions must retain progression rather than globally cap levels');
 assert.deepEqual(errors,[]);
 console.log('CAT BOND STARTER BALANCE PASS '+JSON.stringify({
  trials:result.trials.length,levels:[...new Set(result.trials.map(x=>x.level))],
  maxEnemyDmg:Math.max(...result.trials.map(x=>x.enemyDmg)),
  maxEnemyHp:Math.max(...result.trials.map(x=>x.enemyHp)),
  laterLevel:result.laterLevel
 }));
}finally{await browser.close()}
