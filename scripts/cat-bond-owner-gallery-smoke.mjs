import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 const p=await browser.newPage({viewport:{width:1150,height:875},deviceScaleFactor:1});
 const issues=[];p.on('pageerror',e=>issues.push(e.message));
 await p.goto('file:///tmp/cat-bond-premium-21-duos-review.html',{waitUntil:'load'});
 await p.waitForFunction(()=>window.CatBondGalleryQA?.ready===true,{timeout:20000});
 assert.equal(await p.locator('#gallery button.skill').count(),21);
 const first=await p.locator('#name').innerText();
 await p.locator('#next').click();
 assert.equal(await p.locator('#counter').innerText(),'2 / 21');
 await p.locator('#all').click();
 assert.equal(await p.locator('#all').getAttribute('aria-pressed'),'true');
 await p.screenshot({path:'/tmp/catbond-review-gallery-21.png'});
 assert.deepEqual(issues,[],'full offline gallery must be free of runtime errors');
 console.log('OFFLINE OWNER GALLERY PASS 21 illustrated animations, controls',first);
 await p.close();
}finally{await browser.close()}
