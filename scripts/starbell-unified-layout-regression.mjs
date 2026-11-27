// Targeted browser regression: real title and encounter; isolated developer chapter saves.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const origin=process.env.CAT_BOND_SMOKE_ORIGIN||'http://127.0.0.1:8765';
const out='artifacts/starbell-unified-layout';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const [name,viewport] of [['portrait',{width:390,height:844}],['landscape',{width:844,height:390}]]){
  const context=await browser.newContext({viewport,hasTouch:true});
  await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort()});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);
  const shot=label=>page.screenshot({path:out+'/'+name+'-'+label+'.png'});
  await page.goto(origin+'/cat-bond/?lang=zh&rpgDev=1');
  await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
  await page.locator('#intro-start').waitFor();
  const assertButtons=async()=>{
   const data=await page.evaluate(()=>{const s=document.querySelector('#stage').getBoundingClientRect();return [...document.querySelectorAll('#intro-start,#intro-continue')].map(e=>{const r=e.getBoundingClientRect();return {id:e.id,inside:r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1,w:r.width,h:r.height};})});
   assert.ok(data.every(x=>x.inside&&x.w>=44&&x.h>=44),JSON.stringify(data));
  };
  await assertButtons();await shot('title');
  if(name==='portrait'){for(const size of [{width:320,height:568},{width:430,height:932},viewport]){await page.setViewportSize(size);await assertButtons();}}
  await page.locator('#intro-start').tap();await page.locator('#intro-slot-list [data-slot="slot1"]').tap();
  await page.locator('#cb-player-first-intro').getByRole('button',{name:'开始探索',exact:true}).tap();
  await page.waitForFunction(()=>window.__game?.scene==='yard'&&State.S.cats.length===1);
  await page.locator('[data-npc-talk="muling"]').tap();
  const encounter=page.locator('#cb-traveler-encounter');await encounter.waitFor();
  assert.equal(await encounter.locator('.res-dialogue').getAttribute('data-speaker'),'muling');
  assert.equal(await page.evaluate(()=>CatBondResonanceNPC.drawResident(document.createElement('canvas').getContext('2d'),'muling',{x:50,y:100})),false,'Speaking actor not drawn twice');
  await shot('encounter');await encounter.getByRole('button',{name:'暂时离开',exact:true}).tap();await encounter.waitFor({state:'detached'});
  for(const region of ['harbor','forest','forge','sky','library','starfall']){
   await page.goto(origin+'/cat-bond/?developer=1&qa=developer&reset=1&region='+region+'&lang=zh');
   await page.waitForFunction(r=>window.WorldMap?.mode==='region'&&WorldMap.currentRegion===r&&document.querySelector('.rw-quest-toggle'),region);
   await page.evaluate(()=>document.getElementById('starbell-developer-menu')?.remove());
   const toggle=page.locator('.rw-head .rw-quest-toggle'),rail=page.locator('.rw-fit-rail');
   assert.equal(await toggle.innerText(),'主线任务');assert.equal(await rail.isVisible(),false,region+' starts collapsed');const cue=page.locator(".rw-next-cue");if(await page.locator("button[data-next-scene]").count()){assert.ok(await cue.isVisible(),region+" has a visible next action without opening the quest drawer");}
   await shot(region+'-closed');await toggle.tap();await rail.waitFor();
   assert.equal(await toggle.getAttribute('aria-expanded'),'true');
   assert.equal(await rail.locator('.rw-objective').count(),1);
   assert.ok(await rail.locator('.rw-next').innerText(),region+' objective text');
   const bounds=await rail.evaluate(e=>{const r=e.getBoundingClientRect(),s=document.getElementById('stage').getBoundingClientRect();return r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1;});
   assert.ok(bounds,region+' drawer inside stage');await shot(region+'-open');
   await toggle.tap();await rail.waitFor({state:'hidden'});
  }
  await page.evaluate(()=>WorldMap.enterMap());
  const atlas=page.locator('.rw-atlas-rail'),toggle=page.locator('.rw-head .rw-quest-toggle');await toggle.waitFor();
  assert.equal(await atlas.isVisible(),false,JSON.stringify(await atlas.evaluate(e=>({hidden:e.hidden,display:getComputedStyle(e).display,open:e.querySelector('details')?.open}))));await toggle.tap();await atlas.waitFor();assert.equal(await atlas.locator('.rw-objective').count(),1);await toggle.tap();await atlas.waitFor({state:'hidden'});
  // Isolated CSS presentation fixture, not evidence of campaign progression to H-05.
  await page.evaluate(()=>{const r=document.createElement('div');r.className='cb-story-overlay is-visible res-host';r.dataset.scene='harbor:H-05';r.innerHTML='<section class="res-dialogue"><img class="res-portrait" alt=""><div class="res-body"><h2>你</h2><p>这不是我醒来的花园吗？</p></div></section>';document.getElementById('stage').append(r);});
  const layers=await page.evaluate(()=>{const r=document.querySelector('.res-host[data-scene="harbor:H-05"]');return {map:getComputedStyle(document.querySelector('.rw-world')).visibility,background:getComputedStyle(r).backgroundColor,art:getComputedStyle(r,'::before').backgroundImage,portrait:getComputedStyle(r.querySelector('.res-portrait')).display};});
  assert.equal(layers.map,'hidden');assert.notEqual(layers.background,'rgba(0, 0, 0, 0)');assert.match(layers.art,/harbor-at-twilight/);assert.equal(layers.portrait,'none');await shot('single-story-layer');
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('UNIFIED LAYOUT PASS: title, opening encounter, six regions, atlas and isolated CG layer');
}finally{await browser.close();}
