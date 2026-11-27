import assert from 'node:assert/strict';
import {newSpatial,spatialInput,spatialProof,validSpatialProof,tickSpatial,chasePoint,startBridgeWalk,advanceBridgeWalk,bridgeWalkPosition,bridgeReachable,spatialControls,spatialTap,spatialTravelPose,spatialNodes,animateStarPlatforms,chaseVisualY,chaseLogicalY} from '../public/cat-bond/js/resonance/canon22-spatial.mjs';
const step=i=>({type:'step',i}),aim=x=>({type:'aim',x}),cross={type:'cross'};
function verify(p){const proof=spatialProof(p);assert.ok(p.solved,p.operation);assert.ok(validSpatialProof(p.operation,proof));assert.equal(validSpatialProof(p.operation,{...proof,trace:[]}),false);return proof;}
for(const route of [2,3]){
 const p=newSpatial('puzzle:moonleaf-crossing');assert.deepEqual(bridgeReachable(p),[1]);assert.equal(spatialInput(p,step(4)),false);assert.equal(p.node,0);
 for(const i of [1,route,4]){
  assert.ok(startBridgeWalk(p,step(i)));assert.equal(spatialInput(p,step(4)),false);
  advanceBridgeWalk(p,.1);assert.ok(bridgeWalkPosition(p).every(Number.isFinite));while(p.walk)advanceBridgeWalk(p,.02);
  if(i===1){assert.deepEqual(bridgeReachable(p),[2,3]);assert.ok(spatialControls(p).some(x=>x.action.i===3));}
  if(i===3)spatialInput(p,{type:'rescue'});
 }
 const proof=verify(p);assert.ok(proof.discoveries.includes(route===2?'garden-view':'rescued-kitten'));assert.equal(validSpatialProof(p.operation,{...proof,discoveries:[]}),false);
}
const badRescue=newSpatial('puzzle:moonleaf-crossing');spatialInput(badRescue,{type:'rescue'});assert.equal(badRescue.trace.length,0);
const durations=[];
for(const shortcut of [false,true]){
 const p=newSpatial('puzzle:chime-chase'),first=chasePoint(p);for(let i=0;i<100;i++)tickSpatial(p,.02);assert.deepEqual(chasePoint(p),first);
 assert.equal(spatialTap(p,.5,.5),null);assert.equal(spatialInput(p,{type:'jump'}),false);
 for(let leg=0;leg<4;leg++){
  const q=chasePoint(p),tap=spatialTap(p,q[0],chaseVisualY(q[1]));assert.ok(tap);
  spatialInput(p,shortcut&&leg===1?{type:'jump'}:tap);assert.ok(p.chaseActive);
  for(let j=0;j<1500&&p.chaseActive;j++)tickSpatial(p,.02);
  assert.equal(p.chaseActive,false);if(leg===2)assert.ok(p.readyPounce&&!p.solved);
 }
 const proof=verify(p);durations.push(p.frame*.02);assert.equal(validSpatialProof(p.operation,{...proof,trace:proof.trace.slice(0,1)}),false);assert.equal(validSpatialProof(p.operation,{...proof,trace:proof.trace.map((a,i)=>i===1?{...a,frame:a.frame+5}:a)}),false);assert.equal(p.route,shortcut?'shortcut':'lane');assert.equal(validSpatialProof(p.operation,{...proof,frames:proof.frames-1}),false);
 assert.equal(validSpatialProof(p.operation,{...proof,route:shortcut?'lane':'shortcut'}),false);
}
assert.ok(durations[1]<durations[0],'Shortcut must actually save time');
for(const y of [.2,.27,.35,.49,.5,.73,.8])assert.ok(Math.abs(chaseLogicalY(chaseVisualY(y))-y)<1e-9);
const shadow=newSpatial('puzzle:shadow-bridge');spatialInput(shadow,cross);assert.equal(shadow.solved,false);
assert.equal(spatialTap(shadow,.5,.9),null);for(let i=0;i<1000;i++)spatialInput(shadow,aim(.19+Math.sin(i)*.03));spatialInput(shadow,aim(.51));spatialInput(shadow,cross);assert.equal(shadow.solved,false);spatialInput(shadow,aim(.82));spatialInput(shadow,cross);assert.equal(shadow.discoveries.length,3);verify(shadow);assert.ok(shadow.trace.length<10);
const lantern=newSpatial('puzzle:lantern-show');spatialInput(lantern,{type:'shape',i:1});spatialInput(lantern,aim(.2));spatialInput(lantern,cross);const show=verify(lantern);assert.equal(show.shape,1);assert.equal(validSpatialProof(lantern.operation,{...show,shape:2}),false);
for(const route of [[1,3,5,7],[2,4,6,7]]){
 const p=newSpatial('puzzle:star-steps');assert.equal(startBridgeWalk(p,step(7)),false);assert.equal(p.node,0);
 const before=spatialNodes(p)[3][1];animateStarPlatforms(p,.1);assert.notEqual(spatialNodes(p)[3][1],before);
 for(const i of route){const q=spatialNodes(p)[i];assert.deepEqual(spatialTap(p,...q),step(i));assert.ok(startBridgeWalk(p,step(i)));advanceBridgeWalk(p,.1);assert.ok(spatialTravelPose(p).lift>0);while(p.walk){animateStarPlatforms(p,.02);advanceBridgeWalk(p,.02);}}
 assert.deepEqual(p.visited,[0,...route]);assert.ok(verify(p).discoveries.some(x=>x.startsWith('starlight-')));
}
console.log('PASS: finite chase and final pounce, both forest routes, optional rescue, shadow hunt, theater, moving starstones and forged-proof rejection');
