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
 {name:'phone-landscape',width:844,height:390,mobile:true},
 {name:'compact-phone',width:320,height:568,mobile:true},
 {name:'portal-phone',width:390,height:844,mobile:true,portal:true}
]){
 const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},isMobile:profile.mobile,hasTouch:profile.mobile});
 const page=await context.newPage(),errors=[];
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
  await page.goto(origin+'/cat-bond/?lang=zh'+(profile.portal?'&utm_source=crazygames&utm_medium=portal':''),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__CAT_BOND_READY__===true&&window.CatBondArtworkStatus?.breedsLoaded===true,{timeout:30000});
  const titleImage=await page.locator('.cb-title-landscape').evaluate(async el=>{const style=getComputedStyle(el),match=style.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/);if(!match)throw Error('No title painting');const image=new Image();image.src=match[1];await image.decode();return {url:image.src,width:image.naturalWidth,height:image.naturalHeight,repeat:style.backgroundRepeat,size:style.backgroundSize,visible:el.getBoundingClientRect().height>0&&style.visibility==='visible'&&Number(style.opacity)>0,alternate:getComputedStyle(el,'::after').content};});
  assert.match(titleImage.url,/title-bell-sanctuary\.webp$/);
  assert.ok(titleImage.width>=1600&&titleImage.height>=900&&titleImage.visible,'New painted title loads at usable resolution');
  assert.equal(titleImage.repeat,'no-repeat');
  assert.equal(titleImage.size,'cover');
  assert.equal(titleImage.alternate,'none','No legacy crossfade over new title');
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
  if(profile.portal){assert.equal(await page.locator('#mw-fullscreen-toggle').isVisible(),false,'Portal owns fullscreen')}
  else{await page.locator('#cb-system-toggle').click();await page.locator('[data-system="page-settings"]').click();await page.locator('[data-system="fullscreen"]').click();
  await page.waitForFunction(()=>document.fullscreenElement?.id==='stage'||document.documentElement.classList.contains('mw-fs-active'));
  await screenshot('fullscreen-title');
  await page.locator('#cb-system-toggle').click();await page.locator('[data-system="page-settings"]').click();await page.locator('[data-system="fullscreen"]').click();
  await page.waitForFunction(()=>!document.fullscreenElement&&!document.documentElement.classList.contains('mw-fs-active'));}
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
  await page.waitForFunction(()=>CatBondResonance.view().current?.id==='prologue:P-01'&&document.querySelector('.cbcp-art')?.naturalWidth>0&&!document.querySelector('.cbcp-skip')?.disabled);
  await page.locator('.cbcp-skip').click();
  await page.waitForFunction(()=>CatBondResonance.view().current?.id==='prologue:P-04');
  await checkVisible('#panel.open .dex-cell');await page.locator('#panel.open .dex-cell').first().click();
  assert.equal(await page.locator('#tabbar').isVisible(),false,'Legacy management tabs are replaced by Book');
  assert.equal(await page.locator('#fab-build').isVisible(),false,'Building belongs to garden facilities');
  const dock=await page.evaluate(()=>[...document.querySelectorAll('#yard-actions button')].filter(b=>b.getClientRects().length&&getComputedStyle(b).display!=='none').map(b=>{const q=b.getBoundingClientRect();return {id:b.id,left:q.left,right:q.right,top:q.top,bottom:q.bottom,hit:b.contains(document.elementFromPoint(q.x+q.width/2,q.y+q.height/2))}}));
  assert.equal(dock.length,0,'All garden dock actions are consolidated');
  await page.locator('#map-menu').click();
  const systemMenu=page.locator('#cb-system-menu');
  for(const id of ['yard-map','yard-book','page-garden','page-settings','page-saves'])assert.ok(await systemMenu.locator('[data-system="'+id+'"]').isVisible(),'Missing menu entry '+id);await systemMenu.locator('[data-system="page-garden"]').click();for(const id of ['yard-build','yard-seek','yard-play','yard-feed'])assert.ok(await systemMenu.locator('[data-system="'+id+'"]').isVisible(),'Missing garden menu entry '+id);await systemMenu.locator('[data-system="page-back"]').click();
  await systemMenu.locator('[data-system="yard-book"]').click();
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
  const recall=page.locator('[data-act="unassign"][data-id="st_sun"]');
  if(await recall.isVisible()){
   await recall.click();
   assert.equal(await page.evaluate(()=>Raising.stationsView().find(st=>st.id==='st_sun').assignedUid),null);
  }
  await page.locator('[data-book-tab="daily"]').click();
  if(await page.locator('#claim').isEnabled())await page.locator('#claim').click();
  assert.equal(await page.locator('#claim').isEnabled(),false,'Daily reward cannot be collected twice');
  await page.locator('.rb-close').click();
  const gardenFit=await page.evaluate(()=>{const g=__game,f=World.gardenArtworkRect(g.W,g.H),within=o=>o.x>=f.x&&o.x<=f.x+f.width&&o.y>=f.y&&o.y<=f.y+f.height;return {bushes:g.yard.bushes.every(within),cats:g.yard.entities.every(within),ratio:f.width/f.height};});
  assert.ok(gardenFit.bushes&&gardenFit.cats,'All interactive scenery belongs to the contained original painting: '+JSON.stringify(gardenFit));
  await screenshot('garden-book-dock');
  for(const [label,tab] of [['Party','party'],['Catdex','dex']]){
   await page.locator('.sg-prologue-guide').getByRole('button',{name:'Explore '+label,exact:true}).click();
   assert.equal(await page.locator('[data-book-tab][aria-current="page"]').getAttribute('data-book-tab'),tab);
   await page.locator('.rb-close').click();
  }
  assert.deepEqual((await page.evaluate(()=>State.S.sunlitGarden.bookGuide)).sort(),['cats','dex','party','workshop']);
  await screenshot('garden-guide-complete');
  // A normal new save has earned its own coins through production and Daily.
  // No injected resources, buildings, story progress or simulated clicks.
  let relocated=null,relocatedDecor=null;
  const openFacilities=async()=>{await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="page-garden"]').click();await page.locator('#cb-system-menu [data-system="yard-build"]').click();await checkVisible('#panel.open [data-build="scratcher"]')};
  const chooseSpot=async moving=>{
   const spot=await page.evaluate(moving=>{
    const g=window.__game,cv=document.querySelector('#scene'),r=cv.getBoundingClientRect(),old=g.yard.placement?.relocating;
    for(let y=Math.min(g.H*.50,g.H-96)+8;y<=g.H-58;y+=10)for(let x=45;x<=g.W-45;x+=12){
     if(moving&&(!old||Math.hypot(old.x-x,old.y-y)<70))continue;
     if(!g.yard.buildingSpotValid(x,y,moving?old:null))continue;
     const px=r.x+x*r.width/g.W,py=r.y+y*r.height/g.H;
     if(document.elementFromPoint(px,py)===cv)return {x:px,y:py};
    }return null;
   },moving);
   assert.ok(spot,'A legal, unobstructed garden location must exist');
   if(profile.mobile)await page.touchscreen.tap(spot.x,spot.y);else await page.mouse.click(spot.x,spot.y);
   await page.waitForFunction(()=>!window.__game.yard.placement);
  };
  await openFacilities();await page.locator('[data-garden-decor]').click();
  for(const id of ['moonflower-planter','garden-lantern']){
   const btn=page.locator('[data-build="'+id+'"]');assert.ok(await btn.isEnabled(),'Normal earned resources pay for decoration');
   const art=btn.locator('..').locator('img');await art.waitFor();
   await art.evaluate(im=>im.decode());assert.ok(await art.evaluate(im=>im.naturalWidth===160&&im.naturalHeight===200));
   const before=await page.evaluate(()=>({coins:State.S.coins,buildings:State.S.yardBuildings.length,progress:State.S.resonance.completed.slice(),count:World.gardenDecorations().length}));
   await btn.click();await chooseSpot(false);
   const actual=await page.evaluate(id=>({coins:State.S.coins,buildings:State.S.yardBuildings.length,progress:State.S.resonance.completed.slice(),count:World.gardenDecorations().length,type:World.gardenDecorations().at(-1).type,cost:World.BUILDINGS_BY_ID[id].cost}),id);
   assert.equal(actual.coins,before.coins-actual.cost);assert.equal(actual.count,before.count+1);assert.equal(actual.type,id);assert.equal(actual.buildings,before.buildings);assert.deepEqual(actual.progress,before.progress);
   await screenshot('garden-decor-'+id);
   await openFacilities();await page.locator('[data-garden-decor]').click();
  }
  await screenshot('garden-decor-catalogue');
  const oldDecor=await page.evaluate(()=>({coins:State.S.coins,...World.gardenDecorations()[0]}));
  await page.locator('[data-decor-move="0"]').click();await chooseSpot(true);
  const newDecor=await page.evaluate(()=>({coins:State.S.coins,...World.gardenDecorations()[0]}));
  assert.equal(newDecor.coins,oldDecor.coins);assert.equal(newDecor.type,oldDecor.type);assert.ok(Math.hypot(newDecor.x-oldDecor.x,newDecor.y-oldDecor.y)>60);
  await openFacilities();await page.locator('[data-garden-decor]').click();
  const beforeRemove=await page.evaluate(()=>State.S.coins);
  await page.locator('[data-decor-remove="1"]').click();
  assert.equal(await page.evaluate(()=>State.S.coins),beforeRemove+9);assert.equal(await page.evaluate(()=>World.gardenDecorations().length),1);
  relocatedDecor={type:newDecor.type,u:newDecor.gardenU,v:newDecor.gardenV};
  await page.locator('#panel.open > .panel-dismiss').click();
  await screenshot('garden-decor-arranged');
  if(profile.name==='desktop'){
   await openFacilities();
   const beforeBuild=await page.evaluate(()=>({coins:State.S.coins,count:State.S.yardBuildings.length}));
   assert.ok(await page.locator('[data-build="scratcher"]').isEnabled(),'Earned coins cover the original scratcher cost');
   await page.locator('[data-build="scratcher"]').click();
   await chooseSpot(false);
   const built=await page.evaluate(()=>({coins:State.S.coins,count:State.S.yardBuildings.length,facility:{...State.S.yardBuildings[0]},cost:World.BUILDINGS_BY_ID.scratcher.cost}));
   assert.equal(built.count,beforeBuild.count+1);
   assert.equal(built.coins,beforeBuild.coins-built.cost);
   await page.waitForFunction(()=>{const b=State.S.yardBuildings[0];return __game.yard.entities.some(e=>e._playBuilding===b&&e._playBuildT>0)},null,{timeout:30000});
   await screenshot('garden-facility-play');
   await openFacilities();
   for(let attempt=0;attempt<3;attempt++){
    await page.waitForFunction(()=>{const y=__game.yard,b=State.S.yardBuildings[0];return !y._duoFacility&&!y.entities.some(e=>e._playBuilding===b||e._buildTarget===b)},null,{timeout:30000});
    await page.locator('[data-relocate="0"]').click();
    if(await page.locator('#yard-placement-dock').isVisible())break;
   }
   await checkVisible('#yard-placement-dock');
   const beforeMove=await page.evaluate(()=>({coins:State.S.coins,facility:{...State.S.yardBuildings[0]}}));
   await chooseSpot(true);
   const afterMove=await page.evaluate(()=>({coins:State.S.coins,facility:{...State.S.yardBuildings[0]}}));
   assert.equal(afterMove.coins,beforeMove.coins,'Relocating a facility costs nothing');
   for(const key of ['type','level','lastRewardAt','lastVisitorUid','lastBondAt','upgradeSpend'])assert.equal(afterMove.facility[key],beforeMove.facility[key],key+' survives relocation');
   assert.ok(Math.hypot(afterMove.facility.x-beforeMove.facility.x,afterMove.facility.y-beforeMove.facility.y)>70,'Real canvas move changes location');
   relocated={u:afterMove.facility.gardenU,v:afterMove.facility.gardenV,level:afterMove.facility.level};
   await screenshot('garden-facility-relocated');
  }
  await page.locator('.sg-prologue-guide').getByRole('button',{name:'Talk to Muling'}).click();
  const awakening=page.locator('.res-host[data-scene="prologue:P-04"]');await awakening.getByRole('button',{name:'Skip dialogue',exact:true}).click();
  const bell=page.locator('.res-garden-bell');await bell.waitFor();
  const rect=await bell.boundingBox();const x=Math.floor(rect.x+rect.width/2),y=Math.floor(rect.y+rect.height/3);
  if(profile.mobile){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+62}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
  else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+62,{steps:8});await page.mouse.up();}
  for(const id of ['prologue:P-05']){const dlg=page.locator('.res-host[data-scene="'+id+'"]');await dlg.waitFor();const skip=dlg.getByRole('button',{name:'Skip dialogue',exact:true});if(await skip.isVisible()&&await skip.isEnabled())await skip.click();const close=dlg.getByRole('button',{name:'Close',exact:true});if(await close.isVisible())await close.click();}
  await page.locator('.sg-prologue-guide').getByRole('button',{name:'World map'}).click();
  await waitMap();
  await page.locator('.rw-system-nav').waitFor({state:'attached'});
  assert.equal(await page.locator('.rw-regions [data-region]').count(),6);
  assert.equal(await page.locator('.rw-region-status').count(),6);
  const questSummary=page.locator('.rw-atlas-menu > summary');
  if(!(await page.locator('.rw-atlas-menu').evaluate(el=>el.open))){await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-explore"]').click();}
  await checkVisible('.rw-current');
  assert.match(await page.locator('.rw-current').innerText(),/Prologue|Chapter/);
  const mapBounds=await page.evaluate(()=>{const h=document.querySelector('.rw-world'),s=h.querySelector('.rw-surface');return {map:s.getBoundingClientRect().toJSON(),view:h.getBoundingClientRect().toJSON(),wide:h.classList.contains('rw-atlas-wide')};});
  assert.ok(mapBounds.map.left<=mapBounds.view.left+1&&mapBounds.map.right>=mapBounds.view.right-1&&mapBounds.map.top<=mapBounds.view.top+1&&mapBounds.map.bottom>=mapBounds.view.bottom-1,'Atlas artwork covers the entire viewport without bars');
  assert.equal(await page.locator('.rw-system-nav button').count(),2,'Atlas exposes only Book and Journal');
  const book=page.locator('.rw-system-nav .rb-world-entry');
  const revealBook=async()=>{await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-book"]').click();await page.locator('.rb-wallet').waitFor();assert.equal(await page.locator('#hud').isVisible(),false,'Wallet only appears in the companion book');};
  await revealBook();await checkVisible('#panel.rb-open.open');
  assert.equal(await page.locator('.rw-world').evaluate(el=>el.inert),true,'Book blocks underlying keyboard and pointer exploration');
  if(profile.width<=360)assert.equal(await page.locator('.rb-tabs').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),3,'Compact category labels receive full word width');
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
  await revealBook();
  await page.locator('[data-book-tab="bag"]').click();
  await page.locator('#map-menu').click();
  await page.locator('[data-system="page-settings"]').click();await page.locator('[data-system="language"]').click();
  await page.waitForFunction(()=>window.MorrowwishI18n?.get?.()==='zh');
  await page.locator('[data-system="close"]').click();
  assert.match(await page.locator('.rb-brand strong').innerText(),/星月之书/);
  await screenshot('book-zh');
  await page.locator('#map-menu').click();
  await page.locator('[data-system="page-settings"]').click();await page.locator('[data-system="language"]').click();
  await page.waitForFunction(()=>window.MorrowwishI18n?.get?.()==='en');
  await page.locator('[data-system="close"]').click();
  assert.match(await page.locator('.rb-brand strong').innerText(),/Resonance Book/);
  assert.ok(await page.locator('[data-book-heal]').count()>0,'Individual party recovery retained');
  const inv=await page.evaluate(()=>({coins:State.S.coins,fish:State.S.fish,medkits:State.S.medkits}));
  const field=page.locator('[data-book-recipe="field-kit"]');
  assert.ok(await field.isEnabled(),'New save has material for a field kit after daily reward');
  await field.click();
  assert.deepEqual(await page.evaluate(()=>({coins:State.S.coins,fish:State.S.fish,medkits:State.S.medkits})),{coins:inv.coins-18,fish:inv.fish-1,medkits:inv.medkits+1});
  assert.ok(await page.locator('[data-book-recipe="harbor-kit"]').isDisabled());
  await page.locator('.rb-close').click();
  await page.locator('#panel.open').waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>window.__game.scene),'map');
  assert.equal(await page.locator('.rw-world').evaluate(el=>el.inert),false,'Closing Book restores real atlas input');
  const openedAtlas=page.locator('.rw-atlas-menu[open] > summary');if(await openedAtlas.count())await openedAtlas.click();
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
  await page.locator('.cb-confirm-dialog [data-confirm-accept]').click();
  await page.waitForFunction(()=>window.__CAT_BOND_STARTED__===true&&window.State.activeSlot()==='slot2',{timeout:30000});
  await waitMap();
  assert.equal(await page.evaluate(()=>window.State.S.cats[0].uid),first);
  if(relocated)assert.deepEqual(await page.evaluate(()=>{const b=State.S.yardBuildings[0];return {u:b.gardenU,v:b.gardenV,level:b.level}}),relocated,'Actual save/load preserves relocated facility coordinates and level');
  assert.deepEqual(await page.evaluate(()=>{const d=World.gardenDecorations()[0];return {type:d.type,u:d.gardenU,v:d.gardenV}}),relocatedDecor,'Real slot copy/load preserves garden decoration');
  assert.deepEqual((await page.evaluate(()=>State.S.sunlitGarden.bookGuide)).sort(),['cats','dex','party','workshop']);
  // A real title-menu navigation, not a special test entry.
  await page.locator('#map-menu').click();
  await page.locator('[data-system="page-saves"]').click();await page.locator('[data-system="title"]').click();
  await page.locator('.cb-confirm-dialog [data-confirm-accept]').click();
  await page.waitForFunction(()=>window.__CAT_BOND_READY__===true&&!window.__CAT_BOND_STARTED__,{timeout:30000});
  // Start the third slot through the actual title picker, preserving the two earlier adventures.
  await page.locator('#intro-start').click();
  await page.locator('#intro-slot-list [data-slot="slot3"]').click();
  await page.waitForFunction(()=>window.__CAT_BOND_STARTED__===true&&window.State.activeSlot()==='slot3');
  await checkVisible('#cb-canonical-opening');
  assert.equal(await page.evaluate(()=>State.activeSlot()),'slot3');
  await page.waitForFunction(()=>State.S.cats.length===1&&State.S.cats[0].species==='jinjc');
  assert.deepEqual(await page.evaluate(()=>State.S.cats.map(c=>c.species)),['jinjc']);
  assert.equal(await page.evaluate(()=>World.gardenDecorations().length),0,'Fresh slot does not inherit decorations');
  assert.equal(await page.evaluate(()=>State.S.sunlitGarden?.bookGuide?.length||0),0,'Fresh slot does not inherit onboarding');
  await page.reload();await page.waitForFunction(()=>window.__CAT_BOND_READY__===true&&!window.__CAT_BOND_STARTED__);
  await page.locator('#intro-continue').click();
  await page.locator('[data-title-delete="slot1"]').click();
  await page.locator('.cb-confirm-dialog [data-confirm-cancel]').click();
  assert.ok(await page.evaluate(()=>State.getSaveSlot('slot1')),'Cancel must retain the original save');
  await page.locator('[data-title-delete="slot1"]').click();
  await page.locator('.cb-confirm-dialog [data-confirm-accept]').click();
  await page.waitForFunction(()=>window.State.getSaveSlot('slot1')===null);
  assert.equal(await page.evaluate(()=>window.State.getSaveSlot('slot2').data.state.cats[0].uid),first);
  assert.deepEqual(await page.evaluate(()=>window.State.getSaveSlot('slot3').data.state.cats.map(c=>c.species)),['jinjc']);
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
