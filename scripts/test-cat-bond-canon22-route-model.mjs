import assert from 'node:assert/strict';
import {libraryPuzzle,advanceLibrary} from '../public/cat-bond/js/resonance/library-mechanisms.mjs';
for(const order of [[0,1],[1,0]]){
 const p=libraryPuzzle('puzzle:two-route-model',null);
 assert.equal(advanceLibrary(p,2),false);
 assert.equal(p.solved,false);
 assert.equal(advanceLibrary(p,order[0]),false);
 assert.equal(advanceLibrary(p,2),false);
 assert.equal(advanceLibrary(p,order[1]),false);
 assert.equal(advanceLibrary(p,2),true);
 assert.deepEqual(p.values,[0,1,2]);
}
console.log('Both memory consequences must be demonstrated; either order is valid.');
