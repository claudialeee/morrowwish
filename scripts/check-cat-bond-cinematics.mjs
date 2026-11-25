import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {buildCanonicalScene,mountResonanceCinematics} from '../public/cat-bond/js/resonance-cinematic.mjs';
const manifest=JSON.parse(fs.readFileSync(new URL('../public/cat-bond/assets/cinematics/asset-manifest.json',import.meta.url),'utf8'));
assert.equal(manifest.schemaVersion,2);
for(const a of manifest.assets){
 if(a.runtimeAllowed){assert.equal(a.status,'approved');assert.ok(a.visualReview?.evidence);assert.equal(a.visualReview.result,'PASS');assert.match(a.path,/\.(webp|png|avif|jpe?g)$/);assert.ok(fs.existsSync(path.join('public/cat-bond',a.path)));}
 else assert.equal(a.status,'rejected');
}
const scene={id:'prologue:P-02',title:{zh:'选择',en:'Choice'},choices:[],lines:[{speaker:'muling',text:{zh:'还有办法。',en:'There is another way.'}}],requires:['cinematic:sacrifice','explore:never-grant']};
const campaign={canon:'The Last Resonance',cast:{muling:{name:{zh:'暮铃',en:'Muling'}}},scenes:[scene]};
const view={current:scene,cursor:0,lineReady:true,objective:scene.requires};
assert.equal(buildCanonicalScene({view,campaign,manifest}).reason,'approved-shot-sequence-missing');
const approved={assets:[1,2].map(n=>({id:'test-'+n,path:'assets/cinematics/test-'+n+'.webp',sceneKey:scene.id,status:'approved',runtimeAllowed:true,visualReview:{result:'PASS',evidence:'synthetic-test-fixture-only'}})),approvedShots:{[scene.id]:[1,2].map(n=>({assetId:'test-'+n,alt:{zh:'测试',en:'Test'},durationMs:2000,lines:n===1?[0]:[]}))}};
const ok=buildCanonicalScene({view,campaign,manifest:approved});
assert.equal(ok.ok,true);
assert.equal(ok.scene.frames[0].subtitle.zh.text,scene.lines[0].text.zh);
assert.equal(ok.scene.frames[0].subtitle.en.text,scene.lines[0].text.en);
let slot='slot1',revision=0,cursor=0,evidence=[],writes=0,played=0,callbacks,resolved;
const engine={view:()=>({...view,cursor,objective:scene.requires.filter(x=>!evidence.includes(x))}),snapshot:()=>({revision}),nextLine:()=>({ok:true,state:{revision:++revision,cursor:++cursor}}),record:(id,op)=>{assert.equal(id,scene.id);evidence.push(op);return {ok:true,state:{revision:++revision,evidence}}}};
const factory=(root,opts)=>{callbacks=opts;return {stop(){},register(){},play(){played++},restore(){played++},interrupt(){return {sceneId:scene.id,frameIndex:0,elapsedMs:0}},destroy(){}}};
const host=mountResonanceCinematics({root:{},rendererFactory:factory,engine,campaign,manifest:approved,getSlotKey:()=>slot,onPersist:()=>writes++,onResolved:r=>resolved=r,preload:async()=>{}});
assert.equal((await host.playCurrent()).ok,true);assert.equal(played,1);
slot='slot2';callbacks.onComplete({sceneId:scene.id});assert.equal(writes,0);
slot='slot1';assert.equal((await host.playCurrent()).ok,true);
callbacks.onSkip({sceneId:scene.id});assert.equal(writes,2);assert.deepEqual(evidence,['cinematic:sacrifice']);assert.deepEqual(resolved.remaining,['explore:never-grant']);
callbacks.onComplete({sceneId:scene.id});assert.equal(writes,2);
host.dispose();
const failed=mountResonanceCinematics({root:{},rendererFactory:factory,engine,campaign,manifest:approved,getSlotKey:()=>slot,onPersist:()=>writes++,preload:async()=>{throw Error('decode')}});
assert.equal((await failed.playCurrent()).reason,'cinematic-image-load-failed');assert.equal(writes,2);failed.dispose();
console.log('Cinematic source/adapter tests passed; NOT a visual acceptance result.');
