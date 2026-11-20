import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const games=['pawsibly-innocent','elsewhere','tiny-town','cat-bond','flip-dash','parcel-panic','pocket-aquarium'];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
async function check(game,width,mobile){
  const context=await browser.newContext({viewport:{width,height:mobile?844:800},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
  const page=await context.newPage();
  const uncaught=[];page.on('pageerror',e=>uncaught.push(e.message));
  try{
    await page.goto(origin+'/'+game+'/?lang=zh',{waitUntil:'domcontentloaded',timeout:35000});
    await page.waitForSelector('#mw-fullscreen-toggle',{timeout:15000});
    const button=page.locator('#mw-fullscreen-toggle');
    assert.equal(await button.count(),1,'One fullscreen toggle is required');
    const box=await button.boundingBox();
    assert.ok(box&&box.height>=42&&box.width>=60,'Fullscreen touch target too small');
    // Disable the API to exercise iPhone Safari fallback behavior.
    if(mobile)await page.evaluate(()=>Object.defineProperty(document.documentElement,'requestFullscreen',{configurable:true,value:undefined}));
    if(mobile)await button.tap();else await button.click();
    await page.waitForFunction(()=>document.documentElement.classList.contains('mw-fs-active'));
    assert.equal(await button.getAttribute('aria-pressed'),'true');
    const status=await page.evaluate(()=>{
      const root=document.documentElement,game=root.dataset.mwFullscreenGame;
      const element=document.querySelector(game==='cat-bond'?'#stage':game==='elsewhere'?'.site-wrap':game==='tiny-town'?'.app':game==='pawsibly-innocent'?'.wrap':game==='pocket-aquarium'?'body>main':'.game-shell');
      const rect=element.getBoundingClientRect();
      return {game,width:root.clientWidth,scrollWidth:root.scrollWidth,active:root.classList.contains('mw-fs-active'),
        native:!!document.fullscreenElement,scrollContainerHeight:rect.height,viewportHeight:innerHeight};
    });
    assert.ok(status.scrollWidth<=width+5,'Overflow in full-screen view: '+JSON.stringify(status));
    assert.ok(status.scrollContainerHeight<=status.viewportHeight+6,'Fullscreen content extends outside viewport: '+JSON.stringify(status));
    if(mobile)assert.equal(status.native,false,'Fallback must not invoke native fullscreen');
    if(mobile&&width===390){
      if(game==='pawsibly-innocent'){
        const throwBtn=page.locator('#tool');await throwBtn.tap();
        assert.equal(await page.evaluate(()=>window.__PAWSIBLY_TEST__?.isAiming()),true,'Yarn button must work in immersive mode');
        await throwBtn.tap();
      }
      if(game==='flip-dash'||game==='parcel-panic'){
        await page.locator('#play-btn').tap();
        assert.equal(await page.locator('#overlay').isVisible(),false,'Arcade start must work in immersive mode');
      }
      if(game==='elsewhere'){
        await page.locator('[data-random-world]').first().tap();
        assert.equal(await page.locator('#play-view').isVisible(),true,'Story must work in immersive mode');
      }
      if(game==='pocket-aquarium'){
        await page.locator('#start').tap();
        assert.equal(await page.locator('#overlay').isVisible(),false,'Aquarium must start in immersive mode');
      }
    }
    if(mobile)await button.tap();else await button.click();
    await page.waitForFunction(()=>!document.documentElement.classList.contains('mw-fs-active'));
    assert.equal(await button.getAttribute('aria-pressed'),'false');
    if(mobile)assert.deepEqual(uncaught,[],'JavaScript errors on mobile');
    console.log('FULLSCREEN PASS',game,width+'px',mobile?'touch fallback':'desktop native/fallback',JSON.stringify(status));
  }finally{await context.close()}
}
try{
  for(const width of [390,320]){
    for(const game of games){
      try{await check(game,width,true)}catch(e){const msg=game+' '+width+'px: '+e.message;errors.push(msg);console.error('FULLSCREEN FAIL',msg)}
    }
  }
  for(const game of games){
    try{await check(game,1280,false)}catch(e){const msg=game+' desktop: '+e.message;errors.push(msg);console.error('FULLSCREEN FAIL',msg)}
  }
}finally{await browser.close()}
if(errors.length){console.error('Fullscreen regression failures:\n'+errors.join('\n'));process.exitCode=1}
else console.log('FULLSCREEN: seven games pass phone 320/390px fallback and desktop 1280px toggle+exit tests');
