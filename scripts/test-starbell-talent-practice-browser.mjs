import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const origin=process.env.CAT_BOND_SMOKE_ORIGIN||'http://127.0.0.1:8765';
const portrait=process.env.STARBELL_FOCUS_PROFILE==='portrait',lang=portrait?'zh':'en';
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext(portrait?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:800}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(12000);
 await page.goto(origin+'/cat-bond/?developer=1&qa=talent-practice&region=garden&reset=1&lang='+lang);
 await page.waitForFunction(()=>window.CatBondTalentPractice&&window.State?.S&&window.__game?.scene==='yard');
 await page.evaluate(()=>{if(!window.__STARBELL_DEVELOPER__)throw Error('Expected isolated save');for(const id of ['qilan','yahe','xiaomao'])if(!State.S.cats.some(c=>c.storyActor===id)){const cat=State.makeCat('story_'+id,{affinity:35});cat.storyActor=id;State.S.cats.push(cat);}CatBondResonance.close();UI.closeAll();});
 const before=await page.evaluate(()=>JSON.stringify(State.S));
 const press=loc=>portrait?loc.tap():loc.click();
 for(const [id,effect,n] of [['qilan','charge',100],['yahe','heal',75],['xiaomao','ward',100]]){
  assert.equal(await page.evaluate(id=>CatBondTalentPractice.open(id),id),true);
  const root=page.locator('[data-adventure="trial-'+id+'"]'),arena=root.locator('.cb-talent-arena');
  await arena.waitFor();
  await page.waitForFunction(()=>[...document.querySelectorAll('.cb-talent-unit img')].every(img=>img.complete&&img.naturalWidth>0));
  await press(root.locator('[data-play-action="deploy"]'));
  await page.waitForFunction(effect=>document.querySelector('.cb-talent-arena')?.dataset.talentEffect===effect,effect);
  assert.ok(await root.locator('.cb-talent-float').isVisible());
  assert.equal(await root.locator('progress').first().evaluate(p=>p.value),n);
  if(id==='xiaomao'){assert.equal(await root.locator('.cb-talent-shield').count(),2);await press(root.locator('[data-play-action="impact"]'));assert.equal(await arena.getAttribute('data-talent-effect'),'impact');assert.equal(await root.locator('progress').first().evaluate(p=>p.value),78);}
  assert.equal(await root.locator('[data-play-action="cast"]').count(),0,'No fake ultimate button');
  await press(root.locator('[data-play-action="repeat"]'));assert.equal(await arena.getAttribute('data-talent-effect'),'ready');assert.equal(await root.locator('progress').first().evaluate(p=>p.value),id==='qilan'?88:id==='yahe'?55:100);
  await press(root.locator('.cb-adventure-close'));await root.waitFor({state:'detached'});assert.equal(await page.evaluate(()=>JSON.stringify(State.S)),before,'Practice must not mutate the save');
  console.log('TALENT PRACTICE PASS',lang,id,effect);
 }
 assert.deepEqual(errors,[]);await context.close();
}finally{await browser.close();}
