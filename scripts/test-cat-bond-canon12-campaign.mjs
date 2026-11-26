import assert from "node:assert/strict";
import {campaign} from "../public/cat-bond/js/resonance/campaign.mjs";
import {makeEngine} from "../public/cat-bond/js/resonance/engine.mjs";
import {createExplorer,layouts} from "../public/cat-bond/js/resonance/world-exploration.mjs";
import {createWorldBridge} from "../public/cat-bond/js/resonance/world-bridge.mjs";
import {getSlotRuntime} from "../public/cat-bond/js/resonance/slot-runtime.mjs";
import {skyLaunch} from "../public/cat-bond/js/resonance/sky-flight.mjs";
const ok=(r,m="operation")=>assert.equal(r?.ok,true,m+": "+r?.reason);
for(let variant=0;variant<2;variant++){
 let e=makeEngine(campaign);
 for(const scene of campaign.scenes){
  assert.equal(e.view().current.id,scene.id);
  if(scene.id==="starfall:F-05"){
   const v=e.view();assert.ok(v.ring&&e.snapshot().melodies.length===6);
   assert.equal(v.cargoComplete,variant===1);
   assert.deepEqual(v.current.lines[0].text,scene.lines[0].text);
   assert.deepEqual(makeEngine(campaign,e.snapshot()).view().current.lines[0].text,scene.lines[0].text);
  }
  if(scene.choiceTiming==="beforeAction"&&scene.choices.length)ok(e.choose(scene.choices[variant%scene.choices.length].id),scene.id);
  if(scene.id==="finale:B-03")for(let i=0;i<6;i++)ok(e.supportAction(campaign.regions[i],campaign.support[i]),"support");
  const late=["mechanism:muling-unlock","npc:public-accountability","npc:second-garden-key"];
  for(const op of scene.requires.filter(x=>!late.includes(x)))ok(e.record(scene.id,op),scene.id+" "+op);
  if(variant===1&&scene.id==="starfall:F-04")for(const [a,b,x,y] of campaign.links)for(let i=0;i<4;i++)ok(e.exchange({a,b,stage:["sendA","receiveB","sendB","receiveA"][i],actor:[a,b,b,a][i],action:[x,x,y,y][i]}),"exchange");
  while(e.view().cursor<scene.lines.length){if(scene.choiceAt===e.view().cursor&&!e.view().choice)ok(e.choose(scene.choices[variant%scene.choices.length].id),scene.id+" branch");ok(e.nextLine(),scene.id+" line");}
  if(scene.choiceTiming!=="beforeAction"&&scene.choices.length&&!e.view().choice)ok(e.choose(scene.choices[variant%scene.choices.length].id),scene.id+" choice");
  for(const op of scene.requires.filter(x=>late.includes(x)))ok(e.record(scene.id,op),op);
  ok(e.finish(),scene.id+" finish");e=makeEngine(campaign,e.snapshot());
 }
 assert.ok(e.view().ending&&e.view().ring);assert.equal(e.view().cargoComplete,variant===1);assert.equal(Object.values(e.snapshot().links).reduce((n,l)=>n+l.length,0),variant===1?24:0);assert.ok(e.view().support.every(p=>p.ready));
}
function fixture(id){const i=campaign.scenes.findIndex(x=>x.id===id),s=makeEngine(campaign).snapshot();s.scene=id;s.completed=campaign.scenes.slice(0,i).map(x=>x.id);s.choices={"sky:S-02":"lead","library:M-01":"open","starfall:F-01":"coordinate"};return s;}
// Each tea choice gets exactly its own two lines; no skipped choice or premature finish.
for(const id of ["joke","company","search"]){const e=makeEngine(campaign,fixture("sky:S-04"));assert.equal(e.choose(id).ok,false);assert.equal(e.nextLine().ok,false);ok(e.record("sky:S-04","npc:broken-pendant"));for(let i=0;i<3;i++)ok(e.nextLine());assert.equal(e.nextLine().ok,false);assert.equal(e.finish().ok,false);ok(e.choose(id));assert.deepEqual(e.view().current.lines.slice(3),campaign.scenes.find(s=>s.id==="sky:S-04").choiceResponses[id]);const restored=makeEngine(campaign,e.snapshot());assert.deepEqual(restored.view().current.lines.slice(3),e.view().current.lines.slice(3));ok(restored.nextLine());ok(restored.nextLine());ok(restored.finish());}
const ringLine=campaign.scenes.find(s=>s.id==="starfall:F-05").lines[0].text;
assert.match(ringLine.en,/Each region sent its own reply/);assert.match(ringLine.zh,/自己的回应/);assert.match(ringLine.zh,/这盏灯是哪来的/);
// Cinematic text stays canonical on both cargo routes; no conditional cinematic mutation.
// The two legally progressed routes above verify the line at F-05; a bare fixture cannot satisfy the ring invariant.
function setup(id,region,seed){const s=fixture(id),root={resonance:s,cats:[{uid:"main",species:"jinjc",personality:"gentle"},{uid:"m",species:"story_muling",storyActor:"muling"}],dex:{jinjc:1},coins:0,fish:0,battlePrefs:{teamUids:["main","m"]},resonanceExploration:{location:region,positions:{},interactions:{},pickups:{},cargo:null}};seed?.(root);const State={S:root,activeSlot:()=>"slot1",save:()=>({ok:true}),makeCat:(species,opts)=>({uid:species,species,...opts})};const b=createWorldBridge(State),rt=getSlotRuntime(State);ok(b.enter(region),"enter "+id);return {root,b,rt,x:createExplorer(b,region,{adventureActions:true})};}
function walk(x,p){assert.ok(x.walk(...p),"walk");for(let i=0;i<1000&&x.moving;i++)x.tick(.05);assert.ok(x.near(p),"not near "+p);}
function solve(x){let p=x.puzzle;assert.ok(p,"no actual puzzle");if(p.type==="canonSpatial"){const act=a=>ok(x.spatialAct(a),"spatial "+p.operation);if(p.spatial.kind==="bridge"){act({type:"step",i:1});if(p.operation==="puzzle:moonleaf-loop")act({type:"leaf"});act({type:"step",i:2});act({type:"step",i:4});}else if(p.spatial.kind==="stars"){for(const i of [1,3,5,7])act({type:"step",i});}else if(p.spatial.kind==="light"){act({type:"aim",x:.72});act({type:"cross"});}else{act({type:"target",x:.8,y:.27});for(let i=0;i<2000&&x.puzzle;i++){const r=x.spatialTick(.02);if(r)ok(r,"chase");}}assert.ok(!x.puzzle,"spatial not completed");return;}if(p.type==="skyFlight"){let result;for(let i=0;i<1000&&x.puzzle;i++){const f=x.puzzle.flight,t=f.openGlide?(f.x<.75?.30:.5):(f.x<.24?f.route[0]:f.x<.49?f.route[1]:f.x<.74?f.route[2]:.5);if(!f.started||f.target!==t)x.flightSteer(t);let q=x.flightTick(.05);if(q){result=q;ok(q,"flight");}}assert.ok(result?.ok,"flight fail "+JSON.stringify(x.puzzle?.flight));return;}if(p.type==="pairedWater"){for(const i of [0,0,1,2])ok(x.operate(i),"paired");}else if(["mirrors","water","stars","routing","libraryMirrors"].includes(p.type)){for(let i=0;i<3;i++)for(let j=0;j<10&&x.puzzle&&x.puzzle.values[i]!==p.goal[i];j++)ok(x.operate(i),"dial");}else if(p.type==="heat"){for(let i=0;i<10&&x.puzzle&&x.puzzle.values[0]<p.goal[0];i++)ok(x.operate(0),"heat");for(let i=0;i<10&&x.puzzle&&x.puzzle.values[1]>p.goal[1];i++)ok(x.operate(1),"vent");}else{for(const i of p.goal)ok(x.operate(i),"sequence "+p.type);}assert.ok(!x.puzzle,"still puzzle "+p.type);}
function recordNpc(o,id,region){walk(o.x,layouts[region].castPoints[id]);ok(o.rt.recordNPC({sceneId:o.b.view().current.id,npcId:id,region,token:o.rt.capture()}),"NPC "+id)}
function run(id,region,op,seed,prepare){const o=setup(id,region,seed);prepare?.(o);const p=skyLaunch[op]||layouts[region].features[op];walk(o.x,p);const r=o.x.interact(op);ok(r,id+" "+op);assert.ok(r.puzzle,id+" was auto completed");solve(o.x);assert.ok(!o.b.view().objective.includes(op),id+" proof not saved");return o;}
const forestBridge=run("forest:R-02","forest","puzzle:moonleaf-crossing");
const forestLoop=run("forest:R-03","forest","puzzle:moonleaf-loop");
assert.equal(forestLoop.rt.evidence({sceneId:"forest:R-03",operation:"battle:root-echo",region:"forest",verified:true,outcome:"win",token:forestLoop.rt.capture()}).ok,false);
const oldForest=fixture("forest:R-03");oldForest.evidence["forest:R-03"]=["puzzle:paired-water-gates"];oldForest.cursor=2;delete oldForest.runtimeRevision;assert.equal(makeEngine(campaign,oldForest).view().cursor,0);assert.deepEqual(makeEngine(campaign,oldForest).view().objective,["puzzle:moonleaf-loop"]);
run("harbor:H-02","harbor","puzzle:chime-chase");
const forge=run("forge:E-01","forge","puzzle:lantern-show");recordNpc(forge,"xiaomao","forge");
run("forge:E-02","forge","puzzle:shadow-bridge");
run("sky:S-01","sky","puzzle:sky-pouch");
const waterfall=run("sky:S-03","sky","puzzle:joint-flight");assert.ok(!waterfall.b.view().objective.includes("explore:letter-recipient"),"waterfall has no delivery gate");
const lib=run("library:M-05","library","puzzle:two-route-model",null,o=>recordNpc(o,"moye","library"));assert.ok(!lib.b.view().ring,"model must not credit real links");
run("starfall:F-01","starfall","puzzle:star-steps",null,o=>{recordNpc(o,"lichuan","starfall");recordNpc(o,"xingya","starfall")});
const star=setup("starfall:F-04","starfall");assert.deepEqual(star.b.view().objective,["puzzle:distributed-routing","repair:starfall","melody:starfall"]);assert.equal(star.rt.evidence({sceneId:"starfall:F-04",operation:"battle:observatory-echo",region:"starfall",verified:true,outcome:"win",token:star.rt.capture()}).ok,false);
const legacy=fixture("library:M-03");delete legacy.fullCampaignPresentationVersion;legacy.cursor=99;legacy.choices["sky:S-03"]="train";delete legacy.choices["sky:S-02"];const migrated=makeEngine(campaign,legacy).snapshot();assert.equal(migrated.cursor,0);assert.equal(migrated.choices["sky:S-02"],"train");assert.deepEqual(migrated.completed,legacy.completed);
console.log("Canon 1.2: two 40-scene state-machine routes, actual world puzzles, spatial chapter evidence and cursor migration passed");

// Optional companion visits must be physically reachable through the real resident adapter.
for(const [id,visible,activity] of [
 ["harbor:H-02",false,null],
 ["harbor:H-05",true,"muling:tea"],
 ["forge:E-01",true,"muling:cooking"],
 ["library:M-05",false,null]
]){
 const root={resonance:fixture(id)};
 const rt=getSlotRuntime({S:root,activeSlot:()=>"slot1",save:()=>({ok:true})});
 assert.equal(rt.residents("garden").some(n=>n.id==="muling"),visible,id+" garden visit");
 if(activity)assert.ok(rt.ambientAvailable("garden").some(a=>a.id===activity),activity);
 if(id==="harbor:H-02")assert.ok(rt.residents("harbor").some(n=>n.id==="muling"),"Harbor map encounter actor");
 if(id==="harbor:H-05"){
  const a=rt.ambientAvailable("garden").find(a=>a.id===activity);
  ok(rt.ambient({id:a.id,operation:a.operation,region:"garden",verified:true,token:rt.capture()}),"tea completion");
  assert.ok(!rt.residents("garden").some(n=>n.id==="muling"),"No duplicate tea visit");
 }
}
console.log("Garden and Harbor optional companion visit presence/window contracts passed");
