import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
const locale=process.env.PROLOGUE_LANG==='zh'?'zh':'en';
const tr=(zh,en)=>locale==='zh'?zh:en;
const exactLines=id=>campaign.scenes.find(s=>s.id===id).lines.map(l=>l.text[locale]);

const output='artifacts/cat-bond-release-prologue/'+locale;
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
let failed=false;
for(const profile of [
 {name:'desktop',viewport:{width:1440,height:900},hasTouch:false,full:true},
 {name:'portrait',viewport:{width:390,height:844},hasTouch:true},
 {name:'landscape',viewport:{width:844,height:390},hasTouch:true}
].filter(p=>!process.env.PROLOGUE_PROFILE||p.name===process.env.PROLOGUE_PROFILE)){
 const {name,full,...options}=profile,context=await browser.newContext(options),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const waitScene=id=>page.waitForFunction(id=>window.CatBondResonance?.view()?.current?.id===id,id,{timeout:150000});
 const screenshot=async id=>{
  if(await page.locator('.cbcp-root:not([hidden])').count()){
   await page.waitForFunction(()=>{const img=[...document.querySelectorAll('.cbcp-root:not([hidden]) .cbcp-art')].at(-1);if(!img||!img.complete||!img.naturalWidth)return false;const s=getComputedStyle(img),r=img.getBoundingClientRect();return Number(s.opacity)>=.95&&r.width>=100&&r.height>=100;});
  }
  if(id==='atlas'||id==='harbor')await page.waitForFunction(()=>!document.body.innerText.includes('Loading environment artwork')&&!document.body.innerText.includes('正在加载场景美术'));
  await page.screenshot({path:output+'/'+name+'-'+id+'.png'});
 };
 const ready=()=>page.waitForFunction(()=>document.querySelector('.cbcp-root:not([hidden])')?.dataset.ready==='true'&&document.querySelector('.cbcp-art')?.naturalWidth>0&&!document.querySelector('.cbcp-skip')?.disabled);
 const guide=page.locator('.sg-prologue-guide');
 try{
  await page.goto('http://127.0.0.1:8765/cat-bond/?lang='+locale);
  await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
  await page.locator('#intro-start').click();
  await page.locator('#intro-slot-list [data-slot="slot1"]').click();
  await waitScene('prologue:P-01');await ready();
  assert.equal(await page.locator('.cbcp-subtitle-wrap').isVisible(),false,'Montage with no subtitle must have no obstruction');
  assert.equal(await page.locator('#cb-opening-cover').count(),1,'Opening cover stays mounted throughout all cinematic transitions');
  assert.deepEqual(await page.evaluate(()=>State.S.cats.map(c=>c.species)),['jinjc'],'Fixed protagonist before the opening');
  await page.locator('.cbcp-pause').click();
  const checkpoint=await page.evaluate(()=>State.S.openingPresentation.snapshot);
  assert.equal(checkpoint.paused,true);
  assert.ok(checkpoint.frameId?.startsWith('prologue:P-01-region-'));
  assert.equal(await page.locator('.cbcp-language').isVisible(),false,'No language control during opening');
  assert.equal(await page.locator('.cbcp-continue').innerText(),tr('下一幕','Next scene'));
  assert.equal(await page.locator('.cbcp-back').innerText(),tr('上一幕','Previous scene'));
  const prevRect=await page.locator('.cbcp-back').boundingBox(),nextRect=await page.locator('.cbcp-continue').boundingBox();
  assert.ok(prevRect.x+prevRect.width<nextRect.x&&Math.abs(prevRect.y-nextRect.y)<12,'Opening navigation in opposite bottom corners');
  assert.equal(await page.evaluate(()=>MorrowwishI18n.get()),locale);
  await screenshot('opening-paused');
  await page.reload();
  await page.waitForFunction(()=>window.__CAT_BOND_READY__);
  await page.locator('#intro-continue').click();
  await page.locator('#intro-slot-list [data-slot="slot1"]').click();
  await waitScene('prologue:P-01');await ready();
  assert.equal(await page.evaluate(()=>State.S.openingPresentation.snapshot.frameIndex),checkpoint.frameIndex);
  await page.waitForFunction(()=>document.querySelector('.cbcp-root:not([hidden])')?.dataset.paused==='true');
  assert.equal(await page.locator('.cbcp-pause').textContent(),tr('继续播放','Resume'));
  assert.equal(await page.evaluate(()=>State.S.openingPresentation.snapshot.frameId),checkpoint.frameId);
  await page.locator('.cbcp-pause').click();
  if(!full){const before=await page.locator('.cbcp-root').getAttribute('data-frame-id');await page.locator('.cbcp-stage').click({position:{x:25,y:120}});await page.waitForFunction(old=>document.querySelector('.cbcp-root')?.dataset.frameId&&document.querySelector('.cbcp-root').dataset.frameId!==old,before);}
  if(full){
   for(const region of campaign.regions){await page.waitForFunction(id=>document.querySelector('.cbcp-root')?.dataset.frameId==='prologue:P-01-region-'+id,region);await screenshot('sanctuary-'+region);}
   await page.waitForFunction(()=>document.querySelector('.cbcp-root')?.dataset.frameId==='prologue:P-01-shot-0');await page.waitForTimeout(6200);await screenshot('impact');
  }
  else await page.locator('.cbcp-skip').click();
  if(full){
   await waitScene('prologue:P-02');await ready();
   await screenshot('sacrifice');
   assert.equal(await page.locator('.cbcp-title').textContent(),tr('最后的回响','The Last Resonance'));
   const seen=new Set();
   while(await page.evaluate(()=>CatBondResonance.view().current?.id)==='prologue:P-02'){
    const sub=await page.locator('.cbcp-subtitle').textContent().catch(()=>null);
    if(sub)seen.add(sub);
    if(['Bellkeeper','无名守铃者'].includes(await page.locator('.cbcp-speaker').textContent().catch(()=>null)))throw Error('Premature identity disclosure');
    await page.waitForTimeout(180);
   }
   assert.deepEqual([...seen],exactLines('prologue:P-02'),'All canonical sacrifice subtitles observed in order');
   await waitScene('prologue:P-03');await ready();
   await screenshot('waiting');
   assert.equal(await page.locator('.cbcp-title').textContent(),tr('最后的回响','The Last Resonance'));
  }
  await waitScene('prologue:P-04');
  assert.deepEqual(await page.evaluate(()=>State.S.resonance.completed.slice(0,3)),['prologue:P-01','prologue:P-02','prologue:P-03'],'One skip completes the verified opening checkpoints');
  assert.equal(await page.locator('#panel.open .cat-starter-card').count(),0,'No starter picker');
  assert.deepEqual(await page.evaluate(()=>State.S.cats.map(c=>c.species)),['jinjc']);
  assert.equal(await page.evaluate(()=>State.S.cats.length),1);
  await guide.getByRole('button',{name:tr('与暮铃交谈','Talk to Muling'),exact:true}).click();
  const awakening=page.locator('.res-host[data-scene="prologue:P-04"]');
  await awakening.waitFor();await screenshot('awakening-dialogue');
  for(const line of exactLines('prologue:P-04')){await awakening.locator('.res-line').waitFor();assert.equal(await awakening.locator('.res-line').textContent(),line);await awakening.locator('.res-line').click();}
  const bell=page.locator('.res-garden-bell');await bell.waitFor();await screenshot('garden-bell');
  const b=await bell.boundingBox(),x=Math.floor(b.x+b.width/2),y=Math.floor(b.y+b.height/3);
  if(options.hasTouch){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+62}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
  else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+62,{steps:8});await page.mouse.up();}
  await waitScene('prologue:P-05');
  const journey=page.locator('.res-host[data-scene="prologue:P-05"]');
  await journey.waitFor();await screenshot('journey-dialogue');
  for(const line of exactLines('prologue:P-05')){await journey.locator('.res-line').waitFor();assert.equal(await journey.locator('.res-line').textContent(),line);await journey.locator('.res-line').click();}
  await guide.getByRole('button',{name:tr('前往世界地图','World map'),exact:true}).click();
  const atlas=page.locator('.rw-surface');await atlas.waitFor();await screenshot('atlas');
  const a=await atlas.boundingBox();if(options.hasTouch)await page.touchscreen.tap(a.x+a.width*.5,a.y+a.height*.18);else await page.mouse.click(a.x+a.width*.5,a.y+a.height*.18);
  await waitScene('harbor:H-01');await screenshot('harbor');
  assert.deepEqual(await page.evaluate(()=>State.S.resonance.completed.slice(0,5)),['prologue:P-01','prologue:P-02','prologue:P-03','prologue:P-04','prologue:P-05']);
  assert.equal(await page.evaluate(()=>State.getSaveSlot('slot2')),null);
  assert.equal(await page.evaluate(()=>State.getSaveSlot('slot3')),null);
  await page.reload();
  await page.waitForFunction(()=>window.__CAT_BOND_READY__);
  await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();
  await waitScene('harbor:H-01');
  assert.equal(await page.evaluate(()=>State.S.cats.length),1);
  assert.deepEqual(errors,[]);
  console.log('PASS',name,locale,'new slot, cinematic controls and resume, actual garden actions, H-01, persistence');
 }catch(e){failed=true;console.error('FAIL',name,e);await screenshot('FAIL').catch(()=>{});}
 finally{await context.close();}
}
await browser.close();
if(failed)process.exitCode=1;
