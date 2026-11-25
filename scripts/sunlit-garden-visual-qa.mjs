// Responsive visual smoke test for the real Sunlit Garden game scene.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const out='artifacts/sunlit-garden-visual-qa';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const pageErrors=[];
try{
  for(const profile of [
    {name:'desktop',width:1440,height:900,mobile:false,touch:false,background:'landscape'},
    {name:'phone-portrait',width:390,height:844,mobile:true,touch:true,background:'portrait'},
    {name:'phone-landscape',width:844,height:390,mobile:true,touch:true,background:'landscape'}
  ]){
    const context=await browser.newContext({
      viewport:{width:profile.width,height:profile.height},
      isMobile:profile.mobile,hasTouch:profile.touch,deviceScaleFactor:1
    });
    const page=await context.newPage();
    page.on('pageerror',error=>pageErrors.push(profile.name+': '+error.message));
    await page.goto(origin+'/cat-bond/?autodev=1&lang=zh',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.__game&&window.SunlitGarden&&window.State,
      {timeout:30000});
    await page.waitForFunction(()=>window.__game?.yard&&window.State?.S?.cats?.length>=3,
      {timeout:30000});
    await page.waitForFunction(()=>performance.getEntriesByType('resource').some(x=>x.name.includes('sunlit-garden-cinematic.svg'))&&
      performance.getEntriesByType('resource').some(x=>x.name.includes('sunlit-garden-portrait.svg')),
      {timeout:20000});
    await page.evaluate(()=>{
      // All fixture data is isolated to this temporary browser context; disable
      // local persistence so QA cannot modify a real player slot or cloud save.
      window.State.save=()=>{};
      window.State.S.resonance={
        schema:1,scene:'harbor:H-01',completed:[],evidence:{},choices:{},trust:{},links:{},
        sanctuaries:['harbor','forest','forge','sky','library','starfall'],
        melodies:[],support:[],returned:[],postgame:[],ambientDone:[],cursor:0,revision:0
      };
      window.__game.scene='yard';
      window.__game.showYardChrome();
      window.SunlitGarden.enter();
    });
    await page.waitForFunction(()=>document.getElementById('sunlit-garden-hotspots')?.classList.contains('is-active')&&
      document.getElementById('stage')?.dataset.sunlitGardenBackground);
    const layout=await page.evaluate(()=>{
      const stage=document.getElementById('stage'),sr=stage.getBoundingClientRect();
      const box=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,
        right:r.right,bottom:r.bottom,visible:r.width>0&&r.height>0};};
      const inside=r=>r.x>=sr.x-1&&r.y>=sr.y-1&&r.right<=sr.right+1&&r.bottom<=sr.bottom+1;
      const hotspots=[...document.querySelectorAll('.sg-hotspot')].map(el=>({id:el.dataset.gardenAction,label:el.textContent.trim(),...box(el)}));
      const tabbar=box(document.getElementById('tabbar'));
      const actions=box(document.getElementById('yard-actions'));
      const canvas=document.getElementById('scene'),ctx=canvas.getContext('2d');
      const sample=ctx.getImageData(Math.floor(canvas.width*.5),Math.floor(canvas.height*.5),1,1).data;
      return{
        background:stage.dataset.sunlitGardenBackground,stage:{width:sr.width,height:sr.height},
        hotspots,allInside:hotspots.every(inside),allVisible:hotspots.every(x=>x.visible),
        tabbar,actions,canvas:{width:canvas.width,height:canvas.height,centerPixel:[...sample]},
        gardenActive:stage.classList.contains('cb-sunlit-garden')
      };
    });
    assert.equal(layout.background,profile.background,profile.name+' must select the matching original environment painting');
    assert.equal(layout.hotspots.length,5,profile.name+' must expose five contextual home locations');
    assert.equal(layout.allInside,true,profile.name+' hotspots must remain inside the stage: '+JSON.stringify(layout.hotspots));
    assert.equal(layout.allVisible,true,profile.name+' hotspots must be visible');
    assert.equal(layout.gardenActive,true,profile.name+' garden state class must be active');
    assert.ok(layout.canvas.width>0&&layout.canvas.height>0,'garden canvas must be live');
    await page.screenshot({path:out+'/'+profile.name+'.png',fullPage:false});

    // Every contextual location must open the existing feature, not a mock panel.
    for(const id of ['cats','facilities','catdex','workshop','bond']){
      await page.locator('.sg-hotspot-'+id).click();
      await page.waitForFunction(()=>document.getElementById('panel')?.classList.contains('open'),
        {timeout:8000});
      const panelExists=await page.locator('#panel .card').count();
      assert.ok(panelExists>0,profile.name+' '+id+' must open an existing functional panel');
      await page.evaluate(()=>window.UI.closeAll());
    }

    // The open home labels must update immediately with the shared language event.
    const hasI18n=await page.evaluate(()=>!!window.MorrowwishI18n?.get);
    if(hasI18n){
      await page.evaluate(()=>{
        window.__gardenOriginalLangGet=window.MorrowwishI18n.get.bind(window.MorrowwishI18n);
        window.MorrowwishI18n.get=()=> 'en';
        window.dispatchEvent(new Event('morrowwish-language-change'));
      });
      await page.waitForFunction(()=>document.querySelector('.sg-hotspot-workshop .sg-hotspot-label')?.textContent==='Workshop');
      const labels=await page.locator('.sg-hotspot .sg-hotspot-label').allTextContents();
      assert.deepEqual(labels,['Cats','Facilities','Catdex','Workshop','Duo Bond']);
      await page.evaluate(()=>{
        window.MorrowwishI18n.get=window.__gardenOriginalLangGet;
        window.dispatchEvent(new Event('morrowwish-language-change'));
      });
    }

    await page.locator('#fab-map').click();
    await page.waitForFunction(()=>window.__game.scene==='map'&&
      !document.getElementById('stage').classList.contains('cb-sunlit-garden'));
    console.log('SUNLIT GARDEN VISUAL QA PASS '+profile.name+' '+JSON.stringify({
      background:layout.background,hotspots:layout.hotspots.length,
      canvas:layout.canvas,tabbar:layout.tabbar,actions:layout.actions
    }));
    await context.close();
  }

  // Real facility placement, upgrade and slot round-trip. Only seed funds;
  // purchases, canvas taps, levels, saving and loading use the real game.
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto(origin+'/cat-bond/?autodev=1&lang=en',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.__game?.yard&&window.State?.S?.cats?.length>=3);
  await page.evaluate(()=>{
    State.S.coins=10000;State.S.gameStarted=true;
    __game.scene='yard';__game.showYardChrome();
  });
  await page.locator('.sg-hotspot-facilities').click();
  await page.locator('[data-build="scratcher"]').click();
  await page.waitForFunction(()=>__game.yard.placement?.valid);
  const spot=await page.evaluate(()=>{const p=__game.yard.placement,r=__game.canvas.getBoundingClientRect();return {x:r.x+p.x,y:r.y+p.y}});
  await page.mouse.click(spot.x,spot.y);
  await page.waitForFunction(()=>State.S.yardBuildings.some(b=>b.type==='scratcher'));
  await page.locator('.sg-hotspot-facilities').click();
  await page.locator('[data-upgrade="0"]').click();
  await page.waitForFunction(()=>State.S.yardBuildings[0].level===2);
  await page.evaluate(()=>UI.closeAll());
  const saved=await page.evaluate(()=>{
    const b=State.S.yardBuildings[0];const slot=State.activeSlot();
    const result=State.save();if(!result.ok)throw Error('save '+JSON.stringify(result));
    return {slot,u:b.gardenU,v:b.gardenV,type:b.type,level:b.level};
  });
  assert.ok(Number.isFinite(saved.u)&&Number.isFinite(saved.v),'relative plot position saved');
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>__game.W<500);
  await page.evaluate(slot=>{if(!State.loadSlot(slot))throw Error('load failed');},saved.slot);
  await page.waitForFunction(()=>__game.yard._gardenState===State.S);
  const restored=await page.evaluate(()=>{const b=State.S.yardBuildings[0];return {u:b.gardenU,v:b.gardenV,type:b.type,level:b.level,x:b.x,y:b.y,w:__game.W,h:__game.H}});
  assert.equal(restored.type,saved.type);assert.equal(restored.level,saved.level);
  assert.equal(restored.u,saved.u);assert.equal(restored.v,saved.v);
  assert.ok(restored.x>=30&&restored.x<=restored.w-30&&restored.y>=0&&restored.y<restored.h,'saved facility remains on-screen at phone size');
  await page.screenshot({path:out+'/facility-restored-phone.png'});
  await page.evaluate(()=>{const old=State.activeSlot(),other=State.SAVE_SLOT_IDS.find(id=>id!==old);if(!State.startNewGame(other,{overwriteConfirmed:true}))throw Error('second slot failed')});
  await page.waitForFunction(()=>__game.yard._gardenState===State.S);
  assert.equal(await page.evaluate(()=>State.S.yardBuildings.length),0,'new slot must not inherit buildings');
  assert.equal(await page.evaluate(()=>__game.yard.entities.length),0,'new slot must not retain previous resident cats');
  await page.evaluate(slot=>{if(!State.loadSlot(slot))throw Error('reload failed')},saved.slot);
  await page.waitForFunction(()=>__game.yard._gardenState===State.S);
  assert.equal(await page.evaluate(()=>State.S.yardBuildings[0].level),2,'original slot preserves upgrade');
  await context.close();
  console.log('SUNLIT GARDEN FACILITY SAVE QA PASS');
  assert.deepEqual(pageErrors,[],'garden scene must not produce uncaught browser errors');
}catch(error){
  console.error('SUNLIT GARDEN VISUAL QA FAIL',error);
  console.error('Browser errors',pageErrors);
  process.exitCode=1;
}finally{await browser.close();}
