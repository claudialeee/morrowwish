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

// A dialogue callback captured on one slot cannot mutate a second slot at the same scene.
const a={resonance:fixture("harbor:H-02")},z={resonance:fixture("harbor:H-02")};active=a;const overlay=shared.capture();active=z;assert.equal(shared.isCurrentAction(overlay),false);assert.equal(shared.nextLine(overlay).reason,"stale-action");assert.equal(z.resonance.cursor,0);
// The departed Muling is an explicit scripted participant at the central ruin,
// not a permanently present companion or a generic garden NPC.
active={resonance:fixture("starfall:F-03"),resonanceExploration:{location:"starfall",positions:{starfall:{x:.92,y:.30}}}};assert.equal(shared.follows(),false);assert.ok(shared.residents("starfall").some(n=>n.id==="muling"&&n.scripted));assert.ok(!shared.residents("garden").some(n=>n.id==="muling"));assert.ok(shared.recordNPC({sceneId:"starfall:F-03",npcId:"muling",region:"starfall",token:shared.capture()}).ok);
console.log("Dialogue token isolation and scripted Muling appearance verified");

// Endgame fixtures prove the deferred NPC operations cannot finish early.
function endingFixture(target){let e=makeEngine(campaign);for(const sc of campaign.scenes){if(sc.id===target)return e.snapshot();if(sc.choiceTiming==="beforeAction"&&sc.choices.length)assert.ok(e.choose(sc.choices[0].id).ok);if(sc.id==="finale:B-03")for(let i=0;i<6;i++)assert.ok(e.supportAction(campaign.regions[i],campaign.support[i]).ok);const late=sc.requires.filter(o=>["mechanism:muling-unlock","npc:public-accountability","npc:second-garden-key"].includes(o));for(const o of sc.requires.filter(o=>!late.includes(o)))assert.ok(e.record(sc.id,o).ok);if(sc.id==="starfall:F-04")for(const [a,b,x,y] of campaign.links)for(let i=0;i<4;i++)e.exchange({a,b,stage:["sendA","receiveB","sendB","receiveA"][i],actor:[a,b,b,a][i],action:[x,x,y,y][i]});for(const l of sc.lines)assert.ok(e.nextLine().ok);if(sc.choiceTiming==="afterDialogue"&&sc.choices.length)assert.ok(e.choose(sc.choices[0].id).ok);for(const o of late)assert.ok(e.record(sc.id,o).ok);assert.ok(e.finish().ok);for(const [a,b,x,y] of campaign.links)for(let i=0;i<4;i++)e.exchange({a,b,stage:["sendA","receiveB","sendB","receiveA"][i],actor:[a,b,b,a][i],action:[x,x,y,y][i]});}}
active={resonance:endingFixture("epilogue:E-02")};assert.equal(shared.residents("garden").length,13);let ep=shared.capture();assert.ok(shared.recordNPC({sceneId:"epilogue:E-02",npcId:"muling",region:"garden",token:ep}).dialogueOnly);assert.equal(shared.completeNPCScene({sceneId:"epilogue:E-02",operation:"npc:public-accountability",npcId:"muling",region:"garden",verified:true,token:ep}).ok,false);for(const l of shared.view().current.lines)assert.ok(shared.nextLine(ep).ok);assert.ok(shared.completeNPCScene({sceneId:"epilogue:E-02",operation:"npc:public-accountability",npcId:"muling",region:"garden",verified:true,token:ep}).ok);assert.ok(shared.finish(ep).ok);ep=shared.capture();assert.ok(shared.recordNPC({sceneId:"epilogue:E-03",npcId:"muling",region:"garden",token:ep}).dialogueOnly);for(const l of shared.view().current.lines)assert.ok(shared.nextLine(ep).ok);assert.equal(shared.finish(ep).ok,false);const proofKey={sceneId:"epilogue:E-03",operation:"npc:second-garden-key",npcId:"muling",region:"garden",verified:true,token:ep};failSave=true;assert.equal(shared.completeNPCScene(proofKey).ok,false);assert.equal(shared.view().ending,false);failSave=false;assert.ok(shared.completeNPCScene(proofKey).ok);assert.ok(shared.finish(ep).ok);assert.ok(shared.view().ending);console.log("Epilogue: public accountability and second key must follow dialogue; failed key save cannot finish");

// All six regional replies and the B-03 victory are one local commit.
active={resonance:endingFixture("finale:B-03")};
const replies=campaign.regions.map((region,i)=>({region,action:campaign.support[i]}));
const victory={sceneId:"finale:B-03",operation:"battle:central-echo",participants:replies,verified:true,outcome:"win",token:shared.capture()};
const beforeVictory=JSON.stringify(active),beforeEvents=events;
const badReplies=replies.map((reply,i)=>i===5?{...reply,action:"invalid"}:reply);
assert.equal(shared.commitFinaleVictory({...victory,participants:badReplies}).ok,false);
assert.equal(JSON.stringify(active),beforeVictory);
failSave=true;
assert.equal(shared.commitFinaleVictory(victory).reason,"quota");
assert.equal(JSON.stringify(active),beforeVictory);
assert.equal(events,beforeEvents);
failSave=false;
assert.ok(shared.commitFinaleVictory(victory).ok);
assert.deepEqual(shared.snapshot().support,campaign.regions);
assert.ok(shared.snapshot().evidence["finale:B-03"].includes("battle:central-echo"));
assert.equal(events,beforeEvents+1);
assert.equal(shared.commitFinaleVictory(victory).ok,false);
console.log("Finale B-03 replies and victory commit atomically.");
