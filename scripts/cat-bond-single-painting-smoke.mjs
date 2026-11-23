/* Mobile smoke: every duo skill renders its full original painting, never actor sprites. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/cat-bond/duo-showcase.html?mobile-original-only=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.CatBondPremiumCinematics?.ready===true&&window.CatBondDuoHero?.assetReady===true&&window.__catBondDuoGallery?.ready===true,{timeout:45000});
 const result=await page.evaluate(()=>{
  const p=window.CatBondPremiumCinematics,cv=document.createElement('canvas');cv.width=390;cv.height=844;
  const c=cv.getContext('2d'),rows=[];
  for(const key of p.keys){p.draw(c,390,844,{elements:key,max:2.75,t:1.3,tier:3,hideCaptions:true});rows.push(p.lastLayout);}
  const r=document.querySelector('#duo-player').getBoundingClientRect();
  return{rows,source:window.CatBondDuoHero.assetSource,only:window.CatBondDuoHero.originalArtOnly,
   actorModule:!!window.CatBondDuoBreedActors,playerAspect:r.width/r.height};
 });
 assert.equal(result.rows.length,21);
 assert.ok(result.rows.every(x=>x.source==='63-original-painted-storyboards'&&Math.abs(x.artAspect-16/9)<.00001&&!x.actorFallback));
 assert.equal(result.source,'63-original-painted-storyboards');assert.equal(result.only,true);assert.equal(result.actorModule,false);
 assert.ok(Math.abs(result.playerAspect-16/9)<.03,'phone preview must stay 16:9');
 assert.equal(await page.locator('#mode-breeds').count(),0);assert.deepEqual(errors,[]);
 await page.screenshot({path:'artifacts/cat-bond-mobile-original-only.png',fullPage:true});
 console.log('CAT BOND MOBILE ORIGINAL-PAINTING PASS');
}finally{await browser.close();}
