import assert from 'node:assert/strict';
import {projectFarwindLandscape,unprojectFarwindLandscape} from '../public/cat-bond/js/resonance/portrait-map.mjs';
import {skySurveyPath} from '../public/cat-bond/js/resonance/sky-flight.mjs';
import {chromium} from 'playwright';
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
const browser=await chromium.launch({headless:true});
try{
 await mkdir('artifacts/starbell-framing',{recursive:true});
 for(const [name,options] of [['wide',{viewport:{width:1280,height:800}}],['portrait',{viewport:{width:390,height:844},isMobile:true,hasTouch:true}]]){
  const ctx=await browser.newContext(options),page=await ctx.newPage();
  await page.goto('http://127.0.0.1:8765/cat-bond/?developer=1&qa=framing&region=finale&reset=1&lang=en');
  await page.waitForFunction(()=>window.__game?.scene==='map'&&window.WorldMap?.currentRegion==='finale'&&document.querySelector('.rw-surface')?.dataset.camera==='[1,0,0]'&&document.querySelector('[data-art-ready=true]'));
  const canvas=page.locator('.rw-surface');assert.equal(await page.locator('.rw-camera-controls').count(),0);
  await canvas.hover();await page.mouse.wheel(0,-500);await canvas.press('+');
  assert.equal(await canvas.getAttribute('data-camera'),'[1,0,0]');
  const box=await canvas.boundingBox();await page.mouse.move(box.x+box.width*.35,box.y+box.height*.45);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.55,{steps:5});await page.mouse.up();
  assert.equal(await canvas.getAttribute('data-camera'),'[1,0,0]');
  await page.screenshot({path:'artifacts/starbell-framing/finale-'+name+'.png'});
  await ctx.close();console.log('Fixed finale overview PASS',name);
 }
}finally{await browser.close()}
