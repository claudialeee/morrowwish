import assert from "node:assert/strict";
import {storyPartyPatch,recruitment} from "../public/cat-bond/js/resonance/story-party.mjs";
let uid=1;const factory=(species,opts)=>({uid:"c"+uid++,species,level:1,...opts});
const root={cats:[factory("jinjc",{})],battlePrefs:{teamUids:["c1"]}};
let completed=[];
function finish(scene){const previous={completed:[...completed]};completed.push(scene);const p=storyPartyPatch(root,previous,{completed},factory);if(p)Object.assign(root,p.fields);return p;}
assert.equal(finish("prologue:P-05"),null);
finish("harbor:H-04");const m=root.cats.find(c=>c.storyActor==="muling");assert.ok(m);assert.deepEqual(root.battlePrefs.teamUids,["c1",m.uid]);assert.equal(root.duoRelations.pairs[["c1",m.uid].sort().join(":")].value,20);
m.level=9;for(const id of ["harbor:H-05","forest:R-04","forge:E-04","sky:S-05","library:M-05","starfall:F-04"])finish(id);
assert.equal(root.cats.length,13);assert.equal(root.cats.some(c=>c.storyActor==="muling"),false);assert.equal(root.storyAway.muling.uid,m.uid);
finish("epilogue:E-03");assert.equal(root.cats.length,14);assert.equal(root.cats.find(c=>c.storyActor==="muling").level,9);assert.equal(root.cats.find(c=>c.storyActor==="muling").uid,m.uid);assert.equal(new Set(root.cats.map(c=>c.species)).size,14);
assert.equal(storyPartyPatch(root,{completed},{completed},factory),null);
assert.equal(Object.values(recruitment).flat().length,13);
console.log("Story party: recruit, first duo, 12 NPCs, departure, return, no duplicate passed");

assert.equal(root.firstDuoShowcasePending,true);for(const a of root.cats)for(const b of root.cats)if(a.uid!==b.uid)assert.ok(root.duoRelations.pairs[[a.uid,b.uid].sort().join(":")]?.value>=20);console.log("All 91 protagonist/story pairs unlock duo, including after reunion");
