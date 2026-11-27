import assert from 'node:assert/strict';
import fs from 'node:fs';
const win={};new Function('window',fs.readFileSync(new URL('../public/cat-bond/js/garden-exploration.js',import.meta.url),'utf8'))(win);
const {read,reduce}=win.GardenExploration;
let s=read({});const apply=(event,door=false)=>{const next=reduce(s,event,door);assert.ok(next,event);s=next;};
assert.equal(reduce(s,'chart-0'),null);
apply('chart-start');apply('chart-1');assert.equal(reduce(s,'chart-1'),null);apply('chart-0');assert.equal(s.parts.length,2);assert.ok(s.keepsakes.includes('windblown-chart'));apply('chart-echo');assert.equal(s.chartEcho,true);assert.equal(reduce(s,'chart-echo'),null);
for(let i=0;i<3;i++)apply('butterfly');assert.equal(reduce(s,'butterfly'),null);assert.ok(s.keepsakes.includes('ear-flower'));
apply('seed');assert.equal(reduce(s,'seed'),null);
apply('snack-keep');assert.equal(reduce(s,'snack-eat'),null);
assert.equal(reduce(s,'door'),null);apply('door',true);
assert.deepEqual(read({sunlitGarden:{exploration:s}}),s);assert.equal(read({}).parts.length,0);
assert.equal(new Set(s.keepsakes).size,4);
apply('nameplate');assert.equal(reduce(s,'nameplate'),null);assert.equal(reduce(s,'nameplate-home'),null);apply('nameplate-home',true);assert.equal(reduce(s,'nameplate-home',true),null);assert.equal(read({}).nameplate,false);
console.log('V3 optional discovery reducer: two distinct chart pieces, three butterfly hops, seed, fish cake, return mystery, slot separation passed');

const journey=win.GardenExploration.journeyKeepsakes;assert.equal(journey({resonance:{completed:[]}},{}),null);const earned={resonance:{completed:['harbor:H-05','forest:R-04','forge:E-04','finale:B-04'],choices:{'sky:S-04':'search'}},resonanceExploration:{interactions:{'forge:E-01:puzzle:lantern-show':{shape:1},'sky:S-03:puzzle:joint-flight':{route:'lower'}}}};assert.deepEqual(journey(earned,{}),{map:true,moonleaf:true,lantern:1,cups:3,flight:'lower'});assert.equal(journey({...earned,resonance:{...earned.resonance,choices:{'sky:S-04':'company'}}},{}).cups,2);console.log('Earned garden callbacks depend on story, selected lantern and tea promise');

assert.equal(reduce(s,'moonleaf-touch'),null);apply('moonleaf-touch',true);assert.equal(reduce(s,'moonleaf-touch',true),null);assert.ok(read({sunlitGarden:{exploration:s}}).moonleafTouched);

const pose=win.GardenExploration.moonleafPose,home={x:100,y:100},target={x:300,y:200};assert.equal(pose(0,0,home,target).x,100);assert.equal(pose(600,0,home,target).x,200);assert.equal(pose(1200,0,home,target).x,300);assert.equal(pose(1500,0,home,target,1200).touching,true);assert.equal(pose(2900,0,home,target,1200).x,100);assert.equal(pose(2900,0,home,target,1200).done,true);

// Full DOM-sized touch rectangles remain inside the screen and avoid the
// guide / previously placed badges on desktop and both mobile orientations.
for(const [W,H,bw,bh] of [[1280,800,104,80],[390,844,84,70],[844,390,84,70]]){const avoid=[{left:W*.3,top:8,right:W*.7,bottom:76}];for(let i=0;i<7;i++){const m=win.GardenExploration.placeMarker(W*.5,H*.5,bw,bh,W,H,avoid);const b=m.box;assert.ok(b.left>=0&&b.top>=0&&b.right<=W&&b.bottom<=H);assert.ok(!avoid.some(a=>b.left<a.right&&b.right>a.left&&b.top<a.bottom&&b.bottom>a.top),'badge overlap '+W+'x'+H);avoid.push(b);}}
