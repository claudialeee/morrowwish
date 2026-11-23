// CrazyGames real-input preflight, on the same HTML5 game build as production.
// Unlike state-machine smoke tests, this uses native mouse/touch to start
// each real encounter. Test-position reads are observational only.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const sizes=[
  [907,510,false],[1216,684,false],[1077,606,false],
  [821,462,false],[1366,768,false],[1920,1080,false],
  [1536,864,false],[1280,720,false],[800,450,true],[1080,607,true],
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
