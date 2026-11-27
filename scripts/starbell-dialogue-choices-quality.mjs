import assert from "node:assert/strict";
import {campaign} from "../public/cat-bond/js/resonance/campaign.mjs";
import {makeEngine} from "../public/cat-bond/js/resonance/engine.mjs";

const scenes=["library:M-03","library:M-04","epilogue:E-02"];
let tested=0;
for(const id of scenes){
 const index=campaign.scenes.findIndex(s=>s.id===id),scene=campaign.scenes[index];
 const initial=makeEngine(campaign).snapshot();
 initial.scene=id;
 initial.completed=campaign.scenes.slice(0,index).map(s=>s.id);
 for(const s of campaign.scenes.slice(0,index)){
  initial.evidence[s.id]=[...s.requires];
  for(const op of s.requires){
   if(op.startsWith("repair:"))initial.sanctuaries.push(op.split(":")[1]);
   if(op.startsWith("melody:"))initial.melodies.push(op.split(":")[1]);
  }
  if(s.choices.length)initial.choices[s.id]=s.choices[0].id;
 }
 if(initial.completed.includes("finale:B-03"))initial.support=[...campaign.regions];
 initial.evidence[id]=[...scene.lineGate];
 // The old end-of-dialogue cursor is the new choice boundary.
 initial.cursor=scene.choiceAt;
 assert.equal(scene.lines.length,scene.choiceAt+2);
 const distinct=new Set();
 for(const choice of scene.choices){
  const expected=scene.choiceResponses[choice.id];
  assert.equal(expected.length,2);
  for(const l of expected){assert.ok(campaign.cast[l.speaker]);assert.ok(l.text.zh.trim());assert.ok(l.text.en.trim());}
  distinct.add(JSON.stringify(expected));
  let engine=makeEngine(campaign,initial);
  assert.equal(engine.view().lineReady,false);
  assert.equal(engine.nextLine().ok,false);
  assert.equal(engine.choose(choice.id).ok,true);
  assert.equal(engine.choose(choice.id).ok,false);
  assert.equal(engine.finish().ok,false);
  assert.deepEqual(engine.view().current.lines[engine.view().cursor],expected[0]);
  engine=makeEngine(campaign,engine.snapshot());
  assert.equal(engine.nextLine().ok,true);
  engine=makeEngine(campaign,engine.snapshot());
  assert.deepEqual(engine.view().current.lines[engine.view().cursor],expected[1]);
  assert.equal(engine.nextLine().ok,true);
  if(id==="epilogue:E-02")assert.equal(engine.record(id,"npc:public-accountability").ok,true);
  assert.equal(engine.finish().ok,true);
  // A previously saved selection at the old cursor resumes at its response.
  const oldSelected=structuredClone(initial);
  oldSelected.choices[id]=choice.id;
  assert.deepEqual(makeEngine(campaign,oldSelected).view().current.lines[initial.cursor],expected[0]);
  tested++;
 }
 assert.equal(distinct.size,scene.choices.length);
}
assert.equal(tested,9);
console.log("PASS: nine bilingual choice responses, save/resume, progression and old cursor compatibility");
