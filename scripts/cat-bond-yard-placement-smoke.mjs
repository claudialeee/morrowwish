// REVIEW ONLY — Cat Bond garden architecture and on-screen cat play QA.
// Does not write a production save, publish a game or alter balance.
import assert from 'node:assert/strict';
import {startNewAdventure,continueSavedAdventure} from './cat-bond-test-start.mjs';
import {chromium} from 'playwright';
const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true});
try{
 for(const profile of [
  {name:'phone',width:390,height:844,mobile:true,touch:true},
  {name:'compact-phone',width:320,height:568,mobile:true,touch:true},
  {name:'landscape-phone',width:844,height:390,mobile:true,touch:true},
  {name:'desktop',width:1180,height:760,mobile:false,touch:false}
 ]){
  const ctx=await browser.newContext({viewport:{width:profile.width,height:profile.height},
    deviceScaleFactor:1,isMobile:profile.mobile,hasTouch:profile.touch});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.__game&&!!window.UI&&!!window.World);
  await startNewAdventure(page,{scene:'yard'});
  const init=await page.evaluate(()=>{
   // Test the real garden with two living cats and 500 coins, not a fake menu.
   const g=window.__game;
   State.S.cats=[State.makeCat('tangyuan'),State.makeCat('xiaohui')];
   State.S.coins=500;
   State.S.yardBuildings=[];g.yard.rebuild();g.refreshYardSurprise();
   UI.syncYardNav();
   return {coins:State.S.coins,
    catsNav:document.querySelector('.tab[data-tab="cats"] .nav-caption')?.textContent,
    hidden:document.getElementById('collection-goal').hidden};
  });
  assert.equal(init.coins,500);
  assert.match(init.catsNav,/猫咪/,'bottom cat hub must show the solo and duo features');
  assert.equal(init.hidden,true,'do not keep the broad top combined banner');
  const duoVisible=await page.locator('.tab[data-tab="cats"]').isVisible();
  assert.equal(duoVisible,true,'cat-and-duo hub must be reachable from bottom navigation');
  const rect=await page.locator('.tab[data-tab="cats"]').boundingBox();
  const stage=await page.locator('#stage').boundingBox();
  assert.ok(rect.y>stage.y+stage.height*.55,'cat hub should live below the main yard');
  await page.evaluate(()=>UI.openBuild());
  const select=await page.locator('[data-build="scratcher"]');
  assert.equal(await select.isVisible(),true);
  await select.click();
  assert.equal(await page.locator('#yard-placement-dock').isVisible(),true);
  assert.equal(await page.locator('#yard-placement-confirm').count(),0,
    'lawn placement must not require an extra confirmation button');
  const choosing=await page.evaluate(()=>{
   const g=window.__game,p=g.yard.placement;
   return {coins:State.S.coins,pair:!!p,buildings:State.S.yardBuildings.length};
  });
  assert.equal(choosing.coins,500,'selecting a facility does not charge money');
  assert.equal(choosing.buildings,0,'selecting a blueprint must not spend coins');
  assert.ok(choosing.pair);
  if(profile.mobile){
   // Real responsive geometry: the entire placement HUD must be ABOVE the
   // grass where taps are accepted, not cover the location being selected.
   const dock=await page.locator('#yard-placement-dock').boundingBox();
   assert.ok(dock&&dock.x>=-1&&dock.x+dock.width<=profile.width+1,
    'mobile placement controls must remain on screen');
   assert.ok(dock.y+dock.height<stage.y+stage.height*.60,
    'placement dock must clear the entire buildable grass');
   const tap={x:stage.x+22,y:stage.y+Math.round(stage.height*.45)};
   await page.touchscreen.tap(tap.x,tap.y);
   const preview=await page.evaluate(()=>{
    const p=window.__game.yard.placement;
    return {x:p.x,y:p.y,valid:p.valid};
   });
   assert.ok(Math.abs(preview.x-(tap.x-stage.x))<2&&
      Math.abs(preview.y-(tap.y-stage.y))<2,
     'touch placement preview must stay exactly under the selected finger position');
   assert.equal(preview.valid,false,'tapping outside the grass should show invalid, not snap');
   assert.deepEqual(await page.evaluate(()=>[State.S.coins,State.S.yardBuildings.length]),[500,0],
     'invalid touch must not charge coins or place anything');
   await page.screenshot({path:'/tmp/cat-bond-'+profile.name+'-placement-preview.png'});
  }
  const valid=await page.evaluate(()=>{
   const g=window.__game,previous=State.S.yardBuildings.length;
   const y=g.game?.H||g.H;
   g.yard.movePlacement(0,0);
   UI.updateBuildingPlacement();
   const invalid=g.yard.placement.valid===false && !g.yard.confirmPlacement();
   let site=null;
   for(let yi=g.H*.60;yi<=g.H-70;yi+=9){
    for(let xi=45;xi<g.W-45;xi+=9){
     if(g.yard.buildingSpotValid(xi,yi)){site={x:xi,y:yi};break}
    }
    if(site)break;
   }
   if(site){g.yard.movePlacement(site.x,site.y);UI.updateBuildingPlacement();}
   return {invalid,site,valid:g.yard.placement.valid,buildings:State.S.yardBuildings.length,
    before:previous};
  });
  assert.equal(valid.invalid,true,'out-of-bounds or overlapping spot must be rejected');
  assert.ok(valid.site&&valid.valid,'at least one valid garden location must be found');
  assert.equal(valid.buildings,0);
  // Input is relative to the actual canvas, not a potentially fractional
  // desktop stage border. Chromium rounds pointer coordinates to CSS pixels.
  const canvasRect=await page.locator('#scene').boundingBox();
  const px=canvasRect.x+valid.site.x,py=canvasRect.y+valid.site.y;
  if(profile.touch)await page.touchscreen.tap(px,py);
  else await page.mouse.click(px,py);
  const built=await page.evaluate(()=>{
   const g=window.__game,b=State.S.yardBuildings[0];
   return {coins:State.S.coins,count:State.S.yardBuildings.length,type:b?.type,
     x:b?.x,y:b?.y,target:g.yard.entities.some(e=>e._buildTarget===b),
     placement:g.yard.placement};
  });
  assert.equal(built.count,1);
  assert.equal(built.coins,440,'scratcher cost charged exactly once on the lawn gesture');
  assert.equal(built.type,'scratcher');
  const pixelDrift=Math.hypot(built.x-valid.site.x,built.y-valid.site.y);
  assert.ok(pixelDrift<=1.25,
    'canvas tap/click must preserve the chosen spot (within pointer pixel rounding): '+
    JSON.stringify({profile:profile.name,site:valid.site,built,canvasRect,stage,pixelDrift}));
  assert.equal(built.placement,null);
  assert.equal(await page.locator('#yard-placement-dock').isVisible(),false);
  if(!profile.touch){
    await page.mouse.move(stage.x+stage.width*.8,stage.y+stage.height*.7);
    assert.deepEqual(await page.evaluate(()=>{
      const b=State.S.yardBuildings[0];return [b.x,b.y];
    }),[built.x,built.y],'cursor movement must not change the built coordinate');
  }
  // The play interaction is visible and can be immediately requested by tapping
  // the placed structure; it is not simply a passive income number in a menu.
  // Real invitation and continuous walking to the accessible facility approach.
  await page.evaluate(()=>UI.openBuild());
  await page.locator('[data-visit="0"]').click();
  await page.waitForFunction(()=>{
    const g=window.__game,b=State.S.yardBuildings[0];
    return g.yard.entities.some(e=>e._playBuilding===b&&e._playBuildT>0);
  },null,{timeout:20000});
  assert.equal(await page.evaluate(()=>{const b=State.S.yardBuildings[0];return __game.yard.entities.some(e=>e._playBuilding===b&&e._playBuildT>0)}),true,'cat animation must enter a genuine play state');
  await page.screenshot({path:'/tmp/cat-bond-'+profile.name+'-yard-placement.png'});
  await page.evaluate(()=>UI.openBuild());
  const visit=page.locator('[data-visit="0"]');
  assert.equal(await visit.count(),1,'already placed facility can invite a visible cat');
  await visit.click();
  // Same mobile viewport, with the actual battle DOM and combat buttons shown:
  // duo cast cannot overlap any Q/E/basic/dodge/ultimate hit target.
  await page.evaluate(()=>{
   document.getElementById('battle-ui').classList.add('on');
   document.getElementById('duo-burst').hidden=false;
  });
  const combat=await page.evaluate(()=>{
   const bounds=id=>{
    const r=document.getElementById(id).getBoundingClientRect();
    return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,
      width:r.width,height:r.height};
   };
   return {
    duo:bounds('duo-burst'),
    moves:['mv-q','mv-e','mv-basic','mv-dodge','ult-btn'].map(bounds),
    skillGuide:document.getElementById('battle-skill-guide').hidden
   };
  });
  const intersects=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  assert.ok(combat.duo.width>=80&&combat.duo.height>=30,'Duo must stay visible and tappable');
  assert.ok(combat.duo.left>=0&&combat.duo.right<=profile.width+1 &&
    combat.duo.top>=0&&combat.duo.bottom<=profile.height+1,'Duo must fit the viewport');
  for(const move of combat.moves)
   assert.equal(intersects(combat.duo,move),false,
    'Duo must never block a combat button at '+profile.name);
  await page.screenshot({path:'/tmp/cat-bond-'+profile.name+'-duo-clearance.png'});
  await page.evaluate(()=>{
   document.getElementById('duo-burst').hidden=true;
   document.getElementById('battle-ui').classList.remove('on');
  });
  assert.deepEqual(errors,[],'no browser errors in placement path');
  console.log('YARD PLACEMENT PASS '+profile.name+' '+JSON.stringify({rect,valid,built,plays}));
  await ctx.close();
 }
}catch(err){console.error('YARD PLACEMENT FAIL',err);process.exitCode=1}
finally{await browser.close()}
