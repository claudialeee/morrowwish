import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const failures=[];
try{
  for(const width of [390,320]){
    const context=await browser.newContext({viewport:{width,height:780},isMobile:true,hasTouch:true,deviceScaleFactor:2});
    const page=await context.newPage();
    const uncaught=[];
    page.on('pageerror',e=>uncaught.push(e.message));
    try{
      await page.goto(origin+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForFunction(()=>!!window.__game,{timeout:12000});
      const initial=await page.evaluate(()=>({gameReady:!!window.__game,stageWidth:document.querySelector('#stage').getBoundingClientRect().width,
        introVisible:getComputedStyle(document.getElementById('intro')).display!=='none'}));
      assert.equal(initial.introVisible,true,'Intro must show');
      assert.ok(initial.stageWidth<=width+2,'Stage must fit phone viewport');
      const start=page.locator('#intro-start');
      assert.ok(await start.isVisible(),'Start button must be visible on phone');
      await start.tap();
      await page.waitForFunction(()=>document.getElementById('intro').classList.contains('hide'),{timeout:10000});
      await page.locator('#panel.open .dex-cell').first().tap({timeout:10000});
      assert.equal(await page.evaluate(()=>window.State.S.cats.length),1,'Selecting a starter must work with a finger');
      assert.equal(await page.locator('#panel.open').count(),0,'Starter picker must close after selecting a cat');
      const tabs=page.locator('#tabbar .tab');
      assert.equal(await tabs.count(),6,'All six cat game tabs must be present');
      const layout=await page.evaluate(()=>({width:innerWidth,docScroll:document.documentElement.scrollWidth,
        buttons:[...document.querySelectorAll('#tabbar .tab')].map(el=>{const b=el.getBoundingClientRect();return {left:b.left,right:b.right,height:b.height}})}));
      assert.ok(layout.docScroll<=width+3,'Cat Bond has horizontal overflow: '+JSON.stringify(layout));
      assert.ok(layout.buttons.every(b=>b.left>=-2&&b.right<=width+2&&b.height>=43),'All cat menu buttons must fit and remain tappable: '+JSON.stringify(layout));
      await tabs.last().tap();
      assert.equal(await page.locator('#panel.open').count(),1,'Shop menu tap must open its panel');
      await tabs.first().tap();
      assert.equal(await page.locator('#panel.open').count(),0,'Yard menu tap must close panel');
      await page.locator('#fab-feed').tap();
      assert.equal(await page.locator('#panel.open').count(),1,'Feed icon must be touch-activated');
      await tabs.first().tap();
      if(width===390){
        // No injected webpage fullscreen: only the play stage gets immersive mode.
        await page.evaluate(()=>Object.defineProperty(document.getElementById('stage'),'requestFullscreen',{value:undefined,configurable:true}));
        const fullscreen=page.locator('#mw-fullscreen-toggle');
        await fullscreen.tap();
        await page.waitForFunction(()=>document.documentElement.classList.contains('mw-fs-active'));
        assert.equal(await page.evaluate(()=>document.querySelector('#mw-fullscreen-toggle').parentElement.id),'stage',
          'Fullscreen toggle must move inside the PLAY AREA, not the entire webpage');
        await fullscreen.tap();
        await page.waitForFunction(()=>!document.documentElement.classList.contains('mw-fs-active'));
        // Simulate battle input: touch joystick and verify it drives the fighter.
        await page.evaluate(()=>{
          const g=window.__game;
          g.startBattle(State.S.cats.slice(0,1),GameData.SPECIES[1]);
        });
        await page.waitForFunction(()=>window.__game.scene==='battle');
        const values=await page.evaluate(()=>{
          const c=document.getElementById('scene'),r=c.getBoundingClientRect();
          const start=new Touch({identifier:21,target:c,clientX:r.left+85,clientY:r.top+r.height*0.55});
          c.dispatchEvent(new TouchEvent('touchstart',{touches:[start],targetTouches:[start],changedTouches:[start],bubbles:true,cancelable:true}));
          const movement=new Touch({identifier:21,target:c,clientX:r.left+142,clientY:r.top+r.height*0.55});
          c.dispatchEvent(new TouchEvent('touchmove',{touches:[movement],targetTouches:[movement],changedTouches:[movement],bubbles:true,cancelable:true}));
          return {active:window.__game.joystick.active,dx:window.__game.joystick.dx};
        });
        assert.ok(values.active&&values.dx>0.3,'Touch battle joystick is unresponsive: '+JSON.stringify(values));
      }
      assert.deepEqual(uncaught,[],'Mobile runtime errors: '+uncaught.join(' | '));
      console.log('CAT BOND PHONE PASS',width,'intro/starter/6tabs/feed/fullscreen/battle');
    }catch(e){
      failures.push(width+'px: '+e.message);console.error('CAT BOND PHONE FAIL',failures.at(-1));
    }finally{await context.close();}
  }
}finally{await browser.close();}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}
else console.log('Cat Bond passes two phone sizes and gameplay-only fullscreen test.');
