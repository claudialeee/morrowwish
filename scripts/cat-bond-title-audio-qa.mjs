import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const origin=process.env.CAT_BOND_SMOKE_ORIGIN||'http://127.0.0.1:8766';
const url=origin+'/cat-bond/?lang=en';
const preloaded=page=>page.waitForFunction(()=>window.MorrowwishMusic?.status().decodedCacheBytes>0,null,{timeout:30000});
const playing=page=>page.waitForFunction(()=>{const s=window.MorrowwishMusic?.status();return s?.playing&&s.track==='title'&&s.currentTime>.05;},null,{timeout:12000});
for(const allowed of [true,false]){
 const browser=await chromium.launch({headless:true,args:[allowed?'--autoplay-policy=no-user-gesture-required':'--autoplay-policy=document-user-activation-required']});
 try{
  for(const profile of [{name:'desktop',viewport:{width:1280,height:800}},{name:'phone',viewport:{width:390,height:844},hasTouch:true,isMobile:true}]){
   const {name,...opts}=profile,context=await browser.newContext(opts),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url);await preloaded(page);
   const before=await page.evaluate(()=>MorrowwishMusic.status());
   if(allowed)await playing(page);else{
    const title=page.locator('#cb-title-name');await title.waitFor({state:'visible'});
    if(opts.hasTouch)await title.tap();else await title.click();
    await playing(page);
   }
   const after=await page.evaluate(()=>MorrowwishMusic.status());
   assert.ok(after.source?.startsWith('premium-mp3:'),'preserve title recording');assert.equal(after.activeMusicSources,1);
   assert.deepEqual(errors,[]);
   console.log('TITLE AUDIO PASS',name,allowed?'autoplay allowed':'gesture fallback',JSON.stringify({before:before.audioState,preloaded:before.decodedCacheBytes,track:after.track,source:after.source}));
   await page.evaluate(()=>MorrowwishMusic.setEnabled(false));await page.reload();await page.waitForFunction(()=>window.MorrowwishMusic);
   assert.equal(await page.evaluate(()=>MorrowwishMusic.status().enabled),false);
   await page.locator('#cb-title-name').click();assert.equal(await page.evaluate(()=>MorrowwishMusic.status().playing),false);
   await context.close();
  }
 }finally{await browser.close();}
}
