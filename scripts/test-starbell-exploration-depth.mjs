import assert from 'node:assert/strict';
import {foregroundCuts,withForeground,depthScale,foregroundAssetNames} from '../public/cat-bond/js/resonance/exploration-depth.mjs';
assert.equal(foregroundAssetNames.length,16);
const fit={x:0,y:0,width:540,height:960};
const x=.53*540,y=.738*960;
assert.ok(foregroundCuts('windchime-town-tall.webp',fit,x,y,1).length,'town flower wall partly covers nearby actor');
assert.equal(foregroundCuts('windchime-town-tall.webp',fit,x,.79*960,1).length,0,'actor in front of wall is not occluded');
assert.equal(foregroundCuts('unknown',fit,x,y,1).length,0);
assert.ok(depthScale(.2)<depthScale(.8));
assert.ok(foregroundAssetNames.every(k=>foregroundCuts(k,fit,270,480,1).every(p=>p.length>=3&&p.every(([x,y])=>Number.isFinite(x)&&Number.isFinite(y)))));
let saves=0,clips=0,draws=0;const ctx={save(){saves++},restore(){saves--},beginPath(){},rect(){},moveTo(){},lineTo(){},closePath(){},clip(rule){assert.equal(rule,'evenodd');clips++}};
assert.equal(withForeground(ctx,'windchime-town-tall',fit,x,y,1,()=>{draws++;return 17}),17);
assert.equal(saves,0);assert.ok(clips>0);assert.equal(draws,1);
assert.throws(()=>withForeground(ctx,'windchime-town-tall',fit,x,y,1,()=>{throw Error('draw error')}));assert.equal(saves,0);
console.log('PASS original artwork foreground masks and depth transform (all regions, garden and variants)');

// Normal exploration actor regression: no world-following party rendering, in either orientation.
{
 const {readFileSync}=await import('node:fs');
 const runtime=readFileSync(new URL('../public/cat-bond/js/resonance/world-runtime.mjs',import.meta.url),'utf8');
 const draw=runtime.slice(runtime.indexOf('function draw(){'),runtime.indexOf('function drawLibraryCeremony('));
 const ordinary=draw.slice(draw.indexOf('if(wild)cat(wild.species'),draw.indexOf('if(cargo)',draw.indexOf('if(wild)cat(wild.species')));
 assert.ok(ordinary.includes('c.protagonist===true'),'selected protagonist must drive ordinary map exploration');
 assert.equal((ordinary.match(/explorer\.moving/g)||[]).length,1,'only protagonist can be drawn moving');
 assert.doesNotMatch(ordinary,/companions\.forEach|companionActive|companionFollowing|partner\.species|rescueHeld/);
 assert.match(draw,/paintSpatial\(ctx/,'explicit puzzle actor rendering remains available');
 console.log('Single protagonist exploration / no recruited follower regression passed');
}
