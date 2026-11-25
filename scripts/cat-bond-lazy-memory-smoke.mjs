// Cat Bond regression: cohesive unlocked-only gallery, 13 memories, two
// earnable map markers per region, atomic bulk shop and retired growth controls.
import assert from 'node:assert/strict';
import {startNewAdventure,continueSavedAdventure} from './cat-bond-test-start.mjs';
import fs from 'node:fs';
import {chromium} from 'playwright';
const mapSource=fs.readFileSync('public/cat-bond/js/worldmap.js','utf8');
assert.match(mapSource,/nodes\.push\(\{id:id\+'_duo_moment'/,
  'Each region needs one EXTRA real duo discovery, beyond the original landmark');
const browser=await chromium.launch({headless:true});
try{
 for(const p of [
  {name:'phone',width:390,height:844,mobile:true},
  {name:'desktop',width:1180,height:760,mobile:false}
 ]){
  const ctx=await browser.newContext({viewport:{width:p.width,height:p.height},
     isMobile:p.mobile,hasTouch:p.mobile});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__game&&window.UI&&window.State&&window.CatRelations&&window.Growth);
  await startNewAdventure(page);
  await page.evaluate(()=>{
    const a=State.makeCat('tangyuan'),b=State.makeCat('xiaohui');
    State.S.cats=[a,b];State.S.duoRelations={pairs:{},active:[]};
    State.S.coins=1200;State.S.fish=1200;
    Raising.init();State.S.raising.yarn=100;State.S.raising.starShards=50;
    State.save();UI._shopQuantity=1;
    UI.openShop();
  });
  assert.deepEqual(await page.locator('#panel [data-buy]').evaluateAll(nodes=>nodes.map(n=>n.dataset.buy).sort()),
    ['medkit','treat5','treat15','lure','fish','stone:夜影石','stone:月华露','stone:赤焰晶','stone:翠藤芽','stone:流光珠'].sort(),
    'Shop exposes all ten authored supplies, including recovery kit and five elemental stones');
  assert.equal(await page.locator('#panel [data-buy="medkit"]').count(),1,
    'The first-aid kit must be buyable for post-combat recovery');
  assert.equal(await page.evaluate(()=>UI.shopItem('medkit')?.medkitsGain),1,
    'Buying a kit must produce an actual consumable, not decorative shop art');
  await page.locator('#panel [data-shop-qty="10"]').click();
  await page.locator('#panel [data-buy="treat15"]').click();
  const paid=await page.evaluate(()=>({coins:State.S.coins,fish:State.S.fish}));
  assert.deepEqual(paid,{coins:450,fish:1350},'ten packs cost 750 once; grant 150 fish in the two-currency economy');
  await page.locator('#panel [data-shop-qty="max"]').click();
  const affordable=await page.evaluate(()=>UI.shopMaxAffordable('fish'));
  assert.equal(affordable,7,'one-tap affordable max uses remaining wallet');
  await page.locator('#panel [data-buy="fish"]').click();
  assert.equal(await page.evaluate(()=>State.S.coins),30);
  const failed=await page.evaluate(()=>{
    const balance=State.S.coins;
    const r=UI.buy('treat15',1000);
    return {ok:r.ok,stable:State.S.coins===balance};
  });
  assert.deepEqual(failed,{ok:false,stable:true},'insufficient bulk orders never partially debit');
  await page.evaluate(()=>UI.openCatDetail(State.S.cats[0]));
  assert.equal(await page.locator('#cd-trainfive').count(),0,
    'the redundant five-level button has been removed');
  await page.locator('#cd-trainnext').click();
  assert.equal(await page.evaluate(()=>State.S.cats[0].level),2,
    'one-tap upgrade should advance one level');
  // Current economy uses coins for stat training; top up only for this isolated operation.
  await page.evaluate(()=>{State.S.coins=1000;UI.renderCatDetail(State.S.cats[0]);});
  await page.locator('#cd-grow-more > summary').click();
  await page.locator('#cd-stat-ten').click();
  assert.equal(await page.evaluate(()=>State.S.coins),200,'ten stat sessions cost exactly 800 coins');
  // Level and skill training still work, but growth transformations are retired.
  const form=await page.evaluate(()=>{
    const c=State.S.cats[0];c.level=20;c.affinity=100;
    State.S.raising.starShards=30;
    UI.renderCatDetail(c);
    const before=c.stage||0,shards=State.S.raising.starShards;
    const r=Growth.advance(c,'agi');
    return {blocked:!r.ok&&r.disabled===true,stage:(c.stage||0),
      unchanged:(c.stage||0)===before,
      unspent:State.S.raising.starShards===shards,
      noButton:!document.getElementById('cd-grow'),
      noAwaken:!document.querySelector('[data-awaken]')};
  });
  assert.deepEqual(form,{blocked:true,stage:0,unchanged:true,unspent:true,
    noButton:true,noAwaken:true});
  const duo=await page.evaluate(()=>{
    const [a,b]=State.S.cats;CatRelations.choose(a,b);
    CatRelations.pair(a,b).value=20;State.save();
    UI.openBondPanel();
    const map=CatRelations.MEMORY_CATALOG.filter(m=>m.kind==='map').length;
    const first=CatRelations.remember(a,b,'sakura-moment');
    const second=CatRelations.remember(a,b,'sakura-moment');
    const play=CatRelations.play(a,b);
    const rel=CatRelations.pair(a,b);rel.sulkyPending=true;
    const soothe=CatRelations.soothe(a,b);
    UI.openBondPanel();
    return {total:CatRelations.MEMORY_CATALOG.length,map,first:first.ok,
      repeated:second.ok,play:play.ok,soothe,
      ids:CatRelations.memoryList(a,b),trust:CatRelations.pair(a,b).value};
  });
  assert.equal(duo.total,13);
  assert.equal(duo.map,10);
  assert.equal(duo.first,true);
  assert.equal(duo.repeated,false,'each duo memory may be earned only once');
  assert.equal(duo.play,true);
  assert.equal(duo.soothe,true);
  for(const id of ['sakura-moment','play-together','make-up'])
    assert.ok(duo.ids.includes(id),id+' must be genuinely earned');
  assert.equal(await page.locator('.duo-unlocked-card').count(),1);
  assert.equal(await page.locator('#duo-skill-canvas').count(),0,
    'unlocked move must NOT be drawn twice in same panel');
  assert.equal(await page.locator('.duo-memory-stamp').count(),13);
  await page.locator('#panel [data-duo-memory="sakura-moment"]').click();
  assert.match(await page.locator('#duo-memory-note').innerText(),/花雨双猫舞/);
  await page.screenshot({path:'/tmp/catbond-bulk-memories-'+p.name+'.png'});
  assert.deepEqual(errors,[],'no uncaught game page errors');
  console.log('CAT BOND LAZY + MEMORY PASS '+p.name+' '+JSON.stringify({paid,affordable,form,memories:duo.ids}));
  await ctx.close();
 }
}finally{await browser.close()}
