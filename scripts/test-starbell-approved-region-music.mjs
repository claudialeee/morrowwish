import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const origin=process.env.CAT_BOND_SMOKE_ORIGIN||'http://127.0.0.1:8765';
const profiles=[['wide',{viewport:{width:1280,height:800}}],['portrait',{viewport:{width:390,height:844},isMobile:true,hasTouch:true}]];
const browser=await chromium.launch({headless:true});
try{
 for(const [profile,opts] of profiles.filter(([p])=>!process.env.STARBELL_FOCUS_PROFILE||p===process.env.STARBELL_FOCUS_PROFILE)){
  const ctx=await browser.newContext(opts),page=await ctx.newPage(),external=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{const u=r.request().url();if(u.startsWith(origin+'/')||/^(data:|blob:)/.test(u))return r.continue();external.push(u);return r.abort()});
  try{
   for(const [region,id] of [['sky','amberlight'],['starfall','a-kind-of-hope']]){
    await page.goto(origin+'/cat-bond/?developer=1&qa=music&region='+region+'&reset=1&lang=en');
    await page.waitForFunction(r=>window.__game?.scene==='map'&&window.WorldMap?.currentRegion===r&&window.MorrowwishMusic,region);
    // A trusted gesture allows playback on browsers that block autoplay.
    await page.locator('#starbell-developer-menu > summary').click();
    await page.evaluate(()=>{MorrowwishMusic.setEnabled(true);MorrowwishMusic.start();MorrowwishMusic.switchScene()});
    const wait=()=>page.waitForFunction(([r,i])=>{const s=MorrowwishMusic.status();return s.track===r&&s.source==='premium-mp3:'+i&&s.playing&&s.loop&&s.duration>40&&s.currentTime>.1},[region,id],{timeout:45000});
    await wait();const before=await page.evaluate(()=>MorrowwishMusic.status());
    await page.waitForFunction(t=>MorrowwishMusic.status().currentTime>t+.1,before.currentTime);
    await page.evaluate(()=>MorrowwishMusic.setEnabled(false));await page.waitForFunction(()=>!MorrowwishMusic.status().playing);
    await page.evaluate(()=>MorrowwishMusic.setEnabled(true));await wait();
    console.log('APPROVED BGM PLAYING',profile,region,JSON.stringify(await page.evaluate(()=>MorrowwishMusic.status())));
   }
   assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  }finally{await ctx.close()}
 }
}finally{await browser.close()}
