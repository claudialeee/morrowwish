import assert from "node:assert/strict";
import {libraryPuzzle,advanceLibrary,libraryWords} from "../public/cat-bond/js/resonance/library-mechanisms.mjs";
for(const order of [[0,1,2],[2,0,1],[1,2,0]]){const p=libraryPuzzle("explore:routing-record",null);assert.equal(advanceLibrary(p,3),false);for(const i of order){assert.equal(advanceLibrary(p,i),false);assert.equal(advanceLibrary(p,i),false);}assert.equal(p.seen.length,3);assert.equal(advanceLibrary(p,3),true);assert.equal(p.question,3);assert.deepEqual(p.values,[0]);assert.equal(libraryWords(p)[2].length,4);}
console.log("PASS: three independent records must be inspected before confronting Luna");
