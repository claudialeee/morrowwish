import assert from 'node:assert/strict';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {makeEngine} from '../public/cat-bond/js/resonance/engine.mjs';
import {REGIONAL_BOSSES,bossKey,optionalBossAvailable,atBoss,bossReward} from '../public/cat-bond/js/resonance/regional-bosses.mjs';
const e=makeEngine(campaign);
const late=new Set(['mechanism:muling-unlock','npc:public-accountability','npc:second-garden-key']);
const ok=(r,label)=>assert.ok(r?.ok,label+': '+JSON.stringify(r));
for(const scene of campaign.scenes){
 if(scene.id==='prologue:P-05'&&!e.view().openingMet)ok(e.meetTraveler(),scene.id);
 if(scene.choiceTiming==='beforeAction'&&scene.choices.length)ok(e.choose(scene.choices[0].id),scene.id);
 if(scene.id==='finale:B-03')for(let j=0;j<campaign.regions.length;j++)ok(e.supportAction(campaign.regions[j],campaign.support[j]),scene.id);
 for(const op of scene.requires.filter(op=>!late.has(op)))ok(e.record(scene.id,op),scene.id+':'+op);
 while(e.view().cursor<scene.lines.length){
  if(scene.choiceAt===e.view().cursor&&!e.view().choice)ok(e.choose(scene.choices[0].id),scene.id);
  ok(e.nextLine(),scene.id);
 }
 if(scene.choiceTiming!=='beforeAction'&&scene.choices.length&&!e.view().choice)ok(e.choose(scene.choices[0].id),scene.id);
 for(const op of scene.requires.filter(op=>late.has(op)))ok(e.record(scene.id,op),scene.id);
 ok(e.finish(),scene.id);
}
assert.equal(e.view().ending,true);
for(const id of ['forest','sky','mastery']){
 const d=REGIONAL_BOSSES[id],w={location:d.region,positions:{[d.region]:{x:d.point[0],y:d.point[1]}},interactions:{}},v={melodies:[d.region],ending:true};
 assert.equal(optionalBossAvailable(id,{melodies:[]},w),false);
 assert.equal(optionalBossAvailable(id,v,w),true);
 assert.equal(atBoss(id,w),true);
 assert.equal(optionalBossAvailable(id,{...v,ending:false},w),id!=='mastery');
 assert.deepEqual(bossReward(id,w),d.reward);
 assert.deepEqual(bossReward(id,{...w,interactions:{[bossKey(id)]:true}}),[0,0,0]);
}
console.log('Regional boss metadata and all '+campaign.scenes.length+' story-engine transitions pass (not browser gameplay).');

