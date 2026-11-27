import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const origin=process.env.CAT_BOND_SMOKE_ORIGIN||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true});
try{
 for(const [lang,viewport] of [['zh',{width:390,height:844}],['en',{width:844,height:390}]]){
  const context=await browser.newContext({viewport,hasTouch:true});
  await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort()});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);
  await page.goto(origin+'/cat-bond/?lang='+lang+'&rpgDev=1');
  await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
  await page.locator('#intro-start').tap();
  const picker=page.locator('#intro-slot-panel');await picker.waitFor();
  assert.equal(await picker.locator('.cb-picker-language,[data-slot-language]').count(),0);
  assert.equal(await picker.locator('[data-slot]').count(),3);
  await picker.locator('#intro-slot-close').tap();await picker.waitFor({state:'hidden'});
  await page.locator('#intro-start').tap();await picker.locator('[data-slot="slot1"]').tap();
  await page.locator('#cb-player-first-intro').getByRole('button',{name:lang==='zh'?'开始探索':'Start exploring',exact:true}).tap();
  await page.waitForFunction(()=>window.__game?.scene==='yard'&&State.S.cats.length===1);
  await page.evaluate(()=>window.CatBondCloudSave.openSlots());
  const manager=page.locator('.cb-slot-manager');await manager.waitFor();
  assert.equal(await manager.locator('.cb-picker-language,[data-modal-language]').count(),0);
  assert.equal(await manager.locator('[data-save]').count(),3);
  assert.equal(await manager.locator('[data-load="slot1"]').isEnabled(),true);
  await manager.locator('[data-save="slot2"]').tap();
  await page.waitForFunction(()=>State.listSaveSlots().find(s=>s.id==='slot2')?.readable);
  await manager.locator('.cb-cloud-close').tap();await manager.waitFor({state:'detached'});
  await page.reload();await page.waitForFunction(()=>window.__CAT_BOND_READY__);
  await page.locator('#intro-continue').tap();await picker.waitFor();
  assert.equal(await picker.locator('.cb-picker-language,[data-slot-language]').count(),0);
  assert.equal(await picker.locator('[data-slot="slot2"]').isEnabled(),true);
  await picker.locator('[data-slot="slot1"]').tap();
  await page.waitForFunction(()=>window.__CAT_BOND_STARTED__&&State.activeSlot()==='slot1'&&State.S.cats.length===1);
  assert.equal(await page.evaluate(()=>MorrowwishI18n.get()),lang);
  assert.deepEqual(errors,[]);
  await context.close();console.log('SAVE PICKER PASS',lang);
 }
}finally{await browser.close();}
