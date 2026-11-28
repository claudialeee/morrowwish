// Verify the actual first exploration region, Sunlit Garden, with the current
// casual +/-2 level contract. Exercise real AI / projectiles / cooldowns.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
try{
 const page=await browser.newPage({viewport:{width:910,height:630}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__game&&window.Battle?.CaptureBattle);
 const result=await page.evaluate(()=>{
  const g=window.__game,S=State.S;
  S.tutorialDone=true;S.catchCount=0;State.setDifficulty('casual');
  S.aiProfile={v:1,battles:0,adapt:false};
  S.battlePrefs={autoBattle:true,manualTutorialSeen:true,tutorialSeen:true,modeChosen:true};
  const entries=[];
  for(let trial=0;trial<3;trial++){
   const cats=['tangyuan','xiaohui','doudou','nainai','moqiu'].map(id=>State.makeCat(id));
   cats.forEach(c=>{c.level=1;c.affinity=40;c._hpFrac=1});
   S.cats=cats;S.battlePrefs.teamUids=cats.map(c=>c.uid);
   if(!WorldMap.isUnlocked('home')||WorldMap.isUnlocked('sakura'))throw Error('Beginner region fixture violates current unlock gates');
   g.scene='map';g._battleTheme={region:'home'};
   const b=new Battle.CaptureBattle(g,cats,GameData.speciesById('doudou'),{seed:20261127+trial});
   b.coach=null;b.autoMode=true;
   let ticks=0;
   for(;ticks<4800&&!b.done;ticks++)b.update(1/30);
   entries.push({result:b.result||null,done:b.done,ticks,seconds:Math.round(ticks/30),
    wildLevel:b.wildLevel,enemyHp:b.enemies[0].maxhp,enemyDmg:b.enemies[0].dmg,
    teamAlive:b.team.filter(x=>x.alive).length,
    reserve:b.reserve.length,oppRemaining:b.liveEnemies().length});
  }
  return entries;
 });
 assert.ok(result.every(x=>x.wildLevel>=2&&x.wildLevel<=3),'Lv.1 casual team in home must meet Lv.2–3, per current floor and +2 ceiling: '+JSON.stringify(result));
 assert.ok(result.filter(x=>x.result==='win').length>=2,
   'Most beginner 5-cat runs must win a normal encounter: '+JSON.stringify(result));
 assert.deepEqual(errors,[]);
 console.log('CAT BOND 5-CAT NEW PLAYER AUTOFIGHT '+JSON.stringify(result));
}finally{await browser.close()}
