// Complete chapter acceptance using real browser inputs from isolated synthetic chapter starts.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {attachExperienceRecorder} from './cat-bond-experience-recorder.mjs';
const root=process.argv[2]||'artifacts/cat-bond-experience',out=root+'/chapter-acceptance',origin='http://127.0.0.1:8765';
await fs.mkdir(out,{recursive:true});
process.env.CAT_BOND_EXPERIENCE='1';
const order=['harbor','forest','forge','sky','library','starfall','finale','epilogue'];
const requested=process.env.CAT_BOND_CHAPTERS?.split(',')||order;
assert.ok(requested.every(c=>order.includes(c)));
const browser=await chromium.launch({headless:true});
const results=[];
async function run(chapter){
 const expected=campaign.scenes.filter(s=>s.chapter===chapter),start=expected[0].id;
 const next=campaign.scenes[campaign.scenes.findIndex(s=>s.id===expected.at(-1).id)+1]?.id||null;
 const fixture=JSON.parse(await fs.readFile(root+'/synthetic-checkpoints/'+start.replace(':','-')+'.json','utf8'));
 assert.equal(fixture.provenance,'synthetic engine-model browser-restored');
 const context=await browser.newContext({storageState:fixture.storageState,viewport:{width:1440,height:900}});
 const page=await context.newPage(),errors=[],readLines=[],steps=[];
 page.setDefaultTimeout(18000);page.on('pageerror',e=>errors.push(e.message));
 await attachExperienceRecorder(context,page,{id:'chapter-'+chapter,root:out,synthetic:true});
 const view=()=>page.evaluate(()=>CatBondResonance.view());
 const scene=id=>page.waitForFunction(id=>CatBondResonance.view().current?.id===id,id,{timeout:35000});
 const shot=id=>page.screenshot({path:out+'/'+chapter+'-'+id.replace(':','-')+'.png'});
 async function click(label,scope=page){
  const b=scope.getByRole('button',{name:label,exact:true}).first();
  if(scope===page&&!await b.isVisible()){
   const hidden=page.getByRole('button',{name:label,exact:true,includeHidden:true}).or(page.locator('button').and(page.getByText(label,{exact:true})));
   await hidden.first().waitFor({state:'attached'});
   if(!await b.isVisible()&&await page.locator('.rw-region-toggle[aria-expanded="false"],.rw-atlas-menu:not([open]) > summary').count()){
    await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-explore"]').click();
   }
   const optional=page.locator('.rw-optional-actions:not([open]) > summary:visible');
   if(!await b.isVisible()&&await optional.count())await optional.first().click();
   const prev=page.locator('[data-fit-prev]:visible'),next=page.locator('[data-fit-next]:visible');
   for(let i=0;i<20&&!await b.isVisible()&&await prev.count()&&await prev.isEnabled();i++)await prev.click();
   for(let i=0;i<20&&!await b.isVisible()&&await next.count()&&await next.isEnabled();i++)await next.click();
  }
  steps.push({scene:(await view()).current?.id,action:label});await b.click();
 }
 const op=async(id)=>page.waitForFunction(op=>!CatBondResonance.view().objective.includes(op),id,{timeout:35000});
 async function talk(npc){
  const before=await view();
  const pending=before.objective.find(o=>o.startsWith('npc:'));
  await click('Talk to '+npc);
  if(pending&&!['npc:public-accountability','npc:second-garden-key'].includes(pending))await op(pending);
  else if(before.current?.lines.length)await page.locator('.res-host[data-scene="'+before.current.id+'"]').waitFor();
 }
 async function dialogue(id,choice){
  const dlg=page.locator('.res-host[data-scene="'+id+'"]');
  for(let i=0;i<50;i++){
   const v=await view();if(v.current?.id!==id)return;
   const canChoose=!v.choice&&v.current.choices.length>0&&(v.current.choiceTiming==='beforeAction'||v.cursor===v.current.lines.length);
   const canRead=v.lineReady&&v.cursor<v.current.lines.length;
   if(!canChoose&&!canRead){if(id!=='epilogue:E-03'&&await dlg.isVisible())await dlg.waitFor({state:'hidden',timeout:20000});return;}
   if(!await dlg.isVisible()){
    // Wait for the normal event-driven presentation first. Resume only via a real control.
    await dlg.waitFor({timeout:2500}).catch(()=>{});
    if(!await dlg.isVisible()){
     if(await page.evaluate(()=>__game.scene)==='yard')await talk('Muling');
     else await click('Continue story');
    }
    await dlg.waitFor();
   }
   if(canChoose){const selected=v.current.choices.find(c=>c.label.en===choice)||v.current.choices[0];await click(selected.label.en,dlg);await page.waitForFunction(({id,choice})=>CatBondResonance.view().current?.id!==id||CatBondResonance.view().choice===choice,{id,choice:selected.id});continue;}
   const line=v.current.lines[v.cursor];
   await page.waitForFunction(t=>document.querySelector('.res-host .res-line')?.textContent===t,line.text.en);
   readLines.push({scene:id,cursor:v.cursor,speaker:line.speaker,text:line.text.en});
   if(v.cursor===0||v.cursor===v.current.lines.length-1)await shot(id+'-'+v.cursor);
   await page.waitForFunction(()=>!document.querySelector('.res-host .res-skip-top')?.disabled);
   await dlg.locator('.res-line').click();
   await page.waitForFunction(({id,cursor})=>{const v=CatBondResonance.view();return v.current?.id!==id||v.cursor>cursor;},{id,cursor:v.cursor});
  }
  throw Error('Dialogue loop '+id);
 }
 async function puzzle(label,inputs){
  const directHarbor={'Tide cave logbook':'explore:tide-logbook','Storm boat':'rescue:storm-boat','Lighthouse mirrors':'puzzle:beam-mirrors','Lighthouse sanctuary':'repair:harbor','Returning Tides':'melody:harbor'};
  if(chapter==='harbor'&&directHarbor[label]){const operation=directHarbor[label];assert.ok((await view()).objective.includes(operation),'Expected required harbor action '+operation);await click(label);await op(operation);await shot(operation);return;}
  await click(label);const controls=page.locator('.rw-puzzle-controls');await controls.waitFor();
  for(const input of inputs)await click(input,controls);
  await controls.waitFor({state:'hidden',timeout:35000});
 }
 async function invite(npc){await click('Invite '+npc);await page.getByRole('button',{name:'Invite '+npc,exact:true,includeHidden:true}).waitFor({state:'detached'});}
 async function restore(label,inputs,people,melody,notes){await puzzle(label,inputs);for(const npc of people)await invite(npc);await puzzle(melody,notes);}
 const low='Dew · Low',mid='Starlight · Middle',high='Flower bell · High';
 async function fly(label,heights){
  await click(label);const status=page.locator('[data-sky-flight-status]');await status.waitFor();const box=await page.locator('.rw-surface').boundingBox();
  const p=y=>({x:box.x+box.width*.30,y:box.y+box.height*y});
  let q=p(heights[0]);await page.mouse.move(q.x,q.y);await page.mouse.down();
  try{for(let i=1;i<=3;i++){await page.waitForFunction(g=>Number(document.querySelector('[data-sky-flight-status]')?.dataset.gates)===g,i,{timeout:25000});q=p(i===3?.5:heights[i]);await page.mouse.move(q.x,q.y,{steps:5});}}finally{await page.mouse.up();}
  await status.waitFor({state:'hidden',timeout:30000});
 }
 async function battle(label,operation,type='regional'){
  await click(label);await page.locator('#panel [data-battle-auto="true"]').click();await page.locator('#bp-go').click();await page.locator('#battle-ui.on').waitFor();
  const tutorial=page.locator('#battle-tutorial-skip');if(await tutorial.isVisible())await tutorial.click();
  await shot(operation+'-battle');
  const before=await page.evaluate(()=>__game.battle?.team?.map(f=>({actor:f.cat?.storyActor||f.cat?.species,level:f.cat?.level,hp:f.hp,maxhp:f.maxhp})));
  const t=Date.now();
  if(type==='forge'){
   for(let i=0;i<240;i++){if(await page.locator('#cb-forge-result').isVisible())break;const support=page.locator('[data-forge-support-button]');if(await support.isVisible()&&await support.isEnabled())await support.click();await page.waitForTimeout(750);}
   await page.locator('#cb-forge-result').waitFor({timeout:180000});await shot(operation+'-result');assert.equal(await page.locator('#cb-forge-result h2').innerText(),'FURNACE STABILIZED');await page.locator('[data-forge-return]').click();
  }else if(type==='finale'){
   if(operation==='battle:identify-echo'){
    const clue=page.locator('[data-finale-clue]');await clue.waitFor();await clue.click();
    await page.waitForFunction(()=>__game.battle?.resonanceFinale?.clueOpen===true);
    await shot(operation+'-catdex');
   }
   await page.locator('#cb-finale-result').waitFor({timeout:240000});await shot(operation+'-result');assert.equal(await page.locator('#cb-finale-result').getAttribute('data-finale-outcome'),'saved');await page.locator('[data-finale-return]').click();
  }else{
   await page.waitForFunction(()=>__game.scene==='map',null,{timeout:180000});
   await page.locator('#library-battle-ok').waitFor();await shot(operation+'-result');await page.locator('#library-battle-ok').click();
  }
  await op(operation);if(operation==='battle:central-echo')assert.equal(await page.evaluate(()=>CatBondResonance.snapshot().support.length),6,'All six regions must have answered');steps.push({battle:operation,wallSeconds:(Date.now()-t)/1000,team:before,result:'verified win'});
 }
 async function cinema(id,label){
  await scene(id);await page.waitForFunction(()=>CatBondChapterCinematics.developmentReady(),null,{timeout:15000});await click(label);
  await page.locator('.cbcp-art').first().waitFor();await shot(id+'-cinematic');
  await page.waitForFunction(id=>CatBondResonance.view().current?.id!==id,id,{timeout:180000});
 }
 async function libraryEcho(){
  await click('Hidden room · Verify memories');const controls=page.locator('.rw-puzzle-controls');await controls.waitFor();
  await click('Inspect Catdex',controls);const card=page.locator('[data-library-catdex-memory]');await card.waitFor();const interval=await card.getAttribute('data-library-catdex-memory');
  assert.match(interval,/^\d+\.\d{2}$/);await page.locator('#panel .rb-close:visible,#panel .panel-dismiss:visible').first().click();await controls.waitFor();
  const labels=await controls.getByRole('button',{name:/^Echo [ABC] · /}).allTextContents(),correct=labels.find(t=>t.endsWith(interval+'s'));assert.ok(correct,'Catdex evidence must identify an answer');
  await click(correct,controls);await controls.waitFor({state:'hidden'});
 }
 try{
  await page.goto(origin+'/cat-bond/?lang=en&rpgDev=1');
  await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
  await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();await scene(start);
  assert.ok(!(await view()).completed.includes(start),'Chapter start is not already completed');
  await page.waitForFunction(()=>['map','yard'].includes(__game.scene));
  // Continue can restore to the atlas rather than directly to its region.
  // Navigate via the actual visible next-scene control; never set WorldMap state.
  if(await page.evaluate(()=>__game.scene==='map'&&WorldMap.mode!=='region')){
   await page.locator('[data-next-scene="'+start+'"]:visible').click();
  }
  await page.waitForFunction(()=>WorldMap.mode==='region'||__game.scene==='yard');
  if(['finale','epilogue'].includes(chapter)&&await page.evaluate(()=>__game.scene==='yard')){
   const travel=page.getByRole('button',{name:'Explore',exact:true});
   if(await travel.isVisible())await travel.click();
   else {await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-explore"]').click();}
   await page.locator('[data-next-scene="'+start+'"]:visible').click();
   await page.waitForFunction(()=>WorldMap.mode==='region');
  }
  if(chapter==='harbor'){
   await talk('Qilan');await dialogue('harbor:H-01');await scene('harbor:H-02');
   await talk('Jiedeng');await dialogue('harbor:H-02','Comfort Qilan first');await scene('harbor:H-03');
   await click('Inspect the ebb marks · 1/2');await page.waitForFunction(()=>!!State.S.resonanceExploration.interactions['harbor:H-03:tide:0']);await click('Find the dry steps · 2/2');await page.waitForFunction(()=>!!State.S.resonanceExploration.interactions['harbor:H-03:tide:1']);await puzzle('Tide cave logbook',['Ebb mark','Dry steps','Logbook chest']);await dialogue('harbor:H-03');await scene('harbor:H-04');
   await click('Talk to Qilan');await page.locator('.res-host[data-scene="harbor:H-04"]').waitFor();await dialogue('harbor:H-04','Prioritize rescue');await puzzle('Storm boat',['Secure','Secure','Signal','Guide','Guide','Signal']);await puzzle('Lighthouse mirrors',['Left mirror','Left mirror','Center mirror','Center mirror','Right mirror']);await dialogue('harbor:H-04');await scene('harbor:H-05');
   await restore('Lighthouse sanctuary',['Left mirror','Center mirror','Center mirror','Right mirror'],['Qilan','Jiedeng'],'Returning Tides',[low,high,mid]);await dialogue('harbor:H-05');
  }else if(chapter==='forest'){
   await talk('Yahe');await dialogue('forest:R-01');await scene('forest:R-02');
   for(const label of ['Forest floor · Scattered herbs · 1/3','Canopy · Moving roots · 2/3','Root cavern · Medicine and sick roots · 3/3'])await click(label);
   await op('explore:scent-trail');await dialogue('forest:R-02','Prioritize the gardens');await scene('forest:R-03');
   await click('Meet Yahe · Stabilize the channel');await op('rescue:steady-channel');await click('Inspect the wet water marks');await op('explore:water-marks');await battle('Dispel the mimicking echo','battle:root-echo');await click('Free the roots · Rescue the cats');await op('rescue:trapped-cats');await dialogue('forest:R-03');await scene('forest:R-04');
   await restore('Ancient-root sanctuary',['Upstream','Branch','Roots'],['Yahe','Yuchuan'],'Living Roots',[mid,low,high]);await dialogue('forest:R-04');
  }else if(chapter==='forge'){
   await puzzle('Workshop · Build a safe lantern',['Fit frame','Fit relief valve','Light safely']);await talk('Xiaomao');await dialogue('forge:E-01');await scene('forge:E-02');
   for(const label of ['Recover the frame · 1/3','Recover the old pipe · 2/3','Recover the relief valve · 3/3'])await click(label);
   await puzzle('Safety blueprint',['Frame','Pipes','Valve']);await dialogue('forge:E-02','Publish verified safety findings now');await scene('forge:E-03');
   await dialogue('forge:E-03');await puzzle('Furnace controls',['Heat','Heat','Heat','Heat','Vent','Vent','Vent']);await dialogue('forge:E-03');await battle('Forge guardian','battle:forge-guardian','forge');await scene('forge:E-04');
   await dialogue('forge:E-04');await restore('Hearth sanctuary',['Heat','Heat','Heat','Heat','Vent'],['Jinpo','Xiaomao'],'Song of Ember',[high,mid,low]);await dialogue('forge:E-04');
  }else if(chapter==='sky'){
   await fly('Catch the mail pouch · Practice gliding',[.65,.34,.64]);await talk('Yuanfan');await dialogue('sky:S-01');await scene('sky:S-02');
   await fly('Flight recorder',[.68,.29,.66]);await dialogue('sky:S-02','Let Yuanfan lead');await scene('sky:S-03');
   await fly('Joint gliding platform',[.29,.72,.31]);await dialogue('sky:S-03');await click('Isolated mail station · Deliver the pouch');await scene('sky:S-04');
   await talk('Muling');await dialogue('sky:S-04','Sit with her for a while');await scene('sky:S-05');
   await fly('Windwing sanctuary',[.67,.30,.64]);await invite('Lingyu');await invite('Yuanfan');await puzzle('Open Sky',[mid,high,low]);await dialogue('sky:S-05');
  }else if(chapter==='library'){
   await talk('Baikan');await puzzle('Sealed archive · Review records',['Public history','Living subjects','Seal notice']);await dialogue('library:M-01','Let affected families review personal records first');await scene('library:M-02');
   await puzzle('Ground floor · Reflection gallery',['West mirror','Middle mirror','Middle mirror','Middle mirror','East mirror','East mirror']);await puzzle('Upper floor · Sealed mural',['Fallen star','Broken tongue','Emergency anchor']);await libraryEcho();
   await battle('Archive echo · Guardian illusion','battle:library-echo');await dialogue('library:M-02');await scene('library:M-03');
   await talk('Muling');await dialogue('library:M-03','I feel hurt');await scene('library:M-04');await puzzle('Hidden ledger · Resonance routes',['Original routes','Seal loosened','Inward routing']);await dialogue('library:M-04','I need some distance');await scene('library:M-05');
   await talk('Moye');await puzzle('Six-region model · Compare the two routes',['Converge inward','Connect neighbors','Receive distinct replies']);await dialogue('library:M-05');await restore('Moonmirror sanctuary',['Moon window','Neighbor bridge','Reciprocal reply'],['Moye','Baikan'],'Reflections',[high,low,mid]);await dialogue('library:M-05');
  }else if(chapter==='starfall'){
   await talk('Lichuan');await talk('Xingya');await puzzle('Verify the stars · Guide the caravan',['Right beacon','Left beacon','Middle beacon']);await dialogue('starfall:F-01','Let Xingya coordinate repairs');await scene('starfall:F-02');
   await click('Crater · Impact fragment');await op('explore:crater-fragment');await puzzle('Hollow Echo illusions',['Middle beacon','Right beacon','Left beacon']);await puzzle('Star chart',['Outer ring','Outer ring','Outer ring','Middle ring','Inner ring','Inner ring']);await click('Ruins · Sanctuary record');await op('explore:ruin-fragment');await click('Observatory · Complete record');await op('explore:catastrophe-record');await cinema('starfall:F-02','Remember the choice');
   await talk('Muling');await dialogue('starfall:F-03');await scene('starfall:F-04');await battle('Observatory guardian · Echo orbit','battle:observatory-echo');
   await puzzle('Distributed observatory',['West','Relay','East']);await restore('Starfall sanctuary',['Outer ring','Middle ring','Middle ring','Middle ring','Inner ring'],['Xingya','Lichuan'],'Beyond Stars',[low,mid,high]);await dialogue('starfall:F-04');await cinema('starfall:F-05','Watch the story scene');
  }else if(chapter==='finale'){
   await battle('Approach the Star Bell','battle:inward-gates','finale');await dialogue('finale:B-01','Muling, stop and hear everyone');await scene('finale:B-02');
   await battle('Approach the Star Bell','battle:identify-echo','finale');await dialogue('finale:B-02');await scene('finale:B-03');
   await battle('Approach the Star Bell','battle:central-echo','finale');await dialogue('finale:B-03');
   await click('Help Muling release the last lock');const latch=page.getByRole('button',{name:'Hold the bell chain',exact:true});await latch.waitFor();await latch.focus();await page.keyboard.down('Space');try{await page.waitForTimeout(1800);}finally{await page.keyboard.up('Space');}
   await scene('finale:B-04');await cinema('finale:B-04','Watch the story scene');
  }else if(chapter==='epilogue'){
   await talk('Qilan');await cinema('epilogue:E-01','Revisit the restored regions');await scene('epilogue:E-02');if(await page.evaluate(()=>__game.scene!=='yard'))await page.locator('[data-next-scene="epilogue:E-02"]:visible').click();await page.waitForFunction(()=>__game.scene==='yard');await talk('Muling');await dialogue('epilogue:E-02','Give everyone some time');await scene('epilogue:E-03');await talk('Muling');await dialogue('epilogue:E-03');
   await click('Give Muling the key');await page.getByRole('heading',{name:'THE BELL RINGS AGAIN'}).waitFor();await shot('ending');assert.equal((await view()).ending,true);
  }
  if(next)await scene(next);
  const final=await page.evaluate(()=>({view:CatBondResonance.view(),snapshot:CatBondResonance.snapshot()}));
  const missing=expected.flatMap(s=>s.requires.filter(op=>!final.snapshot.evidence[s.id]?.includes(op)).map(op=>s.id+'/'+op));
  assert.deepEqual(missing,[],'Every required chapter operation must be durably recorded');
  assert.ok(expected.every(s=>final.view.completed.includes(s.id)),'All chapter scenes must be completed');
  assert.deepEqual(errors,[]);
  return {chapter,status:'passed',start,next,scenes:expected.map(s=>s.id),readLines,steps,stagingArt:chapter==='starfall'||chapter==='finale'||chapter==='epilogue'};
 }catch(e){
  await shot('FAIL').catch(()=>{});const observed=await view().catch(()=>null);
  return {chapter,status:'failed',start,next,error:String(e).slice(0,2500),stack:String(e.stack||'').slice(0,3000),lastActions:steps.slice(-5),observedScene:observed?.current?.id,remaining:observed?.objective,completed:expected.filter(s=>observed?.completed.includes(s.id)).map(s=>s.id),readLines,steps,pageErrors:errors};
 }finally{await context.close();}
}
try{
 // Keep the chapter runs independent; report every failure instead of aborting on the first.
 for(const chapter of requested){
  let result;try{result=await run(chapter);}catch(e){result={chapter,status:'failed',error:String(e)};}
  results.push(result);
  await fs.writeFile(out+'/index.json',JSON.stringify({provenance:'synthetic chapter starts; real inputs throughout each chapter',results},null,2));
  console.log('CHAPTER ACCEPTANCE',JSON.stringify({chapter,status:result.status,scene:result.observedScene,remaining:result.remaining,completed:result.scenes||result.completed,lastActions:result.lastActions,stack:result.stack?.split('\n').slice(-4).join('\n'),error:result.error}));
 }
}finally{await browser.close();}
if(results.some(r=>r.status!=='passed'))process.exitCode=1;
