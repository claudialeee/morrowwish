// Run node scripts/starbell-player-regression-20261127.mjs. No deployment.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newGlide,steerGlide,tickGlide,glideProof,validGlideProof} from '../public/cat-bond/js/resonance/canon22-glide.mjs';
import {verifySideProof} from '../public/cat-bond/js/resonance/side-adventures.mjs';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {makeEngine} from '../public/cat-bond/js/resonance/engine.mjs';
import {activateCompanionTalents} from '../public/cat-bond/js/resonance/companion-talents.mjs';
const read=p=>readFileSync(new URL('../public/cat-bond/'+p,import.meta.url),'utf8');
assert(!read('index.html').includes('data-slot-language'));
assert(!read('js/main.js').includes('data-slot-language'));
const world=read('js/resonance/world-runtime.mjs');assert(!world.includes('rw-primary-guide'));assert(world.includes('zoom=explorationZoom();centerCamera(explorer.position);followCamera=true'));assert(world.includes('Return to dock · Continue journey'));assert(read('js/resonance/narrative-host.mjs').includes('res-ending-film'));
for(const version of [1,2])for(const route of ['upper','lower']){const f=newGlide('puzzle:joint-flight','train');f.flightVersion=version;steerGlide(f,route==='upper'?.27:.74);for(let i=0;i<1500&&!f.solved;i++){if(f.x>.82&&f.target!==.5)steerGlide(f,.5);tickGlide(f,.02)}assert(f.solved);assert.equal(f.routeUsed,route);assert(validGlideProof(f.operation,f.choice,glideProof(f)));}
for(const [r,trace] of Object.entries({"harbor":[{"type":"step","i":0},{"type":"step","i":1},{"type":"step","i":2}],"forest":[{"type":"pick","i":1},{"type":"pick","i":3},{"type":"brew"}],"forge":[{"type":"rotate"},{"type":"rotate"},{"type":"rotate"},{"type":"light"}],"sky":[{"type":"place","i":0,"side":1},{"type":"place","i":1,"side":2},{"type":"place","i":2,"side":2},{"type":"place","i":3,"side":1},{"type":"launch"}],"library":[{"type":"page","i":1},{"type":"page","i":2},{"type":"page","i":0},{"type":"bind"}],"starfall":[{"type":"star","i":1},{"type":"star","i":2},{"type":"star","i":3},{"type":"star","i":4}]}))assert(verifySideProof(r,trace),r);
const initial=makeEngine(campaign).snapshot(),index=campaign.scenes.findIndex(s=>s.id==='sky:S-03');initial.completed=campaign.scenes.slice(0,index).map(s=>s.id);initial.scene='sky:S-03';initial.cursor=0;initial.choices['sky:S-02']='lead';const e=makeEngine(campaign,initial);assert(!e.view().lineReady);assert(e.record('sky:S-03','puzzle:joint-flight').ok);assert(e.view().lineReady);for(let i=0;i<3;i++)assert(e.nextLine().ok);assert(!e.view().lineReady);assert(e.record('sky:S-03','battle:gale-guardian').ok);assert(e.view().lineReady);
for(const level of [1,4,7]){const f={cat:{storyActor:'qilan',level},hp:100,maxhp:100,alive:true};const b={regionalCombat:{},team:[f],t:2,ult:0,gainUlt(n){this.ult+=n}};activateCompanionTalents(b);assert.equal(b.ult,12+4*(level>=7?2:level>=4?1:0));activateCompanionTalents(b);assert.equal(b.ult,12+4*(level>=7?2:level>=4?1:0));}
console.log('Starbell source, side adventure, flight, story gate, talent regressions: PASS. Browser and independent player acceptance remain separate.');
