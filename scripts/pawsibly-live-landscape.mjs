import { webkit } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir,readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
const css=await readFile('public/pawsibly-innocent/single-screen.css');
const html=await readFile('public/pawsibly-innocent/index.html','utf8');
const version=html.match(/single-screen\.css\?v=([^" ]+)/)?.[1];
assert.ok(version,'Expected stylesheet version missing');
const sha=b=>createHash('sha256').update(b).digest('hex');
const origins=process.env.PAWSIBLY_ORIGINS?.split(',')||['https://morrowwish.pages.dev','https://morrowwish.vercel.app'];
await mkdir('test-results',{recursive:true});
const browser=await webkit.launch();
try{
 for(const origin of origins){
  let ready=false;
  for(let i=0;i<60;i++){
   try{
    const htmlResponse=await fetch(origin+'/pawsibly-innocent/?verify='+version+'&attempt='+i,{signal:AbortSignal.timeout(15000),cache:'no-store'});
    const pageHtml=await htmlResponse.text();
    const cssResponse=await fetch(origin+'/pawsibly-innocent/single-screen.css?v='+version,{signal:AbortSignal.timeout(15000),cache:'no-store'});
    const body=Buffer.from(await cssResponse.arrayBuffer());
    if(htmlResponse.ok&&cssResponse.ok&&pageHtml.includes('single-screen.css?v='+version)&&sha(body)===sha(css)){ready=true;break;}
    console.log('Waiting for exact production asset',origin,i,htmlResponse.status,cssResponse.status,sha(body));
   }catch(e){console.log('Asset request retry',origin,i,e.message);}
   if(i<59)await sleep(15000);
  }
  assert.ok(ready,origin+' does not serve the tested CSS '+version+' '+sha(css));
  console.log('EXACT CSS VERIFIED',origin,version,sha(css));
  for(const lang of ['zh','en']){
   const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:3,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'});
   try{
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/**',r=>r.request().method()==='POST'?r.fulfill({status:204,body:''}):r.continue());
    await page.goto(origin+'/pawsibly-innocent/?lang='+lang,{waitUntil:'load',timeout:45000});
    await page.waitForSelector('#mw-game-settings');
    await page.evaluate(l=>window.MorrowwishI18n.set(l),lang);
    const check=async(fullscreen=false)=>{
     const d=await page.evaluate(()=>{
      const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
      const ids=['stageHome','heistStatus','guideHelp','guardStatus','menuButton','mw-fullscreen-toggle','tool','wait','restart','bonusQuick'];
      const controls=[...ids.map(id=>document.getElementById(id)),...document.querySelectorAll('#mw-game-settings button')].filter(e=>e&&e.getClientRects().length).map(e=>{
       const r=rect(e),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
       return {id:e.id||e.className,...r,clickable:!e.matches('button,a')||e.disabled||e.contains(hit)};
      });
      return {stage:rect(document.querySelector('#stage')),hud:rect(document.querySelector('.in-game-top')),board:rect(document.querySelector('#board')),controls,w:innerWidth,h:innerHeight,scroll:document.scrollingElement.scrollHeight};
     });
     const msg=origin+' '+lang+' '+JSON.stringify(d);
     assert.ok(d.stage.left>=-1&&d.stage.right<=d.w+1&&d.stage.top>=-1&&d.stage.bottom<=d.h+1,'stage fit '+msg);
     assert.ok(d.hud.right<=d.board.left+1,'HUD overlaps map '+msg);
     assert.ok(Math.abs(d.board.width/d.board.height-10/7)<.02,'map aspect '+msg);
     assert.ok(d.board.width>=Math.min(d.w-300,(d.h-22)*10/7)-2,'map utilization '+msg);
     if(!fullscreen)assert.ok(d.scroll<=d.h+2,'unexpected scroll '+msg);
     for(const c of d.controls){
      assert.ok(c.width>0&&c.height>0&&c.clickable,'control visibility or hit target '+c.id+' '+msg);
      assert.ok(c.left>=d.hud.left-1&&c.right<=d.hud.right+1&&c.top>=d.hud.top-1&&c.bottom<=d.hud.bottom+1,'control clipping '+c.id+' '+msg);
     }
     for(let i=0;i<d.controls.length;i++)for(let j=i+1;j<d.controls.length;j++){
      const a=d.controls[i],b=d.controls[j];
      assert.ok(Math.min(a.right,b.right)-Math.max(a.left,b.left)<=1||Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)<=1,'overlap '+a.id+' '+b.id+' '+msg);
     }
     console.log('WEBKIT LANDSCAPE PASS',origin,lang,d.w,d.h,fullscreen?'fullscreen':'windowed');
     await page.screenshot({path:'test-results/pawsibly-'+new URL(origin).hostname+'-'+lang+'-'+d.w+'x'+d.h+(fullscreen?'-fullscreen':'')+'.png'});
    };
    for(const viewport of [{width:844,height:390},{width:852,height:320},{width:667,height:300},{width:570,height:280}]){
     await page.setViewportSize(viewport);await page.waitForTimeout(150);await check();
     await page.locator('#menuButton').tap();assert.ok(await page.locator('#gameMenu').isVisible());await page.locator('#menuClose').tap();
    }
    await page.setViewportSize({width:844,height:390});
    const b=await page.locator('#board').boundingBox();
    await page.touchscreen.tap(b.x+b.width*.25,b.y+b.height*.5);
    await page.waitForFunction(()=>window.__PAWSIBLY_TEST__.getState().got===1);
    await page.locator('#stage').evaluate(e=>Object.defineProperty(e,'requestFullscreen',{value:undefined,configurable:true}));
    await page.locator('#mw-fullscreen-toggle').tap();
    await page.waitForFunction(()=>document.documentElement.classList.contains('mw-fs-active'));
    await page.waitForTimeout(150);await check(true);
    await page.locator('#mw-fullscreen-toggle').tap();
    await page.waitForFunction(()=>!document.documentElement.classList.contains('mw-fs-active'));
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>window.__PAWSIBLY_TEST__.getState().got),1);
    assert.deepEqual(errors,[],'Unexpected page errors');
   }finally{await context.close();}
  }
 }
}finally{await browser.close();}
