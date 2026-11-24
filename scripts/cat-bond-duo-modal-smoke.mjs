// End-to-end regression for the exact unlocked duo modal players see.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
fs.mkdirSync('artifacts/cat-bond-duo-modal',{recursive:true});
const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true});
const errors=[];
try{
 for(const profile of [
  {name:'phone',width:390,height:844,mobile:true,touch:true},
  {name:'desktop',width:1180,height:760,mobile:false,touch:false}
 ]){
  const context=await browser.newContext({
   viewport:{width:profile.width,height:profile.height},
   isMobile:profile.mobile,hasTouch:profile.touch,deviceScaleFactor:1
  });
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(profile.name+': '+e.message));
  await page.goto(origin+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.__game&&!!window.UI&&!!window.CatRelations&&!!window.State&&!!window.CatBondDuoHero);
  await page.waitForFunction(()=>window.CatBondDuoHero?.assetReady&&
    window.CatBondDuoHero?.assetCount===21,{timeout:18000});
  const pair=await page.evaluate(()=>{
   document.getElementById('intro-start')?.click();
   window.UI.closeAll();
   const State=window.State;
   const a=State.makeCat('tangyuan',{affinity:90});
   const b=State.makeCat('xiaohui',{affinity:90});
   State.S.cats=[a,b];
   window.CatRelations.choose(a,b);
   window.CatRelations.pair(a,b).value=100;
   State.save();
   const opened=window.UI.openUnlockedDuoViewer(a,b);
   return{a:a.uid,b:b.uid,opened};
  });
  assert.equal(pair.opened,true,'real game UI must open the earned duo modal');
  await page.waitForSelector('#cb-duo-viewer iframe',{timeout:10000});
  const frame=page.frames().find(f=>f.url().includes('duo-preview.html'));
  assert.ok(frame,'modal must use its unlocked preview iframe');
  await frame.waitForFunction(()=>window.__duoPreviewReady&&window.CatBondDuoHero?.assetReady,
   {timeout:18000});
  const initial=await frame.evaluate(()=>({
   maxTier:window.__duoPreviewState.maxTier,mode:window.__duoPreviewState.mode,
   activeTier:window.__duoPreviewState.activeTier,
   note:document.getElementById('trust-note').textContent,
   source:window.CatBondDuoHero.assetSource
  }));
  assert.deepEqual({maxTier:initial.maxTier,mode:initial.mode,activeTier:initial.activeTier},
   {maxTier:3,mode:'sequence',activeTier:1},
   '100 trust must auto-play all three unlocked animations from tier 1');
  const tierFit=await frame.evaluate(()=>{
   const selectors=['#duo-canvas','.controls','.tier-controls','#trust-note'];
   const boxes=selectors.map(selector=>{
    const el=document.querySelector(selector),r=el.getBoundingClientRect();
    return {selector,top:r.top,bottom:r.bottom,height:r.height};
   });
   return {viewport:window.innerHeight,boxes,bottom:Math.max(...boxes.map(x=>x.bottom))};
  });
  assert.ok(tierFit.bottom<=tierFit.viewport+2,
   'the animation, replay controls and all three trust-tier buttons must fit in one iframe viewport without scrolling: '+JSON.stringify(tierFit));
  assert.match(initial.note,/已解锁全部三档合击演出/);
  assert.equal(initial.source,'63-original-painted-storyboards');
  for(let n=1;n<=3;n++){
   assert.equal(await frame.locator('#tier-'+n).isVisible(),true);
   assert.equal(await frame.locator('#tier-'+n).isDisabled(),false);
  }
  const layout=await frame.evaluate(()=>{
   const cv=document.getElementById('duo-canvas'),r=cv.getBoundingClientRect();
   const viewer=getComputedStyle(document.querySelector('.viewer'));
   const p=window.CatBondPremiumCinematics;
   const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;
   const ctx=canvas.getContext('2d',{willReadFrequently:true}),hashes=[],layouts=[];
   for(const tier of [1,2,3]){
    ctx.clearRect(0,0,960,540);
    p.draw(ctx,960,540,{elements:'fire+water',max:2.75,t:1.4,tier,
      galleryPreview:true,originalArt:true,hideCaptions:true});
    const bytes=ctx.getImageData(0,0,960,540).data;let h=2166136261>>>0;
    for(let i=0;i<bytes.length;i+=29)h=Math.imul(h^bytes[i],16777619)>>>0;
    hashes.push(h.toString(16));layouts.push({...p.lastLayout});
   }
   return{ratio:r.width/r.height,width:r.width,height:r.height,
    background:viewer.backgroundImage,hashes,layouts};
  });
  assert.ok(Math.abs(layout.ratio-16/9)<.02,
   'embedded canvas must keep the original 16:9 ratio on phone and desktop');
  assert.match(layout.background,/linear-gradient/,
   'modal must restore the soft cream/lilac watercolor frame');
  assert.equal(new Set(layout.hashes).size,3,
   'all three trust tiers must display their own original painted action frames');
  assert.ok(layout.layouts.every(x=>x.source==='63-original-painted-storyboards'&&
    x.actorFallback===false&&x.paintingDrawCount===1&&x.actorLayerCount===0&&x.animatedEffects===true),
   'only the complete original painting may be animated; never add separate cat actors');
  await frame.locator('#tier-2').click();
  assert.equal(await frame.evaluate(()=>window.__duoPreviewState.mode),'single');
  assert.equal(await frame.evaluate(()=>window.__duoPreviewState.activeTier),2);
  await frame.locator('#tier-3').click();
  assert.equal(await frame.evaluate(()=>window.__duoPreviewState.activeTier),3);
  await frame.locator('#replay').click();
  assert.equal(await frame.evaluate(()=>window.__duoPreviewState.mode),'sequence');
  assert.equal(await frame.evaluate(()=>window.__duoPreviewState.activeTier),1);
  await frame.waitForFunction(()=>window.__duoPreviewState.activeTier===2,{timeout:4000});
  await frame.waitForFunction(()=>window.__duoPreviewState.activeTier===3,{timeout:4000});
  await frame.locator('#pause').click();
  assert.equal(await frame.evaluate(()=>window.__duoPreviewState.paused),true);
  const shell=await page.locator('#cb-duo-viewer .cb-duo-viewer-shell').boundingBox();
  assert.ok(shell&&shell.height<profile.height,
   'modal must fit within the viewport rather than leaving a giant empty frame');
  await page.locator('#cb-duo-viewer .cb-duo-viewer-shell').screenshot({
   path:'artifacts/cat-bond-duo-modal/'+profile.name+'-three-tier-modal.png'
  });
  await page.locator('#cb-duo-viewer .cb-duo-viewer-close').click();
  assert.equal(await page.locator('#cb-duo-viewer').count(),0,'modal close button must work');
  console.log('CAT BOND THREE-TIER DUO MODAL PASS '+profile.name+' '+JSON.stringify({
   frameRatio:layout.ratio,tiers:new Set(layout.hashes).size,frameHeight:shell.height
  }));
  await context.close();
 }
 assert.deepEqual(errors,[],'no uncaught browser errors');
}catch(err){console.error('CAT BOND THREE-TIER DUO MODAL FAIL',err);console.error('Browser errors',errors);process.exitCode=1;}
finally{await browser.close();}
