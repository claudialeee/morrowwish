import assert from 'node:assert/strict';
import {newSpatial,spatialInput,spatialProof,validSpatialProof,tickSpatial,chasePoint,startBridgeWalk,advanceBridgeWalk,bridgeWalkPosition} from '../public/cat-bond/js/resonance/canon22-spatial.mjs';
const step=i=>({type:'step',i}),leaf={type:'leaf'},aim=x=>({type:'aim',x}),cross={type:'cross'};
for(const [op,paths] of [
 ['puzzle:moonleaf-crossing',[[step(1),step(3),leaf,step(3),step(4)],[step(1),step(2),step(4)]]],
 ['puzzle:moonleaf-loop',[[step(1),step(2),leaf,step(2),step(4)],[step(1),step(3),step(4)]]],
 ['puzzle:star-steps',[[step(7),step(1),step(3),step(5),step(7)],[step(2),step(4),step(6),step(7)]]],
 ['puzzle:shadow-bridge',[[cross,aim(.2),cross,aim(.72),cross]]],
 ['puzzle:lantern-show',[[{type:'shape',i:2},aim(.2),aim(.72),cross],[cross]]]
]){
 for(const actions of paths){const p=newSpatial(op);assert.equal(validSpatialProof(op,spatialProof(p)),false);for(const a of actions)spatialInput(p,a);assert.ok(p.solved,op);const proof=spatialProof(p);assert.ok(validSpatialProof(op,proof),op);assert.equal(validSpatialProof(op,{...proof,trace:[]}),false);assert.equal(validSpatialProof(op,{...proof,frames:1}),false);}
}
const bridge=newSpatial('puzzle:moonleaf-crossing');spatialInput(bridge,step(1));spatialInput(bridge,step(3));assert.equal(bridge.node,1);assert.equal(bridge.warning,'gap');
const stars=newSpatial('puzzle:star-steps');spatialInput(stars,step(7));assert.equal(stars.node,0);assert.equal(stars.warning,'fall');
const shadow=newSpatial('puzzle:shadow-bridge');spatialInput(shadow,cross);assert.equal(shadow.solved,false);
const chase=newSpatial('puzzle:chime-chase');const first=chasePoint(chase);for(let i=0;i<200;i++)tickSpatial(chase,.02);assert.notDeepEqual(chasePoint(chase),first);assert.equal(chase.solved,false);spatialInput(chase,{type:'target',x:.8,y:.27});for(let i=0;i<2500&&!chase.solved;i++)tickSpatial(chase,.02);assert.ok(chase.solved);const proof=spatialProof(chase);assert.ok(validSpatialProof(chase.operation,proof));assert.equal(validSpatialProof(chase.operation,{...proof,frames:proof.frames-1}),false);
const jump=newSpatial('puzzle:chime-chase');spatialInput(jump,{type:'jump'});for(let i=0;i<2500&&!jump.solved;i++)tickSpatial(jump,.02);assert.ok(jump.solved);assert.equal(jump.route,'shortcut');assert.ok(jump.wallCrossed);assert.equal(chase.route,'lane');assert.ok(validSpatialProof(jump.operation,spatialProof(jump)));assert.equal(validSpatialProof(jump.operation,{...spatialProof(jump),route:'lane'}),false);
const lantern=newSpatial('puzzle:lantern-show');spatialInput(lantern,{type:'shape',i:1});spatialInput(lantern,aim(.2));spatialInput(lantern,cross);assert.equal(spatialProof(lantern).shape,1);assert.equal(validSpatialProof(lantern.operation,{...spatialProof(lantern),shape:2}),false);
const upper=newSpatial('puzzle:moonleaf-crossing');for(const a of [step(1),step(2),step(4)])spatialInput(upper,a);assert.deepEqual(spatialProof(upper).discoveries,['garden-view']);assert.equal(validSpatialProof(upper.operation,{...spatialProof(upper),discoveries:['glowing-fungi']}),false);
console.log('Spatial runtime: alternative paths, collision/gap, local illumination, dynamic light, moving pursuit, replay and wrong-input recovery passed');

const walking=newSpatial('puzzle:moonleaf-crossing');assert.ok(startBridgeWalk(walking,step(1)));assert.equal(walking.node,0);advanceBridgeWalk(walking,.1);assert.ok(bridgeWalkPosition(walking)[0]>.16&&bridgeWalkPosition(walking)[0]<.36);assert.equal(spatialInput(walking,leaf),false);while(walking.walk)advanceBridgeWalk(walking,.02);assert.equal(walking.node,1);assert.equal(startBridgeWalk(walking,step(3)),false);spatialInput(walking,leaf);assert.ok(startBridgeWalk(walking,step(3)));while(walking.walk)advanceBridgeWalk(walking,.02);assert.equal(walking.node,3);spatialInput(walking,{type:'rescue'});assert.ok(walking.discoveries.includes('rescued-kitten'));assert.ok(startBridgeWalk(walking,step(4)));assert.equal(walking.solved,false);while(walking.walk)advanceBridgeWalk(walking,.02);assert.ok(walking.solved);assert.ok(validSpatialProof(walking.operation,spatialProof(walking)));assert.equal(validSpatialProof(walking.operation,{...spatialProof(walking),discoveries:['glowing-fungi']}),false);const badRescue=newSpatial(walking.operation);spatialInput(badRescue,{type:'rescue'});assert.equal(badRescue.trace.length,0);console.log('Bridge movement, arrival gate, gap blocking, optional kitten rescue and evidence passed');

// Visual lane remapping is invertible; simulation and replay proof keep their coordinates.
const {chaseVisualY,chaseLogicalY}=await import('../public/cat-bond/js/resonance/canon22-spatial.mjs');
for(const y of [.2,.27,.35,.49,.5,.73,.8])assert.ok(Math.abs(chaseLogicalY(chaseVisualY(y))-y)<1e-9);
assert.ok(Math.abs(chaseVisualY(.27)-.35)<1e-9);
