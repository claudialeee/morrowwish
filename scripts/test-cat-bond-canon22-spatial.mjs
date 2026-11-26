import assert from 'node:assert/strict';
import {newSpatial,spatialInput,spatialProof,validSpatialProof,tickSpatial,chasePoint} from '../public/cat-bond/js/resonance/canon22-spatial.mjs';
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
console.log('Spatial runtime: alternative paths, collision/gap, local illumination, dynamic light, moving pursuit, replay and wrong-input recovery passed');
