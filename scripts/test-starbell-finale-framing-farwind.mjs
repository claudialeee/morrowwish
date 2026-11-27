import assert from 'node:assert/strict';
import {projectFarwindLandscape,unprojectFarwindLandscape} from '../public/cat-bond/js/resonance/portrait-map.mjs';
import {skySurveyPath} from '../public/cat-bond/js/resonance/sky-flight.mjs';
import {chromium} from 'playwright';
import {finaleArt,finaleBattleAsset} from '../public/cat-bond/js/resonance/finale-art.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {mkdir} from 'node:fs/promises';
const painted=[[.308,.915],[.445,.733],[.710,.632],[.944,.450]];
for(let i=0;i<skySurveyPath.length;i++){
 assert.deepEqual(projectFarwindLandscape(skySurveyPath[i]),painted[i]);
 assert.deepEqual(unprojectFarwindLandscape(painted[i]),skySurveyPath[i]);
}
for(let i=1;i<skySurveyPath.length;i++)for(let j=0;j<=10;j++){
 const p=skySurveyPath[i-1].map((x,k)=>x+(skySurveyPath[i][k]-x)*j/10);
 const q=unprojectFarwindLandscape(projectFarwindLandscape(p));
 assert.ok(Math.hypot(...p.map((x,k)=>x-q[k]))<1e-5,'Roundtrip along logical path');
}
const origin=process.env.CAT_BOND_SMOKE_ORIGIN||'http://127.0.0.1:8765';
const expectedFarwind='e406dcd10c8895e4976ebde7cf31b751b65811ffd125a204de338949715e69dd';
const assetRoot=new URL('../public/cat-bond/assets/',import.meta.url);
const paths=[...Object.values(finaleArt).flatMap(x=>Object.values(x)),'resonance-world-v2/sky-farwind-wide.webp','mobile-portrait/sky-farwind.webp'];
const hashes=new Set();
for(const path of paths){
 const bytes=await readFile(new URL(path,assetRoot));
 const sha=createHash('sha256').update(bytes).digest('hex');
 assert.ok(!hashes.has(sha),'Do not duplicate a painting: '+path);
 hashes.add(sha);if(path==='resonance-world-v2/sky-farwind-wide.webp')assert.equal(sha,expectedFarwind,'Use the exact provided original WebP');
}
const browser=await chromium.launch({headless:true});
try{
 await mkdir('artifacts/starbell-framing',{recursive:true});
 for(const [name,options] of [['wide',{viewport:{width:1280,height:800}}],['portrait',{viewport:{width:390,height:844},isMobile:true,hasTouch:true}]].filter(([p])=>!process.env.STARBELL_FOCUS_PROFILE||p===process.env.STARBELL_FOCUS_PROFILE)){
  const ctx=await browser.newContext(options),page=await ctx.newPage();
  await page.goto(origin+'/cat-bond/?developer=1&qa=framing&region=finale&reset=1&lang=en');
  await page.waitForFunction(()=>window.__game?.scene==='map'&&window.WorldMap?.currentRegion==='finale'&&document.querySelector('.rw-surface')?.dataset.camera==='[1,0,0]'&&document.querySelector('[data-art-ready=true]'));
  const canvas=page.locator('.rw-surface');assert.equal(await page.locator('.rw-camera-controls').count(),0);
  const expected=finaleBattleAsset('finale:B-01',name==='portrait');
  await page.waitForFunction(expected=>document.querySelector('.rw-world')?.dataset.artSource?.endsWith('/assets/'+expected),expected);
  const decoded=await page.evaluate(async paths=>Promise.all(paths.map(async path=>{const im=new Image();im.src='assets/'+path;await im.decode();return {path,w:im.naturalWidth,h:im.naturalHeight};})),paths);
  for(const a of decoded){assert.ok(a.w>=400&&a.h>=400,'Full resolution '+a.path);assert.ok(a.path.includes('mobile-portrait/')?a.h>a.w:a.w>a.h,'Native aspect '+a.path);}
  console.log('ORIGINAL ART DECODED',JSON.stringify(decoded));
  await canvas.hover();await page.mouse.wheel(0,-500);await canvas.press('+');
  assert.equal(await canvas.getAttribute('data-camera'),'[1,0,0]');
  const box=await canvas.boundingBox();await page.mouse.move(box.x+box.width*.35,box.y+box.height*.45);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.55,{steps:5});await page.mouse.up();
  assert.equal(await canvas.getAttribute('data-camera'),'[1,0,0]');
  await page.screenshot({path:'artifacts/starbell-framing/finale-'+name+'.png'});
  console.log('Fixed finale overview PASS',name);
  // Isolated developer checkpoint for visual QA, not a flight acceptance claim.
  await page.goto(origin+'/cat-bond/?developer=1&qa=farwind&region=library&reset=1&lang=en');
  await page.waitForFunction(()=>window.WorldMap?.currentRegion==='library'&&window.CatBondResonance?.view().completed.includes('sky:S-05'));
  await page.evaluate(()=>{
    if(!window.__STARBELL_DEVELOPER__)throw Error('Must use developer save');
    State.S.resonanceExploration.interactions['sky:survey-island']=true;
    State.S.resonanceExploration.positions.sky={x:.27,y:.235};
    WorldMap.enterRegion('sky');
  });
  const island=name==='portrait'?'mobile-portrait/sky-farwind.webp':'resonance-world-v2/sky-farwind-wide.webp';
  await page.waitForFunction(island=>document.querySelector('.rw-world[data-region="sky"]')?.dataset.artSource?.endsWith('/assets/'+island)&&document.querySelector('.rw-world[data-region="sky"]')?.dataset.artReady==='true',island);
  await page.screenshot({path:'artifacts/starbell-framing/farwind-'+name+'.png'});
  await ctx.close();console.log('Farwind exact native original displayed PASS',name);
 }
}finally{await browser.close()}
