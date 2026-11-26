import assert from "node:assert/strict";
import {campaign} from "../public/cat-bond/js/resonance/campaign.mjs";
import {makeEngine} from "../public/cat-bond/js/resonance/engine.mjs";
const ok=r=>assert.equal(r.ok,true,r.reason);
for(const meet of [false,true]){const e=makeEngine(campaign);for(let i=0;i<4;i++){assert.deepEqual(e.view().objective,[]);ok(e.finish());}assert.equal(e.view().muling,"unmet");assert.equal(e.view().current.id,"prologue:P-05");assert.equal(e.finish().ok,false);if(meet){ok(e.meetTraveler());assert.equal(e.meetTraveler().ok,false);}ok(e.record("prologue:P-05","travel:harbor"));ok(e.finish());assert.equal(e.view().current.lines[2].text.zh.includes("又见面"),meet);assert.equal(e.nextLine().ok,false);ok(e.record("harbor:H-01","npc:harbor-arrival"));for(let i=0;i<6;i++)ok(e.nextLine());ok(e.finish());assert.equal(e.view().muling,"temporary");}
const old=makeEngine(campaign).snapshot();old.scene="prologue:P-02";old.completed=["prologue:P-01"];old.cursor=12;delete old.openingPresentationVersion;assert.equal(makeEngine(campaign,old).view().cursor,0);
console.log("Player-first opening and optional encounter passed");

// Chapter II: discover the evidence before choosing, then solve the rescue and local melody.
import {createPuzzle,movePuzzle} from "../public/cat-bond/js/resonance/world-exploration.mjs";
const firstForest=campaign.scenes.findIndex(s=>s.id==="forest:R-01");
const forestSave=makeEngine(campaign).snapshot();forestSave.scene="forest:R-01";forestSave.completed=campaign.scenes.slice(0,firstForest).map(s=>s.id);
const forest=makeEngine(campaign,forestSave);const drain=()=>{while(forest.view().cursor<forest.view().current.lines.length)ok(forest.nextLine());};
ok(forest.record("forest:R-01","npc:forest-dispute"));drain();ok(forest.finish());assert.equal(forest.choose("gardens").ok,false);assert.equal(forest.nextLine().ok,false);ok(forest.record("forest:R-02","explore:scent-trail"));drain();ok(forest.choose("roots"));ok(forest.finish());assert.equal(forest.finish().ok,false);
const water=createPuzzle("puzzle:paired-water-gates");assert.equal(movePuzzle(water,2),false);for(const i of [0,0,1])assert.equal(movePuzzle(water,i),false);assert.equal(movePuzzle(water,2),true);assert.deepEqual(water.values,[2,1,1]);ok(forest.record("forest:R-03","puzzle:paired-water-gates"));drain();ok(forest.finish());assert.equal(forest.record("forest:R-04","melody:forest").ok,false);ok(forest.record("forest:R-04","repair:forest"));const song=createPuzzle("melody:forest");song.participants=["yahe","yuchuan"];assert.equal(movePuzzle(song,1),false);assert.equal(movePuzzle(song,2),false);assert.deepEqual(song.values,[1]);assert.equal(movePuzzle(song,0),false);assert.equal(movePuzzle(song,2),true);ok(forest.record("forest:R-04","melody:forest"));drain();ok(forest.finish());assert.equal(forest.view().current.id,"forge:E-01");console.log("Chapter II: clues, choice, paired rescue, melody and next region passed");
