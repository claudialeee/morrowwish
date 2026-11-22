// Cat Bond V2 client telemetry in a mock browser, never production D1.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const telemetry=fs.readFileSync('public/telemetry.js','utf8');
const game=fs.readFileSync('public/cat-bond/js/game.js','utf8');
const dash=fs.readFileSync('public/studio-insights/index.html','utf8');
assert.ok(game.includes("this.battle._analyticsRegion=this._returnScene==='map'"));
for(const marker of ['region:this.battle._analyticsRegion','region:b._analyticsRegion'])
 assert.ok(game.includes(marker),'region missing from game event '+marker);
for(const id of ['yard','home','sakura','creek','volcano','ruins'])
 assert.ok(telemetry.includes('"'+id+'"'),'missing region '+id);
for(const key of ['colVisitStart','colStartFinish','colVisitFinish','bond_region_','bond_rare_attempt_v2'])
 assert.ok(dash.includes(key),'dashboard missing '+key);
const sent=[],uid='11111111-2222-4333-8444-555555555555';
const win={addEventListener(){},crypto:{randomUUID:()=>uid}};
const doc={referrer:'',visibilityState:'visible',addEventListener(){}};
const ctx={window:win,location:{pathname:'/cat-bond/',search:'',hostname:'morrowwish.pages.dev'},
 document:doc,navigator:{globalPrivacyControl:false,doNotTrack:'0',sendBeacon:()=>false},
 localStorage:{getItem:()=>null,setItem(){}},sessionStorage:{getItem:()=>null,setItem(){}},
 performance:{now:()=>1000},crypto:win.crypto,Blob:class{constructor(parts){this.parts=parts}},
 URLSearchParams,URL,Date,Math,JSON,Number,String,Set,Object,
 fetch:(url,opt)=>{sent.push(JSON.parse(opt.body));return Promise.resolve({ok:true})},
 setInterval:()=>0,console};
vm.runInNewContext(telemetry,ctx,{filename:'telemetry.js'});
assert.equal(sent[0].kind,'visit');assert.equal(sent[0].trackingVersion,11);
const e=win.arcadeMetric;
e('bond_entered');
e('game_start',{rarity:'SR',region:'sakura'});
e('game_complete',{rarity:'SR',region:'sakura'});
e('cat_capture',{rarity:'SR'});
e('game_start',{rarity:'N',region:'yard'});
e('game_over',{rarity:'N',region:'yard'});
e('game_retry');
e('game_start',{rarity:'SSR',region:'ruins'});
e('game_complete',{rarity:'SSR',region:'ruins'});
e('cat_capture',{rarity:'SSR'});
const totals={};
for(const item of sent.filter(s=>s.kind==='session'))
 for(const [k,n] of Object.entries(item.signals||{}))totals[k]=(totals[k]||0)+n;
const expected={bond_enter:1,bond_battle_start_v2:3,bond_battle_end_v2:3,
 bond_battle_win_v2:2,bond_next_battle_v2:2,bond_retry_loss_v2:1,
 bond_capture_v2:2,bond_rare_attempt_v2:2,bond_rare_capture_v2:2,
 bond_region_sakura_start_v2:1,bond_region_sakura_end_v2:1,
 bond_region_yard_start_v2:1,bond_region_yard_end_v2:1,
 bond_region_ruins_start_v2:1,bond_region_ruins_end_v2:1};
for(const [key,value] of Object.entries(expected))assert.equal(totals[key],value,key);
assert.equal(totals.bond_rare_encounter,undefined,'old yard-only count is not the new battle metric');
assert.equal(sent.filter(s=>s.kind==='session').reduce((n,s)=>n+s.starts,0),3,
 'first entry and first battle must not double count starts');
// ?autodev must not emit even the visit beacon.
const qaSent=[],qaWindow={addEventListener(){},crypto:win.crypto};
const qa={...ctx,window:qaWindow,location:{pathname:'/cat-bond/',search:'?autodev',hostname:'morrowwish.pages.dev'},
 fetch:(url,opt)=>{qaSent.push(JSON.parse(opt.body));return Promise.resolve({ok:true})}};
vm.runInNewContext(telemetry,qa,{filename:'telemetry-qa.js'});
qaWindow.arcadeMetric('bond_entered');
assert.equal(qaSent.length,0,'autodev cannot enter live analytics');
console.log('Cat Bond V2 real client event pipeline and synthetic QA exclusion verified.');
