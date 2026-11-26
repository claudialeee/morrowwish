import {finishCanonicalOpening} from './cat-bond-test-start.mjs';
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
// Browser-level English check for every major playable scene.
// Coin icons and Canvas text are checked after the real rendering pipeline.
async function checkEnglish(page,phase,width){
 await page.waitForTimeout(85);
 const leaks=await page.evaluate(()=>{
  const han=/[\u3400-\u9fff]/,out=[];
  const vis=el=>{
   if(!el||!el.isConnected||!el.getClientRects().length)return false;
   if(el.closest('script,style,noscript,head,template'))return false;
   for(let x=el;x;x=x.parentElement){
    const css=getComputedStyle(x);
    if(css.display==='none'||css.visibility==='hidden')return false;
   }
   return true;
  };
  const root=document.getElementById('game-root')||document.body;
  const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  while(walk.nextNode()){
   const n=walk.currentNode,t=(n.nodeValue||'').trim();
   if(t==='中文'&&n.parentElement.matches('button[data-slot-language],button[data-res-language],button[data-opening-language],button.cbcp-language'))continue;
   if(t&&han.test(t)&&vis(n.parentElement))out.push('DOM '+t.slice(0,120));
  }
  for(const el of root.querySelectorAll('[title],[aria-label]')){
   if(!vis(el))continue;
   for(const a of ['title','aria-label']){
    const t=el.getAttribute(a)||'';
    if(han.test(t))out.push(a+' '+t.slice(0,120));
   }
  }
  for(const t of window.__catBondCanvasHan||[])out.push('Canvas '+t);
  return out.slice(0,30);
 });
 assert.deepEqual(leaks,[],'Mixed-language '+phase+' at '+width+'px: '+JSON.stringify(leaks));
}

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
  for(const [width,height,touch] of sizes){
    const ctx=await browser.newContext({
      viewport:{width,height},deviceScaleFactor:1,
      isMobile:touch,hasTouch:touch,
    });
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{
      window.__catBondCanvasHan=[];
      const han=/[\u3400-\u9fff]/;
      for(const name of ['fillText','strokeText']){
        const proto=CanvasRenderingContext2D.prototype,orig=proto[name];
        proto[name]=function(text,...args){
          const t=String(text);
          if(document.documentElement.lang==='en'&&han.test(t)){
            const leaks=window.__catBondCanvasHan;
            if(leaks.length<25&&!leaks.includes(t))leaks.push(t.slice(0,135));
          }
          return orig.call(this,text,...args);
        };
      }
    });
    await page.route('**/api/session',route=>route.fulfill({status:204,body:''}));
    try{
      const response=await page.goto(
        origin+'/cat-bond/?utm_source=crazygames&utm_medium=portal&utm_campaign=cat-bond-playtest&lang=en',
        {waitUntil:'load',timeout:40000});
      assert.equal(response?.status(),200,'Playable route did not load');
      // The portal must show the same genuine Start Adventure screen as
      // the website, not silently place a first-time player in the yard.
      await page.locator('#intro-start').waitFor({state:'visible',timeout:20000});
      const titleBounds=await page.evaluate(()=>{
        const a=document.getElementById('intro-start').getBoundingClientRect(),b=document.getElementById('intro-continue').getBoundingClientRect();
        return {a:a.toJSON(),b:b.toJSON(),hiddenSettings:getComputedStyle(document.getElementById('mw-game-settings')).display==='none'};
      });
      assert.ok(titleBounds.a.right+4<=titleBounds.b.left,'Title actions must be side by side without overlap');
      assert.ok(Math.abs(titleBounds.a.width-titleBounds.b.width)<2,'Title actions must have equal width');
      assert.equal(titleBounds.hiddenSettings,true,'Raw settings must not be on the title toolbar');
      await page.locator('#cb-system-toggle').click();
      await page.locator('#cb-system-menu [data-system="language"]').waitFor({state:'visible'});
      await page.locator('#cb-system-menu [data-system="close"]').click();
      assert.equal(await page.locator('#intro').isVisible(),true,
        'CrazyGames must show Start Adventure on first load');
      assert.equal(await page.locator('#cg-yard-dock').isVisible(),false,
        'Yard-only menu must not appear over the opening intro');
      assert.equal(await page.locator('#cb-home').count(),0,'No outbound studio home link');
      assert.equal(await page.locator('#mw-fullscreen-toggle').isVisible().catch(()=>false),false,
        'Host must own fullscreen');
      if(touch)await page.locator('#intro-start').tap();
      else await page.locator('#intro-start').click();
      await page.locator('#intro-slot-panel.is-open').waitFor({state:'visible',timeout:10000});
      const firstSlot=page.locator('#intro-slot-list [data-slot="slot1"]');
      if(touch)await firstSlot.tap();else await firstSlot.click();
      await page.waitForFunction(()=>window.__CAT_BOND_STARTED__===true);
      const canonical=await page.evaluate(()=>!!window.__CAT_BOND_CANONICAL_ACTIVE__);
      if(canonical)await finishCanonicalOpening(page);else{
      assert.equal(await page.locator('#intro').isVisible(),false,'Start must dismiss intro');
      await page.waitForFunction(()=>window.State?.S?.cats?.length===1&&State.S.cats[0].species==='jinjc');
      const prologue=page.locator('.cb-story-overlay.is-visible');
      await prologue.waitFor({state:'visible',timeout:15000});
      const skip=prologue.locator('.cb-story-skip');
      if(!(await skip.isVisible())){if(touch)await prologue.locator('.cb-story-next').tap();else await prologue.locator('.cb-story-next').click();}
      if(touch)await skip.tap();else await skip.click();
      await prologue.waitFor({state:'detached',timeout:10000});
      await page.waitForFunction(()=>window.__game?.scene==='map'&&WorldMap.mode==='map'&&WorldMap.atlasTargets.length===5);}
      assert.equal(await page.locator('#panel.open').count(),0,'Atlas is the primary RPG screen');
      // Real canvas back affordance in the portal (the host owns fullscreen).
      if(canonical)await page.locator('.rw-head').getByRole('button',{name:'Sunlit Garden'}).click();else{
      const back=await page.evaluate(()=>{const r=document.getElementById('scene').getBoundingClientRect();return{x:r.left+28,y:r.top+24};});
      if(touch)await page.touchscreen.tap(back.x,back.y);else await page.mouse.click(back.x,back.y);}
      await page.waitForFunction(()=>window.__game?.scene==='yard',{timeout:10000});
      // Scene state flips before the map panel's close transition and yard
      // chrome have finished updating. Assert the actual rendered yard, not
      // only the internal scene flag.
      await page.locator('#panel.open').waitFor({state:'hidden',timeout:10000});
      await page.locator('#cg-yard-dock').waitFor({state:'visible',timeout:10000});
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
      assert.equal(await page.locator('#cg-yard-dock').isVisible(),true,
        'Both independent yard-only navigation groups must appear only in the yard');
      await checkEnglish(page,'yard',width);
      // The unified settings row must NEVER live inside a HUD hidden on the map
      // or during battle. This caught missing top-right controls in portal QA.
      assert.equal(await page.locator('#cg-top-tools #mw-game-settings').isVisible(),false,'Settings must be inside the menu');
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
      // Match the actual Morrow Wish website: FIVE bottom-centre tabs in
      // a horizontal row + FIVE separate vertically stacked right-hand FABs.
      // The previous QA asserted two right-side columns and validated a
      // visually wrong interface; do not let that regression pass again.
      assert.ok(menuLayout.tabs.width>=menuLayout.actions.width*3 &&
        menuLayout.tabs.height<84,
        'Named menu tabs must form a wide, shallow horizontal bottom row: '+JSON.stringify(menuLayout));
      assert.ok(menuLayout.actions.height>=menuLayout.tabs.height*3,
        'Only icon garden actions may stack in the right vertical rail: '+JSON.stringify(menuLayout));
      assert.ok(menuLayout.tabs.left>=-1&&menuLayout.tabs.right<=menuLayout.actions.left-4,
        'Bottom-centre nav must not overlap the separate right garden rail: '+JSON.stringify(menuLayout));
      assert.ok(menuLayout.actions.right>=width-26&&menuLayout.actions.right<=width+2,
        'Garden icon rail must hug the right edge: '+JSON.stringify(menuLayout));
      assert.ok(menuLayout.tabs.bottom>=height-24&&menuLayout.tabs.bottom<=height+2 &&
        menuLayout.actions.bottom<=menuLayout.tabs.top-3,
        'Vertical garden rail must stop ABOVE the bottom menu row: '+JSON.stringify(menuLayout));
      const tabButtons=menuLayout.visible.slice(0,5),gardenButtons=menuLayout.visible.slice(5);
      for(let i=1;i<tabButtons.length;i++){
        assert.ok(tabButtons[i].rect.left>=tabButtons[i-1].rect.right-2 &&
          Math.abs(tabButtons[i].rect.top-tabButtons[0].rect.top)<3,
          'The five named tabs must be arranged side by side: '+JSON.stringify(tabButtons));
        assert.ok(gardenButtons[i].rect.top>=gardenButtons[i-1].rect.bottom-2 &&
          Math.abs(gardenButtons[i].rect.left-gardenButtons[0].rect.left)<3,
          'The five garden FABs must form a right-side vertical stack: '+JSON.stringify(gardenButtons));
      }
      // Yard hide-and-seek is now an optional sanctuary activity, not an
      // automatic first-run spawn. Start it through the real garden action.
      if(!(await page.evaluate(()=>!!window.__game?.yard?.hide?.spot))){
        const seek=page.locator('#fab-seek');
        if(touch)await seek.tap();else await seek.click();
      }
      await page.waitForFunction(()=>!!window.__game?.yard?.hide?.spot,{timeout:10000});
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
      assert.equal(await page.locator('#cg-yard-dock').isVisible(),false,
        'Garden-only navigation must disappear during battle');
      assert.equal(await page.locator('#tabbar').isVisible(),false,
        'Garden tab buttons cannot appear during battle');
      assert.equal(await page.locator('#yard-actions').isVisible(),false,
        'Garden actions cannot appear during battle');
      assert.equal(await page.locator('#cb-system-toggle').isVisible(),true,
        'Language/audio/share utility toolbar must stay visible in battle');
      await checkEnglish(page,'battle',width);
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
          tools:rect('#cb-system-toggle'),
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
      const toolsLayout=await page.evaluate(()=>{
        const el=id=>document.getElementById(id);
        const box=id=>{const r=el(id).getBoundingClientRect();
          return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
        return {help:box('battle-help-toggle'),auto:box('btn-auto'),
          retreat:box('btn-flee'),
          fontSize:getComputedStyle(el('battle-help-toggle')).fontSize,
          pseudo:getComputedStyle(el('battle-help-toggle'),'::before').content,
          helpName:el('battle-help-toggle').getAttribute('aria-label')};
      });
      assert.ok(toolsLayout.help.right<=toolsLayout.auto.left+1 &&
        toolsLayout.auto.right<=toolsLayout.retreat.left+1,
        'Combat help/Auto/Retreat labels overlap: '+JSON.stringify(toolsLayout));
      if(width<=520){
        assert.equal(toolsLayout.fontSize,'0px',
          'Compact Controls text must be icon-only below 521px: '+JSON.stringify(toolsLayout));
        assert.ok(toolsLayout.pseudo.includes('?')&&toolsLayout.helpName,
          'Help must show a ? icon and remain accessible: '+JSON.stringify(toolsLayout));
      }
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
      if(!touch){
        assert.ok(actionLayout.bar.height<=80,
          'Desktop CrazyGames skill dock is too tall: '+JSON.stringify(actionLayout));
        for(const button of actionLayout.buttons)
          assert.ok(button.button.width<=84&&button.button.height<=80,
            'Desktop CrazyGames skill card is too large: '+JSON.stringify(button));
      }
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
        await checkEnglish(page,'capture-result',width);
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
        assert.equal(await page.locator('#cg-yard-dock').isVisible(),false,
          'Garden-only navigation must disappear in the exploration map');
        assert.equal(await page.locator('#tabbar').isVisible(),false,
          'Garden tabs cannot cover the exploration map');
        assert.equal(await page.locator('#yard-actions').isVisible(),false,
          'Garden action buttons cannot cover the exploration map');
        const mapPanel=page.locator('#panel.open');
        if(await mapPanel.isVisible())await page.locator('#panel.open .panel-dismiss').click();
        await page.locator('#cg-top-tools #map-menu').waitFor({state:'visible',timeout:10000});
        assert.equal(await page.locator('#cg-top-tools #mw-game-settings').isVisible(),false,'Settings must be inside the menu');
        await checkEnglish(page,'world-map',width);
        const dir='.check/crazygames-yard-dock';
        fs.mkdirSync(dir,{recursive:true});
        await page.screenshot({path:dir+'/'+width+'x'+height+'-map.png'});
        await page.locator('#cg-top-tools #map-menu').click();
        await page.locator('#panel.open .explore-menu').waitFor({state:'visible',timeout:10000});
        const reset=page.locator('#panel.open #cb-menu-reset');
        await reset.waitFor({state:'visible',timeout:10000});
        assert.match(await reset.textContent(),/Reset game/i,
          'Both portal and main website menus must expose a subtle reset action');
        // First click only arms a safe restart; it must not erase game progress.
        const saveProgress=()=>page.evaluate(()=>{
          const book=JSON.parse(localStorage.getItem('catbond_save_slots_v1')||'{}');
          const slots={};
          for(const [id,record] of Object.entries(book.slots||{})){
            const snapshot=record.data||{};
            const state=JSON.parse(JSON.stringify(snapshot.state||snapshot));
            delete state.lastSeen;delete state.playTimeMs;
            slots[id]=state;
          }
          return slots;
        });
        const beforeReset=await saveProgress();
        assert.ok(Object.keys(beforeReset).length>0,'At least one real save slot must exist before emergency reset');
        await reset.click();
        assert.match(await reset.textContent(),/safe restart|keep all saves/i);
        assert.equal(await page.evaluate(()=>State.S.cats.length),2,
          'First reset click must not alter the current run');
        // The second deliberate click reloads transient game state but preserves all save slots.
        await page.evaluate(()=>localStorage.setItem('unrelated_game_qa_key','keep'));
        await reset.click();
        await page.locator('#intro-start').waitFor({state:'visible',timeout:20000});
        const afterReset=await saveProgress();
        const unrelated=await page.evaluate(()=>localStorage.getItem('unrelated_game_qa_key'));
        assert.deepEqual(afterReset,beforeReset,'Emergency reset must preserve all three save-slot progress snapshots');
        assert.equal(unrelated,'keep','Reset must preserve unrelated games');
        await page.evaluate(()=>localStorage.removeItem('unrelated_game_qa_key'));
      }
      assert.deepEqual(errors,[],'Uncaught runtime errors: '+errors.join(' | '));
      console.log('CAT BOND REAL INPUT PASS',width+'x'+height,
        touch?'touch':'mouse','first encounter -> combat'+(width===907?' -> first capture -> duo':''));
    }finally{await ctx.close();}
  }
}finally{await browser.close();}
