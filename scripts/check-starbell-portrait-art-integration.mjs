import assert from 'node:assert/strict';
import fs from 'node:fs';
import {atlasAnchors,regionAnchors,projectPortrait,unprojectPortrait,portraitAsset} from '../public/cat-bond/js/resonance/portrait-map.mjs';
import {chaseCorners,chaseFrame,chaseScreen,portraitChaseTap} from '../public/cat-bond/js/resonance/portrait-chase.mjs';
const dir='public/cat-bond/assets/mobile-portrait/';
const assets=fs.readdirSync(dir).filter(x=>x.endsWith('.webp'));assert.equal(assets.length,31);assert.ok(!assets.includes('forest-waterworks.webp'));assert.ok(assets.includes(portraitAsset('finale')));
for(const file of assets){const b=fs.readFileSync(dir+file);assert.equal(b.toString('ascii',0,4),'RIFF',file);assert.equal(b.toString('ascii',8,12),'WEBP',file);}
const atlas={harbor:[.5,.18],forest:[.79,.33],forge:[.79,.68],sky:[.5,.85],library:[.21,.68],starfall:[.21,.33],center:[.5,.5]};
for(const [id,p] of Object.entries(atlas)){assert.deepEqual(projectPortrait('atlas',p),atlasAnchors[id]);assert.deepEqual(unprojectPortrait('atlas',atlasAnchors[id]),p);}
let points=0,paths=0;
for(const [id,r] of Object.entries(regionAnchors)){
 assert.ok(assets.includes(portraitAsset(id)));paths+=r.route.length;
 const anchors=[...r.route,...Object.values(r.npc||{}),...Object.values(r.feature||{}),...Object.values(r.discoveries||{}),...Object.values(r.cache||{}),...(r.ruins?[r.ruins]:[])];
 for(const a of anchors){assert.deepEqual(projectPortrait(id,a.landscape),a.portrait,id+' forward '+JSON.stringify(a));points++;}
 for(const a of anchors){const back=unprojectPortrait(id,a.portrait);assert.deepEqual(projectPortrait(id,back),a.portrait,id+' inverse '+JSON.stringify(a));}
 if(r.remoteSurvey){assert.ok(assets.includes(portraitAsset(id,true)));for(const a of r.remoteSurvey.route)assert.deepEqual(projectPortrait(id,a.landscape,true),a.portrait);}
}
assert.equal(paths,79);
for(const [w,h] of [[320,568],[390,844],[430,932]]){const f=chaseFrame(w,h);assert.ok(f.w>=w&&f.h>=h);for(const p of chaseCorners){const q=chaseScreen(p,f);assert.ok(q[0]>=15&&q[0]<=w-15&&q[1]>=15&&q[1]<=h-15);assert.deepEqual(portraitChaseTap({},q[0]/w,q[1]/h,w,h,928,1648),{type:'target',x:p[0],y:p[1]});}}
console.log('Native portrait asset and anchor math PASS',assets.length,paths,points);
