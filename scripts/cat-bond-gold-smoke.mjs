// Actual Chromium QA for gold currency HUD, workshop markup, and Canvas.
import assert from 'node:assert/strict';
import {startNewAdventure} from './cat-bond-test-start.mjs';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 for(const spec of [{name:'phone',w:390,h:844,touch:true},{name:'desktop',w:1180,h:760,touch:false}]){
  const context=await browser.newContext({viewport:{width:spec.w,height:spec.h},
    isMobile:spec.touch,hasTouch:spec.touch});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://127.0.0.1:8765/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.CatBondGoldCoin?.ready===true,null,{timeout:15000});
  const src=await page.locator('#hud .cb-gold-coin').getAttribute('src');
  assert.ok(src?.includes('/assets/gold-coin.svg'), 'HUD uses gold asset, not platform gold emoji');
  await startNewAdventure(page);
  await page.evaluate(()=>{
    UI.panel('<h2>金色钱币游戏内验收</h2><p>🪙100 · 🪙20 · 🐠3</p>');
    const probe=document.createElement('canvas');probe.width=44;probe.height=44;
    CatBondGoldCoin.draw(probe.getContext('2d'),22,22,36);
    window.__goldProbe=probe;
  });
  await page.waitForFunction(()=>document.querySelectorAll('#panel .cb-gold-coin').length===2,
    null,{timeout:3000});
  const result=await page.evaluate(()=>{
    const c=window.__goldProbe,px=c.getContext('2d').getImageData(22,22,1,1).data;
    return {hudCoins:document.querySelectorAll('#hud .cb-gold-coin').length,
      panelCoins:document.querySelectorAll('#panel .cb-gold-coin').length,
      leftoverGoldEmoji:document.querySelector('#panel .card')?.textContent?.includes('🪙'),
      rgba:[...px],coinReady:CatBondGoldCoin.ready};
  });
  assert.equal(result.hudCoins,1);
  assert.equal(result.panelCoins,2);
  assert.equal(result.leftoverGoldEmoji,false);
  assert.equal(result.coinReady,true);
  assert.ok(result.rgba[3]>100,'gold coin actually draws on canvas');
  assert.ok(result.rgba[0]>result.rgba[2]+35&&result.rgba[1]>result.rgba[2]+10,
    'currency center must be GOLD: '+JSON.stringify(result.rgba));
  assert.deepEqual(errors,[]);
  await page.screenshot({path:'/tmp/cat-bond-gold-'+spec.name+'.png',fullPage:true});
  console.log('GOLD CURRENCY QA PASS',spec.name,JSON.stringify(result));
  await context.close();
 }
}finally{await browser.close();}
