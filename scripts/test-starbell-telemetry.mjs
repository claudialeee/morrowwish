import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
const script=fs.readFileSync(process.argv[2]||'public/telemetry.js','utf8');
function simulate(host,search=''){
 let clock=0,events=[],interval,observers=[];
 const hooks=new Map(),docHooks=new Map(),store=new Map();
 const on=(map)=>(n,fn)=>{if(!map.has(n))map.set(n,[]);map.get(n).push(fn)};
 const fire=(map,n,arg={})=>{for(const f of map.get(n)||[])f(arg)};
 const puzzleHost={hidden:false,dataset:{regionStep:'region/garden/prologue:P-05/explore'}};
 const stage={querySelector:()=>puzzleHost};
 const doc={referrer:'https://morrowwish.vercel.app/',visibilityState:'visible',addEventListener:on(docHooks),getElementById:id=>id==='stage'?stage:null};
 const root={resonance:{scene:'prologue:P-05',completed:['prologue:P-01','prologue:P-02','prologue:P-03','prologue:P-04'],evidence:{}}};
 const win={ARCADE_GAME_ID:'starbell-preview',ARCADE_COLLECTOR:'https://morrowwish.pages.dev/api/starbell-preview-session',State:{S:root},addEventListener:on(hooks)};
 const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
 const context={window:win,document:doc,location:{hostname:host,pathname:'/cat-bond/',search},navigator:{},localStorage:storage,sessionStorage:storage,URL,URLSearchParams,Blob,crypto:{randomUUID},performance:{now:()=>clock},setInterval:fn=>{interval=fn},MutationObserver:class{constructor(fn){this.fn=fn;observers.push(this)}observe(){}disconnect(){}},fetch:(url,opts)=>{events.push(JSON.parse(opts.body));return Promise.resolve({ok:true})},console};
 vm.runInNewContext(script,context);
 return {events,win,root,puzzleHost,tick:n=>{clock+=n;fire(hooks,'pointerdown')},flush:()=>interval(),story:()=>fire(hooks,'cat-bond-resonance-changed'),puzzle:()=>observers.forEach(o=>o.fn()),hide:()=>{doc.visibilityState='hidden';fire(docHooks,'visibilitychange')},show:()=>{doc.visibilityState='visible';fire(docHooks,'visibilitychange')},leave:()=>fire(hooks,'pagehide')};
}
for(const host of ['cat-bond-preview.morrowwish.pages.dev','starbell-portrait-preview.morrowwish.pages.dev']){
 const x=simulate(host);
 assert.equal(x.events[0].kind,'visit');assert.equal(x.events[0].game,'starbell-preview');assert.equal(x.events[0].metricsVersion,1);
 x.win.arcadeMetric('bond_entered',{mode:'new'});
 assert.ok(x.events.some(e=>e.signals?.rpg_new===1));
 assert.ok(x.events.some(e=>e.signals?.rpg_enter_prologue===1));
 assert.ok(!x.events.some(e=>e.signals?.rpg_opening)); // old save state is not credited
 x.puzzleHost.dataset.regionStep='region/garden/prologue:P-05/puzzle:chase';x.puzzle();
 x.root.resonance.evidence['prologue:P-05']=['puzzle:chase'];x.story();
 x.puzzleHost.dataset.regionStep='region/garden/prologue:P-05/explore';x.puzzle();
 assert.ok(x.events.some(e=>e.signals?.rpg_pstart_chase===1));
 assert.ok(x.events.some(e=>e.signals?.rpg_pdone_chase===1));
 assert.ok(!x.events.some(e=>e.signals?.rpg_pleave_chase));
 x.root.resonance.completed.push('prologue:P-05');x.root.resonance.scene='harbor:H-01';x.story();
 assert.ok(x.events.some(e=>e.signals?.rpg_done_prologue===1&&e.signals?.rpg_enter_harbor===1));
 for(let i=0;i<10;i++)x.tick(30000);x.flush();
 assert.equal(x.events.reduce((n,e)=>n+(e.activeSeconds||0),0),300);
 x.hide();x.tick(300000);x.show();x.flush();
 assert.equal(x.events.reduce((n,e)=>n+(e.activeSeconds||0),0),300);
 for(const q of ['?qa=test','?developer=1','?rpgDev=1','?autodev=1']){const y=simulate(host,q);y.win.arcadeMetric('bond_entered',{mode:'new'});assert.equal(y.events.length,0);}
}
console.log('Starbell telemetry: both origins, new/continued progress, puzzle lifecycle, active time, QA exclusion passed');
