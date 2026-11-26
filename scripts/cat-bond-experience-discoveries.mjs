// Six regions, actual painted props and pointer inputs; synthetic chapter history is not fresh play.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {discoveries,earnedKeepsakes,progress} from '../public/cat-bond/js/resonance/regional-discoveries.mjs';
const root=process.argv[2]||'artifacts/cat-bond-experience',out=root+'/discoveries',origin='http://127.0.0.1:8765';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),results=[];
try{
 for(const [region,def] of Object.entries(discoveries)){
  const next=campaign.scenes[campaign.scenes.findIndex(s=>s.id===def.after)+1].id;
  const fixture=JSON.parse(await fs.readFile(root+'/synthetic-checkpoints/'+next.replace(':','-')+'.json','utf8'));
  assert.equal(fixture.provenance,'synthetic engine-model browser-restored');
  let ctx,page;const errors=[];
  try{
   ctx=await browser.newContext({storageState:fixture.storageState,viewport:{width:1440,height:900}});
   await ctx.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort()});
   page=await ctx.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
   async function load(){
    await page.goto(origin+'/cat-bond/?lang=en&rpgDev=1');await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
    await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();
    await page.waitForFunction(id=>CatBondResonance.view().current?.id===id,next);
    await page.waitForFunction(()=>['map','yard'].includes(__game.scene));
   }
   await load();
   const world=page.locator('.rw-world:not([hidden])'),surface=world.locator('.rw-surface');
   async function menu(id){
    const panel=page.locator('#cb-system-menu');
    if(!await panel.isVisible())await page.locator('#map-menu').click();
    await panel.locator('[data-system="'+id+'"]').click();
   }
   async function enter(){
    if(await page.evaluate(()=>__game.scene)==='yard'){await menu('yard-map');await page.waitForFunction(()=>__game.scene==='map');}
    if(await page.evaluate(r=>WorldMap.mode==='region'&&WorldMap.currentRegion===r,region))return;
    if(await page.evaluate(()=>WorldMap.mode==='region'))await menu('world-atlas');
    await page.waitForFunction(()=>WorldMap.mode==='map');
    const button=world.locator('.rw-regions [data-region="'+region+'"]').first();
    if(!await button.isVisible())await menu('world-explore');
    await button.click();await page.waitForFunction(r=>WorldMap.mode==='region'&&WorldMap.currentRegion===r,region);
   }
   const read=()=>page.evaluate(()=>({interactions:State.S.resonanceExploration?.interactions||{},story:CatBondResonance.snapshot()}));
   await enter();const before=await read();
   assert.deepEqual(progress(region,before.interactions).done,[]);
   for(const step of def.steps){
    if(step.mode==='return'){await menu('world-atlas');await page.waitForFunction(()=>WorldMap.mode==='map');await enter();}
    await page.waitForFunction(id=>{const c=document.querySelector('.rw-world:not([hidden]) .rw-surface');return JSON.parse(c?.dataset.discoveryTargets||'[]').some(p=>p.id===id)},step.id);
    const point=await surface.evaluate((c,id)=>{const p=JSON.parse(c.dataset.discoveryTargets).find(x=>x.id===id).point,[z,x,y]=JSON.parse(c.dataset.camera),r=c.getBoundingClientRect();return {x:r.left+r.width*(p[0]*z+x),y:r.top+r.height*(p[1]*z+y)};},step.id);
    const state=await read();await page.screenshot({path:out+'/'+region+'-'+step.id+'-before.png'});
    await page.mouse.click(point.x,point.y);
    await page.waitForFunction(message=>document.querySelector('.rw-world:not([hidden]) .rw-notice')?.textContent.includes(message),step.message[1]);
    const after=await read();assert.deepEqual(after.story,before.story,'Optional prop must not alter story');
    if(step.mode==='decoy')assert.deepEqual(after.interactions,state.interactions,'Decoy must not award progress');
    else assert.equal(after.interactions['discovery:'+region+':'+step.id],true,'Actual click must persist progress');
    await page.screenshot({path:out+'/'+region+'-'+step.id+'-after.png'});
    results.push({region,id:step.id,mode:step.mode||'normal',status:'passed',point});
    console.log('DISCOVERY BROWSER PASS',region,step.id);
   }
   const final=await read();
   assert.equal(earnedKeepsakes(final.interactions).filter(x=>x.region===region).length,2);
   await load();const restored=await read();assert.deepEqual(restored,final,'Real discovery progress and story must survive reload');
   assert.deepEqual(errors,[]);results.push({region,id:'reload',status:'passed'});
  }catch(error){
   results.push({region,id:'region-failure',status:'failed',error:String(error),stack:error.stack});
   console.error('DISCOVERY BROWSER FAIL',region,error.stack||String(error));
   await page?.screenshot({path:out+'/'+region+'-failure.png'}).catch(()=>{});
  }finally{await ctx?.close();}
 }
}finally{await fs.writeFile(out+'/results.json',JSON.stringify({provenance:'synthetic prior history; actual map pointer inputs, persisted optional progress, reload',results},null,2));await browser.close();}
assert.equal(results.filter(r=>r.status==='failed').length,0);
assert.equal(results.filter(r=>r.status==='passed'&&r.id!=='reload').length,Object.values(discoveries).reduce((n,d)=>n+d.steps.length,0));
assert.equal(results.filter(r=>r.id==='reload'&&r.status==='passed').length,Object.keys(discoveries).length);
