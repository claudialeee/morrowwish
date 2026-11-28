import assert from 'node:assert/strict';
import {newSideState,sideAction,verifySideProof,applySideEvent,sideAdventures,sideMemory,sideKeepsakes} from '../public/cat-bond/js/resonance/side-adventures.mjs';
import {regionalKeepsakes,applyRegionalKeepsake,forgeLightScale} from '../public/cat-bond/js/resonance/regional-keepsake-talents.mjs';
import {newTrial,trialAction} from '../public/cat-bond/js/resonance/adventure-play.mjs';
const a=(type,i,side)=>({type,...(i===undefined?{}:{i}),...(side===undefined?{}:{side})});
const traces={harbor:[a("step",0),a("wait"),a("step",1),a("step",2)],forest:[a("pick",1),a("pick",3),a("brew"),a("pick",0),a("pick",2),a("brew")],forge:[a("rotate"),a("rotate"),a("rotate"),a("flip"),a("light")],sky:[a("place",0,1),a("place",1,2),a("place",2,2),a("place",3,1),a("launch")],library:[a("page",1),a("page",2),a("page",0),a("bind")],starfall:[a("star",2),a("star",1),a("star",3),a("star",4)]};
for(const [region,trace] of Object.entries(traces)){
 const s=newSideState(region);for(const action of trace)assert(sideAction(s,action));assert(s.done);assert(verifySideProof(region,s.trace));assert(!verifySideProof(region,trace.slice(0,-1)));assert(!verifySideProof(region,[...trace,a("wait")]));
 const d=sideAdventures[region],w={location:region,positions:{[region]:{x:d.at[0],y:d.at[1]}},interactions:{}},v={regions:[region]};
 assert(!applySideEvent(region,{...w,positions:{[region]:{x:0,y:0}}},v,trace).ok);
 assert(!applySideEvent(region,w,v,trace.slice(0,-1)).ok);const result=applySideEvent(region,w,v,trace);assert(result.ok);assert(!applySideEvent(region,result.next,v,trace).ok);assert.equal(sideKeepsakes(result.next.interactions).length,1);assert.equal(sideMemory(d.actor,{resonanceExploration:result.next,resonance:{completed:[d.after]}}).length,1);
}
assert(!verifySideProof("harbor",[a("step",0),a("step",2),a("step",0)]));
assert(!verifySideProof("forest",[a("pick",1),a("pick",3),a("brew")]));
assert(!verifySideProof("forge",[a("rotate"),a("rotate"),a("rotate"),a("light")]));
assert(!verifySideProof("sky",[a("place",0,2),a("place",1,1),a("place",2,1),a("place",3,2),a("launch")]));
assert(!verifySideProof("library",[a("page",0),a("page",1),a("page",2),a("bind")]));
assert(verifySideProof("starfall",[a("star",2),a("star",4),a("undo"),a("star",1),a("star",3),a("star",4)]));
const events={harbor:"warning",forest:"tick",sky:"warning",library:"mirror-counter",starfall:"evade"};
for(const [region,event] of Object.entries(events)){
 const f={alive:true,hp:60,maxhp:100},e={reflectT:2},b={team:[f],regionalCombat:{region,cast:{}},ult:30,healUnit:(f,n)=>f.hp+=n,gainUlt(n){this.ult+=n},liveEnemies:()=>[e]},root={resonanceExploration:{interactions:{["side-adventure:"+region]:true}}};
 assert(!applyRegionalKeepsake(b,{},event));assert(!applyRegionalKeepsake(b,root,"wrong"));assert(applyRegionalKeepsake(b,root,event));assert(!applyRegionalKeepsake(b,root,event));
 if(region==="harbor")assert.equal(f.shieldT,2.5);if(region==="forest")assert.equal(f.hp,72);if(region==="sky")assert.equal(b.regionalCombat.keepsakeGaleCast,b.regionalCombat.cast);if(region==="library")assert.equal(e.reflectT,0);if(region==="starfall")assert.equal(b.ult,45);
 b.regionalCombat.keepsakeUsed=false;b.libraryEncounter={bossId:"mastery"};assert(!applyRegionalKeepsake(b,root,event));
}
const forge={regionalCombat:{region:"forge",shadowLight:true}},forgeRoot={resonanceExploration:{interactions:{"side-adventure:forge":true}}};assert.equal(forgeLightScale(forge,forgeRoot),1.15);assert.equal(forgeLightScale(forge,{}),1);assert.equal(Object.keys(regionalKeepsakes).length,6);
for(const level of [1,4,7])for(const id of ["qilan","yahe","xiaomao"]){const s=newTrial(id,level);assert(trialAction(s,"deploy"));if(id==="qilan"){assert.equal(s.b.ult,100);assert(trialAction(s,"cast"));}else if(id==="yahe"){assert(Math.abs(s.ally.hp-(55+s.heal))<1e-8);assert(trialAction(s,"escort"));}else{assert(trialAction(s,"warn"));assert.equal(s.ally.shieldT,s.ward);assert(trialAction(s,"impact"));}assert(s.done);}
console.log("PASS: six regional proofs, incorrect actions, distance, one-time rewards, memory, six tactical perks, nine talent rank cases.");
