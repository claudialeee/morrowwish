import assert from 'node:assert/strict';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {makeEngine} from '../public/cat-bond/js/resonance/engine.mjs';
import {storyPartyPatch} from '../public/cat-bond/js/resonance/story-party.mjs';
import {buildCanonicalScene} from '../public/cat-bond/js/resonance-cinematic.mjs';
import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync('public/cat-bond/assets/cinematics/asset-manifest.json','utf8'));
const ok=(r)=>assert.ok(r?.ok,JSON.stringify(r));
function play(choices={}){const e=makeEngine(campaign);const snapshots=[],wins=[];for(let i=0;i<500&&!e.view().ending;i++){const v=e.view(),x=v.current;if(v.lineReady&&v.cursor<x.lines.length)ok(e.nextLine());else if(x.choices.length&&!v.choice&&(x.choiceTiming==='beforeAction'||v.cursor===(x.choiceAt??x.lines.length)))ok(e.choose(choices[x.id]||x.choices[0].id));else if(v.objective.length){const op=v.objective[0];assert.ok(!/^(repair|melody):/.test(op),'manual bell restoration must not recur');if(x.id==='finale:B-03')for(let j=0;j<campaign.regions.length;j++)ok(e.supportAction(campaign.regions[j],campaign.support[j]));ok(e.record(x.id,op));if(op.startsWith('battle:'))wins.push([x.id,e.snapshot().melodies.length]);}else{ok(e.finish());snapshots.push(e.snapshot());}}assert.equal(e.view().ending,true);return {snapshots,wins,final:e.snapshot()};}
const a=play();assert.equal(a.final.completed.length,40);assert.deepEqual(a.wins.map(w=>w[1]),[1,2,3,4,5,6,6,6]);
for(const choices of [{'sky:S-02':'train','sky:S-04':'search','library:M-03':'space','library:M-04':'distance','epilogue:E-02':'help'},{'sky:S-04':'company','library:M-03':'hurt','library:M-04':'understand','epilogue:E-02':'space'}])play(choices);
assert.equal(campaign.scenes.filter(s=>s.chapter==='finale').flatMap(s=>s.requires).filter(o=>o.startsWith('battle:')).length,2);
const saved=structuredClone(a.snapshots.find(s=>s.scene==='harbor:H-05'));delete saved.storyRevision;saved.sanctuaries=[];saved.melodies=[];delete saved.evidence['harbor:H-05'];assert.ok(makeEngine(campaign,saved).snapshot().melodies.includes('harbor'));
const unfinished=structuredClone(a.snapshots.find(s=>s.scene==='harbor:H-04'));delete unfinished.storyRevision;assert.ok(!makeEngine(campaign,unfinished).snapshot().melodies.includes('harbor'));
for(const id of ['starfall:F-02','starfall:F-05','finale:B-04']){const current=campaign.scenes.find(s=>s.id===id);const r=buildCanonicalScene({campaign,manifest,view:{current,choice:null,objective:current.requires.filter(o=>o.startsWith('cinematic:')),cursor:0,lineReady:true},staging:true});ok(r);assert.ok(!r.scene.frames.some(f=>f.id.includes('last-patrol')));}
const before=a.snapshots.find(s=>s.scene==='finale:B-02'),after=a.snapshots.find(s=>s.scene==='finale:B-03'),root={cats:[{uid:'p',species:'jinjc'}],storyAway:{muling:{uid:'l',storyActor:'muling',species:'story_muling'}},duoRelations:{pairs:{},active:[]},battlePrefs:{teamUids:['p']}};const party=storyPartyPatch(root,before,after,()=>({uid:'new'}));assert.deepEqual(party.fields.battlePrefs.teamUids.slice(0,2),['p','l']);
console.log('PASS Canon 3 complete progression, six actual victory gates, two finale operations, choices, migration and cinematic manifest');
