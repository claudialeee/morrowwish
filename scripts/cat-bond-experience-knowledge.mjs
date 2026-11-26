// Engine-model player knowledge packets. No browser evidence or real saves are implied.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {makeEngine} from '../public/cat-bond/js/resonance/engine.mjs';
const out=process.argv[2]||'artifacts/cat-bond-experience';
await fs.mkdir(out+'/knowledge',{recursive:true});
await fs.mkdir(out+'/model-scenes',{recursive:true});
const ok=(r,label)=>assert.equal(r.ok,true,label+': '+r.reason);
const routes=[];
const optionalChecks={ambient:[],side:[],cargo:[],ruins:[]};
function checkOptional(engine,scene){
 for(const activity of campaign.ambient.filter(a=>a.after===scene.id)){
  const id=activity.id,op=activity.operation;
  assert.ok(engine.ambientAvailable(activity.region).some(x=>x.id===id),id+' should unlock');
  assert.equal(engine.ambient(id,'invalid-operation').ok,false,id+' rejects invalid operation');
  const before=engine.snapshot();
  ok(engine.ambient(id,op),id);
  const after=engine.snapshot();
  assert.equal(after.trust[activity.npc],before.trust[activity.npc]+1,id+' trust gain');
  assert.equal(engine.ambient(id,op).ok,false,id+' rejects duplicate');
  assert.ok(!engine.ambientAvailable(activity.region).some(x=>x.id===id),id+' removed after completion');
  assert.deepEqual(makeEngine(campaign,after).snapshot(),after,id+' reload');
  optionalChecks.ambient.push(id);
 }
}
function checkPostgame(engine){
 for(const quest of campaign.side){
  if(quest.id.startsWith('postgame:reunion-'))assert.ok(engine.snapshot().postgame.includes('postgame:letter-'+quest.region),quest.id+' prerequisite');
  assert.equal(engine.postgame(quest.id,'invalid-operation').ok,false);
  ok(engine.postgame(quest.id,quest.operation),quest.id);
  assert.equal(engine.postgame(quest.id,quest.operation).ok,false,quest.id+' duplicate');
  assert.deepEqual(makeEngine(campaign,engine.snapshot()).snapshot(),engine.snapshot(),quest.id+' reload');
  optionalChecks.side.push(quest.id);
 }
 for(const [id,duo] of [['model-first',false],['model-duo',true]]){
  const before=engine.snapshot().ruins;
  ok(engine.ruinsClear(id,duo),id);
  const after=engine.snapshot().ruins;
  assert.equal(after.clears,before.clears+1);
  assert.equal(after.duoClears,before.duoClears+(duo?1:0));
  assert.equal(engine.ruinsClear(id,duo).ok,false);
  optionalChecks.ruins.push(id);
 }
}
function checkCargo(engine){
 for(const [a,b,forward,back] of campaign.links){
  assert.equal(engine.exchange({a,b,stage:'receiveB',actor:b,action:forward}).ok,false,'Cannot receive before sending');
  for(const [i,stage] of ['sendA','receiveB','sendB','receiveA'].entries()){
   const action=[forward,forward,back,back][i],actor=[a,b,b,a][i];
   ok(engine.exchange({a,b,stage,actor,action}),a+'/'+b+'/'+stage);
   assert.equal(engine.exchange({a,b,stage,actor,action}).ok,false,'Duplicate cargo stage');
   assert.deepEqual(makeEngine(campaign,engine.snapshot()).snapshot(),engine.snapshot(),'Cargo reload');
   optionalChecks.cargo.push(a+'/'+b+'/'+stage);
  }
 }
 assert.equal(engine.view().cargoComplete,true);
}
const late=new Set(['mechanism:muling-unlock','npc:public-accountability','npc:second-garden-key']);
// Three economical counterfactuals cover all 2/3-option authored choices,
// both opening variants, two no-cargo paths, and one full optional path. This is NOT exhaustive
// cross-product or a human/player behavior model.
for(let variant=0;variant<3;variant++){
 let e=makeEngine(campaign);
 const id=['met-first-choices','skip-second-choices','met-third-choices'][variant],events=[];
 const coveredChoices=[];
 const chapters={};
 const emit=(s,event)=>{events.push({scene:s.id,...event});(chapters[s.chapter]??=[]).push({scene:s.id,...event});};
 for(const scene of campaign.scenes){
  assert.equal(e.view().current.id,scene.id);
  if(variant===0&&!/^prologue:P-0[1-4]$/.test(scene.id))await fs.writeFile(out+'/model-scenes/'+scene.id.replace(':','-')+'.json',JSON.stringify({scene:scene.id,chapter:scene.chapter,route:id,provenance:'synthetic engine-model state, not player-earned',snapshot:e.snapshot()},null,2));
  if(scene.id==='prologue:P-05'&&variant!==1){ok(e.meetTraveler(),scene.id);emit(scene,{kind:'model-context',text:'Optional traveler encounter completed; browser presentation not captured here.'});}
  if(scene.id==='prologue:P-05'&&variant===1)emit(scene,{kind:'model-context',text:'Optional traveler encounter skipped.'});
  function choose(){
   const c=scene.choices[variant%scene.choices.length];
   emit(scene,{kind:'choice',options:scene.choices.map(x=>x.label),selected:c.label});
   ok(e.choose(c.id),scene.id+' choice');coveredChoices.push(scene.id+'/'+c.id);
  }
  if(scene.choiceTiming==='beforeAction'&&scene.choices.length)choose();
  if(scene.id==='finale:B-03')for(let i=0;i<campaign.regions.length;i++)ok(e.supportAction(campaign.regions[i],campaign.support[i]),'support');
  // The source model can legally record required operations before reading dialogue;
  // do not turn that technical order into claims about the rendered player's knowledge.
  for(const op of scene.requires.filter(x=>!late.has(x)))ok(e.record(scene.id,op),scene.id+' '+op);
  while(e.view().cursor<scene.lines.length){
   const v=e.view();assert.equal(v.lineReady,true,scene.id+' line gate');
   const l=v.current.lines[v.cursor];
   emit(scene,{kind:'dialogue',cursor:v.cursor,speaker:l.speaker,text:l.text});
   ok(e.nextLine(),scene.id+' line');
  }
  if(scene.choiceTiming!=='beforeAction'&&scene.choices.length)choose();
  for(const op of scene.requires.filter(x=>late.has(x)))ok(e.record(scene.id,op),scene.id+' '+op);
  if(variant===2&&scene.id==='starfall:F-04')checkCargo(e);
  ok(e.finish(),scene.id+' finish');
  if(variant===2)checkOptional(e,scene);
  e=makeEngine(campaign,e.snapshot()); // verify engine-only reload each scene
 }
 assert.ok(e.view().ending);
 assert.equal(e.view().cargoComplete,variant===2);
 if(variant===2){for(const q of campaign.side.filter(q=>q.id.startsWith('postgame:reunion-')))assert.equal(e.postgame(q.id,q.operation).ok,false,'Reunion before repair');checkPostgame(e);}
 const snapshot=e.snapshot();
 for(const [chapter,entries] of Object.entries(chapters)){
   // Each packet includes only the current chapter, not the future script.
   await fs.writeFile(out+'/knowledge/'+id+'-'+chapter+'.json',JSON.stringify({source:'engine-model dialogue; not rendered browser transcript',route:id,chapter,entries},null,2));
 }
 routes.push({id,completed:snapshot.completed.length,choices:coveredChoices,ending:true,cargoComplete:e.view().cargoComplete,muling:e.view().muling});
}
assert.equal(new Set(optionalChecks.ambient).size,campaign.ambient.length);
assert.equal(new Set(optionalChecks.side).size,campaign.side.length);
assert.equal(new Set(optionalChecks.cargo).size,campaign.links.length*4);
await fs.writeFile(out+'/knowledge/optional-coverage.json',JSON.stringify({provenance:'engine state-machine only, not real UI actions',...optionalChecks},null,2));
const expected=campaign.scenes.flatMap(s=>s.choices.map(c=>s.id+'/'+c.id));
const observed=new Set(routes.flatMap(r=>r.choices));
const missing=expected.filter(c=>!observed.has(c));
assert.deepEqual(missing,[],'choice options uncovered');
await fs.writeFile(out+'/knowledge/coverage.json',JSON.stringify({routes,expectedChoices:expected.length,observedChoices:observed.size,limitations:['Engine operation evidence is simulated, not obtained from actual player input.','Opening, ambient interactions, UI context, visuals, audio and player reactions are not represented by these packets.','Three routes cover choice options, not all combinations.']},null,2));
console.log('Model coverage:',routes.length,'routes,',routes[0].completed,'scenes each,',observed.size,'choice options; optional coverage separately recorded');
