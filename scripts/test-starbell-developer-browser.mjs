import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true}),origin=process.env.CAT_BOND_SMOKE_ORIGIN||'http://127.0.0.1:8766';
const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage();
const areas=['garden','harbor','forest','forge','sky','library','starfall','finale'];
await mkdir('artifacts/cat-bond-layout',{recursive:true});
try{
 await page.goto(origin+'/cat-bond/?developer=1&qa=developer&region=harbor&lang=en');
 await page.locator('#starbell-developer-menu').waitFor({timeout:30000});
 const publicBefore=await page.evaluate(()=>['catbond_save_v1','catbond_save_slots_v1','catbond_active_slot_v1','catbond_save_slots_backup_v2'].map(k=>localStorage.getItem(k)));
 assert.ok(publicBefore.every(v=>v===null),'developer must not create ordinary saves');
 for(const region of areas){
  await page.goto(origin+'/cat-bond/?developer=1&qa=developer&reset=1&region='+region+'&lang=en');
  await page.locator('#starbell-developer-menu').waitFor({timeout:30000});
  await page.waitForFunction(r=>r==='garden'?__game.scene==='yard':__game.scene==='map'&&WorldMap.mode==='region'&&WorldMap.currentRegion===(r==='finale'?'starfall':r),region);
  const snapshot=await page.evaluate(()=>({regions:CatBondResonance.view().regions,collector:window.ARCADE_COLLECTOR,saveKey:State.SAVE_SLOTS_KEY,scene:CatBondResonance.view().current?.id,publicSaves:['catbond_save_v1','catbond_save_slots_v1','catbond_active_slot_v1','catbond_save_slots_backup_v2'].map(k=>localStorage.getItem(k))}));
  assert.equal(snapshot.regions.length,6);assert.equal(snapshot.collector,'/api/preview-disabled');assert.ok(snapshot.saveKey.startsWith('starbell_developer_'));assert.deepEqual(snapshot.publicSaves,publicBefore);
  await page.screenshot({path:'artifacts/cat-bond-layout/developer-'+region+'.png'});
  console.log('DEVELOPER PASS',region,snapshot.scene);
 }
 await page.goto(origin+'/cat-bond/?lang=en&qa=ordinary');
 assert.equal(await page.evaluate(()=>window.__STARBELL_DEVELOPER__),false);
 assert.equal(await page.locator('#starbell-developer-menu').count(),0);
 assert.equal(await page.evaluate(()=>State.SAVE_SLOTS_KEY),'catbond_save_slots_v1');
}finally{await browser.close();}
