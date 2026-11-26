import assert from 'node:assert/strict';
import {libraryPuzzle,advanceLibrary,routeGesture} from '../public/cat-bond/js/resonance/library-mechanisms.mjs';
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

assert.equal(routeGesture([.5,.31],[.5,.47]),0);
assert.equal(routeGesture([.5,.31],[.5+.22*Math.sqrt(3)/2,.39]),1);
assert.equal(routeGesture([.1,.1],[.5,.47]),-1);
assert.equal(routeGesture([.5,.31],[.5,.63]),-1);
