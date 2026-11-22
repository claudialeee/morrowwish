/* Hard Cat Bond release gate — actual watercolor identities, NOT fake
 * string IDs painted into a fixed cat sheet or disastrous fur recoloring.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=f=>fs.readFileSync('public/cat-bond/'+f,'utf8');
const scripts=['js/duo-director.js','js/duo-breed-actors.js',
  'js/duo-premium.js','js/duo-hero.js'];
for(const name of scripts)new vm.Script(source(name),{filename:name});
const events=new Map(),images=[];
const window={
 devicePixelRatio:1,
 addEventListener:(id,cb)=>{const list=events.get(id)||[];list.push(cb);events.set(id,list)},
 dispatchEvent:e=>(events.get(e.type)||[]).forEach(fn=>fn(e))
};
class EventMock{constructor(type){this.type=type}}
class ImageMock{
 constructor(){this.onload=null;this.naturalWidth=0;this.naturalHeight=0;images.push(this)}
 set src(v){this._src=v}get src(){return this._src}
}
const noop=()=>{};
const document={createElement:()=>({
 width:512,height:288,
 getContext:()=>({
 drawImage:noop,save:noop,restore:noop,clearRect:noop,setTransform:noop,
 createLinearGradient:()=>({addColorStop:noop}),fillRect:noop
 })
})};
const sandbox={window,document,Image:ImageMock,Event:EventMock,Math,Number,Object,Array,
 Set,Map,console};vm.createContext(sandbox);
for(const name of scripts)vm.runInContext(source(name),sandbox,{filename:name});
for(const img of images){
 if(img.src?.includes('32-actors')){img.naturalWidth=1774;img.naturalHeight=887}
 else{img.naturalWidth=3584;img.naturalHeight=2592}
 img.onload?.();
}
const actors=window.CatBondDuoBreedActors;
const painter=window.CatBondPremiumCinematics;
const hero=window.CatBondDuoHero;
const director=window.CatBondDuoDirector;
assert.equal(actors.breedCount,32);
assert.equal(actors.ready,true,'Both 32 breed actors and 21x3 clean scenic atlas must load');
assert.equal(painter.ready,true,'Premium cutin must not show until selected breeds are decoded');
assert.equal(painter.breedMatchCount,32);
assert.equal(painter.liveBreedArtworkEnabled,true);
assert.equal(hero.assetSource,'32-actual-breed-watercolor-actors');
const roster=[...source('js/data.js').matchAll(/\bid\s*:\s*['"]([a-z][a-z0-9]*)['"]/g)].map(x=>x[1]);
assert.equal(roster.length,32);
assert.deepEqual([...actors.breedIds],roster,
  'Transparent whole-body watercolor atlas must use exact collectible roster order');
for(const id of roster){
 assert.equal(actors.species({uid:'current-player',species:id}),id,
   'Actual selected species must map to its own painted character: '+id);
}
assert.equal(actors.species({species:'not-a-real-breed'}),null,
  'Never substitute a generic fixed gray cat for missing breeds');
assert.equal(director.keys.length,21);
assert.equal(painter.wholeSceneCount,21);
assert.equal(painter.paintedFrameCount,63);
assert.equal(painter.tierVariants,3);
assert.equal(painter.realBreedOverpaintEnabled,false,
  'Never destroy premium scene pixels with generic fur-region masks');
assert.doesNotMatch(source('js/duo-premium.js'),/identity\.paint\(/);
assert.match(source('js/duo-premium.js'),/CatBondDuoBreedActors\?\.draw\?/,
  'Real battle must draw two actual selected full-body watercolor cats');
assert.match(source('js/duo-bond.js'),/this\.duoCinematic,uid=>/,
  'Battle must resolve player-selected UIDs to live player cats');
for(const [path,min] of [
 ['assets/duo-watercolor-32-actors-v1.webp',750000],
 ['assets/duo-stage-clean-21x3-v2.webp',150000]]){
 const file='public/cat-bond/'+path;
 assert.ok(fs.existsSync(file)&&fs.statSync(file).size>min,
  'Original high resolution painted asset is missing: '+path);
}
const page=source('duo-showcase.html'),game=source('index.html'),
  unlocked=source('duo-preview.html');
assert.equal((page.match(/class="stage-breed-preview"/g)||[]).length,63,
 'All 63 stage paintings must show selected breeds, not old fixed cats');
assert.equal((page.match(/class="feature-breed-preview"/g)||[]).length,3);
assert.equal((page.match(/class="skill-preview"/g)||[]).length,21);
assert.equal((page.match(/<article class="breed-card"/g)||[]).length,32);
assert.match(page,/id="pick-cat-a"/);
assert.match(page,/id="pick-cat-b"/);
for(const html of [page,game,unlocked]){
 assert.match(html,/duo-breed-actors\.js\?v=32-watercolor-cats-scenery-v2/);
 assert.match(html,/duo-premium\.js\?v=(?:full-stage-original-63-duo-v4-watercolor-atmosphere|full-frame-gallery-no-crop)-20261122/);
 assert.doesNotMatch(html,/duo-breed-art\.js/,'Unsafe mask shader must stay disabled');
 assert.doesNotMatch(html,/duo-premium-sheet\.webp/,'Rejected low-quality gray cats must not reappear');
}
console.log('CAT BOND 32 BREED PREMIUM PASS: 32 original watercolor cats x 2 actual player UID slots; 21 skill backgrounds x 3 tiers; 63 breed-aware thumbnails and premium battle cutin.');
