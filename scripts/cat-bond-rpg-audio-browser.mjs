import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true});
const url='http://127.0.0.1:8765/cat-bond/';
const profiles=[{name:'desktop',viewport:{width:1440,height:900}},{name:'portrait',viewport:{width:390,height:844},hasTouch:true},{name:'landscape',viewport:{width:844,height:390},hasTouch:true}];
const output=[];
const origin=new URL(url).origin;
const isolate=context=>context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort()});
try{
 for(const profile of profiles){
  const {name,...opts}=profile,context=await browser.newContext(opts),page=await context.newPage(),errors=[];
  await isolate(context);
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url+'?lang=en');
  await page.waitForFunction(()=>window.MorrowwishMusic&&window.CatBondOriginalScore&&window.__CAT_BOND_READY__);
  await page.locator('#cb-system-toggle').click();
  const waitTrack=id=>page.waitForFunction(id=>{const s=MorrowwishMusic.status();return s.track===id&&s.playing&&s.currentTime>.05},id,{timeout:90000});
  await waitTrack('title');
  const title=await page.evaluate(()=>MorrowwishMusic.status());
  // Exercise the visible title menu before opening the save picker (which hides the menu).
  const menu=page.locator('#cb-system-menu');
  await menu.locator('[data-system="page-settings"]').click();
  await menu.locator('[data-audio-volume="music"]').fill('37');
  await menu.locator('[data-audio-volume="effects"]').fill('42');
  await page.waitForFunction(()=>MorrowwishMusic.status().volume===.37&&MorrowwishMusic.status().effectsVolume===.42&&MorrowwishAudio.status().volume===.42);
  await menu.locator('[data-system="effects"]').click();
  await page.waitForFunction(()=>MorrowwishAudio.status().enabled===false&&MorrowwishMusic.status().playing===true);
  await menu.locator('[data-system="effects"]').click();
  await page.waitForFunction(()=>MorrowwishAudio.status().enabled===true);
  await menu.locator('[data-system="music"]').click();
  await page.waitForFunction(()=>!MorrowwishMusic.status().playing&&MorrowwishAudio.status().enabled);
  await menu.locator('[data-system="music"]').click();
  await waitTrack('title');
  await menu.locator('[data-system="close"]').click();
  const manifest=await page.evaluate(()=>fetch('assets/quality-audio/premium-manifest.json',{cache:'no-cache'}).then(r=>r.json()));
  assert.equal(title.source,'premium-mp3:'+(manifest.scenes.title==='tomorrow'?'childhood':manifest.scenes.title),'must use a calm title recording, never Tomorrow');
  await page.locator('#intro-start').click();
  await page.locator('#intro-slot-list [data-slot="slot1"]').click();
  await page.locator('#cb-player-first-intro').waitFor({state:'visible'});await waitTrack('opening');assert.equal(await page.evaluate(()=>MorrowwishMusic.status().source),'premium-mp3:'+manifest.scenes.opening);
  await page.locator('#cb-player-first-intro').getByRole('button',{name:'Start exploring',exact:true}).click();
  await page.waitForFunction(()=>window.CatBondResonance?.view()?.current?.id==='prologue:P-05'&&__game.scene==='yard');
  await waitTrack('garden');
  assert.deepEqual(await page.evaluate(()=>State.S.resonance.completed.slice(0,4)),['prologue:P-01','prologue:P-02','prologue:P-03','prologue:P-04']);
  await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="page-settings"]').click();
  await page.locator('#cb-system-menu [data-system="music"]').click();await page.waitForFunction(()=>!MorrowwishMusic.status().playing);
  await page.locator('#cb-system-menu [data-system="music"]').click();await waitTrack('garden');
  await page.locator('#cb-system-menu [data-system="page-back"]').click();await page.locator('#cb-system-menu [data-system="close"]').click();
  await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="page-settings"]').click();
  await page.locator('#cb-system-menu [data-system="music"]').click();await page.locator('#cb-system-menu [data-system="close"]').click();
  await page.waitForFunction(()=>!MorrowwishMusic.status().playing);
  await page.reload();
  await page.waitForFunction(()=>window.MorrowwishMusic&&window.__CAT_BOND_READY__);
  const settings=await page.evaluate(()=>MorrowwishMusic.status());
  assert.equal(settings.enabled,false);assert.equal(settings.volume,.37);assert.equal(settings.effectsVolume,.42);
  await page.locator('#cb-system-toggle').click();
  await page.locator('#cb-system-menu [data-system="page-settings"]').click();
  assert.equal(await page.locator('[data-audio-volume="music"]').inputValue(),'37');
  assert.equal(await page.locator('[data-audio-volume="effects"]').inputValue(),'42');
  await page.locator('#cb-system-menu [data-system="close"]').click();
  assert.deepEqual(errors,[]);output.push({profile:name,title,settings,opening:'player-first context and garden music',musicToggleResume:true,actualMenuControls:true,errors});
  await context.close();
 }
 const page=await browser.newPage();await isolate(page.context());await page.goto(url);await page.waitForFunction(()=>window.CatBondOriginalScore);
 const tracks=await page.evaluate(async()=>{const s=CatBondOriginalScore,rows=[],manifest=await fetch('assets/audio/manifest.json').then(r=>r.json()),decoder=new OfflineAudioContext(2,1,24000);for(const id of s.ids){const t=performance.now(),response=await fetch('assets/audio/'+manifest.tracks[id].file);if(!response.ok)throw Error(id+' MP3 missing');const buf=await decoder.decodeAudioData(await response.arrayBuffer()),a=buf.getChannelData(0);let peak=0,energy=0;for(let i=0;i<a.length;i++){peak=Math.max(peak,Math.abs(a[i]));energy+=a[i]*a[i];}rows.push({id,seconds:buf.duration,bytes:buf.length*buf.numberOfChannels*4,peak,rms:Math.sqrt(energy/a.length),renderMs:performance.now()-t});}return rows;});
 const premium=await page.evaluate(async()=>{
  const manifest=await fetch('assets/quality-audio/premium-manifest.json').then(r=>r.json()),rows=[];
  for(const id of new Set(Object.values(manifest.scenes))){
   const entry=manifest.tracks[id];if(!entry)throw Error('Missing premium track '+id);
   const res=await fetch('assets/quality-audio/'+entry.file);if(!res.ok)throw Error('Missing premium audio '+id);
   const bytes=await res.arrayBuffer(),decoder=new OfflineAudioContext(2,1,24000),buf=await decoder.decodeAudioData(bytes);
   let peak=0,energy=0,samples=0;for(let c=0;c<buf.numberOfChannels;c++){const a=buf.getChannelData(c);for(let i=0;i<a.length;i+=4){peak=Math.max(peak,Math.abs(a[i]));energy+=a[i]*a[i];samples++;}}
   rows.push({id,seconds:buf.duration,peak,rms:Math.sqrt(energy/samples),channels:buf.numberOfChannels});
  }return rows;
 });
 assert.ok(premium.length>0);for(const row of premium)assert.ok(row.seconds>18&&row.peak>.015&&row.peak<=1.05&&row.rms>.001&&row.channels===2,JSON.stringify(row));
 assert.equal(tracks.length,31);for(const row of tracks)assert.ok(row.seconds>=18&&row.peak>.015&&row.peak<=1.05&&row.rms>.001,JSON.stringify(row));
 await fs.mkdir('artifacts/cat-bond-audio',{recursive:true});await fs.writeFile('artifacts/cat-bond-audio/results.json',JSON.stringify({profiles:output,tracks,premium},null,2));console.log('AUDIO REAL BROWSER RESULTS',JSON.stringify({profiles:output,tracks,premium}));
}finally{await browser.close();}
