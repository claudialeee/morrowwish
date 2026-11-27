import assert from 'node:assert/strict';
import {newSkyFlight,steerSkyFlight,tickSkyFlight,skyFlightProof,validSkyFlightProof} from '../public/cat-bond/js/resonance/sky-flight.mjs';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
const op='puzzle:joint-flight';
for(const choice of ['lead','train'])for(const dt of [.016,.033,.05])for(const height of [.28,.50,.72]){
 const f=newSkyFlight(op,choice);assert.ok(f.openGlide);steerSkyFlight(f,height);let slowed=false;
 for(let i=0;i<3000&&!f.solved;i++){tickSkyFlight(f,dt);if(f.notice==='cloud')slowed=true;}
 assert.ok(f.solved,JSON.stringify(f));assert.equal(f.attempts,0);assert.equal(f.routeUsed,height===.28?'upper':'lower');
 if(height===.50)assert.ok(slowed,'cloud collision slows instead of restarting');
 const proof=skyFlightProof(f);assert.ok(validSkyFlightProof(op,choice,proof));assert.ok(proof.feathers.length>0);
 for(const bad of [{inputs:[]},{frames:proof.frames-1},{landing:proof.landing+.1},{route:proof.route==='upper'?'lower':'upper'},{feathers:[99]}])assert.equal(validSkyFlightProof(op,choice,{...proof,...bad}),false);
}
for(const operation of ['puzzle:sky-pouch','explore:flight-recorder']){
 const f=newSkyFlight(operation,null);assert.ok(f.openGlide);steerSkyFlight(f,.30);
 for(let i=0;i<3000&&!f.solved&&!f.attempts;i++){if(f.x>.74&&f.target!==.5)steerSkyFlight(f,.5);tickSkyFlight(f,.02);}
 assert.ok(f.solved,JSON.stringify(f));assert.ok(validSkyFlightProof(operation,null,skyFlightProof(f)));
}
const scene=campaign.scenes.find(s=>s.id==='sky:S-03');assert.deepEqual(scene.requires,[op,'repair:sky','melody:sky']);assert.ok(!campaign.scenes.find(s=>s.id==='sky:S-01').requires.includes('puzzle:sky-pouch'));
assert.ok(scene.lines.slice(3).every(l=>l.afterOperations?.includes('melody:sky')));assert.ok(scene.lines.every(l=>l.text.zh&&l.text.en));
console.log('PASS: one required continuous flight, forgiving cloud contact, optional feathers, both routes and deterministic proof across frame intervals');
