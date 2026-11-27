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
