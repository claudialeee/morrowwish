import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true});
const results=[];
try{
 for(const [w,h] of [[1280,720],[907,510],[640,480],[390,844],[844,390]]){
 const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1});
 const page=await context.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',req=>{if(!req.url().startsWith('http://127.0.0.1:8766')&&!req.url().startsWith('data:'))external.push(req.url())});
 await page.goto('http://127.0.0.1:8766/standalone/index.html',{waitUntil:'load'});
 const board=page.locator('#board');await board.waitFor({state:'visible'});
 await page.locator('#portalLang').click();await page.locator('#portalLang').click();await page.evaluate(()=>window.MorrowwishI18n.set('en'));
 const layout=await page.evaluate(()=>{const a=document.querySelector('#board').getBoundingClientRect();return {width:a.width,height:a.height,x:a.x,y:a.y,viewport:[innerWidth,innerHeight],testHook:!!window.__PAWSIBLY_TEST__,externalLinks:[...document.querySelectorAll('a[href]')].map(x=>x.href)}});
 assert.ok(layout.width>0&&layout.height>0&&layout.x>=-1&&layout.y>=-1&&layout.x+layout.width<=w+1&&layout.y+layout.height<=h+1,JSON.stringify(layout));
 assert.equal(layout.testHook,false);assert.deepEqual(layout.externalLinks,[]);
 await board.click({position:{x:layout.width*.25,y:layout.height*.5}});await page.waitForTimeout(500);
 const fish=await page.locator('#fishCount').textContent();assert.match(fish,/1\s*\/\s*3/);
 await page.evaluate(()=>window.MorrowwishPortalPause(true));
 const before=await page.locator('#moveCount').count()?await page.locator('#moveCount').textContent():await page.locator('#fishCount').textContent();
 await page.keyboard.press('ArrowRight');await page.waitForTimeout(250);
 assert.equal(await (await page.locator('#moveCount').count()?page.locator('#moveCount'):page.locator('#fishCount')).textContent(),before);
 await page.evaluate(()=>window.MorrowwishPortalPause(false));
 await page.screenshot({path:'release-kit/pawsibly/media/standalone-'+w+'x'+h+'.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 results.push({viewport:[w,h],layout,fish,errors,external});await context.close();
 }
 fs.writeFileSync('release-kit/pawsibly/standalone-qa.json',JSON.stringify(results,null,2));
}finally{await browser.close()}
