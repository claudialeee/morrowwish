import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeEngine} from '../public/cat-bond/js/resonance/engine.mjs';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {buildCanonicalScene} from '../public/cat-bond/js/resonance-cinematic.mjs';
const manifest=JSON.parse(fs.readFileSync('public/cat-bond/assets/cinematics/asset-manifest.json','utf8'));
const get=id=>campaign.scenes.find(s=>s.id===id);
let duration=0;
const allowed=new Set(['assets/resonance-world-v2/starfall.webp','assets/resonance-world-v2/harbor-mist.webp','assets/cinematics/prologue/broken-bell-tongue.webp','assets/garden/sunlit-garden-landscape.webp',...campaign.regions.map(r=>'assets/resonance-world-v2/'+r+'.webp')]);
for(const id of ['prologue:P-01','prologue:P-02','prologue:P-03']){
 const current=get(id);assert.equal(current.lines.length,0);
 const view={current,cursor:0,lineReady:true,objective:current.requires};
 const r=buildCanonicalScene({view,campaign,manifest,openingRelease:true});assert.equal(r.ok,true,r.reason);
 assert.equal(buildCanonicalScene({view,campaign,manifest}).ok,false);
 for(const f of r.scene.frames){assert(allowed.has(f.image),f.image);assert(fs.existsSync('public/cat-bond/'+f.image),f.image);for(const lang of ['zh','en']){assert(!f.subtitle?.[lang]?.speaker);assert(!/暮铃|守铃者|献出|牺牲|Muling|Bellkeeper|sacrifice|anchor/i.test(f.subtitle?.[lang]?.text||''));}duration+=f.durationMs;}
}
const broken=get('prologue:P-02'),bv={current:broken,cursor:0,lineReady:true,objective:broken.requires};
const brokenShot=buildCanonicalScene({view:bv,campaign,manifest,openingRelease:true}).scene.frames[0];
assert.deepEqual(brokenShot.crop,{x:.525,y:.325,width:.475,height:.475});
const unsafe=structuredClone(manifest);delete unsafe.prologueReleaseShots['prologue:P-02'][0].crop;
assert.equal(buildCanonicalScene({view:bv,campaign,manifest:unsafe,openingRelease:true}).reason,'opening-crop-required');
assert(duration>=20000&&duration<=30000,'opening duration '+duration);
assert(get('prologue:P-04').lines.every(l=>l.speaker==='player'));
assert.deepEqual(get('prologue:P-04').requires,['explore:garden-bell']);
assert.equal(get('prologue:P-05').lines[0].speaker,'muling');
assert.deepEqual(get('prologue:P-05').requires,['travel:harbor']);
const recall=get('starfall:F-02');const r=buildCanonicalScene({view:{current:recall,cursor:0,lineReady:true,objective:recall.requires.filter(x=>x.startsWith('cinematic:'))},campaign,manifest,staging:true});assert.equal(r.ok,true,r.reason);assert(r.scene.frames.some(f=>f.image.endsWith('keepers-choice.webp')));
console.log('Mystery opening contract verified; duration '+duration+'ms.');

const engine=makeEngine(campaign);assert(engine.record('prologue:P-01','cinematic:prologue-montage').ok);assert(engine.finish().ok);
const legacy=engine.snapshot();legacy.cursor=9;const restored=makeEngine(campaign,legacy);assert.equal(restored.view().cursor,0);assert.equal(restored.view().current.id,'prologue:P-02');assert.deepEqual(restored.view().objective,['cinematic:sacrifice']);assert.deepEqual(restored.snapshot().completed,legacy.completed);
console.log('Legacy opening cursor recovery preserves evidence and progression.');
