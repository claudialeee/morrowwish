// Engine-model player knowledge packets. No browser evidence or real saves are implied.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {makeEngine} from '../public/cat-bond/js/resonance/engine.mjs';
const out=process.argv[2]||'artifacts/cat-bond-experience';
await fs.mkdir(out+'/knowledge',{recursive:true});
const ok=(r,label)=>assert.equal(r.ok,true,label+': '+r.reason);
const routes=[];
const late=new Set(['mechanism:muling-unlock','npc:public-accountability','npc:second-garden-key']);
// Three economical counterfactuals cover all 2/3-option authored choices,
// both opening variants, and a no-optional-cargo path. This is NOT exhaustive
// cross-product or a human/player behavior model.
for(let variant=0;variant<3;variant++){
 let e=makeEngine(campaign);
 const id=['met-first-choices','skip-second-choices','met-third-choices'][variant],events=[];
 const coveredChoices=[];
 const chapters={};
 const emit=(s,event)=>{events.push({scene:s.id,...event});(chapters[s.chapter]??=[]).push({scene:s.id,...event});};
 for(const scene of campaign.scenes){
  assert.equal(e.view().current.id,scene.id);
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
  ok(e.finish(),scene.id+' finish');
  e=makeEngine(campaign,e.snapshot()); // verify engine-only reload each scene
 }
 assert.ok(e.view().ending);
 assert.equal(e.view().cargoComplete,false);
 const snapshot=e.snapshot();
 for(const [chapter,entries] of Object.entries(chapters)){
   // Each packet includes only the current chapter, not the future script.
   await fs.writeFile(out+'/knowledge/'+id+'-'+chapter+'.json',JSON.stringify({source:'engine-model dialogue; not rendered browser transcript',route:id,chapter,entries},null,2));
 }
 routes.push({id,completed:snapshot.completed.length,choices:coveredChoices,ending:true,cargoComplete:false,muling:e.view().muling});
}
const expected=campaign.scenes.flatMap(s=>s.choices.map(c=>s.id+'/'+c.id));
const observed=new Set(routes.flatMap(r=>r.choices));
const missing=expected.filter(c=>!observed.has(c));
assert.deepEqual(missing,[],'choice options uncovered');
await fs.writeFile(out+'/knowledge/coverage.json',JSON.stringify({routes,expectedChoices:expected.length,observedChoices:observed.size,limitations:['Engine operation evidence is simulated, not obtained from actual player input.','Opening, ambient interactions, UI context, visuals, audio and player reactions are not represented by these packets.','Three routes cover choice options, not all combinations.']},null,2));
console.log('Model coverage:',routes.length,'routes,',routes[0].completed,'scenes each,',observed.size,'choice options; no optional cargo required');
