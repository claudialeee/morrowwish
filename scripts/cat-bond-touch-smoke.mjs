import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const failures=[];
try{
  // Verify the currently selected first-party Cat Bond cover, not an outdated
  // hardcoded filename. Still check that the image loads and paints real pixels.
  const coverPage=await browser.newPage();
  try{
    await coverPage.goto(origin+'/?lang=zh',{waitUntil:'domcontentloaded'});
    const cover=coverPage.locator('.bond-feature-card .feature-art img');
    const coverSrc=await cover.getAttribute('src');
    const coverPath=new URL(coverSrc,origin).pathname;
    assert.match(coverPath,/^\/art\/cat-bond[^/]*\.(?:webp|png|jpe?g)$/i,
      'Cat Bond homepage must use a first-party generated cover image');
    await cover.scrollIntoViewIfNeeded();
    await coverPage.waitForFunction(()=>{
      const img=document.querySelector('.bond-feature-card .feature-art img');
      return img&&img.complete&&img.naturalWidth>=400&&img.naturalHeight>=300;
    },null,{timeout:10000});
    // The approved 480 × 360 Cat Bond garden WebP is optimized for a small card.
    // Verify the real picture has enough pixels and is not a blank placeholder.
    const pixels=await cover.evaluate(img=>{
      const cv=document.createElement('canvas');
      cv.width=150;cv.height=90;
      const ctx=cv.getContext('2d');
      ctx.drawImage(img,0,0,150,90);
      return [ctx.getImageData(52,46,1,1).data,ctx.getImageData(105,35,1,1).data].map(x=>[...x]);
    });
    assert.ok(pixels.every(x=>x[3]===255),'Thumbnail image did not render opaque artwork: '+JSON.stringify(pixels));
    assert.ok(pixels.some(x=>x[0]<225||x[1]<205||x[2]<205),'Thumbnail renders blank: '+JSON.stringify(pixels));
    console.log('CAT BOND COVER PASS: artwork loads and paints');
  }catch(e){failures.push('homepage cover: '+e.message);console.error('CAT BOND COVER FAIL',failures.at(-1))}
  finally{await coverPage.close()}
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
      if (width === 390) {
        await page.evaluate(() => UI.openWelcomeBack({
          minutes: 120, capped: false, produced: {}, gains: { coins: 12 },
          visitors: [{ name: '汤圆', gift: { coins: 12, fish: 1, yarn: 3 }, rare: false }],
        }));
        const reportText = await page.locator('#panel.open .card').innerText();
        assert.ok(reportText.includes('汤圆') && reportText.includes('🪙+12') && reportText.includes('🐠+1') && reportText.includes('🪙+3'),
          'Real visitor popup must show Tangyuan and each numeric resource reward: ' + reportText);
        assert.ok(!reportText.includes('[object Object]'), 'Real visitor popup must never stringify rewards as [object Object]');
        await page.evaluate(() => UI.closeAll());
      }
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
      // Verify expedition actions work on actual phone-sized game pages.
      await page.locator('#fab-map').tap();
      await page.locator('#panel.open .map-destination.available').first().tap();
      await page.locator('#map-menu').waitFor({state:'visible'});
      const beforeMenu=await page.evaluate(()=>({scene:window.__game.scene,region:WorldMap.currentRegion}));
      assert.equal(beforeMenu.scene,'map','Opening a region must stay in exploration');
      const menuRect=await page.locator('#map-menu').boundingBox();
      assert.ok(menuRect&&menuRect.x>=0&&menuRect.x+menuRect.width<=width+2,
        'Mobile map menu must stay within viewport: '+JSON.stringify(menuRect));
      await page.locator('#map-menu').tap();
      const menuText=await page.locator('#panel.open .explore-menu').innerText();
      assert.ok(menuText.includes('探险菜单')&&menuText.includes('状态 / 养成')&&
        menuText.includes('技能搭配')&&menuText.includes('工坊收益')&&menuText.includes('小卖部'),
        'Map menu must show cat status, raising, skills, workshop and shop: '+menuText);
      await page.locator('#panel.open [data-explore-action="shop"]').tap();
      assert.ok((await page.locator('#panel.open .card').innerText()).includes('小卖部'),
        'Map shortcut must open the actual purchasing interface');
      assert.equal(await page.evaluate(()=>window.__game.scene),'map','Shopping must not return to yard');
      await page.locator('#panel .panel-dismiss').tap();
      const afterMenu=await page.evaluate(()=>({scene:window.__game.scene,region:WorldMap.currentRegion}));
      assert.deepEqual(afterMenu,beforeMenu,'Closing menu must resume the same region');
      console.log('CAT BOND MAP MENU PASS',width,'raising, skills, shopping, region retention');
      await page.evaluate(()=>{window.__game.scene='yard';window.__game.showYardChrome();});
      await page.locator('#fab-feed').tap();
      assert.equal(await page.locator('#panel.open').count(),1,'Feed icon must be touch-activated');
      await tabs.first().tap();
      if(width===390){
        // No injected webpage fullscreen: only the play stage gets immersive mode.
        await page.evaluate(()=>Object.defineProperty(document.getElementById('stage'),'requestFullscreen',{value:undefined,configurable:true}));
        const fullscreen=page.locator('#mw-fullscreen-toggle');
        await fullscreen.tap();
        await page.waitForFunction(()=>document.documentElement.classList.contains('mw-fs-active'));
        assert.equal(await page.evaluate(()=>{
          const stage=document.getElementById('stage'),button=document.getElementById('mw-fullscreen-toggle');
          const actionRow=document.getElementById('cb-header-actions');
          return !!(stage&&button&&stage.contains(button)&&actionRow?.contains(button));
        }),true,
          'Fullscreen toggle must stay inside the play area unified header, not the webpage');
        await fullscreen.tap();
        await page.waitForFunction(()=>!document.documentElement.classList.contains('mw-fs-active'));
        // Simulate battle input: touch joystick and verify it drives the fighter.
        await page.evaluate(()=>{
          const g=window.__game;
          g.startBattle(State.S.cats.slice(0,1),GameData.SPECIES[1]);
        });
        await page.waitForFunction(()=>window.__game.scene==='battle');
        // A first-time encounter opens paused tutorial before the live HUD.
        const tutorial=await page.evaluate(()=>!!window.__game.battleTutorial);
        if(tutorial){
          assert.equal(await page.locator('#battle-help').isVisible(),true,
            'First battle should open a visible, skippable control tutorial');
          await page.locator('#battle-tutorial-skip').tap();
        }
        await page.waitForFunction(()=>document.getElementById('battle-hint').textContent.includes('左侧滑动'),
          null,{timeout:8000});
        const phoneBattle=await page.evaluate(()=>{
          const title=document.getElementById('battle-hint').textContent;
          const dodge=document.getElementById('mv-dodge').innerText;
          const dodgeHelp=document.querySelector('#mv-dodge .mv-k').textContent;
          const buttons=['btn-auto','btn-flee'].map(id=>{
            const r=document.getElementById(id).getBoundingClientRect();
            return {id,left:r.left,right:r.right,top:r.top,bottom:r.bottom};
          });
          return {title,dodge,dodgeHelp,buttons};
        });
        assert.ok(phoneBattle.title.includes('右侧按住攻击'),
          'Phone tutorial must describe touch controls, not mouse controls: '+JSON.stringify(phoneBattle));
        assert.ok(phoneBattle.dodge.includes('闪避')&&/^(点按|点击)$/.test(phoneBattle.dodgeHelp),
          'Phone dodge needs a meaningful on-screen label: '+JSON.stringify(phoneBattle));
        assert.ok(phoneBattle.buttons.every(b=>b.left>=-2&&b.right<=width+2),
          'Battle top controls must fit small phone widths: '+JSON.stringify(phoneBattle));

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
  // Real landscape touch regression for the region camera.
  const landscape=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const lp=await landscape.newPage();
  try{
    const errors=[];lp.on('pageerror',e=>errors.push(e.message));
    await lp.goto(origin+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
    await lp.locator('#intro-start').tap();
    await lp.locator('#panel.open .dex-cell').first().tap();
    await lp.locator('#fab-map').tap();
    // Freeze random encounters only in this camera regression: a roaming
    // wild cat otherwise intermittently switches the test into battle.
    await lp.evaluate(()=>{
      window.WorldMap.onEncounter(()=>{});
      window.WorldMap.enterRegion(window.WorldMap.REGIONS.find(r=>window.WorldMap.isUnlocked(r.id)).id);
    });
    await lp.waitForTimeout(250);
    const start=await lp.evaluate(()=>window.WorldMap.view);
    const finger=async(type,x,y)=>{
      await lp.evaluate(({type,x,y})=>{
        const cv=document.querySelector('#scene'),r=cv.getBoundingClientRect();
        const touch=new Touch({identifier:42,target:cv,clientX:r.left+x,clientY:r.top+y});
        cv.dispatchEvent(new TouchEvent(type,{touches:type==='touchend'?[]:[touch],targetTouches:type==='touchend'?[]:[touch],changedTouches:[touch],bubbles:true,cancelable:true}));
      },{type,x,y});
    };
    await finger('touchstart',680,195);await finger('touchend',680,195);
    // Canvas texture decode and first landscape resize can stall a few
    // frames on CI. Verify actual movement, not a fixed 300ms clock that
    // measures rendering startup rather than touch navigation.
    await lp.waitForFunction(start=>{
      const view=window.WorldMap?.view;
      return view&&Math.hypot(view.px-start.px,view.py-start.py)>8;
    },start,{timeout:6500});
    const walked=await lp.evaluate(()=>window.WorldMap.view);
    assert.ok(Math.hypot(walked.px-start.px,walked.py-start.py)>8,
      'Tap did not move the cat in any direction: '+JSON.stringify({start,walked}));
    await finger('touchstart',650,180);
    await finger('touchmove',520,180);
    await finger('touchmove',400,180);
    await finger('touchend',400,180);
    const result=await lp.evaluate(()=>({mode:window.WorldMap.mode,view:window.WorldMap.view}));
    assert.equal(result.mode,'region','Drag accidentally exited grass region');
    assert.equal(await lp.evaluate(()=>window.__game.scene),'map','Drag must keep the exploration scene active');
    assert.ok(result.view.panMode&&result.view.camX>walked.camX+50,'Background camera failed to pan: '+JSON.stringify({walked,result}));
    assert.deepEqual(errors,[],'Landscape page errors: '+errors.join(' | '));
    console.log('CAT BOND LANDSCAPE PASS: tap walk, drag grass, responsive controls');
  }catch(e){failures.push('landscape: '+e.message);console.error('CAT BOND LANDSCAPE FAIL',failures.at(-1))}
  finally{await landscape.close()}
}finally{await browser.close();}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}
else console.log('Cat Bond passes two phone sizes and gameplay-only fullscreen test.');
