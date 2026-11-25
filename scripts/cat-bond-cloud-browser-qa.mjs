import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const origin='http://127.0.0.1:8765';
const out='cat-bond-title-save-qa';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const A=await browser.newContext({viewport:{width:1280,height:800}});
const B=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const a=await A.newPage(),b=await B.newPage();
const errors=[];
for(const page of [a,b]){
 page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',d=>d.accept());
}
const ready=page=>page.waitForFunction(()=>window.__CAT_BOND_READY__===true&&window.CatBondArtworkStatus?.breedsLoaded===true,{timeout:30000});
const waitMap=page=>page.waitForFunction(()=>window.__game?.scene==='map',{timeout:20000});
async function title(page){
 if(await page.locator('#intro').isVisible())return;
 await page.locator('#map-menu').click();
 await page.locator('[data-cb-story-action="system"]').click();
 await page.locator('[data-system="title"]').click();
 await ready(page);
 await page.locator('#intro').waitFor({state:'visible'});
}
async function start(page,id,starter){
 await page.locator('#intro-start').click();
 await page.locator('#intro-slot-list [data-slot="'+id+'"]').click();
 await page.locator('#panel.open .dex-cell').nth(starter).click();
 await page.locator('.cb-story-overlay.is-visible .cb-story-skip').click();
 await waitMap(page);
}
async function cloud(page){
 await page.locator('#cb-system-toggle').click();
 await page.locator('[data-system="cloud"]').click();
 await page.locator('.cb-cloud-overlay').waitFor({state:'visible'});
}
const status=page=>page.locator('#cb-cloud-status');
async function waitText(page,pattern){
 await page.waitForFunction(regex=>new RegExp(regex,'i').test(document.getElementById('cb-cloud-status')?.textContent||''),pattern,{timeout:20000});
}
const readSlots=page=>page.evaluate(()=>window.State.SAVE_SLOT_IDS.map(id=>{
 const slot=window.State.getSaveSlot(id);return slot?.data?.state?.cats?.map(c=>c.uid)||null;
}));
async function shot(page,name){
 // Never retain recovery credentials in screenshots.
 await page.screenshot({path:out+'/'+name+'.png',mask:[page.locator('.cb-cloud-code-row code'),page.locator('[data-recovery-code]')]});
}
try{
 await a.goto(origin+'/cat-bond/?lang=en');await ready(a);
 await start(a,'slot1',0);await title(a);
 await start(a,'slot2',1);
 await a.locator('#map-menu').click();
 await a.locator('[data-cb-story-action="slots"]').click();
 await a.locator('[data-save="slot3"]').click();
 await a.waitForFunction(()=>!!window.State.getSaveSlot('slot3'));
 await a.locator('.cb-slot-manager .cb-cloud-close').click();
 await a.locator('#panel .card-close').click().catch(()=>{});
 await title(a);
 const originals=await readSlots(a);
 assert.ok(originals.every(s=>s?.length));
 assert.notDeepEqual(originals[0],originals[1]);
 await cloud(a);
 // Browser transport fails deliberately on this device; server and crypto remain real.
 const offlineRoute=route=>route.abort('internetdisconnected');
 await a.route('**/api/cat-bond-cloud-save**',offlineRoute);
 await a.locator('[data-cloud="enable"]').click();
 await waitText(a,'did not finish|未完成|retry');
 assert.deepEqual(await readSlots(a),originals);
 await shot(a,'cloud-offline-local-saves-preserved');
 await a.unroute('**/api/cat-bond-cloud-save**',offlineRoute);
 await a.locator('[data-cloud="sync"]').click();
 await waitText(a,'successfully|同步成功');
 const recovery=await a.locator('.cb-cloud-code-row code').innerText();
 assert.match(recovery,/^CB1\.[A-Za-z0-9_-]{43}$/);
 await shot(a,'cloud-retry-success');
 await b.goto(origin+'/cat-bond/?lang=en');await ready(b);
 assert.deepEqual(await readSlots(b),[null,null,null]);
 await cloud(b);
 await b.locator('[data-recovery-code]').fill(recovery);
 await b.locator('[data-cloud="connect"]').click();
 await ready(b);
 await b.waitForFunction(()=>window.State.getSaveSlot('slot3')!==null);
 assert.deepEqual(await readSlots(b),originals);
 await waitMap(b);
 await title(b);
 await shot(b,'second-device-restored');
 // Delete slot1 on A, then prove B's stale copy cannot silently restore it.
 await a.locator('.cb-cloud-overlay .cb-cloud-close').click();
 await a.locator('#cb-system-toggle').click();
 await a.locator('[data-system="slots"]').click();
 await a.locator('[data-remove-save="slot1"]').click();
 await waitText(a,'deleted and synced|删除并同步|cloud deletion is not confirmed|云端尚未确认');
 assert.deepEqual(await readSlots(a),[null,originals[1],originals[2]]);
 if(/not confirmed|尚未确认/i.test(await status(a).innerText())){
  await a.locator('.cb-slot-manager .cb-cloud-close').click();
  await cloud(a);await a.locator('[data-cloud="sync"]').click();
  await waitText(a,'conflict|冲突');
  await a.locator('[data-cloud="overwrite:slot1"]').click();
  await waitText(a,'selected cloud slot updated|指定云存档已更新');
 }
 await shot(a,'cloud-deletion-confirmed');
 await cloud(b);
 await b.locator('[data-cloud="sync"]').click();
 await waitText(b,'conflict|冲突');
 await shot(b,'stale-device-conflict');
 await b.locator('[data-cloud="restore:slot1"]').click();
 await b.waitForFunction(()=>window.State.getSaveSlot('slot1')===null);
 assert.deepEqual(await readSlots(b),[null,originals[1],originals[2]]);
 await shot(b,'second-device-deletion-restored');
 assert.deepEqual(errors,[]);
 console.log('PASS: real Chromium desktop/mobile contexts, real AES-GCM recovery, production handler on SQLite, offline retry, conflict and tombstone isolation.');
}catch(error){
 console.error('FAIL cloud browser acceptance',error);
 for(const [page,name] of [[a,'desktop'],[b,'mobile']])await shot(page,'cloud-failure-'+name).catch(()=>{});
 process.exitCode=1;
}finally{await browser.close();}
