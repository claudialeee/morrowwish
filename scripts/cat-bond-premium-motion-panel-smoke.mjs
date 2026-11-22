// Ensure all 21 pair attacks have independently animated camera direction
// and genuinely distinct visible elemental marks, with one UNBROKEN art piece.
// Verify the actual interactive panels match the pastel illustrated UI.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 for(const profile of [
  {name:'phone',width:390,height:844,mobile:true},
  {name:'desktop',width:1180,height:760,mobile:false}
 ]){
  const ctx=await browser.newContext({viewport:{width:profile.width,height:profile.height},
    deviceScaleFactor:1,isMobile:profile.mobile,hasTouch:profile.mobile});
  const page=await ctx.newPage(),errs=[];
  page.on('pageerror',e=>errs.push(e.message));
  await page.goto('http://127.0.0.1:8765/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.CatBondPremiumCinematics?.ready&&!!window.__game&&!!window.CatBondDuoDirector?.camera);
  const report=await page.evaluate(()=>{
    const dir=window.CatBondDuoDirector,keys=dir.keys;
    const keysFrames=keys.map(k=>[.05,.17,.29,.41,.62,.89].map(p=>{
      const cam=dir.camera(k,p,640,360);
      return [Math.round(cam.dx),Math.round(cam.dy),cam.zoom.toFixed(3),cam.angle.toFixed(3)];
    }));
    const sample=(key,t)=>{
      const c=document.createElement('canvas');c.width=640;c.height=360;
      const cat=[{uid:'a',species:'tangyuan',nickname:'A'},{uid:'b',species:'sanhua',nickname:'B'}];
      CatBondPremiumCinematics.draw(c.getContext('2d'),640,360,{
        t:2.75-t,max:2.75,tier:3,elements:key,catUids:['a','b'],
        hideCaptions:true
      },uid=>cat.find(x=>x.uid===uid));
      const bytes=c.getContext('2d').getImageData(0,0,640,360).data;
      let signal=0;for(let i=0;i<bytes.length;i+=104)signal=(signal*13+bytes[i]+bytes[i+1]+bytes[i+2])%4294967291;
      return signal;
    };
    return {keys,uniqueCamera:new Set(keysFrames.map(x=>JSON.stringify(x))).size,
      motion:keysFrames.every(x=>new Set(x.map(v=>JSON.stringify(v))).size>=4),
      frameChanges:keys.map(k=>[sample(k,.38),sample(k,.90)]),
      atlasReady:CatBondPremiumCinematics.ready};
  });
  assert.equal(report.keys.length,21);
  assert.equal(report.uniqueCamera,21,'21 moves need 21 different camera storyboards');
  assert.equal(report.motion,true,'each camera must actually move through meaningful keyframes');
  assert.equal(report.frameChanges.filter(x=>x[0]!==x[1]).length,21,
    'all 21 moves must render time-changing pictures');
  await page.evaluate(()=>{
    document.getElementById('intro-start')?.click();
    UI.closeAll();
    const a=State.makeCat('tangyuan'),b=State.makeCat('sanhua');
    State.S.cats=[a,b];State.S.duoRelations={pairs:{},active:[]};
    CatRelations.choose(a,b);CatRelations.pair(a,b).value=40;
    State.S.coins=4000;State.S.yardBuildings=[];
    window.__game.yard.rebuild();State.save();
    UI.openBondPanel();
  });
  assert.equal(await page.locator('.duo-unlocked-card').count(),1);
  assert.equal(await page.locator('#duo-skill-canvas').count(),0,
     'No redundant second unlocked animation');
  assert.equal(await page.locator('#panel .duo-unlocked-card .duo-gallery-thumb').count(),1,
     'Real illustrated thumbnail inside the concept panel');
  await page.screenshot({path:'/tmp/catbond-premium-'+profile.name+'-duo-panel.png'});
  await page.evaluate(()=>UI.openBuild());
  await page.waitForSelector('.cb-build-blueprint-card canvas');
  const cards=await page.locator('.cb-build-blueprint-card canvas').count();
  assert.ok(cards>=3,'Multiple facilities have actual illustrated thumbnails');
  const nonempty=await page.locator('.cb-build-blueprint-card canvas').first().evaluate(c=>{
    const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    return Array.from(d).some((v,i)=>i%4===3&&v>0);
  });
  assert.equal(nonempty,true);
  await page.screenshot({path:'/tmp/catbond-premium-'+profile.name+'-garden-panel.png'});
  await page.locator('#panel [data-build="scratcher"]').click();
  assert.equal(await page.locator('#yard-placement-dock').isVisible(),true);
  assert.equal(await page.locator('#yard-placement-dock .cb-placement-heading').count(),1);
  await page.screenshot({path:'/tmp/catbond-premium-'+profile.name+'-placement-panel.png'});
  await page.evaluate(()=>UI.cancelBuildingPlacement());
  // Map navigation should be compact and must not paint a wide milky banner.
  const mapRail=await page.evaluate(()=>{
    const nav=document.getElementById('map-actions');
    for(const button of nav.querySelectorAll('button'))button.hidden=false;
    const r=nav.getBoundingClientRect();
    const stage=document.getElementById('stage').getBoundingClientRect();
    const buttons=[...nav.querySelectorAll('button')].map(b=>{
      const rect=b.getBoundingClientRect();return {width:rect.width,height:rect.height};
    });
    return {width:r.width,rightGap:stage.right-r.right,
      background:getComputedStyle(nav).backgroundColor,buttons};
  });
  assert.ok(mapRail.width<340,'map controls must be a compact group, not a 382px bar');
  assert.ok(mapRail.rightGap>=0&&mapRail.rightGap<30,'map controls sit at top-right');
  assert.equal(mapRail.background,'rgba(0, 0, 0, 0)','map actions outer background must be transparent');
  assert.ok(mapRail.buttons.every(b=>b.width<135&&b.height>=35),'map actions must be short, reachable buttons');

  // Battle artwork button is inside the PLAYABLE game, not in a mockup.
  await page.evaluate(()=>{
    const battle=document.getElementById('battle-ui');
    battle.classList.add('on');
    document.getElementById('duo-burst').hidden=false;
    const demo=document.getElementById('duo-burst');
    demo.style.setProperty('--duo-charge','72%');
    demo.querySelector('.duo-burst-label').textContent='双猫合击 · 72%';
  });
  const layout=await page.locator('#battle-ui #duo-burst').boundingBox();
  assert.ok(layout&&layout.width>=115&&layout.height>=30,'functional duo ultimate panel should fit screen');
  assert.ok(layout.x>=0&&layout.x+layout.width<=profile.width+1,'duo panel must not clip horizontally');
  const stageRect=await page.locator('#stage').boundingBox();
  assert.ok(layout.x>stageRect.x+stageRect.width*.45,'duo must be on the right in every viewport');
  assert.ok(layout.y>stageRect.y+130&&layout.y<stageRect.y+270,'duo must sit above the skill grid');
  await page.screenshot({path:'/tmp/catbond-premium-'+profile.name+'-battle.png'});
  assert.deepEqual(errs,[],'No runtime errors during gameplay');
  console.log('PREMIUM 21 MOTION + CONCEPT UI PASS '+profile.name+' '+JSON.stringify({
    keys:report.keys.length,unique:report.uniqueCamera,buildCards:cards,layout
  }));
  await ctx.close();
 }
}finally{await browser.close()}
