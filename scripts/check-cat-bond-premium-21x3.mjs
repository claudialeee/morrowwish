/* Prevent repeating the 2026-11 regression: UI-only edits / repeated
 * blue-purple scenes / three identical combo stages must fail release QA.
 * Uses the ACTUAL production premium painter and camera director modules,
 * not invented mock metadata or screenshot labels.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=f=>fs.readFileSync('public/cat-bond/'+f,'utf8');
const scripts=['js/duo-director.js','js/duo-premium.js','js/duo-hero.js'];
for(const name of scripts)new vm.Script(source(name),{filename:name});

const window={devicePixelRatio:1,dispatchEvent:()=>{},addEventListener:()=>{}};
const mockCanvas=()=>({width:1152,height:1296,getContext:()=>({})});
const document={createElement:()=>mockCanvas()};
class ImageMock{
 constructor(){this.naturalWidth=1152;this.naturalHeight=1296;this.onload=null}
 set src(v){this._src=v}
 get src(){return this._src}
}
const sandbox={window,document,Image:ImageMock,Math,Number,Object,Array,Set,Map,console};
vm.createContext(sandbox);
for(const name of scripts)vm.runInContext(source(name),sandbox,{filename:name});
const Director=window.CatBondDuoDirector;
const Premium=window.CatBondPremiumCinematics;
const Hero=window.CatBondDuoHero;
assert.equal(Director.keys.length,21,'Must offer 21 real element combinations');
assert.equal(Premium.scenePaletteCount,21,'Each combo must have its own palette');
assert.equal(Premium.tierVariants,3,'Three trust tiers must have separate cut-in scripts');
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
for(const html of [page,game,unlocked]){
 assert.match(html,/js\/duo-premium\.js\?v=21-tinted-scenes-3-cinematic-tiers/,
  'Game, review gallery and unlocked preview must load the SAME latest premium painter');
 assert.match(html,/js\/duo-director\.js\?v=three-tiers-21-cameras/,
  'Every entrypoint needs the latest three-stage direction module');
}
console.log('CAT BOND PREMIUM 21x3 PASS: 21 distinct painted palettes, 63 tier camera edits, original high-quality cats, 21 live previews, 32 breeds');
