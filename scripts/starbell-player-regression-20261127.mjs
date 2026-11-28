// Run with node scripts/starbell-player-regression-20261127.mjs. No deploy.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newGlide,steerGlide,tickGlide,glideProof,validGlideProof} from '../public/cat-bond/js/resonance/canon22-glide.mjs';
const read=p=>readFileSync(new URL('../public/cat-bond/'+p,import.meta.url),'utf8');
assert(!read('index.html').includes('data-slot-language'));
assert(!read('js/main.js').includes('data-slot-language'));
assert(read('js/resonance/world-runtime.mjs').includes('rw-primary-guide'));
assert(read('js/resonance/narrative-host.mjs').includes('res-ending-film'));
for(const version of [1,2])for(const route of ['upper','lower']){const f=newGlide('puzzle:joint-flight','train');f.flightVersion=version;steerGlide(f,route==='upper'?.27:.74);for(let i=0;i<1500&&!f.solved;i++){if(f.x>.82&&f.target!==.5)steerGlide(f,.5);tickGlide(f,.02)}assert(f.solved);assert.equal(f.routeUsed,route);assert(validGlideProof(f.operation,f.choice,glideProof(f)));}
console.log('Starbell source and flight replay regression: PASS. Browser visual and normal-player acceptance are separate.');
