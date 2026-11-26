import assert from 'node:assert/strict';
import {newSkyFlight,steerSkyFlight,tickSkyFlight,skyFlightProof,validSkyFlightProof} from '../public/cat-bond/js/resonance/sky-flight.mjs';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
const op='puzzle:joint-flight';
function fly(route,choice,dt=.02){
 const f=newSkyFlight(op,choice);assert.equal(f.openGlide,true);
 steerSkyFlight(f,.5);steerSkyFlight(f,route==='upper'?.30:.72);
 for(let i=0;i<3000&&!f.solved&&!f.attempts;i++){
   if(f.x>.74&&f.target!==.5)steerSkyFlight(f,.5);
   tickSkyFlight(f,dt);
 }
 assert.ok(f.solved,JSON.stringify(f));assert.equal(f.routeUsed,route);
 const proof=skyFlightProof(f);assert.ok(validSkyFlightProof(op,choice,proof));
 assert.equal(validSkyFlightProof(op,choice,{...proof,route:route==='upper'?'lower':'upper'}),false);
 assert.equal(validSkyFlightProof(op,choice,{...proof,inputs:[]}),false);
 assert.equal(validSkyFlightProof(op,choice,{...proof,frames:proof.frames-1}),false);
 assert.equal(validSkyFlightProof(op,choice,{...proof,landing:proof.landing+.1}),false);
 return f.elapsed;
}
for(const choice of ['lead','train'])for(const dt of [.016,.033,.05]){
 assert.ok(fly('upper',choice,dt)<fly('lower',choice,dt));
}
const idle=newSkyFlight(op,'lead');steerSkyFlight(idle,.5);
for(let i=0;i<1000&&!idle.attempts;i++)tickSkyFlight(idle,.02);
assert.equal(idle.solved,false);assert.equal(idle.attempts,1);assert.equal(skyFlightProof(idle),null);
steerSkyFlight(idle,.30);
for(let i=0;i<1000&&!idle.solved;i++){if(idle.x>.74&&idle.target!==.5)steerSkyFlight(idle,.5);tickSkyFlight(idle,.02);}
assert.ok(idle.solved);assert.ok(validSkyFlightProof(op,'lead',skyFlightProof(idle)));
const scene=campaign.scenes.find(s=>s.id==='sky:S-03');assert.deepEqual(scene.requires,[op]);
assert.ok(scene.lines.every(l=>l.text.zh&&l.text.en));assert.ok(!scene.lines.some(l=>/mail|deliver|信袋|送信/i.test(l.text.en+' '+l.text.zh)));
console.log('Canon 2.2: continuous glide, both routes, variable frame rates, retry, forged proof rejection and no delivery gate passed');
