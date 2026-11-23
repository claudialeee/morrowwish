/* Static release gate for the original-only 63-painting duo renderer. */
import assert from 'node:assert/strict';import fs from 'node:fs';
const read=p=>fs.readFileSync('public/cat-bond/'+p,'utf8'),premium=read('js/duo-premium.js'),hero=read('js/duo-hero.js');
assert.match(premium,/duo-storyboard-21x3-v3\.webp/);assert.match(premium,/paintedFrameCount:63/);
assert.match(premium,/wholeSceneCount:21/);assert.match(premium,/ASPECT=16\/9/);
assert.match(premium,/get actorFallbackEnabled\(\)\{return false\}/);
assert.doesNotMatch(premium,/CatBondDuoBreedActors|drawKitten|originalArt:false/);
assert.match(hero,/63-original-painted-storyboards/);assert.doesNotMatch(hero,/CatBondDuoArtwork|drawKitten|DuoBreedActors/);
for(const page of ['index.html','duo-preview.html','duo-showcase.html']){
 const html=read(page);assert.doesNotMatch(html,/duo-breed-actors\.js|mode-breeds|pick-cat-a/);
 assert.match(html,/duo-premium\.js\?v=/);assert.match(html,/duo-hero\.js\?v=/);
}
for(const path of ['js/duo-breed-actors.js','assets/duo-watercolor-32-actors-v1.webp','assets/duo-stage-clean-21x3-v2.webp'])
 assert.equal(fs.existsSync('public/cat-bond/'+path),false,'retired convergence asset must remain deleted');
console.log('CAT BOND ORIGINAL-ONLY RELEASE GATE PASS');
