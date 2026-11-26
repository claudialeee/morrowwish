// Real-input optional NPC activity acceptance. The earlier campaign is synthetic.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {activities} from '../public/cat-bond/js/resonance/ambient-play.mjs';
const root=process.argv[2]||'artifacts/cat-bond-experience',out=root+'/ambient',origin='http://127.0.0.1:8765';
await fs.mkdir(out,{recursive:true});
const cases=campaign.ambient.filter(a=>a.after!=='epilogue:E-03');
const browser=await chromium.launch({headless:true}),results=[];
try{
 for(const event of cases){
  const after=campaign.scenes.findIndex(s=>s.id===event.after),scene=campaign.scenes[after+1].id;
  const label=campaign.cast[event.npc].name.en,slug=event.id.replace(':','-');
  let ctx,page;const errors=[];
  try{
   const fixture=JSON.parse(await fs.readFile(root+'/synthetic-checkpoints/'+scene.replace(':','-')+'.json','utf8'));
   assert.equal(fixture.provenance,'synthetic engine-model browser-restored');
   ctx=await browser.newContext({storageState:fixture.storageState,viewport:{width:1440,height:900}});
   await ctx.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort()});
   page=await ctx.newPage();page.setDefaultTimeout(18000);page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'/cat-bond/?lang=en&rpgDev=1');
   await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
   await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();
   await page.waitForFunction(id=>CatBondResonance.view().current?.id===id,scene);
   await page.waitForFunction(()=>['map','yard'].includes(__game.scene));
   const read=()=>page.evaluate(({id,npc})=>({done:State.S.resonance.ambientDone.includes(id),trust:State.S.resonance.trust[npc],scene:State.S.resonance.scene}),event);
   const before=await read();assert.equal(before.done,false);
   assert.ok(await page.evaluate(e=>CatBondResonance.ambientAvailable(e.region).some(a=>a.id===e.id),event),'Fixture must make activity available');
   // The compact RPG menu owns atlas/garden/quest navigation. Native buttons
   // may be intentionally hidden; never force-click or mutate game state.
   const world=page.locator('.rw-world:not([hidden])');
   async function menu(id){
    const panel=page.locator('#cb-system-menu');
    if(!await panel.isVisible())await page.locator('#map-menu').click();
    await panel.locator('[data-system="'+id+'"]').click();
   }
   async function scanFor(target){
    const prev=world.locator('[data-fit-prev]'),next=world.locator('[data-fit-next]');
    const count=Number(await world.getAttribute('data-fit-pages')||1);
    for(const pager of [prev,next])for(let i=0;i<count&&!await target.isVisible()&&await pager.isVisible()&&await pager.isEnabled();i++)await pager.click();
   }
   async function reveal(target,all){
    if(await target.isVisible())return;
    await all.waitFor({state:'attached',timeout:8000});
    if(await target.isVisible())return;
    const collapsed=world.locator('.rw-region-toggle[aria-expanded="false"],.rw-atlas-menu:not([open]) > summary');
    if(await collapsed.count()&&await all.evaluate(el=>!!el.closest('#rw-region-actions,.rw-atlas-menu')))await menu('world-explore');
    const optional=world.locator('.rw-optional-actions:not([open]) > summary').first();
    if(!await target.isVisible()&&await optional.count()&&await all.evaluate(el=>!!el.closest('.rw-optional-actions'))){
     await scanFor(optional);await optional.click();
    }
    await scanFor(target);
    await target.waitFor({state:'visible',timeout:8000});
   }
   async function navigate(){
    if(event.region==='garden'){
     if(await page.evaluate(()=>__game.scene)!=='yard')await menu('world-garden');
     await page.waitForFunction(()=>__game.scene==='yard');return;
    }
    if(await page.evaluate(()=>__game.scene)==='yard'){
     await menu('yard-map');await page.waitForFunction(()=>__game.scene==='map');
    }
    if(await page.evaluate(r=>WorldMap.mode==='region'&&WorldMap.currentRegion===r,event.region))return;
    if(await page.evaluate(()=>WorldMap.mode==='region'))await menu('world-atlas');
    await page.waitForFunction(()=>WorldMap.mode==='map');
    const all=world.locator('.rw-regions [data-region="'+event.region+'"]').first();
    await reveal(all,all);await all.click();
    await page.waitForFunction(r=>WorldMap.mode==='region'&&WorldMap.currentRegion===r,event.region);
   }
   await navigate();
   async function open(){
    if(event.region==='garden')await page.locator('[data-npc-talk="'+event.npc+'"]').click();
    else{
     const name='Talk to '+label;
     const target=world.getByRole('button',{name,exact:true}).first();
     const all=world.getByRole('button',{name,exact:true,includeHidden:true}).or(world.locator('button').and(world.getByText(name,{exact:true}))).first();
     await reveal(target,all);await target.click();
    }
    const dialog=page.locator('.res-ambient-simple');await dialog.waitFor();
    const choice=dialog.locator('[data-ambient-choice="'+event.id+'"]');
    if(await choice.count())await choice.click();
    assert.equal(await dialog.locator('h2').innerText(),activities[event.id].title[1]);
    return dialog;
   }
   let dialog=await open();await page.screenshot({path:out+'/'+slug+'-before.png'});
   await dialog.getByRole('button',{name:'Maybe later',exact:true}).click();await dialog.waitFor({state:'hidden'});assert.deepEqual(await read(),before);
   dialog=await open();await dialog.getByRole('button',{name:activities[event.id].action[1],exact:true}).click();
   await dialog.getByRole('button',{name:'Return to exploration',exact:true}).waitFor();
   assert.ok((await dialog.innerText()).includes(event.text.en));await page.screenshot({path:out+'/'+slug+'-complete.png'});
   await dialog.getByRole('button',{name:'Return to exploration',exact:true}).click();
   const afterState=await read();assert.equal(afterState.done,true);assert.equal(afterState.trust,before.trust+1);assert.equal(afterState.scene,before.scene);
   await page.reload();await page.waitForFunction(()=>window.__CAT_BOND_READY__);
   await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();await page.waitForFunction(id=>CatBondResonance.view().current?.id===id,scene);
   assert.deepEqual(await read(),afterState);assert.deepEqual(errors,[]);
   results.push({id:event.id,scene,status:'passed',before,after:afterState});console.log('AMBIENT BROWSER PASS',event.id);
  }catch(e){results.push({id:event.id,scene,status:'failed',error:String(e),stack:e.stack});console.error('AMBIENT BROWSER FAIL',event.id,String(e));if(page)console.error('AMBIENT UI',JSON.stringify(await page.evaluate(()=>({scene:window.__game?.scene,region:window.WorldMap?.currentRegion,mode:window.WorldMap?.mode,overlay:[...document.querySelectorAll('.cb-story-overlay.is-visible')].map(el=>({className:el.className,text:el.innerText.slice(0,300)})),buttons:[...document.querySelectorAll('.rw-world button,.sg-npc-talk-marker')].filter(b=>!b.hidden).map(b=>({text:b.textContent,visible:!!b.getClientRects().length,disabled:b.disabled})).slice(0,50)})).catch(()=>null)));await page?.screenshot({path:out+'/'+slug+'-failure.png'}).catch(()=>{});}
  finally{await ctx?.close();}
 }
}finally{await fs.writeFile(out+'/results.json',JSON.stringify({provenance:'synthetic chapter entry, actual optional activity inputs; postgame tested separately',results},null,2));await browser.close();}
assert.equal(results.filter(r=>r.status==='passed').length,cases.length,'All pre-ending ambient activities must pass');
