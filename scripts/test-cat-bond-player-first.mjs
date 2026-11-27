import assert from 'node:assert/strict';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {sceneIntent,beforeActionDialogue} from '../public/cat-bond/js/resonance/player-first-intent.mjs';
import {makeEngine} from '../public/cat-bond/js/resonance/engine.mjs';
import {layouts,canonRestorationPrerequisites} from '../public/cat-bond/js/resonance/world-exploration.mjs';
assert.deepEqual(Object.keys(sceneIntent),campaign.scenes.map(s=>s.id),'every authored scene needs a visible player motive');
for(const s of campaign.scenes){assert.ok(sceneIntent[s.id].every(x=>x.length>12));if(s.beforeActionLines){assert.ok(s.beforeActionLines<=s.lines.length);const gates=s.lines.slice(0,s.beforeActionLines).flatMap(l=>l.afterOperations||[]);assert.ok(!gates.some(x=>x.startsWith('puzzle:')),'intro is not gated by the puzzle '+s.id);assert.ok(beforeActionDialogue({current:s,cursor:0,lineReady:true}));assert.equal(beforeActionDialogue({current:s,cursor:s.beforeActionLines,lineReady:true}),false);}}
console.log('40 authored motives and split dialogue timing verified; not a subjective playability certificate.');

for(const region of campaign.regions){const a=layouts[region].features["repair:"+region],b=layouts[region].features["melody:"+region];assert.ok(a&&b);assert.deepEqual(a.slice(0,2),b.slice(0,2),"Repair and response must be one physical interaction "+region);const scene=campaign.scenes.find(s=>s.requires.includes("repair:"+region));assert.equal(scene.requires[scene.requires.indexOf("repair:"+region)+1],"melody:"+region);}
assert.equal(canonRestorationPrerequisites["repair:harbor"],"harbor:H-04");

const moments=campaign.scenes.flatMap(s=>s.lines.map((l,i)=>({id:s.id,i,l}))).filter(x=>x.l.beat);assert.ok(moments.length>=12);for(const m of moments){assert.ok(m.l.beat.zh&&m.l.beat.en&&m.l.beat.key);}for(const key of ["signal","tea","home","fracture"]){assert.ok(moments.filter(m=>m.l.beat.key===key).length>=2,"Motif must recur "+key);}
