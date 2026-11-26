// Load a genuine test checkpoint through the normal title/continue flow.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const file=process.argv[2];if(!file)throw Error('Usage: node scripts/cat-bond-experience-replay.mjs <fixture.json> [--headed] [--allow-revision-mismatch]');
const fixture=JSON.parse(await fs.readFile(file,'utf8')),origin='http://127.0.0.1:8765';
assert.equal(fixture.schema,1);assert.equal(fixture.provenance,'real-input local browser save');
const revision=process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(revision!==fixture.revision&&!process.argv.includes('--allow-revision-mismatch'))throw Error('Checkpoint revision mismatch; regenerate or explicitly opt in for migration testing.');
assert.deepEqual(fixture.storageState.cookies,[]);
assert.equal(fixture.storageState.origins.length,1);
assert.equal(fixture.storageState.origins[0].origin,origin);
assert.ok(fixture.storageState.origins[0].localStorage.every(x=>['catbond_save_slots_v1','catbond_active_slot_v1'].includes(x.name)));
const browser=await chromium.launch({headless:!process.argv.includes('--headed')});
try{
 const context=await browser.newContext({storageState:fixture.storageState,viewport:{width:1440,height:900}});
 await context.route('**/*',route=>{const u=new URL(route.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?route.continue():route.abort();});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/cat-bond/?lang=zh');
 await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
 await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="'+fixture.slot+'"]').click();
 await page.waitForFunction(scene=>window.CatBondResonance?.view()?.current?.id===scene,fixture.scene,{timeout:15000});
 assert.deepEqual(errors,[]);console.log('PASS checkpoint restore',fixture.scene,fixture.slot);
 await fs.mkdir('artifacts/cat-bond-experience',{recursive:true});
 await page.screenshot({path:'artifacts/cat-bond-experience/replay-'+fixture.scene.replace(':','-')+'.png'});
 if(process.argv.includes('--headed'))await page.waitForEvent('close',{timeout:0});
}finally{await browser.close();}
