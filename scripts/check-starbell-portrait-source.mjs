// Isolated Starbell RPG gate. The arcade Cat Bond roster gate is deliberately not repurposed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root='public/cat-bond/';
const read=p=>fs.readFileSync(root+p,'utf8');
const image=p=>{const b=fs.readFileSync(root+p);assert.equal(b.toString('ascii',0,4),'RIFF',p);assert.equal(b.toString('ascii',8,12),'WEBP',p);return b;};
for(const p of ['assets/garden/sunlit-garden-landscape.webp','assets/garden/sunlit-garden-portrait.webp','assets/garden/title-bell-sanctuary.webp'])image(p);
const cover=image('assets/garden/title-bell-sanctuary.webp');
const blob=createHash('sha1').update('blob '+cover.length+'\0').update(cover).digest('hex');
assert.equal(blob,'47eb46e81f24b8221c80544e46ed5bb8d417aab1','original non-spoiler cover retained');
const html=read('index.html'),css=read('css/rpg-portrait.css');
assert.ok(html.includes('cb-title-cover-art')&&html.includes('src="assets/garden/title-bell-sanctuary.webp"')&&!html.includes('cb-title-lead'),'original cover only');
assert.ok(css.includes('object-position:76% center')&&css.includes('object-fit:cover')&&css.includes('aspect-ratio:16/9'),'portrait geometry');
const hero=read('js/duo-hero.js'),premium=read('js/duo-premium.js'),bond=read('js/duo-bond.js'),battle=read('js/battle.js');
for(const s of ['63-original-painted-storyboards','const art=window.CatBondPremiumCinematics','return art.draw(ctx,W,H,seq)','get originalArtOnly(){return true}','get actorFallbackEnabled(){return false}'])assert.ok(hero.includes(s),'hero contract: '+s);
for(const s of ['const artW=Math.min(W,H*ASPECT)','feather(paintingCtx,artW,artH)','atmosphere(stageCtx,W,H,index)','drawOriginalArtEffects(stageCtx,artX,artY,artW,artH,p,key,tier)','const alpha=still||gallery?1:smooth(p/.15)*(1-smooth((p-.78)/.20))','actorLayerCount:0','get actorFallbackEnabled(){return false}'])assert.ok(premium.includes(s),'painted cinematic contract: '+s);
assert.ok(!/drawKitten|CatBondDuoArtwork|CatBondDuoBreedActors|originalArt:false/.test(hero+premium),'no alternate low-quality renderer');
for(const p of ['js/duo-breed-actors.js','assets/duo-watercolor-32-actors-v1.webp','assets/duo-stage-clean-21x3-v2.webp'])assert.ok(!fs.existsSync(root+p),'rejected asset must not return: '+p);
assert.ok(bond.includes('this.duoCinematic.originalArt=true')&&!bond.includes('this.duoCinematic.originalArt=false')&&battle.includes('originalArt:true'));
assert.ok(bond.includes('window.CatBondDuoReleaseVFX=')&&bond.includes("duoSignature?.(release.elements,release.tier,'release')"));
console.log('STAR BELL PORTRAIT SOURCE PASS: real WebP cover and garden, original painted cinematic only, no actor fallback');

if(fs.existsSync(root+'js/resonance/portrait-map.mjs'))await import('./check-starbell-portrait-art-integration.mjs');
