// Cheap CI gate to prevent reused music and missing soundtrack credit.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const obj=JSON.parse(fs.readFileSync('promotion/promo-music-catalog.json','utf8'));
const expected=['pawsibly-innocent','cat-bond','tiny-town','elsewhere','flip-dash','parcel-panic','pocket-aquarium'];
assert.deepEqual(Object.keys(obj.tracks).sort(),expected.sort(),'Exactly 7 retained games');
const tracks=Object.values(obj.tracks);
for(const attr of ['title','license','licenseUrl'])assert.ok(tracks.every(t=>typeof t[attr]==='string'&&t[attr].length>2),'Each recording requires '+attr);
const keys=tracks.map(x=>x.localFile||x.sourceUrl);
assert.equal(new Set(keys).size,7,'All seven trailer tracks must originate from different recordings');
assert.equal(new Set(tracks.map(t=>t.title)).size,7,'No repeated track names');
assert.ok(tracks.find(t=>t.title==='Easy Lemon')?.attribution?.includes('Kevin MacLeod'),'Attribution for CC BY music must be retained');
const scriptPaths=['scripts/make-viral-gameplay.mjs','scripts/make-remaining-game-reels.mjs'];
for(const p of scriptPaths){
 const code=fs.readFileSync(p,'utf8');
 assert.ok(code.includes('promoTrack('),p+': use a per-game recorded track');
 assert.ok(!code.includes("const audio='public/audio/cat-happy-clappy.ogg'"),'No shared soundtrack constant');
 assert.ok(!code.includes("const sound='public/audio/cat-happy-clappy.ogg'"),'No shared soundtrack constant');
}
const montage=fs.readFileSync('scripts/make-studio-montage.sh','utf8');
assert.ok(!montage.includes('-stream_loop -1 -i public/audio/cat-happy-clappy.ogg'),'Studio montage must not reuse one shared music loop');
console.log('7 distinct licensed video soundtrack assignments: PASS');