import {bossTemplates,regionalBossLevel} from '../public/cat-bond/js/resonance/regional-bosses.mjs';
import {createSlotRuntime} from '../public/cat-bond/js/resonance/slot-runtime.mjs';
import {layouts} from '../public/cat-bond/js/resonance/world-exploration.mjs';
import {projectPortrait,unprojectPortrait} from '../public/cat-bond/js/resonance/portrait-map.mjs';
import {readFileSync,readdirSync} from 'node:fs';
const w={};w.window=w;new Function('window',readFileSync(new URL('../public/cat-bond/js/data.js',import.meta.url),'utf8'))(w);
const expected={muling:['暮铃','Luna'],jiedeng:['檐灯','Alder'],qilan:['栖蓝','Skye'],yahe:['芽禾','Fern'],yuchuan:['榆川','Rowan'],jinpo:['烬婆','Ember'],xiaomao:['小栗','Pip'],lingyu:['翎羽','Wren'],yuanfan:['远帆','Finn'],moye:['墨页','Quill'],baikan:['白羽','Ivy'],xingya:['星芽','Nova'],lichuan:['砾川','Flint']};
const wild={biscuit:['麦饼','Biscuit'],inkspot:['墨点','Inky'],puff:['绒蒲','Puff'],shell:['贝扣','Shell'],cinder:['炭栗','Cinder'],clover:['芽扣','Clover'],fizz:['啪嗒','Fizz'],button:['夜扣','Button'],sunlace:['晴纱','Sunny'],ripplet:['漪舟','Ripple'],mossbell:['苔盏','Moss'],zest:['柚弧','Zest'],nightloom:['织夜','Midnight'],tidemark:['潮刻','Tide'],emberwing:['烬羽','Blaze'],aurora:['曦瓷','Aurora']};
for(const [id,names] of Object.entries(expected)){
 const a=campaign.cast[id],s=w.GameData.speciesById('story_'+id);
 assert.deepEqual([a.name.zh,a.name.en],names,id);assert.deepEqual([s.name,s.nameEn],names,id);
}
for(const [id,names] of Object.entries(wild)){const s=w.GameData.speciesById(id);assert.deepEqual([s.name,s.nameEn],names,id);}
assert.equal(new Set([...Object.values(expected),...Object.values(wild)].map(a=>a[1])).size,29);
for(const id of Object.values(bossTemplates))assert.ok(w.GameData.speciesById(id),id);
for(const [id,d] of Object.entries(REGIONAL_BOSSES)){
 assert.ok(layouts[d.region].paths.some(p=>Math.hypot(p[0]-d.point[0],p[1]-d.point[1])<.072),'reachable '+id);
 const projected=projectPortrait(d.region,d.point),back=unprojectPortrait(d.region,projected);
 assert.ok(Math.hypot(back[0]-d.point[0],back[1]-d.point[1])<.072,'portrait round trip '+id);
 assert.equal(regionalBossLevel(id,[{level:8},{level:8}]),regionalBossLevel(id,[{level:8},{level:8},{level:99}]),'reserves do not inflate difficulty');
 if(d.op)assert.ok(campaign.scenes.find(s=>s.id===d.scene).requires.includes(d.op));
}
function fixture(target){
 const e=makeEngine(campaign);
 for(const scene of campaign.scenes){
  if(scene.id===target)return e;
  if(scene.id==='prologue:P-05'&&!e.view().openingMet)ok(e.meetTraveler(),scene.id);
  if(scene.choiceTiming==='beforeAction'&&scene.choices.length)ok(e.choose(scene.choices[0].id),scene.id);
  if(scene.id==='finale:B-03')for(let j=0;j<campaign.regions.length;j++)ok(e.supportAction(campaign.regions[j],campaign.support[j]),scene.id);
  for(const op of scene.requires.filter(op=>!late.has(op)))ok(e.record(scene.id,op),scene.id+':'+op);
  while(e.view().cursor<scene.lines.length){if(scene.choiceAt===e.view().cursor&&!e.view().choice)ok(e.choose(scene.choices[0].id),scene.id);ok(e.nextLine(),scene.id);}
  if(scene.choiceTiming!=='beforeAction'&&scene.choices.length&&!e.view().choice)ok(e.choose(scene.choices[0].id),scene.id);
  for(const op of scene.requires.filter(op=>late.has(op)))ok(e.record(scene.id,op),scene.id);
  ok(e.finish(),scene.id);
 }
 return e;
}
for(const id of ['library','starfall']){
 const d=REGIONAL_BOSSES[id],e=fixture(d.scene);
 if(id==='library')ok(e.record(d.scene,'puzzle:library-echo'),d.scene);
 const previous=e.snapshot();delete previous.regionalBossRevision;previous.cursor=99;
 const migrated=makeEngine(campaign,previous);
 assert.equal(migrated.view().cursor,0);
 assert.equal(migrated.view().objective[0],d.op);
 assert.deepEqual(migrated.snapshot().completed,previous.completed);
 assert.deepEqual(migrated.snapshot().evidence,previous.evidence);
 let failSave=false,root={resonance:migrated.snapshot(),resonanceExploration:{location:d.region,positions:{[d.region]:{x:d.point[0],y:d.point[1]}}},coins:5,fish:2};
 const State={get S(){return root},activeSlot:()=> 'slot1',save:()=>({ok:!failSave,reason:failSave?'test-failure':undefined})};
 const runtime=createSlotRuntime(State),token=runtime.capture(),proof={sceneId:d.scene,operation:d.op,region:d.region,verified:true,outcome:'win',token};
 assert.equal(runtime.evidence({...proof,outcome:'loss'}).ok,false);
 assert.equal(runtime.evidence({...proof,token:null}).ok,false);
 root.resonanceExploration.positions[d.region]={x:0,y:0};
 assert.equal(runtime.evidence(proof).ok,false);
 root.resonanceExploration.positions[d.region]={x:d.point[0],y:d.point[1]};
 const before=JSON.stringify(root);failSave=true;assert.equal(runtime.evidence(proof).ok,false);assert.equal(JSON.stringify(root),before);
 failSave=false;assert.ok(runtime.evidence(proof).ok);assert.equal(runtime.evidence(proof).ok,false);
 assert.ok(!runtime.view().objective.includes(d.op));
 const newer={...root,resonance:previous};root=newer;assert.equal(runtime.evidence(proof).ok,false,'stale slot token');
}
console.log('29 approved localized names, seven stable templates, portrait coordinates, old slot migration, rejected defeat/stale/duplicate proof, rollback PASS');

 // Scan executable text and preview pages, not stable lowercase IDs or binary art.
 const root=new URL('../public/cat-bond/',import.meta.url);
 const obsolete=/小铆|白栞|岬灯|\b(?:Muling|Mulings|Yandeng|Jiedeng|Qilan|Yahe|Yuchuan|Jinpo|Xiaomao|Lingyu|Yuanfan|Moye|Baikan|Xingya|Lichuan|Inkspot|Sunlace|Ripplet|Mossbell|Nightloom|Tidemark|Emberwing)\b|\b(?:muling|xiaomao|baikan)['’‘]s\b/;
 const scanDirs=['js/','js/resonance/','css/',''];
 let checked=0;
 for(const d of scanDirs){
   const dir=new URL(d,root);
   for(const entry of readdirSync(dir,{withFileTypes:true})){
    if(!entry.isFile()||! /\.(?:m?js|html|css|json)$/.test(entry.name))continue;
    const source=readFileSync(new URL(entry.name,dir),'utf8');
    const match=source.match(obsolete);
    assert.ok(!match,d+entry.name+': obsolete display name '+match?.[0]);
    checked++;
   }
 }
 const festivalSource=readFileSync(new URL('js/resonance/world-runtime.mjs',root),'utf8');
 assert.ok(festivalSource.includes('const actor=campaign.cast.xiaomao.name;'));
 assert.ok(festivalSource.includes('actor.en}’s Shadow Puppet Theater'));
 assert.ok(festivalSource.includes('actor.zh}的皮影小剧场'));
 console.log('Runtime display-name audit PASS: '+checked+' source/preview files, festival labels use the canonical cast');
