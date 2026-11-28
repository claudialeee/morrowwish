import assert from 'node:assert/strict';
import {newSpatial,spatialInput,spatialProof,validSpatialProof,tickSpatial,chasePoint,startBridgeWalk,advanceBridgeWalk,bridgeWalkPosition,bridgeReachable,spatialControls,spatialTap,spatialTravelPose,spatialNodes,animateStarPlatforms,chaseVisualY,chaseLogicalY} from '../public/cat-bond/js/resonance/canon22-spatial.mjs';
const step=i=>({type:'step',i}),aim=x=>({type:'aim',x}),cross={type:'cross'};
function verify(p){const proof=spatialProof(p);assert.ok(p.solved,p.operation);assert.ok(validSpatialProof(p.operation,proof));assert.equal(validSpatialProof(p.operation,{...proof,trace:[]}),false);return proof;}
{
 const p=newSpatial('puzzle:moonleaf-crossing');assert.deepEqual(bridgeReachable(p),[1]);assert.equal(startBridgeWalk(p,step(4)),false);
 const walk=i=>{assert.ok(startBridgeWalk(p,step(i)));assert.ok(p.walk.duration>=.6);while(p.walk)advanceBridgeWalk(p,.02);};
 walk(1);assert.deepEqual(bridgeReachable(p),[2]);assert.equal(startBridgeWalk(p,step(3)),false);
 walk(2);assert.deepEqual(bridgeReachable(p),[1]);assert.equal(startBridgeWalk(p,step(4)),false);walk(1);
 spatialInput(p,{type:'leaf'});assert.deepEqual(bridgeReachable(p),[3]);assert.ok(spatialControls(p).some(x=>x.action.i===3));
 walk(3);assert.equal(startBridgeWalk(p,step(4)),false);assert.equal(p.solved,false);
 spatialInput(p,{type:'rescue'});walk(4);const proof=verify(p);assert.ok(proof.discoveries.includes('rescued-kitten'));assert.ok(proof.discoveries.includes('garden-view'));assert.equal(validSpatialProof(p.operation,{...proof,discoveries:[]}),false);
 const direct=newSpatial('puzzle:moonleaf-crossing');for(const a of [step(1),{type:'leaf'},step(3),{type:'rescue'},step(4)])spatialInput(direct,a);verify(direct);
}
const badRescue=newSpatial('puzzle:moonleaf-crossing');spatialInput(badRescue,{type:'rescue'});assert.equal(badRescue.trace.length,0);
const bell=newSpatial('puzzle:chime-chase');
assert.equal(bell.kind,'bellPattern');
assert.equal(spatialInput(bell,{type:'bell-tile',i:2}),false);assert.equal(bell.patternRound,0);assert.equal(bell.trace.length,0);assert.equal(bell.warning,'bell-mismatch');
assert.equal(spatialTap(bell,.5,.2),null);
for(const i of [1,0,2]){const action=spatialTap(bell,[.23,.5,.77][i],.68);assert.deepEqual(action,{type:'bell-tile',i});spatialInput(bell,action);}
const bp=verify(bell);assert.equal(bp.route,'restored-pattern');assert.equal(bp.frames,0);assert.equal(validSpatialProof(bell.operation,{...bp,trace:[{type:'bell-tile',i:0},...bp.trace.slice(1)]}),false);
assert.equal(validSpatialProof(bell.operation,{...bp,trace:bp.trace.slice(0,2)}),false);
const shadow=newSpatial('puzzle:shadow-bridge');spatialInput(shadow,cross);assert.equal(shadow.solved,false);
assert.equal(spatialTap(shadow,.5,.9),null);for(let i=0;i<1000;i++)spatialInput(shadow,aim(.19+Math.sin(i)*.03));spatialInput(shadow,aim(.51));spatialInput(shadow,cross);assert.equal(shadow.solved,false);spatialInput(shadow,aim(.82));spatialInput(shadow,cross);assert.equal(shadow.discoveries.length,3);verify(shadow);assert.ok(shadow.trace.length<10);
const lantern=newSpatial('puzzle:lantern-show');spatialInput(lantern,{type:'shape',i:1});spatialInput(lantern,aim(.2));spatialInput(lantern,cross);const show=verify(lantern);assert.equal(show.shape,1);assert.equal(validSpatialProof(lantern.operation,{...show,shape:2}),false);
for(const route of [[1,3,5,7],[2,4,6,7]]){
 const p=newSpatial('puzzle:star-steps');assert.equal(startBridgeWalk(p,step(7)),false);assert.equal(p.node,0);
 const before=spatialNodes(p)[3][1];animateStarPlatforms(p,.1);assert.notEqual(spatialNodes(p)[3][1],before);
 for(const i of route){const q=spatialNodes(p)[i];assert.deepEqual(spatialTap(p,...q),step(i));assert.ok(startBridgeWalk(p,step(i)));advanceBridgeWalk(p,.1);assert.ok(spatialTravelPose(p).lift>0);while(p.walk){animateStarPlatforms(p,.02);advanceBridgeWalk(p,.02);}}
 assert.deepEqual(p.visited,[0,...route]);assert.ok(verify(p).discoveries.some(x=>x.startsWith('starlight-')));
}
console.log('PASS: bell-pattern restoration and invalid proof rejection, forest dead-end, moonleaf switch, mandatory rescue, shadow hunt, theater, moving starstones and forged-proof rejection');
