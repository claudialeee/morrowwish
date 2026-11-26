import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const origin=process.env.CAT_BOND_QA_ORIGIN||'http://127.0.0.1:8765';
const output=process.env.CAT_BOND_QA_OUTPUT||'cat-bond-title-save-qa';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
let failed=false;
for(const profile of [
 {name:'desktop',width:1280,height:800,mobile:false},
 {name:'phone-narrow',width:320,height:568,mobile:true},
 {name:'phone-portrait',width:390,height:844,mobile:true},
 {name:'phone-landscape-narrow',width:568,height:320,mobile:true},
 {name:'phone-landscape',width:844,height:390,mobile:true}
]){
 const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},isMobile:profile.mobile,hasTouch:profile.mobile});
 // When verifying a public deployment, fetch the actual public assets but
 // keep acceptance traffic out of the owner's real player analytics.
 if(new URL(origin).protocol==='https:')await context.route('**/api/session*',route=>route.fulfill({status:204,body:''}));
 const page=await context.newPage(),errors=[];
 await page.addInitScript(()=>{window.__titleQaTouchTrace=[];for(const type of ['touchstart','touchend','touchcancel','pointerdown','pointerup','pointercancel','click'])document.addEventListener(type,event=>{const el=event.target;const button=el?.closest?.('button,.dex-cell');const list=window.__titleQaTouchTrace;list.push({type,target:button?.textContent?.trim().slice(0,70)||el?.id||el?.tagName,pointer:event.pointerType||null,canceled:event.defaultPrevented});if(list.length>32)list.shift();},true);});
 page.on('pageerror',error=>errors.push(error.message));
 page.on('dialog',dialog=>{errors.push('Unexpected native browser dialog: '+dialog.message());void dialog.dismiss()});
 const screenshot=name=>page.screenshot({path:output+'/'+profile.name+'-'+name+'.png',animations:'disabled'});
 const checkVisible=async selector=>{await page.locator(selector).first().waitFor({state:'visible',timeout:15000});};
 const waitMap=()=>page.waitForFunction(()=>window.__game?.scene==='map',{timeout:15000});
 const openInGameSlots=async()=>{
  await page.locator('#map-menu').click();
  await page.locator('[data-system="page-saves"]').click();await page.locator('[data-system="slots"]').click();
  await checkVisible('.cb-slot-manager');
 };
 const openTitleSlots=async()=>{
  await page.locator('#cb-system-toggle').click();
  await page.locator('[data-system="page-saves"]').click();await page.locator('[data-system="slots"]').click();
  await checkVisible('.cb-slot-manager');
  assert.equal(await page.locator('.cb-slot-manager [data-slot-sync], [data-recovery-code], .cb-cloud-code-row').count(),0,'No manual cloud or recovery-code controls');
 };
 try{
  await page.goto(origin+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__CAT_BOND_READY__===true&&window.CatBondArtworkStatus?.breedsLoaded===true,{timeout:30000});
  const painting=await page.locator('.cb-title-landscape').evaluate(async element=>{
   const style=getComputedStyle(element);
   const match=style.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
   if(!match)throw Error('Missing opening painting: '+style.backgroundImage);
   const image=new Image();image.src=match[1];await image.decode();
   return {url:image.src,width:image.naturalWidth,height:image.naturalHeight,repeat:style.backgroundRepeat.split(',').at(-1).trim(),size:style.backgroundSize.split(',').at(-1).trim(),visible:element.getBoundingClientRect().height>0&&style.visibility==='visible'&&Number(style.opacity)>0};
  });
  assert.ok(painting.url.endsWith('/assets/garden/title-bell-sanctuary.webp'),'New opening painting for '+profile.name);
  assert.ok(painting.width>=1600&&painting.height>=900&&painting.visible,'Opening painting decodes at usable resolution');
  assert.equal(painting.repeat,'no-repeat','Opening painting never tiles');
  assert.equal(painting.size,'cover','Opening painting uses responsive framing');
  const bounds=await page.evaluate(()=>{const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON();return {stage:rect('#stage'),start:rect('#intro-start'),next:rect('#intro-continue')};});
  assert.ok(bounds.start.right<=bounds.next.left&&bounds.start.width>0&&bounds.next.width>0,'New and Continue remain side by side');
  for(const b of [bounds.start,bounds.next])assert.ok(b.left>=bounds.stage.left-1&&b.right<=bounds.stage.right+1&&b.top>=bounds.stage.top-1&&b.bottom<=bounds.stage.bottom+1,'Title actions stay in stage');
  await screenshot('title-zh');
  await page.locator('#cb-system-toggle').click();
  assert.equal(await page.locator('[data-system="cloud"]').count(),0);
  await page.locator('[data-system="page-settings"]').click();await page.locator('[data-system="language"]').click();
  await page.waitForFunction(()=>window.MorrowwishI18n?.get?.()==='en');
  await page.locator('[data-system="close"]').click();
  assert.match(await page.locator('#intro-start').innerText(),/New Adventure/);
  await screenshot('title-en');
  await page.locator('#cb-system-toggle').click();
  await page.locator('[data-system="page-settings"]').click();await page.locator('[data-system="fullscreen"]').click();
  await page.waitForFunction(()=>document.fullscreenElement?.id==='stage'||document.documentElement.classList.contains('mw-fs-active'));
  await screenshot('fullscreen-title');
  await page.locator('#cb-system-toggle').click();
  await page.locator('[data-system="page-settings"]').click();await page.locator('[data-system="fullscreen"]').click();
  await page.waitForFunction(()=>!document.fullscreenElement&&!document.documentElement.classList.contains('mw-fs-active'));
  await page.locator('#intro-start').click();
  await checkVisible('#intro-slot-panel.is-open');
  await checkVisible('#intro-slot-list [data-slot]');
  assert.equal(await page.locator('#intro-slot-list [data-slot]').count(),3);
  await page.locator('[data-slot-language]').click();
  await page.waitForFunction(()=>window.MorrowwishI18n?.get?.()==='zh');
  assert.match(await page.locator('#intro-slot-heading').innerText(),/存档位/);
  await screenshot('three-slots-zh');
  await page.locator('[data-slot-language]').click();
  await page.waitForFunction(()=>window.MorrowwishI18n?.get?.()==='en');
  assert.match(await page.locator('#intro-slot-heading').innerText(),/Choose a slot/);
  await screenshot('three-slots-en');
  await page.locator('#intro-slot-list [data-slot="slot1"]').click();
  await page.waitForFunction(()=>CatBondResonance.view().current?.id==='prologue:P-05');
  const intro=page.locator('#cb-player-first-intro');await intro.waitFor();
  assert.equal(await page.locator('.cbcp-root:not([hidden])').count(),0);
  await intro.getByRole('button',{name:'Skip introduction',exact:true}).click();
  assert.equal(await page.locator('#panel.open .cat-starter-card').count(),0,'No starter picker');
  const selectedBreed='jinjc';
  assert.equal(await page.evaluate(()=>State.S.cats[0].species),selectedBreed);
  assert.equal(await page.evaluate(()=>CatBondResonance.view().muling),'unmet');
  await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="yard-map"]').click();
  await waitMap();
  const atlasMenu=page.locator('.rw-atlas-menu > summary');
  assert.equal(await page.locator('.rw-system-nav').isVisible(),false,'Atlas controls start collapsed');
  {await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-explore"]').click();};
  await page.locator('.rw-system-nav').waitFor({state:'visible'});
  assert.equal(await page.locator('.rw-regions [data-region]').count(),6);
  assert.equal(await page.locator('.rw-region-status').count(),6);
  assert.match(await page.locator('.rw-current').innerText(),/Prologue|Chapter/);
  {await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-explore"]').click();};
  assert.equal(await page.locator('.rw-system-nav').isVisible(),true,'Explore opens idempotently');
  const mapBounds=await page.evaluate(()=>{const h=document.querySelector('.rw-world'),s=h.querySelector('.rw-surface');return {map:s.getBoundingClientRect().toJSON(),view:h.getBoundingClientRect().toJSON(),wide:h.classList.contains('rw-atlas-wide')};});
  assert.ok(mapBounds.map.left<=mapBounds.view.left+1&&mapBounds.map.right>=mapBounds.view.right-1&&mapBounds.map.top<=mapBounds.view.top+1&&mapBounds.map.bottom>=mapBounds.view.bottom-1,'Atlas covers the stage without bars');
  const realPress=async locator=>{
   if(!await locator.isVisible()&&await locator.evaluate(el=>!!el.closest('.rw-atlas-menu:not([open])'))){await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-explore"]').click();};
   if(!await locator.isVisible()){
    const world=page.locator(".rw-world:not([hidden])"),count=Number(await world.getAttribute("data-fit-pages")||1),next=world.locator("[data-fit-next]"),prev=world.locator("[data-fit-prev]");
    const press=async el=>profile.mobile?el.tap():el.click();
    for(let i=0;i<count&&await prev.isVisible()&&await prev.isEnabled()&&!await locator.isVisible();i++)await press(prev);
    for(let i=0;i<count&&await next.isVisible()&&await next.isEnabled()&&!await locator.isVisible();i++)await press(next);
   }
   await locator.scrollIntoViewIfNeeded();const hit=await locator.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));});
   assert.ok(hit,'Actual touch target must not be covered: '+await locator.innerText());if(profile.mobile)await locator.tap();else await locator.click();
  };
  const checkStageFit=async()=>{
   const fit=await page.evaluate(()=>{const stage=document.getElementById('stage').getBoundingClientRect(),w=document.querySelector('.rw-world:not([hidden])'),canvas=w.querySelector('.rw-surface').getBoundingClientRect(),rail=w.querySelector('.rw-fit-rail');return {inside:canvas.width>0&&canvas.height>0&&canvas.top<=stage.top+1&&canvas.bottom>=stage.bottom-1&&canvas.left<=stage.left+1&&canvas.right>=stage.right-1,aspect:Math.abs(canvas.width/canvas.height-16/9)<.03,scroll:getComputedStyle(w).overflow==='hidden',solo:!CatBondResonance.isMulingFollowing()&&!CatBondResonanceNPC.drawFollower};});
   assert.deepEqual(fit,{inside:true,aspect:true,scroll:true,solo:true},'Actual world frame fits after resize/fullscreen');
  };
  await checkStageFit();
  const backing=await page.locator('.rw-surface').evaluate(c=>({w:c.width,h:c.height,css:c.getBoundingClientRect().width,dpr:window.devicePixelRatio}));
  assert.ok(backing.w>=Math.min(2880,Math.max(960,backing.css*backing.dpr))-1,'Map backing resolution follows device pixels');
  assert.ok(Math.abs(backing.w/backing.h-16/9)<.01,'Logical map aspect ratio preserved');
  const system=async()=>{await realPress(page.locator('#map-menu'));};
  const toggleWorldFullscreen=async()=>{await system();await realPress(page.locator('[data-system="page-settings"]'));await realPress(page.locator('[data-system="fullscreen"]'));};
  for(const sel of ['#mw-fullscreen-toggle','#mw-game-settings','#guide-help'])assert.equal(await page.locator(sel).isVisible(),false,sel+' must be inside the RPG menu');
  await toggleWorldFullscreen();
  await page.waitForFunction(()=>document.fullscreenElement?.id==='stage'||document.documentElement.classList.contains('mw-fs-active'));
  await page.waitForTimeout(100);await checkStageFit();await screenshot('fullscreen-world-atlas');
  await toggleWorldFullscreen();
  await page.waitForFunction(()=>!document.fullscreenElement&&!document.documentElement.classList.contains('mw-fs-active'));
  await page.waitForTimeout(100);await checkStageFit();
  for(const name of ['Catdex','Party','Raise cats','Workshop']){
   await system();await realPress(page.locator('[data-system="world-book"]'));await page.locator('.rb-wallet').waitFor();assert.equal(await page.locator('#hud').isVisible(),false);
   const tabs={Catdex:'dex',Party:'party','Raise cats':'cats',Workshop:'workshop'};await realPress(page.locator('[data-book-tab="'+tabs[name]+'"]'));
   await checkVisible('#panel.open');
   await screenshot('atlas-'+name.toLowerCase().replaceAll(' ','-'));
   if(name==='Catdex'){
    const owned=page.locator('#panel .dex-cell:not(.locked)').first();await realPress(owned);
    await checkVisible('#panel #dx');await screenshot('atlas-catdex-detail');
    await realPress(page.locator('#dx-back'));await checkVisible('#panel .dex-grid');
   }
   await realPress(page.locator('.rb-close'));
   await page.locator('#panel.open').waitFor({state:'hidden',timeout:5000});
  }
  // Explore is now an idempotent open action; close via a real map pointer, below.
  await screenshot('world-atlas');
  // Physical departure from the merged canonical opening.
  const surface=page.locator('.rw-surface');await surface.waitFor();const atlas=await surface.boundingBox();await page.mouse.click(atlas.x+atlas.width*.5,atlas.y+atlas.height*.18);
  await page.waitForFunction(()=>CatBondResonance.view().current?.id==='harbor:H-01');
  const first=await page.evaluate(()=>window.State.getSaveSlot('slot1').data.state.cats[0].uid);
  assert.ok(first);
  await openInGameSlots();
  await page.locator('.cb-slot-manager [data-modal-language]').click();
  await page.waitForFunction(()=>window.MorrowwishI18n?.get?.()==='zh');
  assert.match(await page.locator('.cb-slot-manager h2').innerText(),/存档位/);
  await screenshot('in-game-save-manager-zh');
  await page.locator('.cb-slot-manager [data-modal-language]').click();
  await page.waitForFunction(()=>window.MorrowwishI18n?.get?.()==='en');
  await page.locator('[data-save="slot2"]').click();
  await page.waitForFunction(()=>!!window.State.getSaveSlot('slot2'));
  await screenshot('in-game-save-manager');
  await page.locator('[data-load="slot2"]').click();
  const confirmBox=await page.locator('.cb-confirm-dialog').boundingBox();assert.ok(confirmBox);const confirmViewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));assert.ok(Math.abs(confirmBox.x+confirmBox.width/2-confirmViewport.width/2)<3&&Math.abs(confirmBox.y+confirmBox.height/2-confirmViewport.height/2)<3,'Save confirmation is centered in viewport');await page.locator('.cb-confirm-dialog [data-confirm-accept]').click();
  await page.waitForFunction(()=>window.__CAT_BOND_STARTED__===true&&window.State.activeSlot()==='slot2',{timeout:30000});
  await waitMap();
  assert.equal(await page.evaluate(()=>window.State.S.cats[0].uid),first);
  assert.equal(await page.evaluate(()=>window.State.S.cats[0].species),selectedBreed);
  // A real title-menu navigation, not a special test entry.
  await page.locator('#map-menu').click();
  await page.locator('[data-system="page-saves"]').click();await page.locator('[data-system="title"]').click();
  await page.locator('.cb-confirm-dialog [data-confirm-accept]').click();
  await page.waitForFunction(()=>window.__CAT_BOND_READY__===true&&!window.__CAT_BOND_STARTED__,{timeout:30000});
  // Start the third slot through the actual title picker, preserving the two earlier adventures.
  await page.locator('#intro-start').click();
  await page.locator('#intro-slot-list [data-slot="slot3"]').click();
  await page.waitForFunction(()=>window.__CAT_BOND_STARTED__===true&&window.State.activeSlot()==='slot3');
  await checkVisible('#cb-player-first-intro');
  assert.equal(await page.evaluate(()=>State.activeSlot()),'slot3');
  assert.equal(await page.evaluate(()=>State.S.cats[0].species),'jinjc');assert.equal(await page.evaluate(()=>State.S.cats.length),1);
  await page.reload();await page.waitForFunction(()=>window.__CAT_BOND_READY__===true&&!window.__CAT_BOND_STARTED__);
  await page.locator('#intro-continue').click();
  await page.locator('[data-title-delete="slot1"]').click();
  await page.locator('.cb-confirm-dialog [data-confirm-cancel]').click();
  assert.ok(await page.evaluate(()=>State.getSaveSlot('slot1')),'Cancel must retain the original save');
  await page.locator('[data-title-delete="slot1"]').click();
  await page.locator('.cb-confirm-dialog [data-confirm-accept]').click();
  await page.waitForFunction(()=>window.State.getSaveSlot('slot1')===null);
  assert.equal(await page.evaluate(()=>window.State.getSaveSlot('slot2').data.state.cats[0].uid),first);
  assert.equal(await page.evaluate(()=>window.State.getSaveSlot('slot3').data.state.cats.length),1);
  assert.equal(await page.locator('[data-title-delete="slot1"]').count(),0);
  await screenshot('title-after-delete');
  assert.deepEqual(errors,[],'no page runtime exceptions');
  console.log('PASS title/save normal flow '+profile.name);
 }catch(error){
  failed=true;console.error('FAIL '+profile.name,error);console.error('Recent actual input',await page.evaluate(()=>window.__titleQaTouchTrace).catch(()=>[]));
  await screenshot('failure').catch(()=>{});
 }finally{await context.close();}
}
await browser.close();
if(failed)process.exitCode=1;
