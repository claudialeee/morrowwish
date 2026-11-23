// CrazyGames real-input preflight, on the same HTML5 game build as production.
// Unlike state-machine smoke tests, this uses native mouse/touch to start
// each real encounter. Test-position reads are observational only.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const sizes=[
  [907,510,false],[1216,684,false],[1077,606,false],
  [821,462,false],[1366,768,false],[1920,1080,false],
  [1536,864,false],[1280,720,false],[800,450,true],[1080,607,true],
  [390,844,true],
];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
  for(const [width,height,touch] of sizes){
    const ctx=await browser.newContext({
      viewport:{width,height},deviceScaleFactor:1,
      isMobile:touch,hasTouch:touch,
    });
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/session',route=>route.fulfill({status:204,body:''}));
    try{
      const response=await page.goto(
        origin+'/cat-bond/?platform=crazygames&lang=en',
        {waitUntil:'load',timeout:40000});
      assert.equal(response?.status(),200,'Playable route did not load');
      await page.waitForSelector('#panel.open .dex-cell',{timeout:20000});
      assert.equal(await page.locator('#intro').isVisible(),false,'Portal intro must not block play');
      assert.equal(await page.locator('#cb-home').count(),0,'No outbound studio home link');
      assert.equal(await page.locator('#mw-fullscreen-toggle').isVisible().catch(()=>false),false,
        'Host must own fullscreen');
      const starter=page.locator('#panel.open .dex-cell').first();
      if(touch)await starter.tap();else await starter.click();
      await page.waitForFunction(()=>window.State?.S?.cats?.length===1);
      assert.equal(await page.locator('#toasts .toast').count(),0,
        'CrazyGames first quest should not have duplicate overlay toasts');
      // A real player must see one coherent, clickable dock in the CrazyGames
      // iframe. The old independent absolute HUDs floated half-way up the yard.
      const menuLayout=await page.evaluate(()=>{
        const dock=document.getElementById('cg-yard-dock');
        const tabs=document.getElementById('tabbar');
        const actions=document.getElementById('yard-actions');
        if(!dock||!tabs||!actions)return null;
        const rect=el=>{
          const r=el.getBoundingClientRect();
          return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
            width:r.width,height:r.height};
        };
        const buttons=[...tabs.querySelectorAll('button'),
          ...actions.querySelectorAll('button')];
        const visible=buttons.map(el=>{
          const r=el.getBoundingClientRect();
          const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
          return {button:el.id||el.dataset.tab||el.textContent.trim().slice(0,12),
            rect:rect(el),clickable:el.contains(hit),
            contentFits:el.scrollWidth<=el.clientWidth+3};
        });
        return {dock:rect(dock),tabs:rect(tabs),actions:rect(actions),
          directParent:tabs.parentElement===dock&&actions.parentElement===dock,
          count:buttons.length,visible,viewport:{width:innerWidth,height:innerHeight}};
      });
      // Save a real screenshot even if a subsequent layout assertion fails.
      if([907,1366,390].includes(width)){
        const dir='.check/crazygames-yard-dock';
        fs.mkdirSync(dir,{recursive:true});
        await page.screenshot({path:dir+'/'+width+'x'+height+'-yard.png'});
      }
      assert.ok(menuLayout?.directParent,
        'CrazyGames menu buttons must share the same dock: '+JSON.stringify(menuLayout));
      assert.equal(menuLayout.count,10,'Exactly 5 tabs + 5 garden actions');
      assert.ok(menuLayout.dock.bottom<=height+2&&menuLayout.dock.bottom>=height-25,
        'Yard controls must sit at bottom of iframe: '+JSON.stringify(menuLayout));
      for(const item of menuLayout.visible){
        const r=item.rect;
        assert.ok(r.width>=40&&r.height>=40&&r.left>=-1&&r.right<=width+1&&
          r.top>=0&&r.bottom<=height+1&&item.clickable&&item.contentFits,
          'Yard control must be visible and clickable: '+JSON.stringify(item));
      }
      if(width>740){
        assert.ok(Math.abs(menuLayout.tabs.bottom-menuLayout.actions.bottom)<12,
          'Wide CrazyGames menus should share one bottom baseline: '+JSON.stringify(menuLayout));
        assert.ok(menuLayout.tabs.right+3<=menuLayout.actions.left,
          'Wide CrazyGames menu groups overlap: '+JSON.stringify(menuLayout));
      }else{
        assert.ok(menuLayout.actions.bottom+2<=menuLayout.tabs.top,
          'Narrow CrazyGames garden actions should sit above bottom tabs: '+JSON.stringify(menuLayout));
      }
      const target=await page.evaluate(()=>{
        const g=window.__game,cv=document.getElementById('scene'),r=cv.getBoundingClientRect();
        const spot=g?.yard?.hide?.spot;
        if(!spot)return null;
        const x=r.left+spot.x,y=r.top+spot.y;
        return {x,y,hit:document.elementFromPoint(x,y)?.id||'',
          inside:x>=r.left&&x<r.right&&y>=r.top&&y<r.bottom,
          docWidth:document.documentElement.scrollWidth};
      });
      assert.ok(target?.inside,'Wild-cat target is outside the canvas: '+JSON.stringify(target));
      assert.equal(target.hit,'scene','Wild-cat target is covered by another UI element: '+JSON.stringify(target));
      assert.ok(target.docWidth<=width+2,'Horizontal overflow in CrazyGames viewport');
      // A rare golden visitor or a loot bubble can share the same coordinates.
      // The main encounter must still be the first action, not an accidental pickup.
      const overlap=await page.evaluate(()=>{
        const y=window.__game.yard,spot=y.hide.spot;
        const gold=y.golden,loot=y.lootBubbles;
        try{
          y.golden={x:spot.x,y:spot.y};
          y.lootBubbles=[{x:spot.x,y:spot.y}];
          return y.handleTap(spot.x,spot.y).type;
        }finally{y.golden=gold;y.lootBubbles=loot;}
      });
      assert.equal(overlap,'hide','Overlapping loot steals first wild encounter');
      if(touch)await page.touchscreen.tap(target.x,target.y);
      else await page.mouse.click(target.x,target.y);
      await page.waitForSelector('#cp-go',{timeout:10000});
      assert.equal(await page.evaluate(()=>window.__game.yard.hide),null,
        'Real pointer event must consume the encounter');
      const prep=await page.locator('#panel.open').innerText();
      assert.doesNotMatch(prep,/[\u4e00-\u9fff]/,
        'CrazyGames battle prompt must be English');
      const auto=page.locator('#panel.open .capture-mode-option[data-battle-auto="true"]');
      if(await auto.count())await auto.click();
      await page.locator('#cp-go').click();
      await page.waitForFunction(()=>window.__game?.scene==='battle',{timeout:10000});
      // CrazyGames owns the embedding viewport. No floating skill reference
      // button or free-standing panel may cover the arena in any portal size.
      assert.equal(await page.locator('#battle-skill-info-toggle').isVisible(),false,
        'Floating Skill guide obstructs CrazyGames battle viewport');
      assert.equal(await page.locator('#battle-skill-guide').isVisible(),false,
        'Detached skill reference panel obstructs CrazyGames battle');
      const tutorial=page.locator('#battle-tutorial-skip');
      if(await tutorial.isVisible().catch(()=>false))await tutorial.click();
      // Full genuine first combat on the primary desktop iframe: do not fake
      // enemies' HP, call b.finish() or execute internal endBattle() helpers.
      if(width===907){
        await page.locator('#cr-next').waitFor({state:'visible',timeout:120000});
        assert.equal(await page.evaluate(()=>State.S.cats.length),2,
          'Real auto battle must reward the player with a second cat');
        await page.locator('#cr-next').click();
        assert.equal(await page.evaluate(()=>State.S.battlePrefs.teamUids.length>=2),true,
          'Second combat must actually use the unlocked duo');
      }
      assert.deepEqual(errors,[],'Uncaught runtime errors: '+errors.join(' | '));
      console.log('CAT BOND REAL INPUT PASS',width+'x'+height,
        touch?'touch':'mouse','first encounter -> combat'+(width===907?' -> first capture -> duo':''));
    }finally{await ctx.close();}
  }
}finally{await browser.close();}
