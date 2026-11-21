import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('public/telemetry.js','utf8');
function simulate(game){
 const posts=[];
 const window={addEventListener(){}};
 const document={referrer:'',visibilityState:'visible',addEventListener(){}};
 const sandbox={
  window,document,
  location:{pathname:'/'+game+'/',search:'',hostname:'morrowwish.vercel.app'},
  performance:{now:()=>1234},
  navigator:{doNotTrack:'1',globalPrivacyControl:false},
  URL,URLSearchParams,Blob,Date,Math,JSON,Set,Object,Number,String,
  crypto:{randomUUID:()=>'test-view-'+game},
  setInterval:()=>0,
  console,
  fetch:(_endpoint,opts)=>{posts.push(JSON.parse(opts.body));return Promise.resolve({ok:true})}
 };
 vm.runInNewContext(source,sandbox,{filename:'telemetry.js'});
 assert.equal(typeof window.arcadeMetric,'function',game+' has shared tracking');
 assert.equal(posts.length,1,game+' landing visit recorded');
 const counts=()=>posts.filter(x=>x.kind==='session').reduce((v,row)=>{
  v.starts+=Number(row.starts||0);
  v.ends+=Number(row.ends||0);
  v.retries+=Number(row.retries||0);
  return v;
 },{starts:0,ends:0,retries:0});
 const emit=(name,data)=>window.arcadeMetric(name,data||{});
 return {counts,emit,posts};
}
{
 const t=simulate('cat-bond');
 t.emit('bond_entered');
 assert.equal(t.counts().starts,1,'Cat Bond start button counts immediately');
 t.emit('bond_starter_chosen');
 assert.equal(t.counts().starts,1,'Starter choice does not start a second run');
 t.emit('game_start');
 assert.equal(t.counts().starts,1,'First battle is already part of entered run');
 t.emit('game_complete');
 assert.equal(t.counts().ends,1,'First battle has normal result');
 t.emit('game_start');
 assert.equal(t.counts().starts,2,'Later battle starts another run');
 t.emit('game_over');
 assert.equal(t.counts().ends,2,'Loss is also a normal completed battle');
}
{
 const t=simulate('tiny-town');
 t.emit('town_charter_care');
 assert.equal(t.counts().starts,1,'Clicking Begin free life counts a start');
 t.emit('town_started');
 t.emit('town_started');
 assert.equal(t.counts().starts,1,'Placing multiple buildings does not add starts');
 t.emit('game_retry');
 assert.equal(t.counts().starts,2,'New town is a fresh run');
 assert.equal(t.counts().retries,1,'New town is also a replay');
 t.emit('town_started');
 assert.equal(t.counts().starts,2,'New town first building is not a duplicate start');
 t.emit('town_completed-lose');
 assert.equal(t.counts().ends,1,'Town result is a completed run even when lost');
}
for(const [game,start,end] of [
 ['flip-dash','run_start','run_end'],
 ['parcel-panic','run_start','run_end'],
 ['pocket-aquarium','game_start','game_complete'],
 ['elsewhere','game_start','game_complete'],
 ['pawsibly-innocent','game_start','game_over']
]){
 const t=simulate(game);t.emit(start);t.emit(end);
 assert.equal(t.counts().starts,1,game+' start');
 assert.equal(t.counts().ends,1,game+' game-over counted');
}
console.log('Seven-game first-party starts: entrance click, combat, building, win/loss and retry all pass.');
