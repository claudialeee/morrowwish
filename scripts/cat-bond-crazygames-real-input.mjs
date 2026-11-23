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
        origin+'/cat-bond/?utm_source=crazygames&utm_medium=portal&utm_campaign=cat-bond-playtest&lang=en',
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
      // The unified settings row must NEVER live inside a HUD hidden on the map
      // or during battle. This caught missing top-right controls in portal QA.
      await page.locator('#cg-top-tools #mw-game-settings').waitFor({state:'visible',timeout:10000});
      await page.locator('#cg-top-tools #map-menu').waitFor({state:'visible',timeout:10000});
      assert.equal(await page.locator('#cg-top-tools #mw-game-settings button').count(),4,
        'CrazyGames top-right language/music/sound/share controls must survive scene changes');
      const topTools=await page.evaluate(()=>{
        const top=document.getElementById('cg-top-tools').getBoundingClientRect();
        const button=document.getElementById('map-menu').getBoundingClientRect();
        const hit=document.elementFromPoint(button.left+button.width/2,button.top+button.height/2);
        return {right:top.right,bottom:top.bottom,menuClickable:document.getElementById('map-menu').contains(hit)};
      });
      assert.ok(topTools.right<=width+2&&topTools.bottom<80&&topTools.menuClickable,
        'CrazyGames upper-right game Menu is missing or blocked: '+JSON.stringify(topTools));
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
      const battleHUD=await page.evaluate(()=>{
        const rect=s=>{const el=document.querySelector(s);if(!el)return null;
          const css=getComputedStyle(el),r=el.getBoundingClientRect();
          if(css.display==='none'||el.hidden)return null;
          return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,
            scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,
            scrollHeight:el.scrollHeight,clientHeight:el.clientHeight};
        };
        return {
          stack:rect('#cg-battle-hud'),
          header:rect('#cg-battle-hud > .battle-topbar'),
          enemy:rect('#cg-battle-hud .battle-enemy-summary'),
          health:rect('#cg-battle-hud .battle-enemy-track'),
          poise:rect('#cg-battle-hud .battle-poise-track'),
          squad:rect('#cg-battle-hud #battle-squad-rail'),
          team:rect('#cg-battle-hud #team-slots'),
          bench:rect('#cg-battle-hud #bench-slots'),
          charges:rect('#cg-battle-hud #cg-battle-charges'),
          ultimate:rect('#cg-battle-hud #ult-wrap'),
          duo:rect('#cg-battle-hud #duo-burst'),
          tools:rect('#cg-top-tools #mw-game-settings'),
          portalMenu:rect('#cg-top-tools #map-menu')
        };
      });
      const B=battleHUD;
      const noOverlap=(a,b,pad=2)=>!a||!b||
        a.bottom+pad<=b.top||b.bottom+pad<=a.top||
        a.right+pad<=b.left||b.right+pad<=a.left;
      assert.ok(B.stack&&B.header&&B.enemy&&B.health&&B.poise&&B.squad&&B.team&&
        B.charges&&B.ultimate&&B.tools,
        'Missing combat HUD sections in CrazyGames: '+JSON.stringify(B));
      assert.ok(B.header.bottom+2<=B.squad.top&&B.header.bottom+2<=B.ultimate.top,
        'Enemy name/health/poise overlaps player cats or ultimate charge: '+JSON.stringify(B));
      assert.ok(B.squad.right+2<=B.charges.left,
        'Active/reserve cats intersect right-side charge gauges: '+JSON.stringify(B));
      assert.ok(!B.duo||B.ultimate.bottom+2<=B.duo.top,
        'Ultimate charge overlaps duo burst: '+JSON.stringify(B));
      assert.ok(B.enemy.left<=B.health.left+2&&B.health.right<=B.enemy.right+2&&
        B.enemy.left<=B.poise.left+60&&B.poise.right<=B.enemy.right+2,
        'Enemy HP or stagger meter spills outside its header: '+JSON.stringify(B));
      assert.ok(B.header.top>=B.tools.bottom+3,
        'Combat status overlaps upper-right settings: '+JSON.stringify(B));
      assert.equal(B.portalMenu,null,'Explore Menu must hide during active combat');
      // A clipped name ("Fluf...", "Fro...", "Bub...") is a RELEASE FAILURE,
      // even if the action button itself is clickable. Inspect live computed
      // text layout for every equipped skill in every CrazyGames viewport.
      const actionLayout=await page.evaluate(()=>{
        const bar=document.querySelector('#battle-ui .move-bar');
        const rect=el=>{const r=el.getBoundingClientRect();
          return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
        };
        return {
          bar:rect(bar),
          buttons:[...bar.querySelectorAll('.move')].filter(el=>getComputedStyle(el).display!=='none').map(btn=>{
            const name=btn.querySelector('.mv-name');
            const style=getComputedStyle(name);
            return {id:btn.id,fullName:name.textContent?.trim(),label:rect(name),button:rect(btn),
              whiteSpace:style.whiteSpace,overflow:style.overflow,textOverflow:style.textOverflow,
              scrollWidth:name.scrollWidth,clientWidth:name.clientWidth,
              scrollHeight:name.scrollHeight,clientHeight:name.clientHeight};
          })
        };
      });
      assert.ok(actionLayout.buttons.length>=5,
        'Missing CrazyGames combat action buttons: '+JSON.stringify(actionLayout));
      assert.ok(actionLayout.bar.left>=-2&&actionLayout.bar.right<=width+2&&
        actionLayout.bar.top>=B.stack.bottom+3&&actionLayout.bar.bottom<=height+2,
        'Combat skill bar is outside the iframe or crosses HUD: '+JSON.stringify(actionLayout));
      for(const item of actionLayout.buttons){
        assert.ok(item.fullName.length>0&&!/[.…]{2,}$/.test(item.fullName),
          'Skill has an abbreviated or missing label: '+JSON.stringify(item));
        assert.ok(item.textOverflow!=='ellipsis'&&item.whiteSpace!=='nowrap'&&
          item.overflow!=='hidden',
          'Skill label is styled to truncate: '+JSON.stringify(item));
        assert.ok(item.scrollWidth<=item.clientWidth+2 &&
          item.scrollHeight<=item.clientHeight+2,
          'Skill label visually clips characters: '+JSON.stringify(item));
        assert.ok(item.label.left>=item.button.left-1&&item.label.right<=item.button.right+1&&
          item.label.top>=item.button.top-1&&item.label.bottom<=item.button.bottom+1,
          'Full skill name escapes its action button: '+JSON.stringify(item));
      }
      // Regression stress for the reported two-cat + Reserves screenshot.
      // Clone only a visual card, measure the real CSS geometry synchronously,
      // then restore the live game DOM without changing battle state.
      const duoLayout=await page.evaluate(()=>{
        const host=document.getElementById('team-slots');
        const template=host?.querySelector('.team-slot');
        const bench=document.getElementById('bench-slots');
        if(!host||!template||!bench)return null;
        const copy=template.cloneNode(true);
        copy.dataset.qaLayoutOnly='true';
        const wasHidden=bench.hidden;
        const wasOpen=bench.classList.contains('is-open');
        const caption=document.createElement('button');
        caption.className='bench-caption';caption.textContent='Reserves · 1';
        const rect=el=>{const r=el.getBoundingClientRect();
          return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
        try{
          host.appendChild(copy);
          bench.hidden=false;
          bench.classList.remove('is-open');
          bench.appendChild(caption);
          return {
            cards:[...host.querySelectorAll('.team-slot')].map(rect),
            bench:rect(bench),
            enemy:rect(document.querySelector('#cg-battle-hud > .battle-topbar')),
            charges:rect(document.querySelector('#cg-battle-charges'))
          };
        }finally{
          copy.remove();caption.remove();bench.hidden=wasHidden;
          bench.classList.toggle('is-open',wasOpen);
        }
      });
      assert.ok(duoLayout?.cards?.length>=2,
        'Two-cat combat layout was not exercised: '+JSON.stringify(duoLayout));
      for(const card of duoLayout.cards){
        assert.ok(card.top>=duoLayout.enemy.bottom+2 &&
          card.right+2<=duoLayout.charges.left,
          'Two-cat roster overlaps enemy health or ultimate charge: '+JSON.stringify(duoLayout));
      }
      assert.ok(duoLayout.bench.top>=Math.max(...duoLayout.cards.map(r=>r.bottom))+2 &&
        duoLayout.bench.right+2<=duoLayout.charges.left,
        'Reserves overlaps cat HP or charge controls: '+JSON.stringify(duoLayout));
      if([907,1366,390].includes(width)){
        const dir='.check/crazygames-yard-dock';
        fs.mkdirSync(dir,{recursive:true});
        await page.screenshot({path:dir+'/'+width+'x'+height+'-battle.png'});
      }
      // Full genuine first combat on the primary desktop iframe: do not fake
      // enemies' HP, call b.finish() or execute internal endBattle() helpers.
      if(width===907){
        await page.locator('#cr-next').waitFor({state:'visible',timeout:120000});
        assert.equal(await page.evaluate(()=>State.S.cats.length),2,
          'Real auto battle must reward the player with a second cat');
        await page.locator('#cr-next').click();
        assert.equal(await page.evaluate(()=>State.S.battlePrefs.teamUids.length>=2),true,
          'Second combat must actually use the unlocked duo');
        // Actually enter the exploration scene after real combat; its Menu
        // and global settings must remain visible/clickable without site chrome.
        const mapButton=page.locator('#fab-map');
        await mapButton.waitFor({state:'visible',timeout:12000});
        await mapButton.click();
        await page.waitForFunction(()=>window.__game?.scene==='map',{timeout:10000});
        const mapPanel=page.locator('#panel.open');
        if(await mapPanel.isVisible())await page.locator('#panel.open .panel-dismiss').click();
        await page.locator('#cg-top-tools #map-menu').waitFor({state:'visible',timeout:10000});
        await page.locator('#cg-top-tools #mw-game-settings').waitFor({state:'visible',timeout:10000});
        const dir='.check/crazygames-yard-dock';
        fs.mkdirSync(dir,{recursive:true});
        await page.screenshot({path:dir+'/'+width+'x'+height+'-map.png'});
        await page.locator('#cg-top-tools #map-menu').click();
        await page.locator('#panel.open .explore-menu').waitFor({state:'visible',timeout:10000});
        await page.locator('#panel.open .panel-dismiss').click();
      }
      assert.deepEqual(errors,[],'Uncaught runtime errors: '+errors.join(' | '));
      console.log('CAT BOND REAL INPUT PASS',width+'x'+height,
        touch?'touch':'mouse','first encounter -> combat'+(width===907?' -> first capture -> duo':''));
    }finally{await ctx.close();}
  }
}finally{await browser.close();}
