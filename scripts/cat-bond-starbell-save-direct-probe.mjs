import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const origin='http://127.0.0.1:8765',out='artifacts/starbell-save-direct';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const [profile,viewport,hasTouch] of [['desktop',{width:1440,height:900},false],['portrait',{width:390,height:844},true],['landscape',{width:844,height:390},true]]){
  for(const lang of ['zh','en']){
   const context=await browser.newContext({viewport,hasTouch,isMobile:hasTouch});
   await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort()});
   const page=await context.newPage();page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const press=async loc=>hasTouch?loc.tap():loc.click();
   async function open(toggle,playing){
    await press(page.locator(toggle));
    const menu=page.locator('#cb-system-menu'),entry=menu.locator('[data-system="slots"]');
    assert.equal(await entry.locator('span').textContent(),lang==='zh'?'存档':'Saves');
    assert.equal(await menu.locator('[data-system="page-saves"]').count(),0);
    assert.equal(await menu.locator('[data-system="title"]').count(),playing?1:0);
    await press(entry);
    const modal=page.locator('.cb-slot-manager');await modal.waitFor({state:'visible'});
    assert.equal(await menu.isVisible(),false);
    assert.equal(await modal.locator('.cb-slot-manager-row').count(),3);
    assert.equal(await modal.locator('#cb-slot-status').isVisible(),false);
    assert.equal(await modal.locator('#cb-slot-status').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
    await page.screenshot({path:out+'/'+profile+'-'+lang+'-'+(playing?'game':'title')+'.png'});
    return modal;
   }
   try{
    await page.goto(origin+'/cat-bond/?lang='+lang+'&rpgDev=1');await page.waitForFunction(()=>window.__CAT_BOND_READY__);
    let modal=await open('#cb-system-toggle',false);await press(modal.locator('.cb-cloud-close'));
    await press(page.locator('#intro-start'));await press(page.locator('#intro-slot-list [data-slot="slot1"]'));
    await page.waitForFunction(()=>CatBondResonance.view().current?.id==='prologue:P-05');
    await press(page.locator('#cb-player-first-intro').getByRole('button',{name:lang==='zh'?'开始探索':'Start exploring',exact:true}));
    await page.waitForFunction(()=>__game.scene==='yard');
    modal=await open('#map-menu',true);
    await press(modal.locator('[data-save="slot2"]'));
    await page.waitForFunction(()=>!!State.getSaveSlot('slot2'));
    const status=modal.locator('#cb-slot-status');await status.waitFor({state:'visible'});
    assert.equal(await status.textContent(),lang==='zh'?'已保存到存档位 2':'Saved to Slot 2');
    assert.equal(await status.evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
    await page.screenshot({path:out+'/'+profile+'-'+lang+'-feedback.png'});
    assert.deepEqual(errors,[]);console.log('SAVE DIRECT PASS',profile,lang);
   }catch(e){await page.screenshot({path:out+'/'+profile+'-'+lang+'-failure.png'}).catch(()=>{});throw e}
   finally{await context.close()}
  }
 }
}finally{await browser.close()}
