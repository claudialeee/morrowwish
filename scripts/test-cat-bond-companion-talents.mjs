import assert from "node:assert/strict";
import {activateCompanionTalents} from "../public/cat-bond/js/resonance/companion-talents.mjs";
const fighter=(id,hp=100)=>({cat:{storyActor:id},alive:true,hp,maxhp:100,shieldT:0});
const q=fighter("qilan"),y=fighter("yahe"),x=fighter("xiaomao"),p=fighter("player",50);
const b={regionalCombat:{cast:null},t:2,ult:30,team:[q,y,x,p],gainUlt(n){this.ult+=n},healUnit(f,n){f.hp=Math.min(f.maxhp,f.hp+n)}};
assert.deepEqual(activateCompanionTalents(b),["qilan","yahe"]);assert.equal(b.ult,42);assert.equal(p.hp,70);
assert.deepEqual(activateCompanionTalents(b),[]);b.regionalCombat.cast={};assert.deepEqual(activateCompanionTalents(b),["xiaomao"]);assert.ok(b.team.every(f=>f.shieldT===3.5));
assert.deepEqual(activateCompanionTalents(b),[]);const c={...b,team:[p],companionTalentsUsed:new Set(),reserve:[q,y,x]};assert.deepEqual(activateCompanionTalents(c),[]);
for(const flag of ["done","captureSeq","duoCinematic","ultCinematic"]){const d={...b,[flag]:true,companionTalentsUsed:new Set()};assert.deepEqual(activateCompanionTalents(d),[]);}
console.log("Companion talents: real charge, heal, shield, once per battle and active roster guards passed");
