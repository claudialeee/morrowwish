// Real-browser release gate for the Cat Bond yard/map navigation and mobile top rail.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
  for(const width of [320,390,1280]){
    const mobile=width<700,height=mobile?780:800;
    const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:8765/cat-bond/?autodev&lang=zh',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>window.__game?.scene==='yard'&&window.State?.S?.cats?.length>=3&&
      !!document.querySelector('#cb-header-actions #hud')&&!!document.querySelector('#cb-header-actions #map-menu'),
      null,{timeout:25000});
    const measure=()=>page.evaluate(()=>{
      const rect=id=>document.getElementById(id)?.getBoundingClientRect();
      const stage=rect('stage'),actions=rect('cb-header-actions'),hud=rect('hud'),
        menu=rect('map-menu'),back=rect('cb-yard-return'),guide=rect('guide-help');
      const hudElement=document.getElementById('hud'),guideElement=document.getElementById('guide-help');
      const menuElement=document.getElementById('map-menu');
      return {scene:window.__game?.scene,mode:window.WorldMap?.mode,
        stage:{left:stage.left,right:stage.right},actions:{left:actions.left,right:actions.right,top:actions.top},
        hud:{left:hud.left,right:hud.right,top:hud.top,
          visible:getComputedStyle(hudElement).display!=='none'},
        guide:{left:guide.left,right:guide.right,top:guide.top,
          visible:!guideElement.hidden&&getComputedStyle(guideElement).display!=='none',
          immediatelyBeforeMenu:guideElement.nextElementSibling===menuElement,
          parent:guideElement.parentElement?.id},
        menu:{left:menu.left,right:menu.right,top:menu.top,
          visible:!document.getElementById('map-menu').hidden&&getComputedStyle(document.getElementById('map-menu')).display!=='none'},
        back:{left:back.left,right:back.right,visible:getComputedStyle(document.getElementById('cb-yard-return')).display!=='none'},
        tabs:[...document.querySelectorAll('#tabbar .tab')].map(x=>x.dataset.tab),
        canonical:!!window.__CAT_BOND_CANONICAL_ACTIVE__,gardenActive:document.getElementById('stage').classList.contains('cb-sunlit-garden'),location:window.WorldMap?.REGIONS?.find(r=>r.id==='home')};
    });
    const yard=await measure();
    assert.deepEqual(yard.tabs,['cats','work','dex','daily','shop'],'remove the do-nothing Yard bottom tab');
    assert.equal(yard.back.visible,false,'Back to yard must be invisible while already in yard');
    assert.equal(yard.menu.visible,true,'Yard menu stays visible on every viewport');
    assert.equal(yard.hud.visible,true,'Currency remains visible in the Yard');
    assert.equal(yard.guide.parent,'cb-header-actions','Gameplay guide is mounted in the right toolbar');
    assert.equal(yard.guide.immediatelyBeforeMenu,true,'Gameplay guide sits immediately left of Menu');
    // The tutorial button retains its real click handler after moving into the header.
    const guideClick=await page.evaluate(()=>{
      const original=window.__game.replayFirstAdventureTour;
      let called=0;
      window.__game.replayFirstAdventureTour=()=>{called++};
      const el=document.getElementById('guide-help');
      el.hidden=false;el.click();
      const visible=getComputedStyle(el).display!=='none';
      const bb=elem=>elem.getBoundingClientRect();
      const hud=bb(document.getElementById('hud')),help=bb(el),
        menu=bb(document.getElementById('map-menu')),
        stage=bb(document.getElementById('stage')),
        bar=bb(document.getElementById('cb-header-actions'));
      const noOverlap=hud.right<=help.left+3&&help.right<=menu.left+3;
      const fits=bar.left>=stage.left-2&&bar.right<=stage.right+2;
      window.__game.replayFirstAdventureTour=original;el.hidden=true;
      return {called,visible,noOverlap,fits,
        positions:{hudRight:hud.right,helpLeft:help.left,helpRight:help.right,menuLeft:menu.left,
          toolbarLeft:bar.left,stageLeft:stage.left}};
    });
    assert.equal(guideClick.called,1,'Guide retains its original click handler');
    assert.equal(guideClick.visible,true,'Guide is visible as a real top-right button');
    assert.ok(guideClick.noOverlap&&guideClick.fits,
      'When Guide is shown, it must not overlap currency or Menu '+JSON.stringify(guideClick));
    assert.ok(yard.actions.left>=yard.stage.left-1&&yard.actions.right<=yard.stage.right+2,
      'right-hand toolbar must stay inside stage '+JSON.stringify(yard));
    assert.ok(yard.actions.right>=yard.stage.right-22,'yard header must align RIGHT '+JSON.stringify(yard));
    assert.ok(Math.abs(yard.hud.top-yard.menu.top)<8&&yard.hud.right<=yard.menu.left+2,
      'resources and menu must be in same row '+JSON.stringify(yard));
    if(yard.canonical)assert.ok(yard.gardenActive,'canonical Sunlit Garden is an actual home scene, not an atlas region');
    else{assert.equal(yard.location.name,'阳光花园');assert.equal(yard.location.sub,'Sunlit Garden');}
    await page.screenshot({path:'/tmp/cat-bond-toolbar-'+width+'-yard.png'});
    await page.evaluate(()=>window.__game.openWorldMap());
    await page.waitForFunction(()=>window.__game?.scene==='map'&&
      getComputedStyle(document.getElementById('cb-yard-return')).display!=='none');
    const map=await measure();
    if(yard.canonical){const home=page.locator('.rw-head').getByRole('button',{name:'阳光花园',exact:true});await home.waitFor({state:'visible'});assert.equal(await home.isEnabled(),true,'canonical atlas has a real garden return');}
    assert.equal(map.back.visible,true,'Only exploration gets Back to Yard');
    assert.equal(map.hud.visible,false,'Map must NOT display duplicate coin/fish resource chips');
    assert.equal(map.guide.visible,false,'Detached guide never overlaps the left map return');
    assert.ok(map.back.right<=map.actions.left+2,'Back to Yard must not overlap resources/menu '+JSON.stringify(map));
    assert.ok(map.actions.right<=map.stage.right+2&&map.menu.visible,
      'exploration toolbar must remain inside the screen '+JSON.stringify(map));
    await page.evaluate(()=>window.UI.closeAll());
    await page.locator('#cb-yard-return').click();
    await page.waitForFunction(()=>window.__game.scene==='yard');
    assert.equal((await measure()).back.visible,false,'Back to yard hides again after return');
    assert.deepEqual(errors,[],'no script errors during menu/map/yard round trip');
    await page.screenshot({path:'/tmp/cat-bond-toolbar-'+width+'-returned.png'});
    await context.close();
    console.log('CAT BOND RIGHT TOOLBAR REAL CHROMIUM PASS',width);
  }
} finally{await browser.close();}
