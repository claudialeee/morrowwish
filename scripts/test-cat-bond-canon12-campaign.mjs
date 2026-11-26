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
  while(e.view().cursor<scene.lines.length)ok(e.nextLine(),scene.id+" line");
  if(scene.choiceTiming!=="beforeAction"&&scene.choices.length)ok(e.choose(scene.choices[variant%scene.choices.length].id),scene.id+" choice");
  for(const op of scene.requires.filter(x=>late.includes(x)))ok(e.record(scene.id,op),op);
  ok(e.finish(),scene.id+" finish");e=makeEngine(campaign,e.snapshot());
 }
 assert.ok(e.view().ending&&e.view().ring);assert.equal(e.view().cargoComplete,variant===1);assert.equal(Object.values(e.snapshot().links).reduce((n,l)=>n+l.length,0),variant===1?24:0);assert.ok(e.view().support.every(p=>p.ready));
}
function fixture(id){const i=campaign.scenes.findIndex(x=>x.id===id),s=makeEngine(campaign).snapshot();s.scene=id;s.completed=campaign.scenes.slice(0,i).map(x=>x.id);s.choices={"sky:S-02":"lead","library:M-01":"open","starfall:F-01":"coordinate"};return s;}
// Optional tea must not be presumed in the required story route.
const teaSkipped=fixture("sky:S-04"),teaTaken=fixture("sky:S-04");
teaTaken.ambientDone=["muling:tea"];
const skippedLine=makeEngine(campaign,teaSkipped).view().current.lines[4].text;
const takenLine=makeEngine(campaign,teaTaken).view().current.lines[4].text;
assert.match(skippedLine.zh,/语气/);assert.match(skippedLine.en,/sound so much/);
assert.match(takenLine.zh,/喝茶/);assert.match(takenLine.en,/smell your tea/);
assert.notDeepEqual(skippedLine,takenLine);
assert.deepEqual(makeEngine(campaign,makeEngine(campaign,teaSkipped).snapshot()).view().current.lines[4].text,skippedLine);
const ringLine=campaign.scenes.find(s=>s.id==="starfall:F-05").lines[0].text;
assert.match(ringLine.en,/Each region sent its own reply/);assert.match(ringLine.zh,/自己送来的回应/);
// Cinematic text stays canonical on both cargo routes; no conditional cinematic mutation.
// The two legally progressed routes above verify the line at F-05; a bare fixture cannot satisfy the ring invariant.
function setup(id,region,seed){const s=fixture(id),root={resonance:s,cats:[{uid:"main",species:"jinjc",personality:"gentle"},{uid:"m",species:"story_muling",storyActor:"muling"}],dex:{jinjc:1},coins:0,fish:0,battlePrefs:{teamUids:["main","m"]},resonanceExploration:{location:region,positions:{},interactions:{},pickups:{},cargo:null}};seed?.(root);const State={S:root,activeSlot:()=>"slot1",save:()=>({ok:true}),makeCat:(species,opts)=>({uid:species,species,...opts})};const b=createWorldBridge(State),rt=getSlotRuntime(State);ok(b.enter(region),"enter "+id);return {root,b,rt,x:createExplorer(b,region,{adventureActions:true})};}
function walk(x,p){assert.ok(x.walk(...p),"walk");for(let i=0;i<1000&&x.moving;i++)x.tick(.05);assert.ok(x.near(p),"not near "+p);}
function solve(x){let p=x.puzzle;assert.ok(p,"no actual puzzle");if(p.type==="skyFlight"){let result;for(let i=0;i<1000&&x.puzzle;i++){const f=x.puzzle.flight,t=f.x<.24?f.route[0]:f.x<.49?f.route[1]:f.x<.74?f.route[2]:.5;if(!f.started||f.target!==t)x.flightSteer(t);let q=x.flightTick(.05);if(q){result=q;ok(q,"flight");}}assert.ok(result?.ok,"flight fail "+JSON.stringify(x.puzzle?.flight));return;}if(p.type==="pairedWater"){for(const i of [0,0,1,2])ok(x.operate(i),"paired");}else if(["mirrors","water","stars","routing","libraryMirrors"].includes(p.type)){for(let i=0;i<3;i++)for(let j=0;j<10&&x.puzzle&&x.puzzle.values[i]!==p.goal[i];j++)ok(x.operate(i),"dial");}else if(p.type==="heat"){for(let i=0;i<10&&x.puzzle&&x.puzzle.values[0]<p.goal[0];i++)ok(x.operate(0),"heat");for(let i=0;i<10&&x.puzzle&&x.puzzle.values[1]>p.goal[1];i++)ok(x.operate(1),"vent");}else{for(const i of p.goal)ok(x.operate(i),"sequence "+p.type);}assert.ok(!x.puzzle,"still puzzle "+p.type);}
function recordNpc(o,id,region){walk(o.x,layouts[region].castPoints[id]);ok(o.rt.recordNPC({sceneId:o.b.view().current.id,npcId:id,region,token:o.rt.capture()}),"NPC "+id)}
function run(id,region,op,seed,prepare){const o=setup(id,region,seed);prepare?.(o);const p=skyLaunch[op]||layouts[region].features[op];walk(o.x,p);const r=o.x.interact(op);ok(r,id+" "+op);assert.ok(r.puzzle,id+" was auto completed");solve(o.x);assert.ok(!o.b.view().objective.includes(op),id+" proof not saved");return o;}
const forestRescue=setup("forest:R-03","forest");const F=layouts.forest.features;const rescueProof=(operation,outcome)=>({sceneId:"forest:R-03",operation,region:"forest",verified:true,token:forestRescue.rt.capture(),outcome});
assert.equal(forestRescue.x.interact("puzzle:paired-water-gates").ok,false);
walk(forestRescue.x,F["rescue:trapped-cats"]);assert.equal(forestRescue.x.interact("rescue:trapped-cats").ok,false);
walk(forestRescue.x,F["battle:root-echo"]);assert.equal(forestRescue.rt.evidence(rescueProof("battle:root-echo","win")).ok,false);
walk(forestRescue.x,F["rescue:steady-channel"]);ok(forestRescue.x.interact("rescue:steady-channel"),"partner stabilizes automatically");assert.equal(forestRescue.x.puzzle,null);
const reload=createExplorer(forestRescue.b,"forest",{adventureActions:true});
walk(reload,[.39,.40]);assert.equal(reload.interact("explore:water-marks").ok,false,"false dry trail cannot produce evidence");
walk(reload,F["explore:water-marks"]);ok(reload.interact("explore:water-marks"),"inspect real marks");assert.equal(reload.puzzle,null);
walk(reload,F["battle:root-echo"]);assert.equal(forestRescue.rt.evidence(rescueProof("battle:root-echo","defeat")).ok,false);assert.equal(forestRescue.b.view().objective[0],"battle:root-echo");
ok(forestRescue.rt.evidence(rescueProof("battle:root-echo","win")),"root echo victory evidence fixture");assert.equal(forestRescue.b.view().objective[0],"rescue:trapped-cats");
walk(reload,F["rescue:trapped-cats"]);ok(reload.interact("rescue:trapped-cats"),"rescue cats after victory");assert.equal(reload.puzzle,null);assert.deepEqual(forestRescue.b.view().objective,[]);
const oldForest=fixture("forest:R-03");oldForest.evidence["forest:R-03"]=["puzzle:paired-water-gates"];oldForest.cursor=2;assert.equal(makeEngine(campaign,oldForest).view().cursor,0);assert.equal(makeEngine(campaign,oldForest).view().objective.length,4);
const forge=run("forge:E-01","forge","puzzle:festival-lantern");recordNpc(forge,"xiaomao","forge");
run("forge:E-03","forge","puzzle:heat-pressure");
run("sky:S-01","sky","puzzle:sky-pouch");
const mail=run("sky:S-03","sky","puzzle:joint-flight");walk(mail.x,layouts.sky.features["explore:letter-recipient"]);ok(mail.x.interact("explore:letter-recipient"),"deliver letter");assert.ok(!mail.b.view().objective.includes("explore:letter-recipient"),"letter proof");
const lib=run("library:M-05","library","puzzle:two-route-model",null,o=>recordNpc(o,"moye","library"));assert.ok(!lib.b.view().ring,"model must not credit real links");
run("starfall:F-01","starfall","puzzle:caravan-route",null,o=>{recordNpc(o,"lichuan","starfall");recordNpc(o,"xingya","starfall")});
const star=setup("starfall:F-04","starfall");const proof={sceneId:"starfall:F-04",operation:"battle:observatory-echo",region:"starfall",verified:true,outcome:"win",token:star.rt.capture()};assert.equal(star.rt.evidence(proof).ok,false);walk(star.x,layouts.starfall.features["battle:observatory-echo"]);assert.equal(star.rt.evidence({...proof,outcome:"defeat",token:star.rt.capture()}).ok,false);ok(star.rt.evidence({...proof,token:star.rt.capture()}),"observatory victory evidence fixture");assert.equal(star.b.view().objective[0],"puzzle:distributed-routing");
const legacy=fixture("library:M-03");delete legacy.fullCampaignPresentationVersion;legacy.cursor=99;legacy.choices["sky:S-03"]="train";delete legacy.choices["sky:S-02"];const migrated=makeEngine(campaign,legacy).snapshot();assert.equal(migrated.cursor,0);assert.equal(migrated.choices["sky:S-02"],"train");assert.deepEqual(migrated.completed,legacy.completed);
console.log("Canon 1.2: two 40-scene state-machine routes, actual world puzzles, observatory evidence gate and cursor migration passed");
