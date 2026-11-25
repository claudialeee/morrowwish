import fs from "node:fs";
const paths=["resonance/campaign.mjs","resonance/engine.mjs","resonance/slot-runtime.mjs","resonance/world-bridge.mjs","resonance/world-exploration.mjs","state.js","resonance/sky-flight.mjs"];
const src=paths.map(p=>fs.readFileSync(new URL("../public/cat-bond/js/"+p,import.meta.url),"utf8"));
console.log(JSON.stringify((function test(src){
 const clean=s=>s.replace(/^import .*;$/gm,"").replace(/\bexport\s+/g,"");
 const campaign=new Function(clean(src[0])+"\nreturn campaign")();
 const makeEngine=new Function(clean(src[1])+"\nreturn makeEngine")();
 const getSlotRuntime=new Function("campaign","makeEngine",clean(src[2])+"\nreturn getSlotRuntime")(campaign,makeEngine);
 const flight=new Function(clean(src[6])+"\nreturn {newSkyFlight,steerSkyFlight,tickSkyFlight,skyFlightProof,validSkyFlightProof,skyLaunch,skyLanding}")();
 const {skyLaunch,skyLanding}=flight;
 const createWorldBridge=new Function("campaign","getSlotRuntime","validSkyFlightProof","skyLaunch","skyLanding",clean(src[3])+"\nreturn createWorldBridge")(campaign,getSlotRuntime,flight.validSkyFlightProof,skyLaunch,skyLanding);
 const {createExplorer,exchangeOptions,layouts}=new Function("campaign",...Object.keys(flight),clean(src[4])+"\nreturn {createExplorer,exchangeOptions,layouts}")(campaign,...Object.values(flight));
 const storage=new Map(),ls={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},window={};
 new Function("window","localStorage",src[5])(window,ls);
 const State=window.State,assert=(x,m)=>{if(!x)throw Error(m)},ok=(r,m)=>assert(r?.ok,m+": "+r?.reason);
 assert(State.startNewGame("slot1"),"slot1");let b=createWorldBridge(State),runtime=getSlotRuntime(State),notified=0;runtime.subscribe(()=>notified++);let physical=0,walking=0,deliveries=0,puzzles=0,localInvites=0,rewards=0,fixture=0;
 function host(fn){const e=makeEngine(campaign,State.S.resonance),r=fn(e);ok(r,"host fixture");State.S.resonance=r.state;ok(State.save(),"fixture save");fixture++;}
 function walk(x,p){let old=x.position;x.walk(...p);let ticks=0;while(x.moving&&ticks++<1000)x.tick(.05);assert(!x.moving&&x.near(p),"walk arrival "+p);walking+=ticks;return old;}
 function solve(x){let p=x.puzzle;assert(p,"puzzle not mounted");const n=p.type;
  if(n==="pairedWater"){ok(x.operate(1),"lower cannot open without pressure");assert(x.puzzle.values[1]===0,"premature lower opening");ok(x.operate(0),"raise");ok(x.operate(0),"stable");ok(x.operate(1),"open lower");ok(x.operate(0),"overpressure");assert(x.puzzle.values[1]===0,"overpressure closes lower");ok(x.operate(0),"reset pressure");ok(x.operate(0),"raise");ok(x.operate(0),"stable");ok(x.operate(1),"open lower");ok(x.operate(2),"joint clearance");}
  else if(["mirrors","water","stars","routing"].includes(n)){for(let i=0;i<3;i++){while(x.puzzle&&x.puzzle.values[i]!==p.goal[i])ok(x.operate(i),"dial");}}
  else if(n==="heat"){while(x.puzzle&&x.puzzle.values[0]<p.goal[0])ok(x.operate(0),"heat");while(x.puzzle&&x.puzzle.values[1]>p.goal[1])ok(x.operate(1),"vent");}
  else if(n==="skyFlight"){
   for(let i=0;i<100;i++)x.flightTick(.05);assert(x.puzzle.flight.x===0,"idle flight must not advance");
   ok(x.operate(1),"launch");for(let i=0;i<400&&x.puzzle?.flight.started;i++)x.flightTick(.05);assert(x.puzzle?.flight.attempts>0,"no steering must fail");
   let result;for(let i=0;i<400&&x.puzzle;i++){const f=x.puzzle.flight,t=f.x<.24?f.route[0]:f.x<.49?f.route[1]:f.x<.74?f.route[2]:.5;if(!f.started||f.target!==t)assert(x.flightSteer(t),"steer");const r=x.flightTick(.05);if(r){ok(r,"flight landing");result=r;}}
   assert(result?.ok,"flight not completed");
  }
  else{ok(x.operate((p.goal[0]+1)%3),"wrong sequence");assert(x.puzzle&&x.puzzle.values.length===0,"wrong sequence advanced");for(const i of p.goal)ok(x.operate(i),"sequence");}
  assert(!x.puzzle,"unsolved mechanism "+n);puzzles++;
 }
 function links(){for(const [a,z] of campaign.links){for(let i=0;i<4;i++){const region=[a,z,z,a][i];ok(b.enter(region),"travel exchange");let x=createExplorer(b,region),o=exchangeOptions(b,region,campaign.links).find(o=>o.a===a&&o.b===z);assert(o,"missing ordered exchange "+a+":"+z+":"+i);walk(x,x.cargoPoints()[o.from]);ok(x.startCargo(o),"pick cargo");assert(!x.deliverCargo().ok,"delivery without walking");x=createExplorer(b,region);assert(x.cargo?.stage===o.stage,"cargo not saved");walk(x,x.cargoPoints()[o.to]);ok(x.deliverCargo(),"deliver");assert(!x.cargo,"cargo not cleared");deliveries++;}}}
 for(let scene=0;scene<34;scene++){
  let v=b.view(),s=v.current;if(!s||s.id==="finale:B-01")break;
  if(s.choices.length&&s.choiceTiming==="beforeAction")host(e=>e.choose(s.choices[0].id));
  const ops=s.id==="harbor:H-04"?[...s.requires].reverse():s.requires;
  if(s.id==="harbor:H-04"){
   ok(b.enter("harbor"),"enter Harbor");
   const x=createExplorer(b,"harbor");
   walk(x,x.layout.features["puzzle:beam-mirrors"]);
   assert(x.interact("puzzle:beam-mirrors").reason==="rescue-first","rescue choice must change the action order");
  }
  for(const op of ops){if(layouts[s.chapter]?.features[op]&&!op.startsWith("battle:")){
   ok(b.enter(s.chapter),"enter "+s.chapter);const x=createExplorer(b,s.chapter),p=x.layout.features[op];
   if(op.startsWith("melody:")){walk(x,p);assert(!x.interact(op).ok,"melody without local NPC");for(const n of x.localNpcs()){walk(x,n.point);ok(x.inviteNpc(n.id),"invite NPC");localInvites++;}if(["forest","sky"].includes(s.chapter)){const restored=createExplorer(b,s.chapter);assert(restored.invited.length===2&&x.localNpcs().every(n=>restored.invited.includes(n.id)),s.chapter+" invitations must survive reload");}}
   if(op==="explore:tide-logbook"){
    walk(x,p);assert(x.interact(op).reason==="incomplete-tide-trail","cannot bypass tide trail");
    let trail=x;
    for(let i=0;i<2;i++){
     const step=trail.tideStep();assert(step?.index===i,"ordered tide waypoint");assert(!trail.traceTide((i+1)%2).ok,"out-of-order tide mark");walk(trail,step.point);ok(trail.traceTide(i),"inspect tide mark");trail=createExplorer(b,s.chapter);
    }
    assert(!trail.tideStep(),"completed tide trail must not reopen");walk(trail,p);ok(trail.interact(op),"recover logbook");solve(trail);
   }else if(op==="explore:scent-trail"){
    assert(!x.traceScent(2).ok,"cannot skip to medicine");
    let trail=x;
    for(let i=0;i<3;i++){const step=trail.scentStep();assert(step?.index===i,"ordered scent waypoint");assert(!trail.traceScent((i+1)%3).ok,"out-of-order scent");walk(trail,step.point);ok(trail.traceScent(i),"trace scent");trail=createExplorer(b,s.chapter);}
    assert(!trail.scentStep(),"completed trail must not reopen");
   }else if(op==="puzzle:paired-water-gates"){
    walk(x,p);assert(x.interact(op).reason==="upper-gate-required","cannot bypass upper gate");
    State.S.cats.push({uid:"forest-fixture",species:"nainai",level:1,stats:{pow:1,agi:1,vit:1,cha:1}});const gate=x.pairedGate();assert(gate&&!gate.ready,"upper gate available");walk(x,gate.point);ok(x.holdUpperGate(),"hold upper gate");
    assert(!x.holdUpperGate().ok,"duplicate upper gate action");const restored=createExplorer(b,s.chapter);assert(restored.pairedGate().ready,"paired gate persists");
    walk(restored,p);ok(restored.interact(op),"lower gate");assert(restored.puzzle.pair.upper==="forest-fixture"&&restored.puzzle.pair.lower==="muling","two separate actors");assert(!b.recordWorld(s.id,op,{sceneId:s.id,operation:op,region:s.chapter,verified:true,token:b.capture()}).ok,"cannot bypass paired flow");solve(restored);State.S.cats=State.S.cats.filter(c=>c.uid!=="forest-fixture");
   }else{walk(x,skyLaunch[op]||p);if(skyLaunch[op]){assert(!b.recordWorld(s.id,op,{sceneId:s.id,operation:op,region:s.chapter,verified:true,token:b.capture()}).ok,"cannot bypass flight");}const r=x.interact(op);ok(r,op);if(r.puzzle)solve(x);if(skyLanding[op]){assert(x.near(skyLanding[op]),"flight must land at actual destination");assert(createExplorer(b,s.chapter).near(skyLanding[op]),"landing must persist");}}
   assert(!b.view().objective.includes(op),"unrecorded "+op);physical++;
   if(physical===1){const p=x.rewardPoints()[0];walk(x,p.point);const cash=State.S.coins;ok(x.pickup(p.id),"cache reward");assert(State.S.coins>cash&&!x.pickup(p.id).ok,"duplicate reward");rewards++;}
  }else host(e=>e.record(s.id,op));}
  if(s.id==="starfall:F-04")links();
  while(b.view().cursor<s.lines.length)host(e=>e.nextLine());
  if(s.choices.length&&!b.view().choice)host(e=>e.choose(s.choices[0].id));
  host(e=>e.finish());
 }
 assert(b.view().current.id==="finale:B-01","did not reach finale: "+b.view().current.id);
 assert(b.view().ring&&b.view().melodies.length===6&&b.view().sanctuaries.length===6,"ring or sanctuaries incomplete");assert(deliveries===24&&localInvites===12,"wrong exchange/participation counts");
 assert(!State.S.lastResonanceWorld,"parallel story state still created");
 const old=State.S.resonance,oldW=JSON.stringify(b.world());const oldExplorer=createExplorer(b,b.world().location),oldToken=runtime.capture();
 assert(State.startNewGame("slot2"),"slot2");assert(!oldExplorer.walk(.2,.2),"stale world explorer can move");assert(!runtime.nextLine(oldToken).ok,"stale scene lease accepted");assert(b.view().current.id==="prologue:P-01"&&!b.world().location,"slot2 leaked");
 assert(State.startNewGame("slot3"),"slot3");assert(b.view().current.id==="prologue:P-01","slot3 leaked");
 assert(State.loadSlot("slot1"),"restore slot1");assert(b.view().current.id==="finale:B-01"&&JSON.stringify(b.world())===oldW,"slot1 restore");
 const before=JSON.stringify(State.S.resonanceExploration),failed=createWorldBridge({get S(){return State.S},save:()=>({ok:false,reason:"quota"})});assert(!failed.enter("harbor").ok&&JSON.stringify(State.S.resonanceExploration)===before,"failed save did not roll back");
 assert(notified===physical+deliveries,"unexpected shared runtime notification count "+notified);
 // Finish upstream-owned finale/epilogue with fixtures ONLY to exercise the actual postgame world host.
 while(!b.view().ending){const v=b.view(),scene=v.current;
  if(scene.id==="finale:B-03")for(const [i,region] of campaign.regions.entries())host(e=>e.supportAction(region,campaign.support[i]));
  if(scene.choices.length&&scene.choiceTiming==="beforeAction")host(e=>e.choose(scene.choices[0].id));
  for(const op of scene.requires.filter(op=>!["mechanism:muling-unlock","npc:public-accountability","npc:second-garden-key"].includes(op)))host(e=>e.record(scene.id,op));
  while(b.view().cursor<scene.lines.length)host(e=>e.nextLine());
  if(scene.choices.length&&!b.view().choice)host(e=>e.choose(scene.choices[0].id));
  for(const op of b.view().objective)host(e=>e.record(scene.id,op));host(e=>e.finish());
 }
 let letters=0,reunions=0;
 for(const region of campaign.regions){
  ok(b.enter(region),"postgame travel");let x=createExplorer(b,region),q=x.homeQuest();
  assert(q&&!q.repaired,"letter available");assert(!x.meetHomeResident(x.localNpcs()[0].id).ok,"no reunion before repair");
  walk(x,q.point);ok(x.startHomeRepair(),"repair after ending");solve(x);letters++;
  x=createExplorer(b,region);assert(x.homeQuest()?.repaired,"letter saved");
  for(const n of x.localNpcs()){walk(x,n.point);ok(x.meetHomeResident(n.id),"invite resident");x=createExplorer(b,region);}
  assert(!x.homeQuest(),"reunion completed");reunions++;
 }
 assert(b.view().returned.length===12&&b.view().postgame.length===12,"all six regional reunions persisted");
 return {physical,puzzles,walkingTicks:walking,deliveries,localInvites,rewards,fixtureTransitions:fixture,slots:3,sharedRuntimeNotifications:notified,letters,reunions,canonicalEnding:b.view().ending};
})(src)));
