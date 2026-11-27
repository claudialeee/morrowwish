// Complete chapter acceptance using real browser inputs from isolated synthetic chapter starts.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {attachExperienceRecorder,captureExperienceMilestone} from './cat-bond-experience-recorder.mjs';
const root=process.argv[2]||'artifacts/cat-bond-experience',out=root+'/chapter-acceptance',origin='http://127.0.0.1:8765';
await fs.mkdir(out,{recursive:true});
process.env.CAT_BOND_EXPERIENCE='1';
const order=['harbor','forest','forge','sky','library','starfall','finale','epilogue'];
const requested=process.env.CAT_BOND_CHAPTERS?.split(',')||order;
assert.ok(requested.every(c=>order.includes(c)));
const browser=await chromium.launch({headless:true});
const results=[];
const continuous=process.env.CAT_BOND_CONTINUOUS==='1';let earnedSave=null;
if(continuous)assert.deepEqual(requested,order,'Fresh campaign must cover every chapter in sequence');
async function run(chapter){
 const expected=campaign.scenes.filter(s=>s.chapter===chapter),start=expected[0].id;
 const next=campaign.scenes[campaign.scenes.findIndex(s=>s.id===expected.at(-1).id)+1]?.id||null;
 const fixture=continuous?null:JSON.parse(await fs.readFile(root+'/synthetic-checkpoints/'+start.replace(':','-')+'.json','utf8'));
 if(fixture)assert.equal(fixture.provenance,'synthetic engine-model browser-restored');
 const context=await browser.newContext({...(continuous?(earnedSave?{storageState:earnedSave}:{}):{storageState:fixture.storageState}),viewport:{width:1440,height:900}});
 await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort();});
 const page=await context.newPage(),errors=[],readLines=[],steps=[],battleMeasurements=[];
 page.setDefaultTimeout(18000);page.on('pageerror',e=>errors.push(e.message));
 await attachExperienceRecorder(context,page,{id:(continuous?'fresh-':'chapter-')+chapter,root:out,synthetic:!continuous,chapterEntry:continuous?null:start});
 const view=()=>page.evaluate(()=>CatBondResonance.view());
 const scene=id=>page.waitForFunction(id=>{const v=CatBondResonance.view();return v.current?.id===id||(id==='epilogue:E-01'&&v.current?.id==='epilogue:E-02'&&v.completed.includes(id));},id,{timeout:35000});
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
   const canChoose=!v.choice&&v.current.choices.length>0&&(v.current.choiceTiming==='beforeAction'||v.cursor===(v.current.choiceAt??v.current.lines.length));
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
   if(/^library:M-0[345]$/.test(id)){
    const body=dlg.locator('.res-body'),panel=dlg.locator('.res-dialogue');
    const [b,p]=await Promise.all([body.boundingBox(),panel.boundingBox()]);
    assert.ok(b&&p&&b.width>=p.width*.9&&b.x>=0&&b.x+b.width<=1441,'Library reveal dialogue must occupy its full readable row');
    if(v.cursor===0||v.cursor===v.current.lines.length-1)await page.waitForFunction(()=>{const stage=document.querySelector('.library-reveal-stage');const img=stage?.querySelector('.library-reveal-painting.is-current');return stage?.dataset.ready==='true'&&img&&Number(getComputedStyle(img).opacity)>=.95;});
   }
   if(v.cursor===0||v.cursor===v.current.lines.length-1)await shot(id+'-'+v.cursor);
   await page.waitForFunction(()=>!document.querySelector('.res-host .res-skip-top')?.disabled);
   await dlg.locator('.res-line').click();
   await page.waitForFunction(({id,cursor})=>{const v=CatBondResonance.view();return v.current?.id!==id||v.cursor>cursor;},{id,cursor:v.cursor});
  }
  throw Error('Dialogue loop '+id);
 }
 let checkedPuzzleLayout=false;
 async function checkPuzzleLayout(){
  const rail=page.locator('.rw-dedicated-rail'),surface=page.locator('.rw-world .rw-surface');
  await rail.waitFor();
  const measure=async()=>{try{await page.waitForFunction(()=>{const a=document.querySelector('.rw-dedicated-rail'),b=document.querySelector('.rw-world .rw-surface');if(!a||!b)return false;const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return x.width>0&&y.width>0&&(x.left>=y.right-1||y.bottom<=x.top+1||x.bottom<=y.top+1||y.left>=x.right-1);},null,{timeout:5000});}catch(e){const layout=await page.evaluate(()=>Object.fromEntries(['.rw-world','.rw-shell','.rw-surface','.rw-dedicated-rail'].map(sel=>{const el=document.querySelector(sel);if(!el)return [sel,null];const r=el.getBoundingClientRect(),s=getComputedStyle(el);return [sel,{rect:r.toJSON(),classes:el.className,display:s.display,inset:s.inset,width:s.width,height:s.height,gridArea:s.gridArea}]})));throw Error('Minigame layout overlap '+JSON.stringify(layout),{cause:e});}
   assert.ok(await rail.locator('.rw-minigame-title').isVisible(),'Minigame goal is visible');
   assert.ok(await rail.locator('.rw-minigame-hint').isVisible(),'Minigame controls are explained');
   const [a,b]=await Promise.all([rail.boundingBox(),surface.boundingBox()]);
   assert.ok(a&&b&&b.width>80&&b.height>45,'Playable scene is not collapsed');
   assert.ok(a.x>=-1&&a.y>=-1&&a.x+a.width<=page.viewportSize().width+1&&a.y+a.height<=page.viewportSize().height+1,'Controls remain on screen');
  };
  await measure();
  if(!checkedPuzzleLayout){checkedPuzzleLayout=true;const original=page.viewportSize();try{for(const viewport of [{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(viewport);await measure();}}finally{await page.setViewportSize(original);}await measure();}
 }
 async function puzzle(label,inputs){
  const directHarbor={'Tide cave logbook':'explore:tide-logbook','Storm boat':'rescue:storm-boat','Lighthouse mirrors':'puzzle:beam-mirrors','Town bell sanctuary':'repair:harbor','Coming Home':'melody:harbor'};
  if(chapter==='harbor'&&directHarbor[label]){const operation=directHarbor[label];assert.ok((await view()).objective.includes(operation),'Expected required harbor action '+operation);await click(label);await op(operation);await shot(operation);return;}
  await click(label);const controls=page.locator('.rw-puzzle-controls');await controls.waitFor();await checkPuzzleLayout();
  for(const input of inputs)await click(input,controls);
  await controls.waitFor({state:'hidden',timeout:35000});
 }
 async function invite(npc){await click('Invite '+npc);await page.getByRole('button',{name:'Invite '+npc,exact:true,includeHidden:true}).waitFor({state:'detached'});}
 async function restore(label,inputs,people,melody,notes){await puzzle(label,inputs);for(const npc of people)await invite(npc);await puzzle(melody,notes);}
 const low='Dew · Low',mid='Starlight · Middle',high='Flower bell · High';
 async function flyWaterfall(label){
  await click(label);const status=page.locator('[data-sky-flight-status][data-route="open"]');await status.waitFor();await checkPuzzleLayout();
  const box=await page.locator('.rw-surface').boundingBox();assert.ok(box,"flight surface");
  await page.mouse.click(box.x+box.width*.35,box.y+box.height*.30);
  // Route is continuous, not a three-gate sequence. Read only visual progress via
  // the canvas status; the underlying flight completion must come from real pointer input.
  await page.waitForFunction(()=>Number(document.querySelector('[data-sky-flight-status]')?.dataset.progress)>=.74,{timeout:20000});
  await page.mouse.click(box.x+box.width*.35,box.y+box.height*.50);
  await status.waitFor({state:'hidden',timeout:20000});
}
 async function fly(label,heights){
  await click(label);const status=page.locator('[data-sky-flight-status]');await status.waitFor();await checkPuzzleLayout();const box=await page.locator('.rw-surface').boundingBox();
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
  const measurement={scene:(await view()).current?.id,operation,type,mode:'auto',initialTeam:before,status:'started',samples:[]};
  battleMeasurements.push(measurement);
  // Read-only observation of the actual game. Keep the last live battle state
  // even when the battle object is destroyed before the result panel appears.
  await page.evaluate(()=>{
   if(window.__cbChapterBattleTrace)clearInterval(window.__cbChapterBattleTrace.timer);
   const trace={samples:[]};
   const sample=()=>{
    const b=window.__game?.battle;
    if(!b||trace.samples.length>=1800)return;
    const finale=b.resonanceFinale;
     trace.samples.push({t:b.t,duoUses:b.duoUses??null,result:b.result??null,
      finale:finale?{elapsed:finale.elapsed,phase:finale.id,nodes:finale.nodes.map(n=>({region:n.region,done:n.done,integrity:n.integrity,progress:n.progress,cleared:n.reply?.cleared??null,interference:n.reply?.interference??null}))}:null,
     team:(b.team||[]).map(f=>({actor:f.cat?.storyActor||f.cat?.species||null,level:f.cat?.level??null,hp:f.hp,maxhp:f.maxhp,alive:f.alive})),
     enemies:(b.enemies||[]).map(f=>({hp:f.hp,maxhp:f.maxhp,alive:f.alive}))});
   };
   sample();trace.timer=setInterval(sample,250);window.__cbChapterBattleTrace=trace;
  });
  try{
  if(type==='forge'){
   for(let i=0;i<240;i++){if(await page.locator('#cb-forge-result').isVisible())break;const support=page.locator('[data-forge-support-button]');if(await support.isVisible()&&await support.isEnabled())await support.click();await page.waitForTimeout(750);}
   await page.locator('#cb-forge-result').waitFor({timeout:180000});await shot(operation+'-result');assert.equal(await page.locator('#cb-forge-result h2').innerText(),'FURNACE STABILIZED');await page.locator('[data-forge-return]').click();
  }else if(type==='finale'){
   if(operation==='battle:identify-echo'){await page.waitForFunction(()=>__game.battle?.resonanceFinale?.probeChanged===true||!!document.getElementById('cb-finale-result'),null,{timeout:30000});await shot(operation+'-live-reply');}
   const result=page.locator('#cb-finale-result');
    if(operation==='battle:central-echo'){
     // The runtime has its own active-simulation time cap. CI rendering may run
     // slower than real time; allow bounded wall-clock headroom, but fail on a frozen simulation.
     const deadline=Date.now()+360000;let lastT=-1,lastAdvance=Date.now();
     while(!await result.isVisible()){
      const state=await page.evaluate(()=>({t:__game.battle?.t,phase:__game.battle?.resonanceFinale?.id,elapsed:__game.battle?.resonanceFinale?.elapsed}));
      if(Number.isFinite(state.t)&&state.t>lastT){lastT=state.t;lastAdvance=Date.now();}
      if(Date.now()-lastAdvance>35000||Date.now()>deadline)throw Error('Central echo simulation stalled or exceeded bounded wall time: '+JSON.stringify(state));
      if(errors.length)throw Error('Central echo browser error: '+errors.join('; '));
      await page.waitForTimeout(1000);
     }
    }else await result.waitFor({timeout:240000});
    await shot(operation+'-result');assert.equal(await result.getAttribute('data-finale-outcome'),'saved');await page.locator('[data-finale-return]').click();
  }else{
   await page.waitForFunction(()=>__game.scene==='map',null,{timeout:180000});
   await page.locator('#library-battle-ok').waitFor();await shot(operation+'-result');await page.locator('#library-battle-ok').click();
  }
  await op(operation);if(operation==='battle:central-echo')assert.equal(await page.evaluate(()=>CatBondResonance.snapshot().support.length),6,'All six regions must have answered');
  measurement.status='verified win';
  }finally{
   measurement.wallSeconds=(Date.now()-t)/1000;
   measurement.samples=await page.evaluate(()=>{
    const trace=window.__cbChapterBattleTrace;
    if(!trace)return [];
    clearInterval(trace.timer);delete window.__cbChapterBattleTrace;return trace.samples;
   }).catch(()=>[]);
   measurement.last=measurement.samples.at(-1)||null;
    if(measurement.status!=='verified win')console.error('BATTLE LAST STATE',operation,JSON.stringify(measurement.last));
   await fs.writeFile(out+'/'+chapter+'-combat.json',JSON.stringify({provenance:'synthetic chapter start, actual browser battles',chapter,battles:battleMeasurements},null,2));
  }
  assert.ok(measurement.samples.length,'Actual combat telemetry is required: '+operation);
  steps.push({battle:operation,wallSeconds:measurement.wallSeconds,team:before,result:measurement.status,gameSeconds:measurement.last?.t,duoUses:measurement.last?.duoUses});
 }
 async function cinema(id,label){
  await scene(id);await page.waitForFunction(()=>CatBondChapterCinematics.developmentReady(),null,{timeout:15000});await click(label);
  await page.locator('.cbcp-art').first().waitFor();await shot(id+'-cinematic');
  if(id==='finale:B-04'){const reply=page.getByRole('button',{name:'Ring twice in reply',exact:true});await reply.waitFor();await shot(id+'-ring-reply');await reply.click();}
  if(id==='starfall:F-02'&&!continuous){await page.waitForFunction(()=>{const root=document.querySelector('.cbcp-root');if(root?.dataset.frameId!=='starfall:F-02-last-patrol')return false;const art=root.querySelector('.cbcp-art[src$="lantern-vault.webp"]');const layers=[...root.querySelectorAll('.cbcp-layer')];return art&&art.complete&&Number(getComputedStyle(art).opacity)>=.95&&layers.length>=3&&layers.every(x=>x.complete&&x.naturalWidth>0&&Number(getComputedStyle(x).opacity)>=.75);},{},{timeout:45000});await shot(id+'-lamp-handoff');await page.locator('.cbcp-skip').click();const summary=page.locator('[data-canon-acknowledgement="starfall:F-02"]');await summary.waitFor();assert.match(await summary.innerText(),/promised Muling/);assert.equal((await view()).current.id,id);await shot(id+'-skip-summary');await click('Continue',summary);}
  await page.waitForFunction(id=>CatBondResonance.view().current?.id!==id,id,{timeout:180000});
 }
 async function libraryEcho(){
  await click('Two Mulings in the mirror');const controls=page.locator('.rw-puzzle-controls');await controls.waitFor();await checkPuzzleLayout();
  const status=controls.locator('[data-mirror-response]');await status.waitFor();
  await click('Choose the left cat',controls);await status.waitFor();assert.equal(await status.getAttribute('data-position'),'0','guess cannot complete the scene');
  await click('Move and ring',controls);await status.waitFor();
  const left=Number(await status.getAttribute('data-left-facing')),right=Number(await status.getAttribute('data-right-facing')),position=Number(await status.getAttribute('data-position'));
  assert.ok(position!==0&&(left===position)!==(right===position),'new action must distinguish the cats');
  await shot('mirror-new-response');await click(left===position?'Choose the left cat':'Choose the right cat',controls);
  await controls.waitFor({state:'hidden'});
 }
 try{
  await page.goto(origin+'/cat-bond/?lang=en&rpgDev=1');
  await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
  if(continuous&&!earnedSave){
   assert.equal(chapter,'harbor');await page.locator('#intro-start').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();await scene('prologue:P-05');
   await page.locator('#cb-player-first-intro').getByRole('button',{name:'Start exploring',exact:true}).click();
   // Start from a new slot, no fixture or direct state mutation.
   await page.locator('.sg-prologue-guide').getByRole('button',{name:/Next scene/}).click();await scene(start);
  }else{await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();await scene(start);}
  assert.ok(start==='epilogue:E-01'||!(await view()).completed.includes(start),'Chapter start is not already completed');
  await page.waitForFunction(()=>['map','yard'].includes(__game.scene));
  // Continue can restore to the atlas rather than directly to its region.
  // Navigate via the actual visible next-scene control; never set WorldMap state.
  if(await page.evaluate(region=>__game.scene==='map'&&(WorldMap.mode!=='region'||(region!=='epilogue'&&WorldMap.currentRegion!==region)),chapter==='finale'?'starfall':chapter)){
   await page.locator('[data-next-scene="'+start+'"]:visible').click();
  }
  await page.waitForFunction(()=>WorldMap.mode==='region'||__game.scene==='yard');
  if(chapter==='finale'&&await page.evaluate(()=>__game.scene==='yard')){
   const travel=page.getByRole('button',{name:'Explore',exact:true});
   if(await travel.isVisible())await travel.click();
   else {await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-explore"]').click();}
   await page.locator('[data-next-scene="'+start+'"]:visible').click();
   await page.waitForFunction(()=>WorldMap.mode==='region');
  }
  // Verify the actual canvas affordances rather than only the menu buttons.
  if(await page.evaluate(()=>__game.scene==='map'&&WorldMap.mode==='region')){
   await page.waitForFunction(()=>JSON.parse(document.querySelector('.rw-surface')?.dataset.affordances||'[]').length>0);
   const markers=await page.locator('.rw-surface').evaluate(el=>JSON.parse(el.dataset.affordances||'[]'));
   for(const m of markers){assert.ok(m.x>=0&&m.x<=960&&m.y>=0&&m.y<=540,'Marker inside world: '+m.t);if(m.rect)assert.ok(m.rect.x>=0&&m.rect.y>=0&&m.rect.x+m.rect.w<=960&&m.rect.y+m.rect.h<=540,'Label inside world: '+m.t);}
   await shot('interaction-markers');
  }
  if(chapter==='harbor'){
   await talk('Qilan');await dialogue('harbor:H-01');await scene('harbor:H-02');
   await click('Chase the runaway chime');const chase=page.locator('[data-spatial="chase"]');await chase.waitFor();await page.keyboard.down('ArrowUp');await page.waitForTimeout(920);await page.keyboard.up('ArrowUp');await page.keyboard.down('ArrowRight');await chase.waitFor({state:'hidden',timeout:15000});await page.keyboard.up('ArrowRight');await chase.waitFor({state:'hidden',timeout:30000});await dialogue('harbor:H-02');await scene('harbor:H-03');
   await talk('Yandeng');await dialogue('harbor:H-03');await scene('harbor:H-04');
   await battle('Belllight beast','battle:chime-beast');await dialogue('harbor:H-04');await scene('harbor:H-05');
   await restore('Town bell sanctuary',['Left mirror','Center mirror','Center mirror','Right mirror'],['Qilan','Yandeng'],'Coming Home',[low,high,mid]);await dialogue('harbor:H-05');
  }else if(chapter==='forest'){
   await talk('Yahe');await dialogue('forest:R-01');await scene('forest:R-02');
   await puzzle('Moonleaf bridge',['Fork','Roots','Turn moonleaf','Roots','Free the trapped kitten','Far bank']);await dialogue('forest:R-02');await scene('forest:R-03');
   await puzzle('Break the forest loop',['Fork','Canopy','Turn moonleaf','Canopy','Far bank']);await dialogue('forest:R-03');await scene('forest:R-04');
   await restore('Ancient-root sanctuary',['Upstream','Branch','Roots'],['Yahe','Yuchuan'],'Living Roots',[mid,low,high]);await dialogue('forest:R-04');
  }else if(chapter==='forge'){
   await puzzle('Lantern festival · Shadow show',['Cat','Aim left','Aim right','Continue festival']);await talk('Xiaomao');await dialogue('forge:E-01');await scene('forge:E-02');
   await puzzle('Light the stone bridge',['Cross the bridge','Aim left','Aim right','Cross the bridge']);await dialogue('forge:E-02');await scene('forge:E-03');
   await battle('Shadow beast','battle:shadow-beast');await dialogue('forge:E-03');await scene('forge:E-04');
   await restore('Lantern sanctuary',['Heat','Heat','Heat','Heat','Vent'],['Jinpo','Xiaomao'],'Song of Ember',[high,mid,low]);await dialogue('forge:E-04');
  }else if(chapter==='sky'){
   await flyWaterfall('Catch the wind · Practice gliding');await talk('Yuanfan');await dialogue('sky:S-01');await scene('sky:S-02');
   await flyWaterfall('Find the moon gate · Cloud route');await dialogue('sky:S-02','Let Yuanfan lead');await scene('sky:S-03');
   await flyWaterfall('Joint gliding platform');await dialogue('sky:S-03');await click('Windwing sanctuary');await op('repair:sky');await invite('Lingyu');await invite('Yuanfan');await puzzle('Open Sky',[mid,high,low]);await dialogue('sky:S-03');await scene('sky:S-04');assert.ok((await view()).melodies.includes('sky'),'Sky must answer before the tea scene');
   await talk('Muling');const lookout=page.locator('.sky-lookout-view');await lookout.waitFor();await click('Walk around the lookout');assert.equal(await lookout.getAttribute('data-pose'),'walk');await click('Sit beside Muling');assert.equal(await lookout.getAttribute('data-pose'),'sit');await shot('sky-lookout-sit');await dialogue('sky:S-04','Sit with her for a while');await scene('sky:S-05');
   await dialogue('sky:S-05');
  }else if(chapter==='library'){
   await talk('Baikan');await dialogue('library:M-01');await scene('library:M-02');
   await libraryEcho();await dialogue('library:M-02');await click('Moonmirror sanctuary');await op('repair:library');await invite('Moye');await invite('Baikan');await puzzle('Reflections',[high,low,mid]);await dialogue('library:M-02');await scene('library:M-03');assert.ok((await view()).melodies.includes('library'),'Library must answer before the identity reveal');
   await talk('Muling');await dialogue('library:M-03','I feel hurt');await scene('library:M-04');await puzzle('Public records · Investigation',['Ask about the borrowed map']);await dialogue('library:M-04','I need some distance');await scene('library:M-05');
   await talk('Moye');await click('Six-region model · Compare the two routes');const routes=page.locator('.rw-puzzle-controls');await routes.waitFor();await checkPuzzleLayout();const surface=page.locator('.rw-surface'),box=await surface.boundingBox();assert.ok(box);const dragBell=async(a,b)=>{await page.mouse.move(box.x+box.width*a[0],box.y+box.height*a[1]);await page.mouse.down();await page.mouse.move(box.x+box.width*b[0],box.y+box.height*b[1],{steps:8});await page.mouse.up();};await dragBell([.5,.40],[.5,.54]);await page.getByText('Routes explored 1/2',{exact:true}).waitFor();await shot('route-inward');await dragBell([.5,.40],[.5+.22*Math.sqrt(3)/2,.47]);await page.getByText('Routes explored 2/2',{exact:true}).waitFor();await shot('route-neighbors');await click('Finish demonstration',routes);await dialogue('library:M-05');
  }else if(chapter==='starfall'){
   await talk('Lichuan');await talk('Xingya');await puzzle('Walk on starlight',['Jump to stone 2','Jump to stone 4','Jump to stone 6','Jump to stone 8']);await dialogue('starfall:F-01');await scene('starfall:F-02');
   assert.deepEqual((await view()).objective,['explore:catastrophe-record','cinematic:starfall-memory']);await click('Observatory · Complete record');await op('explore:catastrophe-record');await cinema('starfall:F-02','Remember the choice');
   await talk('Muling');await dialogue('starfall:F-03');await scene('starfall:F-04');
   await puzzle('Test the neighboring bells',['Ring the local bell']);await restore('Starfall sanctuary',['Outer ring','Middle ring','Middle ring','Middle ring','Inner ring'],['Xingya','Lichuan'],'Beyond Stars',[low,mid,high]);await dialogue('starfall:F-04');await cinema('starfall:F-05','Watch the story scene');
  }else if(chapter==='finale'){
   await battle('Approach the Star Bell','battle:inward-gates','finale');await dialogue('finale:B-01');await scene('finale:B-02');
   await battle('Approach the Star Bell','battle:identify-echo','finale');await dialogue('finale:B-02');await scene('finale:B-03');
   await battle('Approach the Star Bell','battle:central-echo','finale');await dialogue('finale:B-03');
   await click('Help Muling release the last lock');const latch=page.getByRole('button',{name:'Hold the bell chain',exact:true});await latch.waitFor();await latch.focus();await page.keyboard.down('Space');try{await page.waitForTimeout(1800);}finally{await page.keyboard.up('Space');}
   await scene('finale:B-04');await cinema('finale:B-04','Watch the story scene');
  }else if(chapter==='epilogue'){
   if(await page.evaluate(()=>__game.scene!=='yard'))await page.locator('[data-next-scene="epilogue:E-01"]:visible').click();await page.waitForFunction(()=>__game.scene==='yard');await scene('epilogue:E-02');if(!await page.locator('.res-host[data-scene="epilogue:E-02"]').isVisible())await talk('Muling');await dialogue('epilogue:E-02','Give everyone some time');await scene('epilogue:E-03');await talk('Muling');await dialogue('epilogue:E-03');
   await click('Give Muling the key');await page.getByRole('heading',{name:'THE BELL RINGS AGAIN'}).waitFor();await shot('ending');assert.equal((await view()).ending,true);await captureExperienceMilestone(page,'ending');
  }
  if(next)await scene(next);
  const final=await page.evaluate(()=>({view:CatBondResonance.view(),snapshot:CatBondResonance.snapshot()}));
  const missing=expected.flatMap(s=>s.requires.filter(op=>!final.snapshot.evidence[s.id]?.includes(op)).map(op=>s.id+'/'+op));
  assert.deepEqual(missing,[],'Every required chapter operation must be durably recorded');
  assert.ok(expected.every(s=>final.view.completed.includes(s.id)),'All chapter scenes must be completed');
  const requiredBattles=expected.flatMap(s=>s.requires.filter(op=>op.startsWith('battle:')));
  assert.deepEqual(requiredBattles.filter(op=>!battleMeasurements.some(b=>b.operation===op&&b.status==='verified win'&&b.samples.length)),[],'Every required battle needs real outcome and telemetry');
  assert.deepEqual(errors,[]);
  if(continuous){
   const expectedCount=campaign.scenes.indexOf(expected.at(-1))+1+(next==='epilogue:E-01'&&final.snapshot.completed.includes(next)?1:0);assert.equal(final.snapshot.completed.length,expectedCount,'Fresh route must preserve all previous chapter history');
   earnedSave=await context.storageState();await fs.writeFile(out+'/fresh-earned-save-'+chapter+'.json',JSON.stringify({provenance:'fresh real inputs, chapter boundary reload',storageState:earnedSave,completed:expectedCount},null,2));
  }
  return {chapter,status:'passed',start,next,scenes:expected.map(s=>s.id),readLines,steps,battleMeasurements:battleMeasurements.map(({samples,...m})=>({...m,sampleCount:samples.length})),stagingArt:chapter==='starfall'||chapter==='finale'||chapter==='epilogue'};
 }catch(e){
  await shot('FAIL').catch(()=>{});const observed=await view().catch(()=>null);
  return {chapter,status:'failed',start,next,error:String(e).slice(0,2500),stack:String(e.stack||'').slice(0,3000),lastActions:steps.slice(-5),observedScene:observed?.current?.id,remaining:observed?.objective,completed:expected.filter(s=>observed?.completed.includes(s.id)).map(s=>s.id),readLines,steps,battleMeasurements:battleMeasurements.map(({samples,...m})=>({...m,sampleCount:samples.length})),pageErrors:errors};
 }finally{await context.close();}
}
try{
 // Keep the chapter runs independent; report every failure instead of aborting on the first.
 for(const chapter of requested){
  let result;try{result=await run(chapter);}catch(e){result={chapter,status:'failed',error:String(e)};}
  results.push(result);
  await fs.writeFile(out+'/index.json',JSON.stringify({provenance:continuous?'fresh slot; real inputs throughout campaign; real save reload at chapter boundaries':'synthetic chapter starts; real inputs throughout each chapter',results},null,2));
  console.log('CHAPTER ACCEPTANCE',JSON.stringify({chapter,status:result.status,scene:result.observedScene,remaining:result.remaining,completed:result.scenes||result.completed,lastActions:result.lastActions,stack:result.stack?.split('\n').slice(-4).join('\n'),error:result.error}));
  if(continuous&&result.status!=='passed')break;
 }
}finally{await browser.close();}
if(results.some(r=>r.status!=='passed'))process.exitCode=1;
