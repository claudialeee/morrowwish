import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true});
const url='http://127.0.0.1:8765/cat-bond/';
const profiles=[{name:'desktop',viewport:{width:1440,height:900}},{name:'portrait',viewport:{width:390,height:844},hasTouch:true},{name:'landscape',viewport:{width:844,height:390},hasTouch:true}];
const output=[];
try{
 for(const profile of profiles){
  const {name,...opts}=profile,context=await browser.newContext(opts),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url+'?lang=en');
  await page.waitForFunction(()=>window.MorrowwishMusic&&window.CatBondOriginalScore&&window.__CAT_BOND_READY__);
  await page.locator('#intro-start').click();
  const waitTrack=id=>page.waitForFunction(id=>{const s=MorrowwishMusic.status();return s.track===id&&s.playing&&s.currentTime>.05},id,{timeout:90000});
  await waitTrack('title');
  const title=await page.evaluate(()=>MorrowwishMusic.status());
  assert.equal(title.source,'recorded-mp3:title','must use actual compressed original recording');
  await page.locator('#intro-slot-list [data-slot="slot1"]').click();
  await page.waitForFunction(()=>document.querySelector('.cbcp-root:not([hidden])')?.dataset.ready==='true');
  await waitTrack('opening');
  assert.equal(await page.evaluate(()=>MorrowwishMusic.status().source),'recorded-mp3:opening');
  await page.locator('.cbcp-pause').click();
  await page.waitForFunction(()=>MorrowwishMusic.status().audioState==='suspended');
  await page.locator('.cbcp-pause').click();
  await waitTrack('opening');
  await page.evaluate(()=>{MorrowwishMusic.setVolume(.37);MorrowwishMusic.setEffectsVolume(.42);MorrowwishMusic.setEnabled(false);});
  await page.waitForFunction(()=>!MorrowwishMusic.status().playing);
  await page.reload();
  await page.waitForFunction(()=>window.MorrowwishMusic&&window.__CAT_BOND_READY__);
  const settings=await page.evaluate(()=>MorrowwishMusic.status());
  assert.equal(settings.enabled,false);assert.equal(settings.volume,.37);assert.equal(settings.effectsVolume,.42);
  assert.deepEqual(errors,[]);output.push({profile:name,title,settings,opening:true,pauseResume:true,errors});
  await context.close();
 }
 const page=await browser.newPage();await page.goto(url);await page.waitForFunction(()=>window.CatBondOriginalScore);
 const tracks=await page.evaluate(async()=>{const s=CatBondOriginalScore,rows=[];for(const id of s.ids){const t=performance.now(),buf=await s.render(id),a=buf.getChannelData(0);let peak=0,energy=0;for(let i=0;i<a.length;i++){peak=Math.max(peak,Math.abs(a[i]));energy+=a[i]*a[i];}rows.push({id,seconds:buf.duration,bytes:buf.length*buf.numberOfChannels*4,peak,rms:Math.sqrt(energy/a.length),renderMs:performance.now()-t});}return rows;});
 assert.equal(tracks.length,31);for(const row of tracks)assert.ok(row.seconds>=18&&row.peak>.015&&row.peak<=.83&&row.rms>.001,JSON.stringify(row));
 await fs.mkdir('artifacts/cat-bond-audio',{recursive:true});await fs.writeFile('artifacts/cat-bond-audio/results.json',JSON.stringify({profiles:output,tracks},null,2));console.log('AUDIO REAL BROWSER RESULTS',JSON.stringify({profiles:output,tracks}));
}finally{await browser.close();}
