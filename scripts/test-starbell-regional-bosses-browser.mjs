// Developer-slot checkpoints only; tested fights must win through the real battle engine.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {makeEngine} from '../public/cat-bond/js/resonance/engine.mjs';
import {REGIONAL_BOSSES,bossKey,bossReward,bossTemplates} from '../public/cat-bond/js/resonance/regional-bosses.mjs';
const origin=process.env.CAT_BOND_SMOKE_ORIGIN||'http://127.0.0.1:8765';
const portrait=process.env.STARBELL_BOSS_PROFILE==='portrait';
const lang=portrait?'zh':'en';
const browser=await chromium.launch({headless:true});
const late=new Set(['mechanism:muling-unlock','npc:public-accountability','npc:second-garden-key']);
const ok=(r,m)=>assert.ok(r?.ok,m+': '+JSON.stringify(r));
function checkpoint(target){
 const e=makeEngine(campaign);
 for(const s of campaign.scenes){
  if(s.id===target){
   if(target==='library:M-02'){ok(e.record(s.id,'puzzle:library-echo'),s.id);while(e.view().lineReady&&e.view().cursor<s.lines.length)ok(e.nextLine(),s.id);}
   return e.snapshot();
  }
  if(s.id==='prologue:P-05'&&!e.view().openingMet)ok(e.meetTraveler(),s.id);
  if(s.choiceTiming==='beforeAction'&&s.choices.length)ok(e.choose(s.choices[0].id),s.id);
  if(s.id==='finale:B-03')for(let j=0;j<campaign.regions.length;j++)ok(e.supportAction(campaign.regions[j],campaign.support[j]),s.id);
  for(const op of s.requires.filter(o=>!late.has(o)))ok(e.record(s.id,op),s.id);
  while(e.view().cursor<s.lines.length){if(s.choiceAt===e.view().cursor&&!e.view().choice)ok(e.choose(s.choices[0].id),s.id);ok(e.nextLine(),s.id);}
  if(s.choiceTiming!=='beforeAction'&&s.choices.length&&!e.view().choice)ok(e.choose(s.choices[0].id),s.id);
  for(const op of s.requires.filter(o=>late.has(o)))ok(e.record(s.id,op),s.id);
  ok(e.finish(),s.id);
 }
 return e.snapshot();
}
const cases=[
 {id:'harbor',region:'harbor',scene:'harbor:H-04',op:'battle:chime-beast',point:[.195,.50],start:[.235,.56],level:1},
 {id:'forest',...REGIONAL_BOSSES.forest,scene:'forge:E-01',start:[.69,.53],level:3},
 {id:'forge',region:'forge',scene:'forge:E-03',op:'battle:shadow-beast',point:[.74,.40],start:[.63,.50],level:3},
 {id:'sky',...REGIONAL_BOSSES.sky,scene:'library:M-01',start:[.58,.55],level:4},
 {id:'library',...REGIONAL_BOSSES.library,start:[.67,.40],level:5},
 {id:'starfall',...REGIONAL_BOSSES.starfall,start:[.51,.58],level:6},
 {id:'mastery',...REGIONAL_BOSSES.mastery,scene:null,start:[.34,.68],level:12}
];
const assets={harbor:['combat/tide-shell-watercolor.webp','combat/harbor-arena.webp','mobile-portrait/battle-windchime.webp'],forest:['combat/rootbound-watercolor.webp','combat/forest-arena.webp','mobile-portrait/battle-forest.webp'],forge:['canon22-final-art/shadow-beast.webp','canon22-final-art/lantern-theater.webp','mobile-portrait/battle-lantern.webp'],sky:['combat/gale-wing-watercolor.webp','combat/sky-arena.webp','mobile-portrait/battle-sky.webp'],library:['combat/mirror-sentinel-watercolor.webp','combat/library-arena.webp','mobile-portrait/battle-library.webp'],starfall:['combat/orbit-sentinel-watercolor.webp','combat/starfall-arena.webp','mobile-portrait/battle-starfall.webp']};
const press=async(loc)=>portrait?loc.tap():loc.click();
const errors=[];
try{
 for(const c of cases){
  const context=await browser.newContext(portrait?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:800}});
  const page=await context.newPage();page.setDefaultTimeout(20000);
  const localErrors=[];page.on('pageerror',e=>localErrors.push(e.message));
  await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort()});
  try{
   await page.goto(origin+'/cat-bond/?developer=1&qa=guardian&region='+c.region+'&reset=1&lang='+lang);
   await page.locator('#starbell-developer-menu').waitFor();
   await page.evaluate(async ({c,snapshot,paths})=>{
    if(!window.__STARBELL_DEVELOPER__)throw Error('Isolated developer slot required');
    await Promise.all(paths.map(async p=>{const im=new Image();im.src='assets/'+p;await im.decode();if(!im.naturalWidth)throw Error(p+' missing');}));
    CatBondResonance.close();UI.closeAll();
    const cats=['jinjc','story_muling'].map(species=>{const cat=State.makeCat(species,{affinity:35,protagonist:species==='jinjc'});while(cat.level<c.level)State.addXp(cat,State.xpToNext(cat.level));Skills.autoLearn(cat);return cat;});
    Object.assign(State.S,{cats,gameStarted:true,coins:500,fish:20,difficulty:'casual',catchCount:2,firstDuoShowcasePending:false,battleTutorialDone:true,battlePrefs:{autoBattle:true,modeChosen:true,tutorialSeen:true,manualTutorialSeen:true,teamUids:cats.map(x=>x.uid)},resonance:snapshot,resonanceExploration:{location:c.region,positions:{[c.region]:{x:c.start[0],y:c.start[1]}},interactions:{},pickups:{},cargo:null}});
    if(!State.save().ok)throw Error('Checkpoint save failed');
    if(!WorldMap.enterRegion(c.region))throw Error('Region entry failed');
   },{c,snapshot:checkpoint(c.scene),paths:assets[c.region]});
   await page.waitForFunction(()=>document.querySelector('.rw-world')?.dataset.artReady==='true');
   const open=async()=>{
    if(c.optional){
     const b=page.locator('[data-regional-boss="'+c.id+'"]');
     if(!await b.isVisible()){const toggle=page.locator('.rw-region-toggle');if(await toggle.isVisible()&&await toggle.getAttribute('aria-expanded')!=='true')await press(toggle);const summary=page.locator('.rw-optional-actions>summary');if(await summary.isVisible()&&!await b.isVisible())await press(summary);}
     await press(b);
    }else await press(page.locator('[data-next-scene="'+c.scene+'"]'));
    await page.locator('#bp-go').waitFor({state:'visible'});
   };
   await open();
   if(c.id==='harbor'){
    await press(page.locator('[data-battle-auto="false"]'));
    await press(page.locator('#bp-go'));
    await page.waitForFunction(()=>__game.scene==='battle'&&__game.battle?.libraryEncounter?.bossId==='harbor');
    assert.equal(await page.evaluate(()=>__game.battle.autoMode),false);
    if(await page.locator('#battle-help-start').isVisible())await press(page.locator('#battle-help-start'));
    // A real manual input followed by real retreat; no manufactured victory.
    const canvas=page.locator('#scene'),r=await canvas.boundingBox();
    if(portrait){const session=await context.newCDPSession(page);const x=r.x+r.width*.40,y=r.y+r.height*.55;await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+35,y:y+20}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
    else{await page.keyboard.down('d');await page.waitForTimeout(150);await page.keyboard.up('d');}
    await press(page.locator('#btn-flee'));await page.waitForFunction(()=>__game.scene==='map');
    assert.equal(await page.evaluate(()=>State.S.coins),500);
    assert.ok(await page.evaluate(op=>CatBondResonance.view().objective.includes(op),c.op));
    if(await page.locator('#library-retry-encounter').isVisible())await press(page.locator('#library-retry-encounter'));else{await page.evaluate(()=>UI.closeAll());await open();}
   }
   await press(page.locator('[data-battle-auto="true"]'));await press(page.locator('#bp-go'));
   await page.waitForFunction(id=>__game.scene==='battle'&&__game.battle?.libraryEncounter?.bossId===id,c.id);
   const combat=await page.evaluate(()=>{const b=__game.battle;return {species:b.enemies[0].sp.id,element:b.enemies[0].element,isBoss:b.enemies[0].isBoss,portrait:b.H>b.W,health:b.enemies[0].hp,auto:b.autoMode};});
   assert.equal(combat.species,bossTemplates[c.id]);assert.equal(combat.isBoss,true);assert.equal(combat.auto,true);assert.ok(combat.health>0);assert.equal(combat.portrait,portrait);
   const hud=page.locator('#cb-region-combat');await hud.waitFor({state:'visible'});
   // Run the real update loop faster than wall time, never call finish(true).
   const result=await page.evaluate(()=>{const g=__game,b=g.battle;for(let i=0;i<10000&&!b.done;i++)b.update(1/60);const out={result:b.result,done:b.done,t:b.t};if(b.done&&g.battle===b)g.endBattle();return out;});
   assert.equal(result.done,true);assert.equal(result.result,'win',JSON.stringify(result));
   await page.waitForFunction(()=>__game.scene==='map');
   const after=await page.evaluate(({c,key})=>({coins:State.S.coins,fish:State.S.fish,recorded:c.optional?!!State.S.resonanceExploration.interactions[key]:State.S.resonance.evidence[c.scene]?.includes(c.op),region:WorldMap.currentRegion,publicKeys:['catbond_save_v1','catbond_save_slots_v1','catbond_active_slot_v1'].map(k=>localStorage.getItem(k)),mapSize:(()=>{const r=document.querySelector('.rw-surface')?.getBoundingClientRect();return r&&{w:r.width,h:r.height}})()}),{c,key:bossKey(c.id)});
   const reward=bossReward(c.id,{interactions:{}});assert.equal(after.coins,500+reward[0]);assert.equal(after.fish,20+reward[1]);assert.equal(after.recorded,true);assert.equal(after.region,c.region);assert.ok(after.publicKeys.every(x=>x===null));assert.ok(after.mapSize?.w>0&&after.mapSize?.h>0);
   if(c.id==='forest'){
    await page.evaluate(()=>{CatBondResonance.close();UI.closeAll();});await open();await press(page.locator('[data-battle-auto="true"]'));await press(page.locator('#bp-go'));
    await page.waitForFunction(()=>__game.battle?.libraryEncounter?.bossId==='forest');
    const rematch=await page.evaluate(()=>{const g=__game,b=g.battle;for(let i=0;i<10000&&!b.done;i++)b.update(1/60);if(b.done&&g.battle===b)g.endBattle();return b.result;});
    assert.equal(rematch,'win');assert.equal(await page.evaluate(()=>State.S.coins),after.coins,'no duplicate reward');
   }
   assert.deepEqual(localErrors,[]);console.log('GUARDIAN BROWSER PASS',portrait?'portrait':'wide',lang,c.id,JSON.stringify({combat,result,after}));
  }catch(e){errors.push({id:c.id,message:String(e),pageErrors:localErrors});console.error('GUARDIAN BROWSER FAIL',c.id,String(e),localErrors);}
  finally{await context.close();}
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
