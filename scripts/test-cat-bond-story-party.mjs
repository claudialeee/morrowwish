import assert from "node:assert/strict";
import {storyPartyPatch,recruitment,optionalRecruitment,companionRoles} from "../public/cat-bond/js/resonance/story-party.mjs";
let uid=1;const factory=(species,opts)=>({uid:"c"+uid++,species,level:1,...opts});
const root={cats:[factory("jinjc",{})],battlePrefs:{teamUids:["c1"]}};
let completed=[],postgame=[];
function advance(scene,reunion){const previous={completed:[...completed],postgame:[...postgame]};if(scene)completed.push(scene);if(reunion)postgame.push(reunion);const p=storyPartyPatch(root,previous,{completed,postgame},factory);if(p)Object.assign(root,p.fields);return p;}
assert.equal(advance("prologue:P-05"),null);
advance("harbor:H-04");const m=root.cats.find(c=>c.storyActor==="muling");assert.ok(m);assert.deepEqual(root.battlePrefs.teamUids,["c1",m.uid]);
m.level=9;advance("harbor:H-05");advance("forest:R-01");const herb=root.cats.find(c=>c.storyActor==="yahe");assert.ok(herb);assert.ok(!root.battlePrefs.teamUids.includes(herb.uid));
for(const id of ["forest:R-04","forge:E-04","sky:S-05","library:M-05","starfall:F-04"])advance(id);
assert.equal(root.cats.length,9);assert.equal(root.storyAway.muling.uid,m.uid);
assert.deepEqual(root.battlePrefs.teamUids.map(uid=>root.cats.find(c=>c.uid===uid).species),["jinjc","story_qilan","story_xiaomao","story_yuanfan","story_baikan"]);
assert.equal(Object.values(companionRoles).filter(x=>x==="regional").length,4);
assert.ok(!root.cats.some(c=>companionRoles[c.storyActor]==="regional"));
advance("epilogue:E-03");assert.equal(root.cats.length,10);assert.equal(root.cats.find(c=>c.storyActor==="muling").level,9);assert.equal(root.cats.find(c=>c.storyActor==="muling").uid,m.uid);
for(const id of Object.keys(optionalRecruitment)){const p=advance(null,id);assert.equal(p.joined.length,1);assert.equal(advance(null,id),null);}
assert.equal(root.cats.length,14);assert.equal(new Set(root.cats.map(c=>c.species)).size,14);
assert.equal(storyPartyPatch(root,{completed,postgame},{completed,postgame},factory),null);
assert.equal(new Set(Object.values(recruitment).flat()).size,9);
assert.equal(root.firstDuoShowcasePending,true);
for(const a of root.cats)for(const b of root.cats)if(a.uid!==b.uid)assert.ok(root.duoRelations.pairs[[a.uid,b.uid].sort().join(":")]?.value>=20);
console.log("Core party, reserve allies, optional reunion recruitment, departure, return, all 91 bonds and deduplication passed");
