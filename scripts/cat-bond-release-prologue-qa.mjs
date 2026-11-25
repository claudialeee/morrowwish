import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const output='artifacts/cat-bond-release-prologue';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
let failed=false;
for(const profile of [
 {name:'desktop',viewport:{width:1440,height:900},hasTouch:false,full:true},
 {name:'portrait',viewport:{width:390,height:844},hasTouch:true},
 {name:'landscape',viewport:{width:844,height:390},hasTouch:true}
]){
 const {name,full,...options}=profile,context=await browser.newContext(options),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const waitScene=id=>page.waitForFunction(id=>window.CatBondResonance?.view()?.current?.id===id,id,{timeout:150000});
 const screenshot=id=>page.screenshot({path:output+'/'+name+'-'+id+'.png'});
 const ready=()=>page.waitForFunction(()=>document.querySelector('.cbcp-art')?.naturalWidth>0&&document.querySelector('.cbcp-skip')&&!document.querySelector('.cbcp-skip').disabled);
 const guide=page.locator('.sg-prologue-guide');
 try{
  await page.goto('http://127.0.0.1:8765/cat-bond/?lang=en');
  await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
  await page.locator('#intro-start').click();
  await page.locator('#intro-slot-list [data-slot="slot1"]').click();
  await waitScene('prologue:P-01');await ready();
  assert.equal(await page.evaluate(()=>State.S.cats.length),0,'Opening before starter');
  await page.locator('.cbcp-pause').click();
  const checkpoint=await page.evaluate(()=>State.S.openingPresentation.snapshot);
  assert.equal(checkpoint.paused,true);
  await page.locator('.cbcp-language').click();
  assert.equal(await page.evaluate(()=>MorrowwishI18n.get()),'zh');
  await page.locator('.cbcp-language').click();
  assert.equal(await page.evaluate(()=>MorrowwishI18n.get()),'en');
  await screenshot('opening-paused');
  await page.reload();
  await page.waitForFunction(()=>window.__CAT_BOND_READY__);
  await page.locator('#intro-continue').click();
  await page.locator('#intro-slot-list [data-slot="slot1"]').click();
  await waitScene('prologue:P-01');await ready();
  assert.equal(await page.evaluate(()=>State.S.openingPresentation.snapshot.frameIndex),checkpoint.frameIndex);
  assert.equal(await page.locator('.cbcp-pause').textContent(),'Resume');
  await page.locator('.cbcp-pause').click();
  if(full){await page.waitForTimeout(6500);await screenshot('impact');}
  else await page.locator('.cbcp-skip').click();
  await waitScene('prologue:P-02');await ready();
  await screenshot('sacrifice');
  if(full){
   const seen=new Set();
   while(await page.evaluate(()=>CatBondResonance.view().current?.id)==='prologue:P-02'){
    const sub=await page.locator('.cbcp-subtitle').textContent().catch(()=>null);
    if(sub)seen.add(sub);
    if(await page.locator('.cbcp-speaker').textContent().catch(()=>null)==='Bellkeeper')throw Error('Premature identity disclosure');
    await page.waitForTimeout(180);
   }
   assert.equal(seen.size,15,'All canonical sacrifice subtitles observed');
  }else await page.locator('.cbcp-skip').click();
  await waitScene('prologue:P-03');await ready();
  await screenshot('waiting');
  if(!full)await page.locator('.cbcp-skip').click();
  await waitScene('prologue:P-04');
  await page.locator('#panel.open .cat-starter-card .dex-cell').first().click();
  assert.equal(await page.evaluate(()=>State.S.cats.length),1);
  await guide.getByRole('button',{name:'Talk to Muling',exact:true}).click();
  const awakening=page.locator('.res-host[data-scene="prologue:P-04"]');
  for(let i=0;i<10;i++)await awakening.getByRole('button',{name:'Continue',exact:true}).click();
  const bell=page.locator('.res-garden-bell');await bell.waitFor();await screenshot('garden-bell');
  const b=await bell.boundingBox(),x=Math.floor(b.x+b.width/2),y=Math.floor(b.y+b.height/3);
  if(options.hasTouch){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+62}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
  else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+62,{steps:8});await page.mouse.up();}
  await waitScene('prologue:P-05');
  const journey=page.locator('.res-host[data-scene="prologue:P-05"]');
  for(let i=0;i<6;i++)await journey.getByRole('button',{name:'Continue',exact:true}).click();
  await guide.getByRole('button',{name:'World map',exact:true}).click();
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
  console.log('PASS',name,'new slot, cinematic controls and resume, actual garden actions, H-01, persistence');
 }catch(e){failed=true;console.error('FAIL',name,e);await screenshot('FAIL').catch(()=>{});}
 finally{await context.close();}
}
await browser.close();
if(failed)process.exitCode=1;
