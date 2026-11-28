import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import {developerCheckpoint} from '../public/cat-bond/js/resonance/developer-preview.mjs';
const origin=process.env.CAT_BOND_SMOKE_ORIGIN||'http://127.0.0.1:8765';
const portrait=process.env.STARBELL_FOCUS_PROFILE==='portrait';
const profiles=portrait?[{name:'portrait',viewport:{width:390,height:844},isMobile:true,hasTouch:true}]:[{name:'wide',viewport:{width:1280,height:800}},{name:'landscape-touch',viewport:{width:844,height:390},isMobile:true,hasTouch:true}];
const cases=[['harbor','harbor:H-01'],['forest','forest:R-01'],['forge','forge:E-01'],['sky','sky:S-01'],['library','library:M-01'],['starfall','starfall:F-03']];
const browser=await chromium.launch({headless:true});
const out='artifacts/starbell-dialogue-camera';await fs.mkdir(out,{recursive:true});let failed=false;
try{for(const {name,...device} of profiles)for(const [region,scene] of cases){
 const ctx=await browser.newContext(device),page=await ctx.newPage();page.setDefaultTimeout(25000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.goto(origin+'/cat-bond/?developer=1&qa=dialogue-camera&region='+region+'&reset=1&lang='+ (portrait?'zh':'en'));
 await page.locator('#starbell-developer-menu').waitFor();
 // F-01 intentionally requires two NPCs and the star-path puzzle before any
 // dialogue. Use the isolated F-03 checkpoint to test a genuine NPC encounter
 // on the zoomed Starfall exploration map, not a minigame canvas.
 if(region==='starfall')await page.evaluate(story=>{
  CatBondResonance.close();UI.closeAll();State.S.resonance=story;
  State.S.resonanceExploration={location:'starfall',positions:{},interactions:{},pickups:{},cargo:null};
  if(!State.save().ok)throw Error('Starfall fixture save failed');
  if(!WorldMap.enterRegion('starfall'))throw Error('Starfall fixture region failed');
 },developerCheckpoint(scene).story);
 if(process.env.SOURCE_SHA)assert.equal(await page.locator('body').getAttribute('data-source-sha'),process.env.SOURCE_SHA);
 await page.waitForFunction(({region,scene})=>WorldMap.currentRegion===region&&WorldMap.mode==='region'&&CatBondResonance.view().current?.id===scene&&document.querySelector('.rw-world')?.dataset.artReady==='true'&&JSON.parse(document.querySelector('.rw-surface')?.dataset.camera||'[0]')[0]>1,{region,scene});
 // Deliberately zoom beyond the default, proving the real camera, not a static plate.
 const surface=page.locator('.rw-world:not([hidden]) .rw-surface');
 await surface.focus();await page.keyboard.press('+');
 await page.waitForFunction(()=>JSON.parse(document.querySelector('.rw-surface').dataset.camera)[0]>1);
 await page.screenshot({path:out+'/'+name+'-'+region+'-before.png'});
 await page.evaluate(scene=>{
  window.__dialogueCameraProof=null;
  const observer=new MutationObserver(()=>{
   const d=document.querySelector('.res-host[data-scene="'+scene+'"]');if(!d)return;
   const c=document.querySelector('.rw-world:not([hidden]) .rw-surface');if(!c)return;
   const r=c.getBoundingClientRect();window.__dialogueCameraProof={camera:c.dataset.camera,rect:[r.x,r.y,r.width,r.height],canvas:c,hash:c.toDataURL()};
   observer.disconnect();
  });observer.observe(document.getElementById('stage'),{childList:true,subtree:true});
 },scene);
 const next=page.locator('[data-next-scene="'+scene+'"]:visible').first();
 if(device.hasTouch)await next.tap();else await next.click();
 const dialog=page.locator('.res-host[data-scene="'+scene+'"]');await dialog.waitFor();
 await page.waitForFunction(()=>!!window.__dialogueCameraProof);
 const verify=()=>page.evaluate(()=>{
  const d=document.querySelector('.res-host.is-visible'),c=document.querySelector('.rw-world:not([hidden]) .rw-surface'),p=window.__dialogueCameraProof;
  const style=getComputedStyle(d),before=getComputedStyle(d,'::before'),after=getComputedStyle(d,'::after'),r=c.getBoundingClientRect();
  return {camera:c.dataset.camera,openingCamera:p.camera,sameCanvas:c===p.canvas,samePixels:c.toDataURL()===p.hash,rect:[r.x,r.y,r.width,r.height],openingRect:p.rect,visible:!!c.getClientRects().length&&getComputedStyle(c).visibility!=='hidden',background:style.backgroundColor,before:{content:before.content,image:before.backgroundImage,display:before.display},after:{content:after.content,image:after.backgroundImage,display:after.display}};
 });
 const check=x=>{assert.ok(JSON.parse(x.camera)[0]>1,'Dialogue must remain zoomed');assert.equal(x.camera,x.openingCamera);assert.ok(x.sameCanvas&&x.samePixels&&x.visible,'Actual exploration canvas is retained');assert.deepEqual(x.rect,x.openingRect);assert.equal(x.background,'rgba(0, 0, 0, 0)');for(const p of [x.before,x.after]){assert.equal(p.image,'none');assert.ok(p.content==='none'||p.display==='none','No full-map pseudo-element');}};
 check(await verify());
 // Advance one real line by tapping the dialogue text, not a synthetic overlay.
 const line=dialog.locator('.res-line');if(device.hasTouch)await line.tap();else await line.click();
 if(await dialog.isVisible())check(await verify());
 await page.screenshot({path:out+'/'+name+'-'+region+'-during.png'});
 const zoom=await page.evaluate(()=>JSON.parse(window.__dialogueCameraProof.camera)[0]);
 await page.evaluate(()=>CatBondResonance.close());
 await dialog.waitFor({state:'detached'});
 await page.waitForFunction(zoom=>Math.abs(JSON.parse(document.querySelector('.rw-surface')?.dataset.camera||'[0]')[0]-zoom)<.0001,zoom);
 await page.screenshot({path:out+'/'+name+'-'+region+'-after.png'});
 assert.deepEqual(errors,[]);console.log('REGIONAL DIALOGUE CAMERA PASS',name,region,scene);
 }catch(e){failed=true;console.error('REGIONAL DIALOGUE CAMERA FAIL',name,region,e);await page.screenshot({path:out+'/'+name+'-'+region+'-FAIL.png'}).catch(()=>{});}
 finally{await ctx.close();}
}}finally{await browser.close();}
if(failed)process.exitCode=1;
