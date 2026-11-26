// Generate explicitly synthetic, browser-restored review checkpoints.
// Real browser checkpoints remain separate; no seeded state counts as a completed playthrough.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const root=process.argv[2]||'artifacts/cat-bond-experience',origin='http://127.0.0.1:8765';
const out=root+'/synthetic-checkpoints';await fs.mkdir(out,{recursive:true});
const revision=process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const selection=process.env.CAT_BOND_TARGET_SCENES?.split(',').filter(Boolean)||null;
const files=(await fs.readdir(root+'/model-scenes')).filter(f=>f.endsWith('.json')&&(!selection||selection.includes(f.slice(0,-5).replace(/-([A-Z])-([0-9]+)$/ ,':$1-$2')))).sort();
if(selection)assert.equal(files.length,selection.length,'Every requested chapter entry model must exist');
assert.ok(files.length>0,'Run knowledge model first');
const browser=await chromium.launch({headless:true});
const open=async storageState=>{const ctx=await browser.newContext({viewport:{width:1440,height:900},...(storageState?{storageState}:{})});
 await ctx.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort();});
 const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/cat-bond/?lang=zh&rpgDev=1');
 await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
 return {ctx,page,errors};
};
const continueSlot=async page=>{await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();};
const results=[];
try{
 const initial=await open();
 await initial.page.locator('#intro-start').click();await initial.page.locator('#intro-slot-list [data-slot="slot1"]').click();
 await initial.page.waitForFunction(()=>CatBondResonance.view().current?.id==='prologue:P-05');
 await initial.page.locator('#cb-player-first-intro').getByRole('button',{name:'开始探索',exact:true}).click();
 const baseline=await initial.ctx.storageState();assert.deepEqual(initial.errors,[]);await initial.ctx.close();
 for(const file of files){
   const model=JSON.parse(await fs.readFile(root+'/model-scenes/'+file,'utf8'));
   let setup,restored;
   try{
     assert.equal(model.provenance,'synthetic engine-model state, not player-earned');
     setup=await open(baseline);await continueSlot(setup.page);
     await setup.page.waitForFunction(()=>State.S.cats?.length&&CatBondResonance.view().current?.id==='prologue:P-05');
     const seeded=await setup.page.evaluate(async model=>{
       if(location.origin!=='http://127.0.0.1:8765')throw Error('local only');
       const {storyPartyPatch}=await import('/cat-bond/js/resonance/story-party.mjs');
       const {campaign}=await import('/cat-bond/js/resonance/campaign.mjs');
       const {makeEngine}=await import('/cat-bond/js/resonance/engine.mjs');
       const root=State.S,previous=root.resonance,next=makeEngine(campaign,model.snapshot).snapshot();
       // Reconstruct recruited companions using the actual game helper, not invented species or levels.
       const patch=storyPartyPatch(root,previous,next,State.makeCat.bind(State),cat=>window.Raising?.decorateNewCat?.(cat,{shinyOdds:0}));
       if(patch)Object.assign(root,patch.fields);
       root.resonance=next;
       const region=model.chapter==='prologue'||['epilogue:E-02','epilogue:E-03'].includes(model.scene)?'garden':model.chapter==='finale'?'starfall':model.chapter==='epilogue'?'harbor':model.chapter;
       root.resonanceExploration={location:region,positions:{},interactions:{},pickups:{},cargo:null};
       delete root.chapterPresentation;
       const saved=State.save();if(!saved?.ok)throw Error('Synthetic fixture save failed: '+saved?.reason);
       return {region,party:root.cats.map(c=>({uid:c.uid,species:c.species,actor:c.storyActor||null})),away:root.storyAway?.muling?.uid||null};
     },model);
     const storageState=await setup.page.evaluate(()=>({cookies:[],origins:[{origin:location.origin,localStorage:['catbond_save_slots_v1','catbond_active_slot_v1'].map(name=>({name,value:localStorage.getItem(name)}))}]}));
     assert.deepEqual(setup.errors,[]);
     await setup.ctx.close();setup=null;
     restored=await open(storageState);await continueSlot(restored.page);
     const gardenTransition=model.scene==='epilogue:E-01',restoredScene=gardenTransition?'epilogue:E-02':model.scene;
     await restored.page.waitForFunction(id=>CatBondResonance.view().current?.id===id,restoredScene,{timeout:20000});
     await restored.page.waitForFunction(()=>['map','yard'].includes(window.__game?.scene));
     const actual=await restored.page.evaluate(()=>({scene:CatBondResonance.view().current.id,cursor:CatBondResonance.view().cursor,objective:CatBondResonance.view().objective,
       party:State.S.cats.map(c=>({uid:c.uid,species:c.species,actor:c.storyActor||null})),away:State.S.storyAway?.muling?.uid||null,area:__game.scene}));
     assert.equal(actual.scene,restoredScene);assert.equal(actual.cursor,gardenTransition?0:model.snapshot.cursor);
     if(gardenTransition){assert.equal(actual.area,'yard');assert.deepEqual(await restored.page.evaluate(()=>CatBondResonance.snapshot().completed),[...model.snapshot.completed,'epilogue:E-01']);}
     assert.deepEqual(actual.party,seeded.party);assert.equal(actual.away,seeded.away);assert.deepEqual(restored.errors,[]);
     const fixture={schema:1,revision,scene:model.scene,cursor:model.snapshot.cursor,restoredScene,region:seeded.region,slot:'slot1',provenance:'synthetic engine-model browser-restored',limitations:['Earlier narrative evidence is seeded, not earned in browser.','Physical interaction history, optional exploration, economy and battle progression are not reproduced.','Not evidence that target scene can be completed or that a real player reached it.'],storageState};
     await fs.writeFile(out+'/'+file,JSON.stringify(fixture,null,2));
     await restored.page.screenshot({path:out+'/'+file.replace('.json','.png')});
     results.push({scene:model.scene,status:'restored',area:actual.area,party:actual.party.map(c=>c.actor||c.species),objective:actual.objective});
     console.log('SYNTHETIC RESTORE PASS',model.scene);
   }catch(e){results.push({scene:model.scene,status:'failed',error:String(e).slice(0,1600)});console.error('SYNTHETIC RESTORE FAIL',model.scene,String(e));}
   finally{await setup?.ctx.close();await restored?.ctx.close();}
 }
}finally{await browser.close();await fs.writeFile(out+'/index.json',JSON.stringify({revision,provenance:'synthetic, not real-play coverage',results},null,2));}
const passed=results.filter(r=>r.status==='restored').length;
console.log('Synthetic target restore:',passed,'/',files.length);if(passed!==files.length)process.exitCode=1;
