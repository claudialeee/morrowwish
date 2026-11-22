// Actual Chromium QA for silver currency HUD, workshop markup, and Canvas.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 for(const spec of [{name:'phone',w:390,h:844,touch:true},{name:'desktop',w:1180,h:760,touch:false}]){
  const context=await browser.newContext({viewport:{width:spec.w,height:spec.h},
    isMobile:spec.touch,hasTouch:spec.touch});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://127.0.0.1:8765/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.CatBondSilverCoin?.ready===true,null,{timeout:15000});
  const src=await page.locator('#hud .cb-silver-coin').getAttribute('src');
  assert.ok(src?.includes('/assets/silver-coin.svg'), 'HUD uses silver asset, not platform gold emoji');
  await page.locator('#intro-start').click();
  await page.locator('#panel.open .dex-cell').first().click();
  await page.evaluate(()=>{
    UI.panel('<h2>银色钱币游戏内验收</h2><p>🪙100 · 🪙20 · 🐠3</p>');
    const probe=document.createElement('canvas');probe.width=44;probe.height=44;
    CatBondSilverCoin.draw(probe.getContext('2d'),22,22,36);
    window.__silverProbe=probe;
  });
  await page.waitForFunction(()=>document.querySelectorAll('#panel .cb-silver-coin').length===2,
    null,{timeout:3000});
  const result=await page.evaluate(()=>{
    const c=window.__silverProbe,px=c.getContext('2d').getImageData(22,22,1,1).data;
    return {hudCoins:document.querySelectorAll('#hud .cb-silver-coin').length,
      panelCoins:document.querySelectorAll('#panel .cb-silver-coin').length,
      leftoverGoldEmoji:document.querySelector('#panel .card')?.textContent?.includes('🪙'),
      rgba:[...px],coinReady:CatBondSilverCoin.ready};
  });
  assert.equal(result.hudCoins,1);
  assert.equal(result.panelCoins,2);
  assert.equal(result.leftoverGoldEmoji,false);
  assert.equal(result.coinReady,true);
  assert.ok(result.rgba[3]>100,'silver coin actually draws on canvas');
  assert.ok(Math.abs(result.rgba[0]-result.rgba[2])<65,
    'currency center is cool silver, not gold: '+JSON.stringify(result.rgba));
  assert.deepEqual(errors,[]);
  await page.screenshot({path:'/tmp/cat-bond-silver-'+spec.name+'.png',fullPage:true});
  console.log('SILVER CURRENCY QA PASS',spec.name,JSON.stringify(result));
  await context.close();
 }
}finally{await browser.close();}
