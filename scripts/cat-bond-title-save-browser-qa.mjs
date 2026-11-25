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
 {name:'phone-portrait',width:390,height:844,mobile:true},
 {name:'phone-landscape',width:844,height:390,mobile:true}
]){
 const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},isMobile:profile.mobile,hasTouch:profile.mobile});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('dialog',dialog=>dialog.accept());
 const screenshot=name=>page.screenshot({path:output+'/'+profile.name+'-'+name+'.png',animations:'disabled'});
 const checkVisible=async selector=>{await page.locator(selector).first().waitFor({state:'visible',timeout:15000});};
 const waitMap=()=>page.waitForFunction(()=>window.__game?.scene==='map',{timeout:15000});
 const openInGameSlots=async()=>{
  await page.locator('#map-menu').click();
  await page.locator('[data-system="slots"]').click();
  await checkVisible('.cb-slot-manager');
 };
 const openTitleSlots=async()=>{
  await page.locator('#cb-system-toggle').click();
  await page.locator('[data-system="slots"]').click();
  await checkVisible('.cb-slot-manager');
  assert.equal(await page.locator('.cb-slot-manager [data-slot-sync], [data-recovery-code], .cb-cloud-code-row').count(),0,'No manual cloud or recovery-code controls');
 };
 try{
  await page.goto(origin+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__CAT_BOND_READY__===true&&window.CatBondArtworkStatus?.breedsLoaded===true,{timeout:30000});
  const titleImage=await page.evaluate(async()=>{
   const background=getComputedStyle(document.querySelector('.cb-title-landscape')).backgroundImage;
   const image=new Image();image.src='assets/resonance-world-v2/atlas.webp';await image.decode();
   const harbor=new Image();harbor.src='assets/resonance-world-v2/harbor-mist.webp';await harbor.decode();
   const alternate=getComputedStyle(document.querySelector('.cb-title-landscape'),'::after').backgroundImage;
   return {background,width:image.naturalWidth,height:image.naturalHeight,alternate,harborWidth:harbor.naturalWidth,harborHeight:harbor.naturalHeight,repeat:getComputedStyle(document.querySelector('.cb-title-landscape')).backgroundRepeat,size:getComputedStyle(document.querySelector('.cb-title-landscape')).backgroundSize,alternateRepeat:getComputedStyle(document.querySelector('.cb-title-landscape'),'::after').backgroundRepeat};
  });
  assert.match(titleImage.background,/atlas\.webp/);
  assert.match(titleImage.alternate,/harbor-mist\.webp/);
  assert.ok(titleImage.repeat.split(',').every(v=>v.trim()==='no-repeat')&&titleImage.alternateRepeat.split(',').every(v=>v.trim()==='no-repeat'),'Title artwork never tiles');
  assert.ok(titleImage.size.split(',').every(v=>v.trim()==='cover'),'Title artwork fills each viewport');
  assert.ok(titleImage.harborWidth>=960&&titleImage.harborHeight>=540,'Alternate painted title background loads at usable resolution');
  assert.ok(titleImage.width>=960&&titleImage.height>=540,'Painted title background loads at usable resolution');
  const bounds=await page.evaluate(()=>{const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON();return {stage:rect('#stage'),start:rect('#intro-start'),next:rect('#intro-continue')};});
  assert.ok(bounds.start.right<=bounds.next.left&&bounds.start.width>0&&bounds.next.width>0,'New and Continue remain side by side');
  for(const b of [bounds.start,bounds.next])assert.ok(b.left>=bounds.stage.left-1&&b.right<=bounds.stage.right+1&&b.top>=bounds.stage.top-1&&b.bottom<=bounds.stage.bottom+1,'Title actions stay in stage');
  await screenshot('title-zh');
  await page.locator('#cb-system-toggle').click();
  assert.equal(await page.locator('[data-system="cloud"]').count(),0);
  await page.locator('[data-system="language"]').click();
  await page.waitForFunction(()=>window.MorrowwishI18n?.get?.()==='en');
  await page.locator('[data-system="close"]').click();
  assert.match(await page.locator('#intro-start').innerText(),/New Adventure/);
  await screenshot('title-en');
  await page.locator('#mw-fullscreen-toggle').click();
  await page.waitForFunction(()=>document.fullscreenElement?.id==='stage'||document.documentElement.classList.contains('mw-fs-active'));
  await screenshot('fullscreen-title');
  await page.locator('#mw-fullscreen-toggle').click();
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
  for(const n of [1,2,3]){
   await page.waitForFunction(n=>CatBondResonance.view().current?.id==='prologue:P-0'+n&&document.querySelector('.cbcp-art')?.naturalWidth>0&&document.querySelector('.cbcp-skip')&&!document.querySelector('.cbcp-skip').disabled,n);
   await page.locator('.cbcp-skip').click();
  }
  await checkVisible('#panel.open .dex-cell');await page.locator('#panel.open .dex-cell').first().click();
  await page.locator('#sg-book-entry').click();
  await checkVisible('#panel.rb-open.open');
  await page.locator('[data-book-tab="workshop"]').click();
  const quick=page.locator('#work-quick-start');
  if(await quick.isVisible())await quick.click();
  const collect=page.locator('[data-act="collect"][data-id="st_sun"]').last();
  if(await collect.isEnabled()){
   const wallet=await page.evaluate(()=>State.S.coins);
   await collect.click();
   assert.ok(await page.evaluate(()=>State.S.coins)>wallet,'Actual workshop resource payout');
  }
  await page.locator('[data-book-tab="daily"]').click();
  if(await page.locator('#claim').isEnabled())await page.locator('#claim').click();
  assert.equal(await page.locator('#claim').isEnabled(),false,'Daily reward cannot be collected twice');
  await page.locator('.rb-close').click();
  await screenshot('garden-book-dock');
  await page.locator('.sg-prologue-guide').getByRole('button',{name:'Talk to Muling'}).click();
  const awakening=page.locator('.res-host[data-scene="prologue:P-04"]');await awakening.getByRole('button',{name:'Skip dialogue',exact:true}).click();
  const bell=page.locator('.res-garden-bell');await bell.waitFor();
  const rect=await bell.boundingBox();const x=Math.floor(rect.x+rect.width/2),y=Math.floor(rect.y+rect.height/3);
  if(profile.mobile){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+62}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
  else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+62,{steps:8});await page.mouse.up();}
  for(const id of ['prologue:P-05']){const dlg=page.locator('.res-host[data-scene="'+id+'"]');await dlg.waitFor();const skip=dlg.getByRole('button',{name:'Skip dialogue',exact:true});if(await skip.isVisible()&&await skip.isEnabled())await skip.click();const close=dlg.getByRole('button',{name:'Close',exact:true});if(await close.isVisible())await close.click();}
  await page.locator('.sg-prologue-guide').getByRole('button',{name:'World map'}).click();
  await waitMap();
  await page.locator('.rw-system-nav').waitFor();
  assert.equal(await page.locator('.rw-regions [data-region]').count(),6);
  assert.equal(await page.locator('.rw-region-status').count(),6);
  assert.match(await page.locator('.rw-current').innerText(),/Prologue|Chapter/);
  const mapBounds=await page.evaluate(()=>{const h=document.querySelector('.rw-world'),s=h.querySelector('.rw-surface');return {map:s.getBoundingClientRect().toJSON(),view:h.getBoundingClientRect().toJSON(),wide:h.classList.contains('rw-atlas-wide')};});
  if(profile.name!=='phone-portrait'){assert.ok(mapBounds.wide,'Wide atlas uses independent quest rail');assert.ok(mapBounds.map.bottom<=mapBounds.view.bottom+1&&mapBounds.map.top>=mapBounds.view.top-1,'Complete atlas painting is visible without scrolling');assert.ok(mapBounds.map.right<=mapBounds.view.right+1,'Atlas must not overflow horizontally');}
  assert.equal(await page.locator('.rw-system-nav button').count(),2,'Atlas exposes only Book and Journal');
  const book=page.locator('.rw-system-nav .rb-world-entry');
  await book.click();await checkVisible('#panel.rb-open.open');
  for(const tab of ['dex','party','cats','workshop','duo','bag','shop','daily','records']){
   await page.locator('[data-book-tab="'+tab+'"]').click();
   await checkVisible('#panel.rb-open.open');
   assert.equal(await page.locator('[data-book-tab][aria-current="page"]').getAttribute('data-book-tab'),tab);
   if(['dex','party','cats','workshop','bag'].includes(tab))await screenshot('book-'+tab);
  }
  await page.locator('[data-book-tab="daily"]').click();
  if(await page.locator('#claim').isEnabled())await page.locator('#claim').click();
  await page.locator('[data-book-tab="cats"]').click();
  const before=await page.evaluate(()=>({uid:State.S.cats[0].uid,level:State.S.cats[0].level,power:State.catPower(State.S.cats[0]),fish:State.S.fish}));
  await page.locator('#panel [data-breed]').first().click();
  await page.locator('#cd-trainnext').click();
  const after=await page.evaluate(()=>({uid:State.S.cats[0].uid,level:State.S.cats[0].level,power:State.catPower(State.S.cats[0]),fish:State.S.fish}));
  assert.equal(after.uid,before.uid);assert.equal(after.level,before.level+1);assert.ok(after.power>before.power&&after.fish<before.fish,'Real training updates native cat power');
  await page.locator('[data-book-tab="party"]').click();
  await page.locator('#map-squad-best').click();await page.locator('#map-squad-save').click();
  assert.ok(await page.evaluate(()=>State.S.battlePrefs.teamUids.includes(State.S.cats[0].uid)));
  await book.click();
  await page.locator('[data-book-tab="bag"]').click();
  await page.locator('#map-menu').click();
  await page.locator('[data-system="language"]').click();
  await page.waitForFunction(()=>window.MorrowwishI18n?.get?.()==='zh');
  await page.locator('[data-system="close"]').click();
  assert.match(await page.locator('.rb-brand strong').innerText(),/星铃之书/);
  await screenshot('book-zh');
  await page.locator('#map-menu').click();
  await page.locator('[data-system="language"]').click();
  await page.waitForFunction(()=>window.MorrowwishI18n?.get?.()==='en');
  await page.locator('[data-system="close"]').click();
  assert.match(await page.locator('.rb-brand strong').innerText(),/Resonance Book/);
  const inv=await page.evaluate(()=>({coins:State.S.coins,fish:State.S.fish,medkits:State.S.medkits}));
  const field=page.locator('[data-book-recipe="field-kit"]');
  assert.ok(await field.isEnabled(),'New save has material for a field kit after daily reward');
  await field.click();
  assert.deepEqual(await page.evaluate(()=>({coins:State.S.coins,fish:State.S.fish,medkits:State.S.medkits})),{coins:inv.coins-18,fish:inv.fish-1,medkits:inv.medkits+1});
  assert.ok(await page.locator('[data-book-recipe="harbor-kit"]').isDisabled());
  await page.locator('.rb-close').click();
  await page.locator('#panel.open').waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>window.__game.scene),'map');
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
  await page.waitForFunction(()=>window.__CAT_BOND_STARTED__===true&&window.State.activeSlot()==='slot2',{timeout:30000});
  await waitMap();
  assert.equal(await page.evaluate(()=>window.State.S.cats[0].uid),first);
  // A real title-menu navigation, not a special test entry.
  await page.locator('#map-menu').click();
  await page.locator('[data-system="title"]').click();
  await page.waitForFunction(()=>window.__CAT_BOND_READY__===true&&!window.__CAT_BOND_STARTED__,{timeout:30000});
  // Start the third slot through the actual title picker, preserving the two earlier adventures.
  await page.locator('#intro-start').click();
  await page.locator('#intro-slot-list [data-slot="slot3"]').click();
  await page.waitForFunction(()=>window.__CAT_BOND_STARTED__===true&&window.State.activeSlot()==='slot3');
  await checkVisible('#cb-canonical-opening');
  assert.equal(await page.evaluate(()=>State.activeSlot()),'slot3');
  assert.equal(await page.evaluate(()=>State.S.cats.length),0);
  await page.reload();await page.waitForFunction(()=>window.__CAT_BOND_READY__===true&&!window.__CAT_BOND_STARTED__);
  await page.locator('#intro-continue').click();
  await page.locator('[data-title-delete="slot1"]').click();
  await page.waitForFunction(()=>window.State.getSaveSlot('slot1')===null);
  assert.equal(await page.evaluate(()=>window.State.getSaveSlot('slot2').data.state.cats[0].uid),first);
  assert.equal(await page.evaluate(()=>window.State.getSaveSlot('slot3').data.state.cats.length),0);
  assert.equal(await page.locator('[data-title-delete="slot1"]').count(),0);
  await screenshot('title-after-delete');
  assert.deepEqual(errors,[],'no page runtime exceptions');
  console.log('PASS title/save normal flow '+profile.name);
 }catch(error){
  failed=true;console.error('FAIL '+profile.name,error);
  await screenshot('failure').catch(()=>{});
 }finally{await context.close();}
}
await browser.close();
if(failed)process.exitCode=1;
