/* Prevent repeating the 2026-11 regression: UI-only edits / repeated
 * blue-purple scenes / three identical combo stages must fail release QA.
 * Uses the ACTUAL production premium painter and camera director modules,
 * not invented mock metadata or screenshot labels.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=f=>fs.readFileSync('public/cat-bond/'+f,'utf8');
const scripts=['js/duo-director.js','js/duo-breed-art.js','js/duo-premium.js','js/duo-hero.js'];
for(const name of scripts)new vm.Script(source(name),{filename:name});

const window={devicePixelRatio:1,dispatchEvent:()=>{},addEventListener:()=>{}};
const mockCanvas=()=>({width:3584,height:2592,getContext:()=>({})});
const document={createElement:()=>mockCanvas()};
class ImageMock{
 constructor(){this.naturalWidth=3584;this.naturalHeight=2592;this.onload=null}
 set src(v){this._src=v}
 get src(){return this._src}
}
const sandbox={window,document,Image:ImageMock,Math,Number,Object,Array,Set,Map,console};
vm.createContext(sandbox);
for(const name of scripts)vm.runInContext(source(name),sandbox,{filename:name});
const Director=window.CatBondDuoDirector;
const Premium=window.CatBondPremiumCinematics;
const Hero=window.CatBondDuoHero;
const BreedArt=window.CatBondDuoBreedArt;
assert.equal(BreedArt.breedCount,32,'Must supply actual illustrated fur profiles for all 32 cats');
assert.equal(BreedArt.maskSourceCount,23,'All 23 unique high-res watercolor scene mask contours must be traced');
assert.equal(Premium.breedMatchCount,0,'Do not falsely claim broken fur repainting is active');
assert.equal(Premium.realBreedOverpaintEnabled,false,'Broken fur recolor must remain off');
assert.equal(Premium.breedProfileCount,32,'Real cat roster still supports all 32 species');
const rosterIds=[...source('js/data.js').matchAll(/\bid\s*:\s*['"]([a-z][a-z0-9]*)['"]/g)].map(x=>x[1]);
assert.equal(rosterIds.length,32,'Actual playable roster must contain exactly 32 collectible IDs');
assert.deepEqual(new Set(BreedArt.sourceProfiles),new Set(rosterIds),
  'No missing cat or fabricated non-playable fur profile');
for(const id of rosterIds){
 const coat=BreedArt.coat({uid:'test',species:id});
 assert.equal(coat.id,id,'Actual user-selected species must resolve without a fallback: '+id);
 assert.equal(coat.base.length,3);
 assert.ok(coat.base.every(v=>Number.isFinite(v)&&v>=0&&v<=255));
}
assert.doesNotMatch(source('js/duo-premium.js'),/identity\.paint\(/,
  'Unsafe wide-area fur repaint must never be enabled: it destroys painted cats');
assert.match(source('js/duo-bond.js'),/this\.duoCinematic,uid=>/,
  'Real battle must resolve current team UID to the proper two actual chosen cats');
assert.equal(Director.keys.length,21,'Must offer 21 real element combinations');
assert.equal(Premium.scenePaletteCount,21,'Each combo must have its own palette');
assert.equal(Premium.tierVariants,3,'Three trust tiers must have separate cut-in scripts');
assert.equal(Premium.wholeSceneCount,21,'No more 8 repeated grey/purple paintings');
assert.equal(Premium.paintedFrameCount,63,'Must have 21 element pairs with 3 real pose images each');
assert.match(Premium.source,/duo-storyboard-21x3-v3.webp/);
const asset='public/cat-bond/assets/duo-storyboard-21x3-v3.webp';
assert.ok(fs.existsSync(asset) && fs.statSync(asset).size>1500000,'Real 63-frame atlas must exist in production source');
assert.equal(Hero.assetSource,'approved-complete-painterly-duo-sheet',
 'Do not silently replace painted cats with rejected cheap procedural actors');
const paletteIds=Director.keys.map(key=>{
 const value=Premium.paletteFor(key);
 assert.equal(value.length,4,key+' requires a full painted scene palette');
 for(const hex of value)assert.match(hex,/^#[0-9a-f]{6}$/i,key+' invalid ink');
 return value.join('/');
});
assert.equal(new Set(paletteIds).size,21,'Different skill keys cannot share a scene color recipe');
assert.equal(Director.isUnique(),true,'All 21 elemental camera tracks must be distinct');
const edits=Director.trustStoryboards;
assert.equal(new Set(Object.values(edits).map(x=>x.name)).size,3,
 'Bond 20, 60, 90 must describe three different edits');
for(const key of Director.keys){
 const samples=[.20,.40,.54,.73].map(p=>[1,2,3].map(tier=>{
  const cam=Director.camera(key,p,960,540,tier);
  return [cam.dx,cam.dy,cam.zoom,cam.angle].map(x=>x.toFixed(3)).join(',');
 }));
 for(const [i,trio] of samples.entries())
  assert.equal(new Set(trio).size,3,key+' at sample '+i+' still has identical camera choreography');
}
// The public review gallery must show the 21 distinct LIVE rendered frames;
// CSS-stretched static images or empty divs cannot pass.
const page=source('duo-showcase.html'),game=source('index.html'),unlocked=source('duo-preview.html');
assert.equal((page.match(/class="skill-preview"/g)||[]).length,21,
 'All 21 gallery cards must include real animation canvases');
assert.equal((page.match(/<article class="breed-card"/g)||[]).length,32);
assert.equal((page.match(/class="featured-painting"/g)||[]).length,3);
assert.match(page,/id="pick-cat-a"/);
assert.match(page,/id="pick-cat-b"/);
assert.equal((page.match(/class="source-art-stage"/g)||[]).length,63,
 'Every skill must show three actual painted frames, not just camera presets');
assert.equal((page.match(/<article class="master-art"/g)||[]).length,21);
for(const html of [page,game,unlocked]){
 assert.match(html,/js\/duo-breed-art\.js\?v=32-traced-breed-coats-20261122-v2/,
  'Actual game and both review pages MUST load the 32 selected-cat fur painter');
 assert.match(html,/js\/duo-premium\.js\?v=art-integrity-no-fur-bleed-20261122-v9/,
  'All public entrypoints must load the artwork-preserving corrected painter');
 assert.doesNotMatch(html,/duo-premium-sheet\.webp/, 'Rejected old gray-purple cut-in artwork must never load');
 assert.match(html,/js\/duo-director\.js\?v=three-tiers-21-cameras/,
  'Every entrypoint needs the latest three-stage direction module');
}
console.log('CAT BOND ART INTEGRITY PASS: clean 63 original paintings, 32 roster species, 21 skills × 3 trust tiers, forbidden fur-masking disabled until individually validated');
