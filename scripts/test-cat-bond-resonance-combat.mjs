import {buildCombatRules} from '../public/cat-bond/js/resonance/combat-rules.mjs';
const testRules = function testRules(build){
 const a=build(),ids=a.regions.map(x=>x.id);let n=0;const check=(v)=>{if(!v)throw Error("assert "+n);n++};
 const ctx={slotId:"slot1",attemptId:"run1",regions:Object.fromEntries(ids.map(id=>[id,{sanctuary:true,melody:true,reciprocal:true}])),echoes:[{id:"a",identity:"muling",habit:"two-taps",observed:"one-tap"},{id:"b",identity:"player",habit:"reply-first",observed:"no-reply"}],catdex:{muling:["two-taps"]},duo:{bond:20,promiseIds:["p"],matchedBehavior:["reply-first"]},supportMethods:{harbor:"rescue-first"}};
 const make=(s,c=ctx)=>a.finale(s,c);let f=make();const act=(type,p={})=>f.accept({type,slotId:"slot1",attemptId:"run1",...p});
 check(a.regions.length===6&&new Set(a.regions.map(x=>x.behavior)).size===6);
 check(!act("central-victory",{result:"win"}).ok);check(!act("gate-disabled",{region:"harbor",interrupted:true,npcsProtected:true,slotId:"slot2"}).ok);
 check(!act("gate-disabled",{region:"harbor",interrupted:true,npcsProtected:false}).ok);
 check(!act("loss").ok&&f.snapshot().gates.length===0);
 for(const id of ids)check(act("gate-disabled",{region:id,interrupted:true,npcsProtected:true}).ok);
 check(f.snapshot().phase===2);check(!act("gate-disabled",{region:"harbor",interrupted:true,npcsProtected:true}).ok);
 check(!act("echo-interrupted",{echoId:"a",identity:"muling",observed:"one-tap",verifiedHabit:"two-taps",method:"promise",promiseId:"p",interrupted:true}).ok);
 check(act("echo-interrupted",{echoId:"a",identity:"muling",observed:"one-tap",verifiedHabit:"two-taps",method:"catdex",interrupted:true}).ok);
 f=make(JSON.parse(JSON.stringify(f.snapshot())));check(f.snapshot().identified.length===1);
 check(act("echo-interrupted",{echoId:"b",identity:"player",observed:"no-reply",verifiedHabit:"reply-first",method:"promise",promiseId:"p",interrupted:true}).ok);
 check(f.snapshot().phase===3);check(!act("central-victory",{result:"win"}).ok);
 for(const id of ids){const p=f.supportProfile(id);check(!act("support-complete",{region:id,action:p.action,method:p.method,actors:[],protected:true,melodyActivated:true}).ok);check(act("support-complete",{region:id,action:p.action,method:p.method,actors:p.npcs,protected:true,melodyActivated:true}).ok)}
 check(!act("muling-unlock",{actor:"muling",route:"neighbor",dialogueComplete:true}).ok);check(act("central-victory",{result:"win"}).ok);
 check(!act("central-victory",{result:"win"}).ok);check(!act("muling-unlock",{actor:"player",route:"neighbor",dialogueComplete:true}).ok);check(act("muling-unlock",{actor:"muling",route:"neighbor",dialogueComplete:true}).ok);
 check(!act("ring-confirmed",{neighborPaths:{},canonicalReplyVerified:true}).ok);check(act("ring-confirmed",{neighborPaths:Object.fromEntries(ids.map(id=>[id,true])),canonicalReplyVerified:true}).ok);check(f.snapshot().resolved);
 check(make(null,{...ctx,slotId:"slot2",attemptId:"run2"}).snapshot().phase===1);
 let rejected=false;try{make(null,{...ctx,regions:{}})}catch{rejected=true}check(rejected);
 let invalid=false;try{make({...f.snapshot(),support:[]})}catch{invalid=true}check(invalid);
 return n;
};
console.log('Isolated combat rules assertions:',testRules(buildCombatRules));

import assert from "node:assert/strict";
import {campaign} from "../public/cat-bond/js/resonance/campaign.mjs";
import {supportEffects,echoHabit,rhythm,identifyEcho} from "../public/cat-bond/js/resonance/finale-combat.mjs";

// Exercise the helper called by the actual phase-three battle loop and pulse handler.
const baseline=supportEffects({},null);
assert.equal(baseline.required,4);
assert.equal(baseline.pulseDamage,32);
for(const region of campaign.regions){
 const scenes=campaign.scenes.filter(s=>s.chapter===region&&s.choices.length===2);
 assert.ok(scenes.length,"Missing canonical regional choice: "+region);
 for(const scene of scenes){
  const results=scene.choices.map(c=>supportEffects({methods:[c.method],trust:{}},null));
  assert.notDeepEqual(results[0],results[1],scene.id+" choices must change actual battle assistance");
  for(const result of results)assert.ok(result.required<4||result.pulseDamage<32,scene.id+" must grant a real effect");
 }
}
const profile={methods:["precise-beacon"],trust:{qilan:2,jiedeng:2}};
const before=supportEffects(profile,null);
const built=supportEffects(profile,{level:1,visits:0});
const tended=supportEffects(profile,{level:3,visits:4});
assert.ok(tended.required<built.required&&built.required<before.required);
assert.ok(tended.pulseDamage<built.pulseDamage&&built.pulseDamage<before.pulseDamage);
assert.ok(supportEffects(profile,null,{bonded:true,pledge:true}).required<before.required);
assert.deepEqual(supportEffects({methods:["precise-beacon","precise-beacon"],trust:profile.trust},null),before);
assert.deepEqual(supportEffects({methods:["anger"],trust:{}},null),baseline);
console.log("Live finale support calculation: canonical alternatives, garden care, duo promises and duplicate-method guard passed");

const personalities=["clever","mischievous","glutton","diligent","gentle","shy","lazy"];
assert.equal(new Set(personalities.map(personality=>echoHabit({personality}))).size,personalities.length);
for(const personality of personalities){
 const habit=echoHabit({personality});
 const normal=rhythm("finale:B-02",false,habit),copied=rhythm("finale:B-02",true,habit);
 assert.equal(identifyEcho(habit,normal[1]-normal[0]),false);
 assert.equal(identifyEcho(habit,copied[1]-copied[0]),true);
 assert.equal(identifyEcho(habit,null),false);
}
console.log("Individual Catdex rhythm and measured-mismatch regression passed");
