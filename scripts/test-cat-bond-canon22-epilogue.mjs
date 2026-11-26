import assert from 'node:assert/strict';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {makeEngine} from '../public/cat-bond/js/resonance/engine.mjs';
import {classifyPrologue} from '../public/cat-bond/js/resonance/title-entry.mjs';
import {getSlotRuntime} from '../public/cat-bond/js/resonance/slot-runtime.mjs';
const e=makeEngine(campaign);
for(const scene of campaign.scenes){
 if(scene.id==='epilogue:E-01')break;
 if(scene.choiceTiming==='beforeAction'&&scene.choices.length)assert.ok(e.choose(scene.choices[0].id).ok);
 if(scene.id==='finale:B-03')for(let i=0;i<6;i++)assert.ok(e.supportAction(campaign.regions[i],campaign.support[i]).ok);
 const late=['mechanism:muling-unlock','npc:public-accountability','npc:second-garden-key'];
 for(const op of scene.requires.filter(x=>!late.includes(x)))assert.ok(e.record(scene.id,op).ok,scene.id+' '+op);
 while(e.view().cursor<scene.lines.length){if(scene.choiceAt===e.view().cursor&&!e.view().choice)assert.ok(e.choose(scene.choices[0].id).ok);assert.ok(e.nextLine().ok);}
 if(scene.choiceTiming!=='beforeAction'&&scene.choices.length&&!e.view().choice)assert.ok(e.choose(scene.choices[0].id).ok);
 for(const op of scene.requires.filter(x=>late.includes(x)))assert.ok(e.record(scene.id,op).ok);
 assert.ok(e.finish().ok,scene.id);
}
assert.equal(e.view().current.id,'epilogue:E-01');assert.deepEqual(e.view().objective,[]);assert.equal(classifyPrologue(e.view()),'garden');
assert.equal(e.record('epilogue:E-01','npc:regional-reunion').ok,false);
const legacy=e.snapshot();legacy.cursor=2;assert.equal(makeEngine(campaign,legacy).view().cursor,0);
assert.ok(e.finish().ok);assert.equal(e.view().current.id,'epilogue:E-02');
const state={S:{resonance:e.snapshot(),cats:[],dex:{}},activeSlot:()=>'epilogue',save:()=>({ok:true})};
const rt=getSlotRuntime(state);const visitors=rt.residents('garden').map(n=>n.id);
assert.ok(visitors.includes('jiedeng')&&visitors.includes('muling'));assert.ok(!visitors.includes('qilan'));
assert.equal(rt.view().objective[0],'npc:public-accountability');
assert.equal(rt.finish(rt.capture()).ok,false);
console.log('Canon 2.2: return directly to garden, old epilogue cursor migration and actual accountability participants passed');
