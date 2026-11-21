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
      assert.equal(await page.evaluate(()=>window.__game.battle.autoUsed),true,
        'Turning off auto must not erase automatic assistance from the rank evaluation');
      if(width===907){
        // Simulate earned win through the real battle completion logic.
        await page.evaluate(()=>{
          const b=window.__game.battle;
          // Simulate a genuinely high-performing result to exercise the
          // entire S-rank achievement path, not only generic battle victory.
          for(const e of b.enemies){e.hp=0;e.alive=false;}
          b.team.forEach(cat=>{cat.hp=cat.maxhp;});
          b.t=10;b.comboBest=19; // exceptional auto S, not a trivial automatic S
          b.finish(true);window.__game.endBattle();
        });
        await page.waitForSelector('#cr-next',{timeout:8000});
        await page.waitForSelector('#cr-newskill',{timeout:5000});
        await page.waitForSelector('#cr-duo',{timeout:5000});
        const unlockedDuo=await page.evaluate(()=>{
          const cats=State.S.cats;
          const duo=window.CatRelations?.active(cats);
          return {ready:!!duo,name:duo?.name||'',points:duo?.value||0};
        });
        assert.equal(unlockedDuo.ready,true,'First captured cat forms a usable duo');
        assert.ok(unlockedDuo.name.length>=4,'New duo must have a named elemental move');
        assert.ok(unlockedDuo.points>=20,'The first duo starts with enough trust to fight');
        const firstMove=await page.evaluate(()=>{
          const starter=State.S.cats[0];
          return {skill:starter.loadout?.[2],awakened:starter.skillAwakened};
        });
        assert.equal(firstMove.awakened,true,'First captured companion awakens a new ability');
        assert.ok(firstMove.skill,'The new ability is automatically equipped');
        assert.equal(await page.locator('.skill-reveal-card').count(),1,
          'New players must visibly celebrate an unlocked skill');
        const rank=await page.locator('.battle-grade b').innerText();
        assert.equal(rank,'S','An exceptional auto battle can still earn S and a permanent species medal');
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
        assert.equal(await page.locator('.journey-path').count(),5,
          'Collection, skills, workshop, bonding and exploration should all be discoverable');
        assert.equal(await page.locator('#journey-workshop').count(),1,
          'Workshop must be reachable directly from the adventure guide');
        await page.locator('#journey-duo').click();
        await page.waitForSelector('#duo-play');
        await page.locator('#duo-choose').click();
        assert.match(await page.locator('.duo-active-status').innerText(),/Current|当前/,
          'Choosing a duo must immediately confirm who is joining the next battle');
        assert.deepEqual(await page.evaluate(()=>CatRelations.chosen().map(c=>c.uid)),
          await page.evaluate(()=>State.S.cats.slice(0,2).map(c=>c.uid)),
          'The chosen duo must persist in the save');
        assert.ok((await page.locator('.duo-relation').innerText()).length>10,
          'Duo relationship management must display a real trust meter');
        await page.locator('#duo-return').click();
        await page.waitForSelector('#journey-collect');
        assert.equal(await page.locator('#journey-skills').count(),1,
          'The newly learned skill must have a visible progression route');
        await page.locator('#journey-skills').click();
        await page.waitForSelector('#panel .skill-roadmap');
        assert.equal(await page.locator('#panel .sk-slot').count(),4,
          'The skill route must open the four-slot playable skill loadout');
        await page.evaluate(()=>UI.openJourney());
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
        const moves=await page.evaluate(()=>{
          const b=window.__game.battle,active=b.me();
          return {q:document.querySelector('#mv-q .mv-name')?.textContent,
            e:document.querySelector('#mv-e .mv-name')?.textContent,
            actualQ:active.qSkill?.name,actualE:active.eSkill?.name,
            hotkey:document.querySelector('#mv-e .mv-k')?.textContent,
            display:getComputedStyle(document.querySelector('#mv-e .mv-name')).display,
            present:!!document.querySelector('#mv-e .mv-name')};
        });
        assert.ok(moves.present&&moves.display!=='none'&&moves.e.length>1,
          'The newly equipped skill must have a visible name on the E button');
        assert.equal(moves.hotkey,'E','E hotkey must not be replaced by a skill name');
        assert.ok(moves.q?.length>1,'Q skill must be readable rather than a generic icon');
        const duoDamage=await page.evaluate(()=>{
          const b=window.__game.battle;
          if(!b?.duo)return null;
          b.duoCharge=100;
          const target=b.enemies[0],before=target.hp;
          const cast=b.castDuo();
          return {cast,damage:before-target.hp,uses:b.duoUses};
        });
        assert.ok(duoDamage?.cast&&duoDamage.damage>0&&duoDamage.uses===1,
          'Real duo move must activate and deal damage, not just display a name');
        assert.ok(await page.evaluate(()=>window.__game.battle.duoCinematic?.t>0),
          'Duo attack must trigger an animated two-cat cinematic');
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
        await page.waitForSelector('#panel .map-destination.available');
        assert.equal(await page.locator('#panel .map-destination').count(),5,
          'All five real explorable regions must appear in one in-game directory');
        assert.equal(await page.locator('#panel .map-destination.locked').count(),4,
          'Future regions must expose their actual unlocking requirements');
        await page.locator('#panel .map-destination.available').first().click();
        assert.equal(await page.evaluate(()=>WorldMap.mode),'region',
          'Clicking a region must open a playable walking world');
        const canvasBox=await page.locator('#scene').boundingBox();
        assert.ok(canvasBox,'World must have a playable canvas');
        const x=canvasBox.x+canvasBox.width*.68,y=canvasBox.y+canvasBox.height*.48;
        await page.mouse.move(x,y);await page.mouse.down();
        await page.mouse.move(x-210,y-12,{steps:8});await page.mouse.up();
        const view=await page.evaluate(()=>WorldMap.view);
        assert.ok(view.panMode&&view.camX>30,
          'Desktop mouse drag must pan the camera rather than only move the cat');
        await page.mouse.click(canvasBox.x+canvasBox.width*.48,canvasBox.y+canvasBox.height*.45);
        const walk=await page.evaluate(()=>WorldMap.view);
        assert.equal(walk.panMode,false,'Click-to-walk must resume camera follow');
        assert.equal(walk.target,true,'Click-to-walk should set a physical destination');
        await page.evaluate(()=>{window.__game.scene='yard';window.__game.showYardChrome();UI.closeAll();});
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
