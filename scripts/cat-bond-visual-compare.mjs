// Normal-player visual comparison, not seeded saves or synthetic DOM.
// Run unchanged against the pinned baseline and the candidate local server.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const origin='http://127.0.0.1:8765',out=process.env.VISUAL_OUT||'artifacts/cat-bond-visual/after';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const rows=[];
try{
 for(const profile of [{name:'desktop',viewport:{width:1280,height:800}},{name:'portrait',viewport:{width:390,height:844},hasTouch:true,isMobile:true},{name:'landscape',viewport:{width:844,height:390},hasTouch:true,isMobile:true}]){
  for(const lang of ['en','zh']){
   const {name,...options}=profile,ctx=await browser.newContext(options),page=await ctx.newPage(),errors=[],shots=[];
   const tr=(en,zh)=>lang==='en'?en:zh;
   const button=(en,zh,scope=page)=>scope.getByRole('button',{name:tr(en,zh),exact:true,includeHidden:true});
   const scene=id=>page.waitForFunction(v=>window.CatBondResonance?.view()?.current?.id===v,id,{timeout:20000});
   const shot=async id=>{await page.evaluate(()=>document.fonts.ready);
    if(name==='portrait'&&['atlas','harbor-exploration'].includes(id)&&await page.locator('link[href*="rpg-warm-interface.css"]').count()){
     const header=await page.locator('.rw-world:not([hidden])>.rw-head').evaluate(el=>{
      const title=el.querySelector('.rw-brand strong'),brand=el.querySelector('.rw-brand'),r=el.getBoundingClientRect(),b=brand.getBoundingClientRect(),t=title.getBoundingClientRect();
      const line=parseFloat(getComputedStyle(title).lineHeight);
      return {wide:b.width>=r.width*.9,readable:t.height<=line*2+1,buttons:[...el.querySelectorAll(':scope>.rw-button')].every(btn=>{const p=btn.getBoundingClientRect();return p.width>=70&&p.left>=r.left-1&&p.right<=r.right+1&&p.top>=b.bottom-1;})};
     });assert.deepEqual(header,{wide:true,readable:true,buttons:true},'Portrait region title must use the full header, not wrap one letter at a time');
    }
    await page.screenshot({path:out+'/'+name+'-'+lang+'-'+id+'.png',animations:'disabled'});shots.push(id)};
   const dialogue=async id=>{
    const box=page.locator('.res-host[data-scene="'+id+'"]');await box.waitFor();
    let steps=0;
    while(await box.isVisible()&&await button('Continue','继续',box).isEnabled()){
     assert.ok(++steps<40,'Dialogue did not advance: '+id);
     await button('Continue','继续',box).click();
    }
    if(await box.isVisible()&&await button('Close','关闭',box).isVisible())await button('Close','关闭',box).click();
   };
   const candidate=()=>page.locator('link[href*="rpg-visual-polish.css"]').count();
   const checkTheme=async()=>{
    if(!await candidate())return;
    const result=await page.evaluate(()=>{
     const isVisible=e=>e&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0&&getComputedStyle(e).visibility!=='hidden';
     const tabs=[...document.querySelectorAll('#tabbar .tab,#yard-actions .fab')].filter(isVisible);
     const actions=[...document.querySelectorAll('#panel.open .btn:not(.ghost):not(:disabled)')].filter(isVisible);
     const invalidTabs=tabs.filter(e=>getComputedStyle(e).backgroundImage!=='none').map(e=>e.id||e.textContent);
     const invalidActions=actions.filter(e=>getComputedStyle(e).backgroundImage!=='none').map(e=>e.id||e.textContent);
     const card=document.querySelector('#panel.open:not([data-mandatory="true"]):not(.rb-open)>.card');
     const atlas=document.querySelector('.rw-world:not([hidden])');
     const panel=card&&atlas&&innerHeight<=530&&innerWidth>innerHeight?card.getBoundingClientRect():null;
     return {invalidTabs,invalidActions,panelHeight:panel?.height??null,scrolling:!!panel&&card.scrollHeight>card.clientHeight+2};
    });
    assert.deepEqual(result.invalidTabs,[],'Garden controls must not inherit legacy rainbow gradients');
    assert.deepEqual(result.invalidActions,[],'Primary action must not inherit the legacy pink/lilac gradient');
    if(result.scrolling)assert.ok(result.panelHeight>=180,'Landscape optional card needs a usable scroll viewport');
   };
   const closePanel=async()=>{await page.locator('#panel>.panel-dismiss').click();await page.locator('#panel.open').waitFor({state:'hidden'});};
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',route=>/^(data:|blob:)/.test(route.request().url())||route.request().url().startsWith(origin+'/')?route.continue():route.abort());
   try{
    await page.goto(origin+'/cat-bond/?lang='+lang);
    await page.waitForFunction(()=>window.WorldMap===window.CatBondCanonicalWorld&&window.CatBondResonance&&window.__game&&window.CatBondArtworkStatus?.breedsLoaded&&window.CatBondArtworkStatus?.jiafeiLoaded,null,{timeout:30000});
    assert.equal(await page.evaluate(()=>MorrowwishI18n.get()),lang);
    if(out.endsWith('/after')){
     const portraits=await page.evaluate(async()=>{
      const manifest=await fetch('/cat-bond/assets/cinematics/asset-manifest.json').then(r=>r.json());
      const assets=manifest.assets.filter(a=>a.kind==='character-portrait'&&a.dialogueRuntimeAllowed===true);
      return Promise.all(assets.map(async a=>{
       const response=await fetch('/cat-bond/'+a.path);if(!response.ok)throw Error('Portrait missing: '+a.path);
       const blob=await response.blob(),bitmap=await createImageBitmap(blob);
       const c=document.createElement('canvas');c.width=bitmap.width;c.height=bitmap.height;
       const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0);bitmap.close();
       const data=ctx.getImageData(0,0,c.width,c.height).data;
       let clear=0,opaque=0;for(let i=3;i<data.length;i+=4){if(data[i]===0)clear++;if(data[i]>240)opaque++;}
       return {id:a.id,size:blob.size,expectedBytes:a.bytes,dimensions:c.width+'x'+c.height,expectedDimensions:a.canvas,clear:clear/(c.width*c.height),opaque:opaque/(c.width*c.height),type:blob.type};
      }));
     });
     assert.equal(portraits.length,19,'Every new painted character portrait must be checked');
     assert.equal(new Set(portraits.map(p=>p.id)).size,19);
     for(const p of portraits){
      assert.equal(p.size,p.expectedBytes,'Stale or wrong portrait: '+p.id);
      assert.equal(p.dimensions,p.expectedDimensions,'Wrong portrait dimensions: '+p.id);
      assert.ok(p.clear>.05&&p.opaque>.15,'Missing transparent background or subject: '+p.id);
      assert.match(p.type,/image\/webp/);
     }
     await fs.writeFile(out+'/'+name+'-'+lang+'-portrait-assets.json',JSON.stringify(portraits,null,2));
    }
    await page.locator('#intro-start').waitFor();await shot('title');
    await page.locator('#intro-start').click();await page.locator('#intro-slot-list [data-slot="slot1"]').waitFor();await shot('slots');
    await page.locator('#intro-slot-list [data-slot="slot1"]').click();
    for(const id of ['prologue:P-01','prologue:P-02','prologue:P-03']){
     await scene(id);await page.waitForFunction(()=>document.querySelector('.cbcp-art')?.naturalWidth>0&&!document.querySelector('.cbcp-skip')?.disabled);
     await page.locator('.cbcp-art').first().evaluate(img=>img.decode());
     if(id==='prologue:P-01')await shot('opening');
     await page.locator('.cbcp-skip').click();
     if(out.endsWith('/after'))break;
    }
    await scene('prologue:P-04');const starter=page.locator('#panel .cat-starter-card .dex-cell').first();await starter.waitFor();await shot('starter');
    await starter.click();await button('Talk to Muling','与暮铃交谈',page.locator('.sg-prologue-guide')).click();
    const firstDialogue=page.locator('.res-host[data-scene="prologue:P-04"]');await firstDialogue.waitFor();
    await shot('player-dialogue');
    // Capture Muling's actual dialogue, not the player's first line.
    for(let i=0;i<12;i++){
     if(await firstDialogue.locator('.res-dialogue').getAttribute('data-speaker')==='muling')break;
     await button('Continue','继续',firstDialogue).click();
    }
    assert.equal(await firstDialogue.locator('.res-dialogue').getAttribute('data-speaker'),'muling');
    const mulingArt=firstDialogue.locator('img.res-portrait');
    await mulingArt.waitFor({state:'visible'});
    await mulingArt.evaluate(img=>img.decode());
    if(out.endsWith('/after'))assert.match(await mulingArt.getAttribute('src'),/traveler-(warm|neutral|dry|nervous|worried|determined)\.webp$/);
    await shot('muling-dialogue');
    await dialogue('prologue:P-04');
    const bell=page.locator('.res-garden-bell');await bell.waitFor();await checkTheme();await shot('garden');
    const rect=await bell.boundingBox(),x=Math.floor(rect.x+rect.width/2),y=Math.floor(rect.y+rect.height/3);
    if(options.hasTouch){
     const cdp=await ctx.newCDPSession(page);
     await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
     await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+62}]});
     await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
    }else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+62,{steps:8});await page.mouse.up();}
    await scene('prologue:P-05');await dialogue('prologue:P-05');
    await button('World map','前往世界地图',page.locator('.sg-prologue-guide')).click();await page.locator('.rw-surface').waitFor();await shot('atlas');
    const nav=page.locator('.rw-system-nav');
    const book=nav.getByRole('button',{name:tr('Resonance Book','星月之书'),exact:true,includeHidden:true});
    const reveal=async target=>{
      if(await target.isVisible())return;
      const world=page.locator('.rw-world:not([hidden])'),prev=world.locator('[data-fit-prev]'),next=world.locator('[data-fit-next]');
      const atlas=world.locator('.rw-atlas-menu:not([open]) > summary');if(await atlas.count()&&await target.evaluate(el=>!!el.closest('.rw-atlas-menu'))){await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-explore"]').click();};
      const drawer=world.locator('.rw-region-toggle[aria-expanded="false"]');if(await drawer.count()&&await target.evaluate(el=>!!el.closest('#rw-region-actions'))){await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-explore"]').click();};
      const count=Number(await world.getAttribute('data-fit-pages')||1);
      for(let i=0;i<count&&!await target.isVisible()&&await prev.isVisible()&&await prev.isEnabled();i++)await prev.click();
      for(let i=0;i<count&&!await target.isVisible()&&await next.isVisible()&&await next.isEnabled();i++)await next.click();
      await target.waitFor({state:'visible'});
    };
    for(const [en,zh,id,tab] of [['Catdex','猫咪图鉴','catdex','dex'],['Party','出战队伍','party','party'],['Raise cats','猫咪养成','cultivation','cats'],['Workshop','工坊','workshop','workshop']]){
     if(await book.count()){
      await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-book"]').click();await page.locator('[data-book-tab="'+tab+'"]').click();
      await page.locator('#panel.open.rb-open>.card').waitFor();await checkTheme();await shot(id);
      if(id==='cultivation'){await page.locator('[data-book-tab="duo"]').click();await shot('duo-bond');}
      await page.locator('#panel .rb-close').click();await page.locator('#panel.open').waitFor({state:'hidden'});
     }else{
      const legacy=button(en,zh,nav);await reveal(legacy);await legacy.click();await page.locator('#panel.open>.card').waitFor();await checkTheme();await shot(id);
      if(id==='cultivation'){await page.locator('#panel [data-cat-view="duo"]').click();await shot('duo-bond');}
      await closePanel();
     }
    }
    // The same normally created save can meet a wild cat in the first
    // available region. Do not seed an encounter, stats, or story evidence.
    const opened=page.locator('.rw-atlas-menu[open] > summary');if(await opened.count())await opened.click();
    const surface=page.locator('.rw-surface');await surface.scrollIntoViewIfNeeded();
    const mapRect=await surface.boundingBox();
    const mapX=mapRect.x+mapRect.width*.5,mapY=mapRect.y+mapRect.height*.18;
    if(options.hasTouch)await page.touchscreen.tap(mapX,mapY);
    else await page.mouse.click(mapX,mapY);
    await scene('harbor:H-01');
    await page.locator('.rw-world[data-region="harbor"] .rw-surface').waitFor();
    await shot('harbor-exploration');
    await reveal(button('Approach wild cat','接近野猫'));await button('Approach wild cat','接近野猫').click();
    await page.locator('#bp-go').waitFor({state:'visible',timeout:20000});
    await shot('battle-preparation');
    await page.locator('#bp-go').click();
    await page.locator('#battle-ui.on').waitFor();
    await page.waitForFunction(()=>window.__game?.battle?.regionalCombat?.region==='harbor');
    const skip=page.locator('#battle-tutorial-skip');
    if(await skip.isVisible())await skip.click();
    await page.locator('#battle-help').waitFor({state:'hidden'});
    await shot('battle-live');
    await page.waitForFunction(()=>window.__game?.scene==='map',null,{timeout:75000});
    const result=page.locator('#cr-ok,#battle-recovery-ok');
    await result.waitFor({state:'visible'});
    await checkTheme();await shot('battle-result');
    await result.click();
    assert.deepEqual(errors,[]);rows.push({name,lang,shots,ok:true});
   }catch(error){
    await shot('failure').catch(()=>{});rows.push({name,lang,shots,ok:false,error:String(error),pageErrors:errors});
    console.error(name,lang,error);
   }finally{await ctx.close();}
  }
 }
}finally{await browser.close();await fs.writeFile(out+'/results.json',JSON.stringify(rows,null,2));}
assert.ok(rows.length===6&&rows.every(r=>r.ok),'One or more actual UI routes failed; review screenshots and results.json');
