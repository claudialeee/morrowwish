import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Existing linked saves retain background-only synchronization. Test against
// the isolated local SQLite handler, never the production D1 database.
const browser=await chromium.launch({headless:true});
const origin='http://127.0.0.1:8765';
try{
 const context=await browser.newContext();
 const page=await context.newPage();
 const requests=[];
 page.on('request',r=>{if(r.url().includes('/api/cat-bond-cloud-save'))requests.push(r.url())});
 await page.goto(origin+'/cat-bond/?lang=en');
 await page.waitForFunction(()=>window.CatBondCloudSave&&window.__game);
 await page.locator('#cb-system-toggle').click();
 assert.equal(await page.locator('[data-system="cloud"]').count(),0);
 await page.locator('[data-system="slots"]').click();
 await page.locator('.cb-slot-manager').waitFor();
 assert.equal(await page.locator('.cb-slot-manager-row').count(),3);
 assert.equal(await page.locator('[data-recovery-code],[data-slot-sync],.cb-cloud-code-row').count(),0);
 assert.equal(requests.length,0,'A new player must not consume cloud quota');
 const results=await page.evaluate(async()=>{
   const api=window.CatBondCloudSave;
   const disabled=await api.syncNow();
   return {disabled:disabled.disabled,manualPanel:typeof api.openPanel};
 });
 assert.equal(results.disabled,true);
 assert.equal(results.manualPanel,'undefined');
 await context.close();
 console.log('PASS local-first three-slot UI, no recovery code or new-player cloud traffic');
}finally{await browser.close()}
