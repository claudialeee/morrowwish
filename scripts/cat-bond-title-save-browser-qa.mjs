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
 const screenshot=name=>page.screenshot({path:output+'/'+profile.name+'-'+name+'.png'});
 const checkVisible=async selector=>{await page.locator(selector).first().waitFor({state:'visible',timeout:15000});};
 const waitMap=()=>page.waitForFunction(()=>window.__game?.scene==='map',{timeout:15000});
 const openInGameSlots=async()=>{
  await page.locator('#map-menu').click();
  await page.locator('[data-cb-story-action="slots"]').click();
  await checkVisible('.cb-slot-manager');
 };
 const openTitleSlots=async()=>{
  await page.locator('#cb-system-toggle').click();
  await page.locator('[data-system="slots"]').click();
  await checkVisible('.cb-slot-manager');
 };
 try{
  await page.goto(origin+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__CAT_BOND_READY__===true&&window.CatBondArtworkStatus?.breedsLoaded===true,{timeout:30000});
  await screenshot('title-zh');
  await page.locator('#cb-system-toggle').click();
  await page.locator('[data-system="language"]').click();
  await page.waitForFunction(()=>window.MorrowwishI18n?.get?.()==='en');
  await page.locator('[data-system="close"]').click();
  assert.match(await page.locator('#intro-start').innerText(),/New Adventure/);
  await screenshot('title-en');
  await page.locator('#intro-start').click();
  assert.equal(await page.locator('#intro-slot-list [data-slot]').count(),3);
  await screenshot('three-slots');
  await page.locator('#intro-slot-list [data-slot="slot1"]').click();
  await checkVisible('#panel.open .dex-cell');
  await page.locator('#panel.open .dex-cell').first().click();
  await checkVisible('.cb-story-overlay.is-visible');
  // This is a save-flow test only; skipping the deprecated intro is not
  // cinematic acceptance. The formal prologue must be tested separately.
  await page.locator('.cb-story-skip').click();
  await waitMap();
  const first=await page.evaluate(()=>window.State.getSaveSlot('slot1').data.state.cats[0].uid);
  assert.ok(first);
  await openInGameSlots();
  await page.locator('[data-save="slot2"]').click();
  await page.waitForFunction(()=>!!window.State.getSaveSlot('slot2'));
  await screenshot('in-game-save-manager');
  await page.locator('[data-load="slot2"]').click();
  await page.waitForFunction(()=>window.__CAT_BOND_STARTED__===true&&window.State.activeSlot()==='slot2',{timeout:30000});
  await waitMap();
  assert.equal(await page.evaluate(()=>window.State.S.cats[0].uid),first);
  // A real title-menu navigation, not a special test entry.
  await page.locator('#map-menu').click();
  await page.locator('[data-cb-story-action="system"]').click();
  await page.locator('[data-system="title"]').click();
  await page.waitForFunction(()=>window.__CAT_BOND_READY__===true&&!window.__CAT_BOND_STARTED__,{timeout:30000});
  await openTitleSlots();
  await page.locator('[data-remove-save="slot1"]').click();
  await page.waitForFunction(()=>window.State.getSaveSlot('slot1')===null);
  assert.equal(await page.evaluate(()=>window.State.getSaveSlot('slot2').data.state.cats[0].uid),first);
  assert.equal(await page.evaluate(()=>window.State.getSaveSlot('slot3')),null);
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
