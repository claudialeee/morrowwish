import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {discoveries,availableDiscoveries,applyDiscovery,progress,earnedKeepsakes} from '../public/cat-bond/js/resonance/regional-discoveries.mjs';
import {sideKey,trailPerkKey,sideMemory,sideAdventures} from '../public/cat-bond/js/resonance/side-adventures.mjs';
import {newSpatial,spatialInput,spatialProof,validSpatialProof} from '../public/cat-bond/js/resonance/canon22-spatial.mjs';
import {newSkyFlight,steerSkyFlight,tickSkyFlight,skyFlightProof,validSkyFlightProof,canLandSkyFlight,landSkyFlight} from '../public/cat-bond/js/resonance/sky-flight.mjs';
import {newMirror,advanceMirror,mirrorProof,validMirrorProof} from '../public/cat-bond/js/resonance/canon22-mirror.mjs';
import {libraryPuzzle,advanceLibrary} from '../public/cat-bond/js/resonance/library-mechanisms.mjs';
const runtime=readFileSync(new URL('../public/cat-bond/js/resonance/world-runtime.mjs',import.meta.url),'utf8');
assert(!runtime.includes('mountSideAdventure')&&!runtime.includes('availableSideEvents'),'retired boards must not be player-facing');
assert(!runtime.includes('p.flight.openGlide&&!p.flight.practice&&p.operation!=='));
const introduced={harbor:'harbor:H-01',forest:'forest:R-01',forge:'forge:E-01',sky:'sky:S-01',library:'library:M-01'};
for(const [region,d] of Object.entries(discoveries))for(const old of [false,true]){
 let w={location:region,positions:{},interactions:old?{[sideKey(region)]:true}:{},cargo:null},v={regions:[region],completed:region==='starfall'?['epilogue:E-03',d.after]:[introduced[region],d.after]};
 assert.equal(availableDiscoveries(region,w,{...v,completed:[]}).length,0);
 let grants=0;for(let i=0;i<12;i++){const s=availableDiscoveries(region,w,v).find(x=>x.mode!=='decoy');if(!s)break;
  assert.equal(applyDiscovery(region,s.id,{...w,positions:{}},v).ok,false);
  w.positions[region]={x:s.at[0],y:s.at[1]};const result=applyDiscovery(region,s.id,w,v);assert.ok(result.ok);grants+=Number(!!result.reward);w=result.next;assert(!applyDiscovery(region,s.id,w,v).ok);}
 assert.ok(progress(region,w.interactions).returned);assert.equal(grants,old?0:1);assert.equal(!!w.interactions[trailPerkKey(region)],!old);assert.ok(w.interactions[sideKey(region)]);assert.equal(earnedKeepsakes(w.interactions).length,old?3:2);
 assert.equal(sideMemory(sideAdventures[region].actor,{resonanceExploration:w,resonance:{completed:[d.after]}}).length,1);
}
assert.equal(availableDiscoveries('library',{location:'library',interactions:{}},{regions:['library'],completed:['library:M-01','library:M-03']}).length,0);
assert.equal(availableDiscoveries('starfall',{location:'starfall',interactions:{}},{regions:['starfall'],completed:['starfall:F-04']}).length,0);
for(const route of [[1,3,7],[2,4,6,7]]){const p=newSpatial('puzzle:star-steps');for(const i of route)spatialInput(p,{type:'step',i});assert.ok(p.solved);assert.ok(validSpatialProof(p.operation,spatialProof(p)));assert.equal(p.discoveries.includes('starlight-6'),route[0]===2);}
const shadow=newSpatial('puzzle:shadow-bridge');for(const x of [.19,.51,.82])spatialInput(shadow,{type:'aim',x});assert.equal(shadow.discoveries.length,1);spatialInput(shadow,{type:'cross'});assert(!shadow.solved);for(const x of [.68,.82,.18])spatialInput(shadow,{type:'aim',x});spatialInput(shadow,{type:'cross'});assert(shadow.solved);const proof=spatialProof(shadow);assert(validSpatialProof(shadow.operation,proof));assert(!validSpatialProof(shadow.operation,{...proof,trace:proof.trace.filter(a=>a.x!==.68)}));
for(const y of [.28,.72]){const f=newSkyFlight('puzzle:joint-flight','lead');steerSkyFlight(f,y);let landed=0;for(let i=0;i<1500&&!f.solved;i++){tickSkyFlight(f,.02);if(canLandSkyFlight(f)){assert(landSkyFlight(f));landed++;steerSkyFlight(f,y);}if(f.x>.84&&f.target!==.5)steerSkyFlight(f,.5);}assert(f.solved);assert(validSkyFlightProof(f.operation,f.choice,skyFlightProof(f)));assert.equal(landed,y===.72?2:0);}
for(const seed of ['a','b']){const m=newMirror(seed),correct=m.trueSide===0?0:2;assert(!advanceMirror(m,correct));assert(!advanceMirror(m,1));assert(advanceMirror(m,correct));assert(validMirrorProof(seed,mirrorProof(m)));}
for(const order of [[2,0,1],[1,2,0]]){const p=libraryPuzzle('explore:routing-record',null);assert(!advanceLibrary(p,3));for(const i of order)assert(!advanceLibrary(p,i));assert(advanceLibrary(p,3));assert.equal(p.seen.length,3);}
assert(campaign.scenes.find(s=>s.id==='sky:S-04').lines.some(l=>l.text.zh.includes('杯茶')));assert(campaign.scenes.find(s=>s.id==='library:M-03').lines.some(l=>l.text.zh.includes('记忆')));
console.log('PASS: narrative map rewards, legacy items, urgency gates, star routes, five-phase shadow hunt, both flight routes and safe-island stops, mirror and ledger proof, protected story beats');
