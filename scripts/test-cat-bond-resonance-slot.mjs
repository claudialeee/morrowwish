import assert from "node:assert/strict";
import {campaign} from "../public/cat-bond/js/resonance/campaign.mjs";
import {makeEngine} from "../public/cat-bond/js/resonance/engine.mjs";
import {createSlotRuntime,getSlotRuntime} from "../public/cat-bond/js/resonance/slot-runtime.mjs";
function fixture(target){
 let e=makeEngine(campaign);
 for(const scene of campaign.scenes){
  if(scene.id===target)return e.snapshot();
  if(scene.choiceTiming==="beforeAction"&&scene.choices.length)assert.ok(e.choose(scene.choices[0].id).ok);
  for(const op of scene.requires)assert.ok(e.record(scene.id,op).ok);
  for(const line of scene.lines)assert.ok(e.nextLine().ok);
  if(scene.choiceTiming==="afterDialogue"&&scene.choices.length)assert.ok(e.choose(scene.choices[0].id).ok);
  assert.ok(e.finish().ok);
 }
 throw Error("unknown fixture");
}
const notices=[];let active={resonance:fixture("harbor:H-02"),npcStories:{harborKeeper:{trust:999},mulingCompanion:{trust:999},other:{keep:true}}},failSave=false;
const first=active,second={resonance:fixture("prologue:P-05")};
const State={get S(){return active},save(){return {ok:!failSave,reason:failSave?"quota":undefined}}};
const runtime=createSlotRuntime(State,{notify:n=>notices.push(n)});
assert.equal(runtime.view().current.id,"harbor:H-02");
assert.equal(runtime.npcProfile("qilan").trust,0);
assert.equal(runtime.follows(),true);
assert.equal(runtime.recordNPC({sceneId:"harbor:H-02",npcId:"yahe",region:"harbor"}).ok,false);
assert.equal(runtime.recordNPC({sceneId:"harbor:H-02",npcId:"jiedeng",region:"garden"}).ok,false);
assert.equal(runtime.evidence({sceneId:"harbor:H-02",operation:"npc:keeper-talk",region:"harbor",verified:true}).ok,false);
assert.equal(runtime.recordNPC({sceneId:"harbor:H-02",npcId:"jiedeng",region:"harbor"}).ok,true);
assert.deepEqual(first.npcStories,{other:{keep:true}});
assert.equal(runtime.choose("comfort").ok,false);
for(let i=0;i<5;i++)assert.ok(runtime.nextLine().ok);
const before=JSON.stringify(first.resonance);failSave=true;assert.equal(runtime.choose("comfort").ok,false);assert.equal(JSON.stringify(first.resonance),before);failSave=false;
assert.ok(runtime.choose("comfort").ok);assert.equal(runtime.view().trust.qilan,2);assert.equal(runtime.view().trust.jiedeng,0);assert.ok(runtime.supportProfile("harbor").methods.includes("navigator-trust"));assert.ok(runtime.finish().ok);
assert.equal(runtime.view().current.id,"harbor:H-03");assert.equal(runtime.view().lineReady,false);
assert.equal(runtime.evidence({sceneId:"harbor:H-03",operation:"explore:tide-logbook",region:"harbor",verified:false}).ok,false);
assert.ok(runtime.evidence({sceneId:"harbor:H-03",operation:"explore:tide-logbook",region:"harbor",verified:true}).ok);
assert.equal(runtime.view().lineReady,true);
assert.ok(notices.some(n=>n.trustChanges?.some(c=>c.id==="qilan"&&c.delta===2)));
active=second;assert.equal(runtime.view().current.id,"prologue:P-05");assert.ok(runtime.view().regions.includes("harbor"));assert.equal(runtime.view().trust.qilan,0);assert.equal(runtime.ambient({id:"muling:tea",operation:"ambient:brew-bitter-tea",region:"garden",verified:true}).ok,false);
assert.ok(runtime.evidence({sceneId:"prologue:P-05",operation:"travel:harbor",region:"harbor",verified:true}).ok);
active=first;assert.equal(runtime.view().current.id,"harbor:H-03");assert.equal(runtime.view().trust.qilan,2);
console.log("Canonical slot runtime PASS: choice, quest, evidence, region gate, rollback, retired sample state, relationship, alternate slot");

const shared=getSlotRuntime(State);assert.equal(getSlotRuntime(State),shared);
const lease=shared.capture();const original=JSON.stringify(active);
active=second;assert.equal(shared.nextLine(lease).reason,"stale-action");assert.equal(shared.evidence({sceneId:"prologue:P-05",operation:"travel:harbor",region:"harbor",verified:true,token:lease}).reason,"stale-action");
active={resonance:fixture("harbor:H-03"),coins:10,fish:2,resonanceExploration:{location:"harbor",interactions:{}}};
const token=shared.capture(),proof={sceneId:"harbor:H-03",operation:"explore:tide-logbook",region:"harbor",verified:true,token};
const old=JSON.stringify(active);let events=0;shared.subscribe(()=>events++);
const physical=w=>({coins:w.coins+8,fish:w.fish+1,resonanceExploration:{...w.resonanceExploration,interactions:{logbook:true}}});
failSave=true;assert.equal(shared.evidence(proof,physical).reason,"quota");assert.equal(JSON.stringify(active),old);assert.equal(events,0);
failSave=false;assert.ok(shared.evidence(proof,physical).ok);assert.equal(events,1);assert.equal(active.coins,18);assert.equal(active.fish,3);assert.equal(active.resonanceExploration.interactions.logbook,true);
assert.equal(shared.evidence(proof,physical).ok,false);assert.equal(active.coins,18);assert.equal(events,1);
for(let i=0;i<shared.view().current.lines.length;i++)assert.ok(shared.nextLine(token).ok);
assert.ok(shared.finish(token).ok);assert.equal(shared.nextLine(token).reason,"stale-action");
console.log("Shared slot transaction: stale slot/scene rejected, atomic physical state/reward rollback, duplicate rejection and notification verified");
