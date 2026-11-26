import assert from "node:assert/strict";
import {libraryPuzzle,advanceLibrary,libraryWords} from "../public/cat-bond/js/resonance/library-mechanisms.mjs";
for(let i=0;i<3;i++){const p=libraryPuzzle("explore:routing-record",null);assert.equal(p.solved,false);assert.equal(advanceLibrary(p,i),true);assert.equal(p.question,i);assert.equal(p.mistakes,0);assert.deepEqual(p.values,[0]);assert.equal(libraryWords(p)[2].length,3);}
const invalid=libraryPuzzle("explore:routing-record",null);assert.equal(advanceLibrary(invalid,3),false);assert.equal(invalid.solved,false);
console.log("PASS: public ledger accepts all three questions without sorting or guessing");
