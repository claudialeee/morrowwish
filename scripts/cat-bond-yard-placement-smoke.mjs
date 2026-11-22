// REVIEW ONLY — Cat Bond garden architecture and on-screen cat play QA.
// Does not write a production save, publish a game or alter balance.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true});
try{
 for(const profile of [
  {name:'phone',width:390,height:844,mobile:true,touch:true},
  {name:'desktop',width:1180,height:760,mobile:false,touch:false}
 ]){
  const ctx=await browser.newContext({viewport:{width:profile.width,height:profile.height},
    deviceScaleFactor:1,isMobile:profile.mobile,hasTouch:profile.touch});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.__game&&!!window.UI&&!!window.World);
  const init=await page.evaluate(()=>{
   // Test the new path with two living cats and 500 coins, not a fake menu.
   const g=window.__game;
   document.getElementById('intro-start').click();UI.closeAll();
   State.S.cats=[State.makeCat('tangyuan'),State.makeCat('xiaohui')];
   State.S.coins=500;
   State.S.yardBuildings=[];g.yard.rebuild();g.refreshYardSurprise();
   UI.syncYardNav();
   return {coins:State.S.coins,duoText:document.getElementById('yard-duo-status').textContent,
    hidden:document.getElementById('collection-goal').hidden};
  });
  assert.equal(init.coins,500);
  assert.match(init.duoText,/双猫合击/,'duo shortcut must be labeled explicitly');
  assert.equal(init.hidden,true,'do not keep the broad top combined banner');
  const duoVisible=await page.locator('#yard-duo-status').isVisible();
  assert.equal(duoVisible,true,'duo should be visible on the right once two cats exist');
  const rect=await page.locator('#yard-duo-status').boundingBox();
  const stage=await page.locator('#stage').boundingBox();
  assert.ok(rect.x>stage.x+stage.width*.48,'duo CTA must live on right, not left/top');
  await page.evaluate(()=>UI.openBuild());
  const select=await page.locator('[data-build="scratcher"]');
  assert.equal(await select.isVisible(),true);
  await select.click();
  assert.equal(await page.locator('#yard-placement-dock').isVisible(),true);
  const choosing=await page.evaluate(()=>{
   const g=window.__game,p=g.yard.placement;
   return {coins:State.S.coins,pair:!!p,buildings:State.S.yardBuildings.length};
  });
  assert.equal(choosing.coins,500,'selecting a facility does not charge money');
  assert.equal(choosing.buildings,0,'no building placed until user confirms');
  assert.ok(choosing.pair);
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
  await page.locator('#yard-placement-confirm').click();
  const built=await page.evaluate(()=>{
   const g=window.__game,b=State.S.yardBuildings[0];
   return {coins:State.S.coins,count:State.S.yardBuildings.length,type:b?.type,
     x:b?.x,y:b?.y,target:g.yard.entities.some(e=>e._buildTarget===b),
     placement:g.yard.placement};
  });
  assert.equal(built.count,1);
  assert.equal(built.coins,440,'scratcher cost charged exactly once on confirm');
  assert.equal(built.type,'scratcher');
  assert.ok(Math.abs(built.x-valid.site.x)<.1&&Math.abs(built.y-valid.site.y)<.1);
  assert.equal(built.placement,null);
  // The play interaction is visible and can be immediately requested by tapping
  // the placed structure; it is not simply a passive income number in a menu.
  const plays=await page.evaluate(()=>{
   const g=window.__game,b=State.S.yardBuildings[0];
   const invited=g.yard.inviteCatToBuilding(b);
   if(!invited)return {invited:false};
   const cat=g.yard.entities.find(e=>e._buildTarget===b);
   if(!cat)return {invited:false};
   cat.x=b.x-8;cat.y=b.y+14;
   g.yard.stepBuildTarget(cat,.033);
   g.yard.update(.033);
   return {invited,playing:g.yard.entities.some(e=>e._playBuilding===b&&e._playBuildT>0),
     joy:cat.cat.joy,bubble:cat.bubble};
  });
  assert.equal(plays.invited,true,'cats must come to the selected structure');
  assert.equal(plays.playing,true,'cat animation must enter a genuine play state');
  await page.screenshot({path:'/tmp/cat-bond-'+profile.name+'-yard-placement.png'});
  await page.evaluate(()=>UI.openBuild());
  const visit=page.locator('[data-visit="0"]');
  assert.equal(await visit.count(),1,'already placed facility can invite a visible cat');
  await visit.click();
  assert.deepEqual(errors,[],'no browser errors in placement path');
  console.log('YARD PLACEMENT PASS '+profile.name+' '+JSON.stringify({rect,valid,built,plays}));
  await ctx.close();
 }
}catch(err){console.error('YARD PLACEMENT FAIL',err);process.exitCode=1}
finally{await browser.close()}
