import fs from "node:fs";
import {campaign} from "../public/cat-bond/js/resonance/campaign.mjs";
import {makeEngine} from "../public/cat-bond/js/resonance/engine.mjs";
import {getSlotRuntime} from "../public/cat-bond/js/resonance/slot-runtime.mjs";
import {createWorldBridge} from "../public/cat-bond/js/resonance/world-bridge.mjs";
import {createExplorer,exchangeOptions,layouts} from "../public/cat-bond/js/resonance/world-exploration.mjs";
import {skyLaunch,skyLanding} from "../public/cat-bond/js/resonance/sky-flight.mjs";
const stateSource=fs.readFileSync(new URL("../public/cat-bond/js/state.js",import.meta.url),"utf8");
const dataSource=fs.readFileSync(new URL("../public/cat-bond/js/data.js",import.meta.url),"utf8");
console.log(JSON.stringify((function test(){
 const storage=new Map(),ls={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},window={};
 new Function("window",dataSource)(window);
 new Function("window","localStorage","GameData",stateSource)(window,ls,window.GameData);
 const State=window.State,assert=(x,m)=>{if(!x)throw Error(m)},ok=(r,m)=>assert(r?.ok,m+": "+r?.reason);
 assert(State.startNewGame("slot1"),"slot1");State.S.cats.push({uid:"player-fixture",species:"jinjc",level:1,stats:{pow:1,agi:1,vit:1,cha:1}});ok(State.save(),"fixed protagonist fixture");let b=createWorldBridge(State),runtime=getSlotRuntime(State),notified=0;runtime.subscribe(()=>notified++);let rescueBattleCommits=0,physical=0,walking=0,deliveries=0,puzzles=0,localInvites=0,rewards=0,fixture=0;
 function host(fn){const e=makeEngine(campaign,State.S.resonance),r=fn(e);ok(r,"host fixture");State.S.resonance=r.state;ok(State.save(),"fixture save");fixture++;}
 function walk(x,p){let old=x.position;x.walk(...p);let ticks=0;while(x.moving&&ticks++<1000)x.tick(.05);assert(!x.moving&&x.near(p),"walk arrival "+p);walking+=ticks;return old;}
 function solve(x){let p=x.puzzle;assert(p,"puzzle not mounted");const n=p.type;
  if(n==="canonSpatial"){const act=a=>ok(x.spatialAct(a),"spatial");if(p.spatial.kind==="bridge"){act({type:"step",i:1});if(p.operation==="puzzle:moonleaf-loop")act({type:"leaf"});act({type:"step",i:2});act({type:"step",i:4});}else if(p.spatial.kind==="stars"){for(const i of [1,3,5,7])act({type:"step",i});}else if(p.spatial.kind==="light"){act({type:"aim",x:.72});act({type:"cross"});}else{act({type:"target",x:.8,y:.27});for(let i=0;i<2000&&x.puzzle;i++){const r=x.spatialTick(.02);if(r)ok(r,"chase");}}}
  else if(n==="libraryCompanion"){ok(x.operate(1),"new position");const p=x.puzzle.mirror;ok(x.operate(p.faces[0]===0?2:0),"real reply");}
  else if(n==="libraryLedger"){ok(x.operate(1),"ask question");}
  else if(n==="pairedWater"){ok(x.operate(1),"lower cannot open without pressure");assert(x.puzzle.values[1]===0,"premature lower opening");ok(x.operate(0),"raise");ok(x.operate(0),"stable");ok(x.operate(1),"open lower");ok(x.operate(0),"pressure stays locked");assert(x.puzzle.values[0]===2&&x.puzzle.values[1]===1,"pressure cannot overshoot or close gate");ok(x.operate(1),"repeat opening");assert(x.puzzle.values[1]===1,"gate stays open");ok(x.operate(2),"clear roots");}
  else if(["mirrors","water","stars","routing","libraryMirrors"].includes(n)){for(let i=0;i<3;i++){while(x.puzzle&&x.puzzle.values[i]!==p.goal[i])ok(x.operate(i),"dial");}}
  else if(n==="heat"){while(x.puzzle&&x.puzzle.values[0]<p.goal[0])ok(x.operate(0),"heat");while(x.puzzle&&x.puzzle.values[1]>p.goal[1])ok(x.operate(1),"vent");}
  else if(n==="skyFlight"){
   for(let i=0;i<100;i++)x.flightTick(.05);assert(x.puzzle.flight.x===0,"idle flight must not advance");
   ok(x.operate(1),"launch");for(let i=0;i<400&&x.puzzle?.flight.started;i++)x.flightTick(.05);assert(x.puzzle?.flight.attempts>0,"no steering must fail");
   let result;for(let i=0;i<1000&&x.puzzle;i++){const f=x.puzzle.flight,t=f.openGlide?(f.x<.75?.30:.5):(f.x<.24?f.route[0]:f.x<.49?f.route[1]:f.x<.74?f.route[2]:.5);if(!f.started||f.target!==t)assert(x.flightSteer(t),"steer");const r=x.flightTick(.05);if(r){ok(r,"flight landing");result=r;}}
   assert(result?.ok,"flight not completed");
  }
  else{ok(x.operate((p.goal[0]+1)%3),"wrong sequence");assert(x.puzzle&&x.puzzle.values.length===0,"wrong sequence advanced");for(const i of p.goal)ok(x.operate(i),"sequence");}
  assert(!x.puzzle,"unsolved mechanism "+n);puzzles++;
 }
 function transfer(a,z,i){const region=[a,z,z,a][i];ok(b.enter(region),"travel exchange");let x=createExplorer(b,region),o=exchangeOptions(b,region,campaign.links).find(o=>o.a===a&&o.b===z);assert(o,"missing ordered exchange "+a+":"+z+":"+i);walk(x,x.cargoPoints()[o.from]);ok(x.startCargo(o),"pick cargo");assert(!x.deliverCargo().ok,"delivery without walking");const proof={a,b:z,stage:o.stage,actor:region,action:o.action,verified:true,token:runtime.capture()},money=State.S.coins,fish=State.S.fish;const exact=prior=>({resonanceExploration:{...prior.resonanceExploration,cargo:null},coins:(prior.coins||0)+10,fish:(prior.fish||0)+1});assert(!runtime.exchange(proof,exact).ok,"direct transaction cannot bypass walking");assert(State.S.coins===money&&State.S.fish===fish,"remote failure must not grant reward");x=createExplorer(b,region);assert(x.cargo?.stage===o.stage,"cargo not saved");walk(x,x.cargoPoints()[o.to]);assert(!runtime.exchange({...proof,token:runtime.capture()},prior=>({...exact(prior),coins:money+1000})).ok,"wrong delivery reward accepted");assert(!runtime.exchange({...proof,token:runtime.capture()},prior=>({...exact(prior),resonanceExploration:prior.resonanceExploration})).ok,"delivery without clearing cargo accepted");ok(x.deliverCargo(),"deliver");assert(!x.cargo,"cargo not cleared");assert(State.S.coins===money+10&&State.S.fish===fish+1,"exact delivery reward");assert(!runtime.exchange({...proof,token:runtime.capture()},exact).ok,"duplicate transaction accepted");assert(State.S.coins===money+10&&State.S.fish===fish+1,"duplicate granted reward");deliveries++;}
 function links(){for(const [a,z] of campaign.links){for(let i=(b.view().links[a+":"+z]||[]).length;i<4;i++)transfer(a,z,i);}}
 for(let scene=0;scene<campaign.scenes.length;scene++){
  let v=b.view(),s=v.current;if(!s||s.id==="finale:B-01")break;
  if(s.choices.length&&s.choiceTiming==="beforeAction")host(e=>e.choose(s.choices[0].id));
  if(s.id==="sky:S-01"){ok(b.enter("sky"),"enter before cargo");const x=createExplorer(b,"sky");walk(x,skyLaunch["puzzle:sky-pouch"]);assert(x.interact("puzzle:sky-pouch").ok,"flight available without optional cargo");transfer("forge","sky",0);transfer("forge","sky",1);assert(!b.cargoSpec("forge","sky"),"cannot send flight data before route restoration");}
  if(s.id==="library:M-02"){State.S.cats.push({uid:"library-fixture",species:"nainai",personality:"gentle",level:1,stats:{pow:1,agi:1,vit:1,cha:1}});State.S.dex.nainai=1;ok(b.enter("library"),"enter library");const x=createExplorer(b,"library");walk(x,x.layout.features["puzzle:mirror-records"]);assert(!x.interact("puzzle:mirror-records").ok,"retired mural sorting cannot advance the live mirror scene");}
  const ops=s.requires;
  for(const op of ops){if(s.id==="library:M-05"&&op==="repair:library"){ok(b.enter("library"),"enter library for route choice");const early=createExplorer(b,"library");walk(early,early.layout.features[op]);assert(early.interact(op).reason==="library-previous-station","repair must wait until the two routes dialogue");while(b.view().cursor<s.lines.length)host(e=>e.nextLine());}if(layouts[s.chapter]?.features[op]&&!op.startsWith("battle:")){
   ok(b.enter(s.chapter),"enter "+s.chapter);const x=createExplorer(b,s.chapter),p=x.layout.features[op];
   if(op.startsWith("melody:")){walk(x,p);assert(!x.interact(op).ok,"melody without local NPC");for(const n of x.localNpcs()){walk(x,n.point);ok(x.inviteNpc(n.id),"invite NPC");localInvites++;}if(s.chapter==="library"){const restored=createExplorer(b,"library");assert(restored.invited.length===2,"library invitations persist");}if(["forest","sky"].includes(s.chapter)){const restored=createExplorer(b,s.chapter);assert(restored.invited.length===2&&x.localNpcs().every(n=>restored.invited.includes(n.id)),s.chapter+" invitations must survive reload");}}
   if(op==="explore:tide-logbook"){
    walk(x,p);assert(x.interact(op).reason==="incomplete-tide-trail","cannot bypass tide trail");
    let trail=x;
    for(let i=0;i<2;i++){
     const step=trail.tideStep();assert(step?.index===i,"ordered tide waypoint");assert(!trail.traceTide((i+1)%2).ok,"out-of-order tide mark");walk(trail,step.point);ok(trail.traceTide(i),"inspect tide mark");trail=createExplorer(b,s.chapter);
    }
    assert(!trail.tideStep(),"completed tide trail must not reopen");walk(trail,p);ok(trail.interact(op),"recover logbook");solve(trail);
   }else if(op==="puzzle:safety-blueprint"){
    walk(x,p);assert(x.interact(op).reason==="incomplete-forge-parts","cannot bypass old workshop");let trail=x;
    for(let i=0;i<3;i++){const step=trail.forgeStep();assert(step?.index===i,"ordered workshop clue");assert(!trail.collectForgePart((i+1)%3).ok,"cannot skip clue");walk(trail,step.point);ok(trail.collectForgePart(i),"recover part");trail=createExplorer(b,"forge");}
    assert(!trail.forgeStep(),"workshop parts persist");walk(trail,p);ok(trail.interact(op),"reassemble blueprint");solve(trail);
   }else if(op==="explore:scent-trail"){
    assert(!x.traceScent(2).ok,"cannot skip to medicine");
    let trail=x;
    for(let i=0;i<3;i++){const step=trail.scentStep();assert(step?.index===i,"ordered scent waypoint");assert(!trail.traceScent((i+1)%3).ok,"out-of-order scent");walk(trail,step.point);ok(trail.traceScent(i),"trace scent");trail=createExplorer(b,s.chapter);}
    assert(!trail.scentStep(),"completed trail must not reopen");
   }else{walk(x,skyLaunch[op]||p);if(skyLaunch[op]){assert(!b.recordWorld(s.id,op,{sceneId:s.id,operation:op,region:s.chapter,verified:true,token:b.capture()}).ok,"cannot bypass flight");}const r=x.interact(op);ok(r,op);if(r.puzzle)solve(x);if(skyLanding[op]){assert(x.near(skyLanding[op]),"flight must land at actual destination");assert(createExplorer(b,s.chapter).near(skyLanding[op]),"landing must persist");}}
   assert(!b.view().objective.includes(op),"unrecorded "+op);physical++;
   if(physical===1){const p=x.rewardPoints()[0];walk(x,p.point);const cash=State.S.coins;ok(x.pickup(p.id),"cache reward");assert(State.S.coins>cash&&!x.pickup(p.id).ok,"duplicate reward");rewards++;}
  }else if(["battle:chime-beast","battle:shadow-beast"].includes(op)){ok(b.enter(s.chapter),"enter actual encounter location");const x=createExplorer(b,s.chapter),proof={sceneId:s.id,operation:op,region:s.chapter,verified:true,token:b.capture(),outcome:"win"};assert(!runtime.evidence(proof).ok,"remote victory rejected");walk(x,layouts[s.chapter].features[op]);assert(!runtime.evidence({...proof,outcome:"defeat",token:b.capture()}).ok,"defeat rejected");ok(runtime.evidence({...proof,token:b.capture()}),"battle fixture");rescueBattleCommits++;}else if(op==="battle:root-echo"){ok(b.enter("forest"),"enter forest rescue battle");const x=createExplorer(b,"forest"),rescueProof={sceneId:s.id,operation:op,region:"forest",verified:true,token:b.capture(),outcome:"win"};walk(x,[.31,.58]);assert(!runtime.evidence(rescueProof).ok,"remote victory rejected");walk(x,layouts.forest.features[op]);assert(!runtime.evidence({...rescueProof,outcome:"defeat",token:b.capture()}).ok,"defeat does not finish rescue");ok(runtime.evidence({...rescueProof,token:b.capture()}),"root echo victory evidence fixture");rescueBattleCommits++;assert(b.view().objective[0]==="rescue:trapped-cats","free cats only after victory");}
  else host(e=>e.record(s.id,op));}
  if(s.id==="starfall:F-04"){assert(b.view().ring,"all melodies unlock the story");assert(!b.view().cargoComplete,"optional deliveries remain incomplete");}
  while(b.view().cursor<s.lines.length)host(e=>e.nextLine());
  if(s.choices.length&&!b.view().choice)host(e=>e.choose(s.choices[0].id));
  host(e=>e.finish());
  if(s.id==="sky:S-05"){
   ok(b.enter("sky"),"return to sky");let x=createExplorer(b,"sky"),survey=x.survey();assert(survey&&!survey.remote,"survey unlocked");assert(!x.startSurvey().ok,"must reach takeoff");assert(!b.pickupReward("sky","survey-cache").ok,"cache cannot be claimed from main island");
   walk(x,survey.from);assert(!b.finishSurvey(survey.operation,null,b.capture()).ok,"cannot skip flight");const story=JSON.stringify(State.S.resonance);ok(x.startSurvey(),"takeoff");solve(x);assert(x.survey().remote&&x.near(survey.to),"actual island landing");
   assert(State.loadSlot("slot1"),"reload on island");x=createExplorer(b,"sky");assert(x.survey().remote&&x.near(survey.to),"remote landing persists");assert(!x.pickup("survey-cache").ok,"cache requires exploring path");const cache=x.rewardPoints()[0];walk(x,cache.point);const coins=State.S.coins,fish=State.S.fish;ok(x.pickup(cache.id),"collect hidden cache");assert(State.S.coins===coins+45&&State.S.fish===fish+4&&!x.pickup(cache.id).ok,"one-time reward");
   assert(State.loadSlot("slot1"),"reload after cache");x=createExplorer(b,"sky");assert(!x.survey().cache,"cache stays collected");let back=x.survey();walk(x,back.from);ok(x.startSurvey(),"return takeoff");solve(x);assert(!x.survey().remote&&x.near(back.to),"return to dock");assert(JSON.stringify(State.S.resonance)===story,"optional flight must not mutate story");
   // Repeat the optional flight to confirm it remains available without duplicating treasure.
   walk(x,x.survey().from);ok(x.startSurvey(),"repeat takeoff");solve(x);assert(x.survey().remote&&!x.survey().cache,"repeat island without duplicate cache");walk(x,x.survey().from);ok(x.startSurvey(),"repeat return");solve(x);assert(!x.survey().remote,"repeat return");
  }
 }
 assert(b.view().current.id==="finale:B-01","did not reach finale: "+b.view().current.id);
 assert(b.view().ring&&b.view().melodies.length===6&&b.view().sanctuaries.length===6,"ring or sanctuaries incomplete");assert(deliveries===2&&localInvites===12,"wrong exchange/participation counts");links();assert(deliveries===24&&b.view().cargoComplete,"optional deliveries still available at finale");
 assert(!State.S.lastResonanceWorld,"parallel story state still created");
 const old=State.S.resonance,oldW=JSON.stringify(b.world());const oldExplorer=createExplorer(b,b.world().location),oldToken=runtime.capture();
 assert(State.startNewGame("slot2"),"slot2");assert(!oldExplorer.walk(.2,.2),"stale world explorer can move");assert(!runtime.nextLine(oldToken).ok,"stale scene lease accepted");assert(b.view().current.id==="prologue:P-01"&&!b.world().location,"slot2 leaked");
 assert(State.startNewGame("slot3"),"slot3");assert(b.view().current.id==="prologue:P-01","slot3 leaked");
 assert(State.loadSlot("slot1"),"restore slot1");assert(b.view().current.id==="finale:B-01"&&JSON.stringify(b.world())===oldW,"slot1 restore");
 const before=JSON.stringify(State.S.resonanceExploration),failed=createWorldBridge({get S(){return State.S},save:()=>({ok:false,reason:"quota"})});assert(!failed.enter("harbor").ok&&JSON.stringify(State.S.resonanceExploration)===before,"failed save did not roll back");
 assert(notified===physical+deliveries+rescueBattleCommits,"unexpected shared runtime notification count "+notified);
 // Finish upstream-owned finale/epilogue with fixtures ONLY to exercise the actual postgame world host.
 while(!b.view().ending){const v=b.view(),scene=v.current;
  if(scene.id==="finale:B-03")for(const [i,region] of campaign.regions.entries())host(e=>e.supportAction(region,campaign.support[i]));
  if(scene.choices.length&&scene.choiceTiming==="beforeAction")host(e=>e.choose(scene.choices[0].id));
  for(const op of scene.requires.filter(op=>!["mechanism:muling-unlock","npc:public-accountability","npc:second-garden-key"].includes(op)))host(e=>e.record(scene.id,op));
  while(b.view().cursor<scene.lines.length)host(e=>e.nextLine());
  if(scene.choices.length&&!b.view().choice)host(e=>e.choose(scene.choices[0].id));
  for(const op of b.view().objective)host(e=>e.record(scene.id,op));host(e=>e.finish());
 }
 assert(runtime.residents("garden").map(n=>n.id).join(",")==="muling","only Muling before postgame resident visits");
 assert(!runtime.postgame({id:"postgame:ruins",operation:"postgame:ruins-victory",region:"starfall",verified:true,token:runtime.capture()}).ok,"generic postgame event cannot award a ruins victory");
 let letters=0,reunions=0;
 for(const region of campaign.regions){
  ok(b.enter(region),"postgame travel");let x=createExplorer(b,region),q=x.homeQuest();
  assert(q&&!q.repaired,"letter available");assert(!x.meetHomeResident(x.localNpcs()[0].id).ok,"no reunion before repair");
  walk(x,q.point);const beforeRepair=JSON.stringify(State.S);assert(!b.finishHomeRepair(region,runtime.capture()).ok,"repair without solved mechanism");assert(JSON.stringify(State.S)===beforeRepair,"invalid repair changed save");const repairCoins=State.S.coins,repairFish=State.S.fish;ok(x.startHomeRepair(),"repair after ending");solve(x);letters++;assert(State.S.coins===repairCoins+25&&State.S.fish===repairFish+2,"exact letter reward "+region);assert(!x.startHomeRepair().ok,"duplicate repair "+region);assert(State.S.coins===repairCoins+25&&State.S.fish===repairFish+2,"duplicate repair reward "+region);assert(State.loadSlot("slot1"),"reload after letter "+region);
  x=createExplorer(b,region);assert(x.homeQuest()?.repaired,"letter saved");
  for(const n of x.localNpcs()){walk(x,n.point);assert(!b.meetHomeResident(n.id,[0,0],runtime.capture()).ok,"forged NPC location rejected");const beforeCoins=State.S.coins,beforeFish=State.S.fish,last=x.homeQuest().actors.filter(a=>!a.visited).length===1;ok(x.meetHomeResident(n.id),"invite resident");assert(State.S.coins===beforeCoins+(last?40:0)&&State.S.fish===beforeFish+(last?3:0),"exact reunion reward "+n.id);assert(!x.meetHomeResident(n.id).ok,"duplicate NPC "+n.id);assert(State.S.coins===beforeCoins+(last?40:0)&&State.S.fish===beforeFish+(last?3:0),"duplicate NPC reward "+n.id);const snapshot=JSON.stringify(State.S.resonance);assert(State.loadSlot("slot1"),"reload after NPC "+n.id);assert(JSON.stringify(State.S.resonance)===snapshot,"NPC narrative persistence "+n.id);x=createExplorer(b,region);}
  assert(!x.homeQuest(),"reunion completed");const actor={harbor:"jiedeng",forest:"yuchuan",library:"moye",starfall:"lichuan"}[region];if(actor){assert(State.S.cats.filter(c=>c.storyActor===actor&&c.species==="story_"+actor).length===1,"real recruited cat persisted: "+actor);assert(State.S.cats.find(c=>c.storyActor===actor).stats.pow>0,"real species stats: "+actor);}reunions++;assert(runtime.residents("garden").length===1+reunions*2,"only actual reunited residents appear in garden");
 }
 assert(b.view().returned.length===12&&b.view().postgame.length===12,"all six regional reunions persisted");
 // Fixture-based transaction regression only: actual combat is covered by the browser matrix.
 ok(b.enter("starfall"),"ruins travel");
 const cash=State.S.coins,fish=State.S.fish,proof={attemptId:"audit-first",duoPromise:false,verified:true,outcome:"win",token:runtime.capture()};
 assert(!runtime.commitRuinsVictory({...proof,outcome:"loss"}).ok,"loss awarded ruins prize");
 assert(!runtime.commitRuinsVictory({...proof,verified:false}).ok,"unverified victory awarded prize");
 ok(runtime.commitRuinsVictory(proof),"first verified ruins clear");
 assert(State.S.coins===cash+100&&State.S.fish===fish+5,"first ruins reward exact");
 assert(!runtime.commitRuinsVictory(proof).ok,"duplicate ruins attempt");
 assert(State.S.coins===cash+100&&State.S.fish===fish+5,"duplicate ruins prize");
 ok(runtime.commitRuinsVictory({...proof,attemptId:"audit-duo",duoPromise:true,token:runtime.capture()}),"duo ruins clear");
 assert(State.S.coins===cash+145&&State.S.fish===fish+8,"repeat duo ruins reward exact");
 assert(b.view().ruins.clears===2&&b.view().ruins.duoClears===1&&b.view().postgame.length===13,"ruins state exact");
 const save=JSON.stringify(State.S.resonance);assert(State.loadSlot("slot1"),"ruins reload");assert(JSON.stringify(State.S.resonance)===save,"ruins progress persistence");assert(State.S.coins===cash+145&&State.S.fish===fish+8,"ruins currency persistence");
 assert(!runtime.commitRuinsVictory({...proof,attemptId:"audit-duo",token:runtime.capture()}).ok,"duplicate ruins after reload");
 return {physical,puzzles,walkingTicks:walking,deliveries,localInvites,rewards,fixtureTransitions:fixture,slots:3,sharedRuntimeNotifications:notified,letters,reunions,canonicalEnding:b.view().ending};
})()));
