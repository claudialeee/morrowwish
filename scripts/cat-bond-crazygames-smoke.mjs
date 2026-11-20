import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
try{
  for(const [width,height] of [[907,510],[821,462],[800,450],[1366,768]]){
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
    const page=await context.newPage();
    const exceptions=[];
    page.on('pageerror',err=>exceptions.push(err.message));
    await page.route('**/api/session',route=>route.fulfill({status:204,body:''}));
    try{
      await page.goto(origin+'/cat-bond/?platform=crazygames&lang=en',{waitUntil:'load',timeout:40000});
      await page.waitForFunction(()=>window.__CAT_BOND_STARTED__===true,{timeout:12000});
      await page.waitForSelector('#panel.open .dex-cell',{timeout:12000});
      await page.waitForTimeout(80); // MutationObserver's ZH→EN DOM pass
      const starterCopy=await page.locator('#panel.open').innerText();
      assert.doesNotMatch(starterCopy,/[\u4e00-\u9fff]/,
        'CrazyGames English starter dialog has untranslated Chinese: '+starterCopy);

      const layout=await page.evaluate(()=>{
        const stage=document.getElementById('stage').getBoundingClientRect();
        const panel=document.querySelector('#panel.open .card').getBoundingClientRect();
        const quest=document.getElementById('first-quest');
        return {cg:document.documentElement.classList.contains('cb-cg'),hiddenIntro:
          getComputedStyle(document.getElementById('intro')).display==='none',
          home:!!document.getElementById('cb-home'),fullscreen:!!document.getElementById('mw-fullscreen-toggle'),
          stage:{width:stage.width,height:stage.height,left:stage.left,top:stage.top},
          panel:{left:panel.left,top:panel.top,right:panel.right,bottom:panel.bottom},
          screen:{width:innerWidth,height:innerHeight},questText:quest?.textContent||''};
      });
      assert.equal(layout.cg,true,'Portal mode class must be present');
      assert.equal(layout.hiddenIntro,true,'Player must not be blocked by the studio intro');
      assert.equal(layout.home,false,'No external home link inside CrazyGames');
      assert.equal(layout.fullscreen,false,'Host controls fullscreen; no internal button');
      assert.ok(layout.stage.width>=width-3&&layout.stage.height>=height-3,'Canvas stage must fill portal iframe: '+JSON.stringify(layout));
      assert.ok(layout.panel.left>=0&&layout.panel.right<=width+1&&layout.panel.top>=0&&layout.panel.bottom<=height+1,
        'Starter selection overflows iframe: '+JSON.stringify(layout));
      await page.locator('#panel.open .dex-cell').first().click();
      await page.waitForFunction(()=>document.querySelector('#panel').classList.contains('open')===false);
      const state=await page.evaluate(()=>({
        cats:State.S.cats.length,hide:!!window.__game.yard.hide,
        tutorial:window.__game.yard.hide?.tutorial,
        rarity:window.__game.yard.hide?.species.rarity,
        species:window.__game.yard.hide?.species.id,
        owned:State.S.cats[0]?.species,
        quest:document.getElementById('first-quest')?.textContent
      }));
      assert.equal(state.cats,1);
      assert.equal(state.hide,true,'Fresh player should immediately see a discoverable cat');
      assert.equal(state.tutorial,true,'First wild must have a highlighted target');
      assert.equal(state.rarity,'N','First wild should be a learnable common');
      assert.notEqual(state.species,state.owned,'First catch must reveal a new breed');
      await page.evaluate(()=>{
        const game=window.__game,spot=game.yard.hide.spot;
        game.yardTap(spot.x,spot.y);
      });
      await page.waitForSelector('#cp-go',{timeout:8000});
      await page.waitForTimeout(80);
      const battlePrepCopy=await page.locator('#panel.open').innerText();
      assert.doesNotMatch(battlePrepCopy,/[\u4e00-\u9fff]/,
        'CrazyGames English battle prep has untranslated Chinese: '+battlePrepCopy);

      await page.locator('#cp-go').click();
      await page.waitForFunction(()=>window.__game.scene==='battle',{timeout:8000});
      if(width===907){
        // Simulate earned win through the real battle completion logic.
        await page.evaluate(()=>{
          const b=window.__game.battle;
          for(const e of b.enemies){e.hp=0;e.alive=false;}
          b.finish(true);window.__game.endBattle();
        });
        await page.waitForSelector('#cr-next',{timeout:8000});
        await page.waitForTimeout(80);
        const catchCopy=await page.locator('#panel.open').innerText();
        assert.doesNotMatch(catchCopy,/[\u4e00-\u9fff]/,
          'CrazyGames English catch result has untranslated Chinese: '+catchCopy);

        assert.equal(await page.evaluate(()=>State.S.cats.length),2);
        await page.locator('#cr-next').click();
        assert.equal(await page.evaluate(()=>!!window.__game.yard.hide),true,'Second collection starts with one click');
      }
      assert.deepEqual(exceptions,[],'Portal runtime errors: '+exceptions.join(' | '));
      console.log('CRAZYGAMES CAT BOND PASS',width+'x'+height,JSON.stringify({stage:layout.stage,starter:state.species}));
    }finally{await context.close();}
  }
}finally{await browser.close();}
