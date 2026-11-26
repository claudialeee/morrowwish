import assert from "node:assert/strict";
import {campaign} from "../public/cat-bond/js/resonance/campaign.mjs";
import {makeEngine} from "../public/cat-bond/js/resonance/engine.mjs";
const ok=r=>assert.equal(r.ok,true,r.reason);
for(const meet of [false,true]){const e=makeEngine(campaign);for(let i=0;i<4;i++){assert.deepEqual(e.view().objective,[]);ok(e.finish());}assert.equal(e.view().muling,"unmet");assert.equal(e.view().current.id,"prologue:P-05");assert.equal(e.finish().ok,false);if(meet){ok(e.meetTraveler());assert.equal(e.meetTraveler().ok,false);}ok(e.record("prologue:P-05","travel:harbor"));ok(e.finish());assert.equal(e.view().current.lines[2].text.zh.includes("又见面"),meet);assert.equal(e.nextLine().ok,false);ok(e.record("harbor:H-01","npc:harbor-arrival"));for(let i=0;i<6;i++)ok(e.nextLine());ok(e.finish());assert.equal(e.view().muling,"temporary");}
const old=makeEngine(campaign).snapshot();old.scene="prologue:P-02";old.completed=["prologue:P-01"];old.cursor=12;delete old.openingPresentationVersion;assert.equal(makeEngine(campaign,old).view().cursor,0);
console.log("Player-first opening and optional encounter passed");
