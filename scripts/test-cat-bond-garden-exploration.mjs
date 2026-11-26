import assert from 'node:assert/strict';
import fs from 'node:fs';
const win={};new Function('window',fs.readFileSync(new URL('../public/cat-bond/js/garden-exploration.js',import.meta.url),'utf8'))(win);
const {read,reduce}=win.GardenExploration;
let s=read({});const apply=(event,door=false)=>{const next=reduce(s,event,door);assert.ok(next,event);s=next;};
assert.equal(reduce(s,'chart-0'),null);
apply('chart-start');apply('chart-1');assert.equal(reduce(s,'chart-1'),null);apply('chart-0');assert.equal(s.parts.length,2);
for(let i=0;i<3;i++)apply('butterfly');assert.equal(reduce(s,'butterfly'),null);assert.ok(s.keepsakes.includes('ear-flower'));
apply('seed');assert.equal(reduce(s,'seed'),null);
apply('snack-keep');assert.equal(reduce(s,'snack-eat'),null);
assert.equal(reduce(s,'door'),null);apply('door',true);
assert.deepEqual(read({sunlitGarden:{exploration:s}}),s);assert.equal(read({}).parts.length,0);
assert.equal(new Set(s.keepsakes).size,4);
apply('nameplate');assert.equal(reduce(s,'nameplate'),null);assert.equal(reduce(s,'nameplate-home'),null);apply('nameplate-home',true);assert.equal(reduce(s,'nameplate-home',true),null);assert.equal(read({}).nameplate,false);
console.log('V3 optional discovery reducer: two distinct chart pieces, three butterfly hops, seed, fish cake, return mystery, slot separation passed');

const journey=win.GardenExploration.journeyKeepsakes;assert.equal(journey({resonance:{completed:[]}},{}),null);const earned={resonance:{completed:['harbor:H-05','forest:R-04','forge:E-04','finale:B-04'],choices:{'sky:S-04':'search'}},resonanceExploration:{interactions:{'forge:E-01:puzzle:lantern-show':{shape:1},'sky:S-03:puzzle:joint-flight':{route:'lower'}}}};assert.deepEqual(journey(earned,{}),{map:true,moonleaf:true,lantern:1,cups:3,flight:'lower'});assert.equal(journey({...earned,resonance:{...earned.resonance,choices:{'sky:S-04':'company'}}},{}).cups,2);console.log('Earned garden callbacks depend on story, selected lantern and tea promise');
