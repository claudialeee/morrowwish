import assert from 'node:assert/strict';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {sceneIntent,beforeActionDialogue} from '../public/cat-bond/js/resonance/player-first-intent.mjs';
import {makeEngine} from '../public/cat-bond/js/resonance/engine.mjs';
assert.deepEqual(Object.keys(sceneIntent),campaign.scenes.map(s=>s.id),'every authored scene needs a visible player motive');
for(const s of campaign.scenes){assert.ok(sceneIntent[s.id].every(x=>x.length>12));if(s.beforeActionLines){assert.ok(s.beforeActionLines<=s.lines.length);const gates=s.lines.slice(0,s.beforeActionLines).flatMap(l=>l.afterOperations||[]);assert.ok(!gates.some(x=>x.startsWith('puzzle:')),'intro is not gated by the puzzle '+s.id);assert.ok(beforeActionDialogue({current:s,cursor:0,lineReady:true}));assert.equal(beforeActionDialogue({current:s,cursor:s.beforeActionLines,lineReady:true}),false);}}
console.log('40 authored motives and split dialogue timing verified; not a subjective playability certificate.');
