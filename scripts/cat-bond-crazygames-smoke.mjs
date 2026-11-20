import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
try{
  for(const [width,height] of [[907,510],[821,462],[800,450],[1366,768]]){
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:width===907?2:1});
    const page=await context.newPage();
    const exceptions=[];
    page.on('pageerror',err=>exceptions.push(err.message));
    await page.route('**/api/session',route=>route.fulfill({status:204,body:''}));
    try{
      await page.goto(origin+'/cat-bond/?platform=crazygames&lang=en',{waitUntil:'load',timeout:40000});
      await page.waitForFunction(()=>window.__CAT_BOND_STARTED__===true,{timeout:12000});
      await page.waitForSelector('#panel.open .dex-cell',{timeout:12000});
      if(width===907){
        await page.waitForFunction(()=>window.CatBondArtworkStatus?.breedsLoaded===true,
          null,{timeout:18000});
        const artAudit=await page.evaluate(()=>{
          const portraits=GameData.SPECIES.map(sp=>{
            const canvas=document.createElement('canvas');
            canvas.width=170;canvas.height=125;
            CatArt.renderCatThumb(canvas,sp);
            return canvas.toDataURL('image/png');
          });
          return {total:portraits.length,unique:new Set(portraits).size};
        });
        assert.equal(artAudit.total,25,'All catalog breeds must have artwork');
        assert.equal(artAudit.unique,25,
          'Different breeds must not share identical final portrait artwork: '+JSON.stringify(artAudit));
        console.log('CAT BOND 25-BREED ART PASS',JSON.stringify(artAudit));
      }
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

      if(width===907){
        const art=await page.locator('#cp-wild').evaluate(canvas=>{
          const rect=canvas.getBoundingClientRect();
          return {px:canvas.width,css:rect.width};
        });
        assert.ok(art.css>80&&art.px/art.css>=1.8,
          'Cat portraits must render sharply on retina devices: '+JSON.stringify(art));
      }
      await page.locator('#cp-go').click();
      await page.waitForFunction(()=>window.__game.scene==='battle',{timeout:8000});
      const auto=page.locator('#btn-auto');
      assert.equal(await auto.getAttribute('aria-pressed'),'false','Start in explicit manual mode');
      assert.ok((await page.locator('#mv-dodge').innerText()).match(/Dodge|闪避/),
        'Dodge button must explain its function instead of only showing Space');
      await auto.click();
      assert.equal(await auto.getAttribute('aria-pressed'),'true','Click must turn automatic battle ON');
      assert.match(await auto.innerText(),/ON|开/,'Button must show CURRENT active mode');
      await auto.click();
      assert.equal(await auto.getAttribute('aria-pressed'),'false','Click must turn automatic battle OFF');
      if(width===907){
        // Simulate earned win through the real battle completion logic.
        await page.evaluate(()=>{
          const b=window.__game.battle;
          // Simulate a genuinely high-performing result to exercise the
          // entire S-rank achievement path, not only generic battle victory.
          for(const e of b.enemies){e.hp=0;e.alive=false;}
          b.team.forEach(cat=>{cat.hp=cat.maxhp;});
          b.t=10;b.comboBest=8;
          b.finish(true);window.__game.endBattle();
        });
        await page.waitForSelector('#cr-next',{timeout:8000});
        const rank=await page.locator('.battle-grade b').innerText();
        assert.equal(rank,'S','Good play earns an S rank and a permanent species medal');
        await page.waitForSelector('.golden-paw-unlock',{timeout:5000});
        assert.equal(await page.locator('#cr-medal').count(),1,
          'First S unlock must offer a direct route into the Golden Paw codex');
        const medalState=await page.evaluate(()=>({
          count:window.__game.masteryStatus().medals,
          lure:State.S.luckLure,
          newCatBond:State.S.cats.at(-1).affinity
        }));
        assert.equal(medalState.count,1);
        assert.equal(medalState.lure,1);
        assert.ok(medalState.newCatBond>=15);
        const bonusText=await page.locator('.battle-grade').innerText();
        assert.match(bonusText,/Bonus|奖励/,'Players should see a reward tied to battle performance');
        await page.waitForTimeout(80);
        const catchCopy=await page.locator('#panel.open').innerText();
        assert.doesNotMatch(catchCopy,/[\u4e00-\u9fff]/,
          'CrazyGames English catch result has untranslated Chinese: '+catchCopy);

        assert.equal(await page.evaluate(()=>State.S.cats.length),2);
        await page.locator('#cr-next').click();
        assert.equal(await page.evaluate(()=>!!window.__game.yard.hide),true,'Second collection starts with one click');
        await page.locator('#collection-goal').click();
        await page.waitForSelector('#journey-collect');
        assert.equal(await page.locator('.journey-path').count(),3,
          'Collection, bonding and exploration should all be discoverable');
        await page.locator('#journey-mastery').click();
        await page.waitForSelector('.golden-paw-stamp');
        assert.ok((await page.locator('.golden-paw-stamp').count())>=1,
          'S medals must be permanently represented on the cat codex');
        assert.doesNotMatch(await page.locator('#panel.open').innerText(),/解锁隐藏传说种/,
          'No fake legendary unlock claim');
        // A real user must be able to challenge a specific breed from the
        // codex without winning another duplicate and farming resources.
        await page.locator('#panel .dex-cell.golden-paw').first().click();
        await page.waitForSelector('#dx-rematch');
        const beforeRematch=await page.evaluate(()=>({
          cats:State.S.cats.length,captures:State.S.catchCount,
          coins:State.S.coins,dex:JSON.stringify(State.S.dex)
        }));
        await page.locator('#dx-rematch').click();
        await page.waitForFunction(()=>window.__game.scene==='battle');
        await page.evaluate(()=>{
          const g=window.__game,b=g.battle;
          if(!b.masteryChallenge)throw Error('Codex rematch entered normal capture');
          b.team.forEach(f=>{f.hp=f.maxhp;});
          b.t=10;b.comboBest=8;
          b.finish(true);g.endBattle();
        });
        await page.waitForSelector('#mc-retry');
        const afterRematch=await page.evaluate(()=>({
          cats:State.S.cats.length,captures:State.S.catchCount,
          coins:State.S.coins,dex:JSON.stringify(State.S.dex)
        }));
        assert.deepEqual(afterRematch,beforeRematch,
          'Rank rematches cannot clone kittens, alter capture count or farm coins');
        await page.evaluate(()=>UI.openJourney());
        await page.locator('#journey-explore').click();
        assert.equal(await page.evaluate(()=>window.__game.scene),'map',
          'Explore CTA should actually open the explorable world');
        // Production-like mature save: dozens of owned cats, many duplicates.
        // The garden should remain inviting and every individual accessible.
        const mature=await page.evaluate(()=>{
          const base=GameData.SPECIES.slice(0,12);
          for(const sp of base)for(let i=0;i<3;i++)State.S.cats.push(State.makeCat(sp.id));
          const game=window.__game;game.scene='yard';game.showYardChrome();game.rebuildYard();
          return {owned:State.S.cats.length,visible:game.yard.entities.length,
            uniqueGarden:new Set(game.yard.entities.map(e=>e.cat.species)).size,
            uniqueOwned:new Set(State.S.cats.map(e=>e.species)).size,
            pages:game.yard.pageCount};
        });
        assert.ok(mature.owned>=35,'Mature save must include many kittens');
        assert.ok(mature.visible<=6,'Only a handful of cats may roam the garden');
        assert.equal(mature.visible,mature.uniqueGarden,'No duplicate breeds visible together');
        assert.ok(mature.pages>=2,'More breeds must rotate using a visible control');
        await page.locator('#yard-cat-switch').click();
        const gardenAfterRotate=await page.evaluate(()=>window.__game.yard.page);
        assert.equal(gardenAfterRotate,1,'Visitors switch on demand');
        await page.evaluate(()=>UI.openRoster());
        assert.equal(await page.locator('.breed-group').count(),mature.uniqueOwned,
          'Roster must group all duplicate individuals by breed');
        await page.locator('.breed-group').first().click();
        assert.ok((await page.locator('.breed-member').count())>=2,
          'Grouped breed still provides access to individual saved cats');
        await page.locator('.breed-member').first().click();
        await page.waitForSelector('#cat-detail');
        console.log('CAT BOND MATURE ROSTER PASS',JSON.stringify(mature));
      }
      assert.deepEqual(exceptions,[],'Portal runtime errors: '+exceptions.join(' | '));
      console.log('CRAZYGAMES CAT BOND PASS',width+'x'+height,JSON.stringify({stage:layout.stage,starter:state.species}));
    }finally{await context.close();}
  }
}finally{await browser.close();}
