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
 else if(img.src?.includes('jiafei-watercolor-v2.webp')){img.naturalWidth=160;img.naturalHeight=180}
 else{img.naturalWidth=3584;img.naturalHeight=2592}
 img.onload?.();
}
const actors=window.CatBondDuoBreedActors;
const painter=window.CatBondPremiumCinematics;
const hero=window.CatBondDuoHero;
const director=window.CatBondDuoDirector;
assert.equal(actors.breedCount,32,'Do not fake a 33rd 8x4 atlas cell');
assert.equal(actors.supportedBreedCount,33,'32 atlas cats + one independent user-approved watercolor WebP');
assert.equal(actors.jiafeiArtReady,true,'Dedicated Jiafei raster must decode');
assert.match(actors.jiafeiSource,/jiafei-watercolor-v2\.webp/);
assert.equal(actors.ready,true,'32-cell atlas, 21x3 scenery and approved Jiafei watercolor must all load');
assert.equal(painter.ready,true,'Premium cutin must not show until selected breeds are decoded');
assert.equal(painter.breedMatchCount,32);
assert.equal(painter.liveBreedArtworkEnabled,true);
assert.equal(hero.assetSource,'32-actual-breed-watercolor-actors');
const roster=[...source('js/data.js').matchAll(/\bid\s*:\s*['"]([a-z][a-z0-9]*)['"]/g)].map(x=>x[1]);
assert.equal(roster.length,33,'The full roster includes the new Exotic Shorthair');
assert.deepEqual([...actors.breedIds],roster.filter(id=>id!=='jiafei'),
  'The original 32-cell watercolor atlas must remain unchanged');
assert.ok(roster.includes('jiafei'),'Exotic Shorthair is a real playable cat');
for(const id of roster){
 assert.equal(actors.species({uid:'current-player',species:id}),id,
   'Actual selected species must map to its own painted character: '+id);
}
assert.equal(actors.species({species:'not-a-real-breed'}),null,
  'Never substitute a generic fixed gray cat for missing breeds');
// Draw both UID placements and require the actual Image object, not merely a
// distinct procedural shape or a passing species() lookup.
const painted=[];
const ctx={globalAlpha:1,save:noop,restore:noop,translate:noop,rotate:noop,
 scale:noop,beginPath:noop,ellipse:noop,fill:noop,
 drawImage:(img,...args)=>painted.push({src:img.src,args})};
for(const pair of [['jiafei','tangyuan'],['tangyuan','jiafei']]){
 painted.length=0;
 assert.equal(actors.draw(ctx,512,288,pair.map((id,i)=>({uid:'q'+i,species:id})),
   'elec+fire',.44,1),true,'Duo paints both selected species');
 assert.equal(painted.length,2,'Each side draws exactly one real raster subject');
 const jf=painted.filter(x=>x.src?.includes('jiafei-watercolor-v2.webp'));
 const orig=painted.filter(x=>x.src?.includes('32-actors'));
 assert.equal(jf.length,1,
   'Jiafei must use its dedicated real watercolor Image on either side');
 assert.equal(orig.length,1,
   'Original 32-cell atlas must paint the other selected cat');
 assert.ok(Math.abs(jf[0].args[3]/orig[0].args[7]-.92)<.0001,
   'Jiafei duo art must be 8% smaller than its partner at the same pose height');
}
const jiafeiAsset='public/cat-bond/assets/jiafei-watercolor-v2.webp';
const raster=fs.readFileSync(jiafeiAsset);
assert.ok(raster.length>6000&&raster.toString('ascii',0,4)==='RIFF'&&
  raster.toString('ascii',8,12)==='WEBP',
  'Jiafei must have genuine painted transparent WebP pixels, not an SVG/text placeholder');
assert.doesNotMatch(source('js/duo-breed-actors.js'),/CatArt\.drawCat/,
  'Premium duo must never silently fall back to a procedural Jiafei');
assert.match(source('js/real-kittens.js'),/const visualScale=\.86;/,
  'Yard, normal battle and portraits must calibrate approved Jiafei visible fur uniformly');
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
assert.match(source('js/duo-bond.js'),/this\.duoCinematic\.originalArt=true/,
  'Actual battles must play the approved 21 x 3 original watercolor cut-in');
assert.doesNotMatch(source('js/duo-bond.js'),/this\.duoCinematic\.originalArt=false/,
  'The rejected alternate v10 animation cannot replace approved original paintings');
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
assert.equal((page.match(/<article class="breed-card"/g)||[]).length,roster.length,
 'Every playable species, including Exotic Shorthair, must have a gallery card');
assert.match(page,/id="pick-cat-a"/);
assert.match(page,/id="pick-cat-b"/);
for(const html of [page,game,unlocked]){
 assert.match(html,/duo-breed-actors\.js\?v=32-watercolor-cats-scenery-v5/);
 // Require a real cache-busted premium renderer, without pinning the release to a stale asset version.
 assert.match(html,/duo-premium\.js\?v=[\w-]+-20261122/);
 assert.doesNotMatch(html,/duo-breed-art\.js/,'Unsafe mask shader must stay disabled');
 assert.doesNotMatch(html,/duo-premium-sheet\.webp/,'Rejected low-quality gray cats must not reappear');
}
console.log('CAT BOND PREMIUM PASS: 32 untouched atlas cats + approved flat-faced Jiafei WebP tested in both real actor slots; 21 skill backgrounds x 3 tiers; 63 previews.');
