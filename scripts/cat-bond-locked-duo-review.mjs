// REVIEW ONLY: players must never see unearned duo art, names, or spoilers.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
  for(const profile of [
    {name:'phone',width:390,height:844,mobile:true},
    {name:'desktop',width:1180,height:760,mobile:false}
  ]){
    const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},
      isMobile:profile.mobile,hasTouch:profile.mobile});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:8765/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__game&&window.CatRelations&&window.UI);
    const init=await page.evaluate(()=>{
      document.getElementById('intro-start')?.click();
      UI.closeAll();
      const a=State.makeCat('tangyuan'),b=State.makeCat('xiaohui');
      State.S.cats=[a,b];State.S.duoRelations={pairs:{},active:[]};
      window.CatRelations.choose(a,b);
      UI._duoPicked=[a.uid,b.uid];
      UI.openBondPanel();
      return {name:CatRelations.title(a,b).name,uidA:a.uid,uidB:b.uid};
    });
    assert.equal(await page.locator('#duo-skill-canvas').count(),0,'NO locked animated canvas');
    assert.equal(await page.locator('select#duo-a,select#duo-b').count(),0,
      'Cat duo selection must not use the old dropdowns');
    assert.equal(await page.locator('#duo-direct-chooser .duo-cat-chip').count(),4,
      'Before a duo is earned, show direct cat choices without move spoilers');
    assert.equal(await page.locator('.duo-unlocked-card').count(),0,
      'Unconfirmed or locked pair must never be shown as unlocked');
    assert.equal(await page.locator('#duo-preview').count(),0,'NO locked animation link');
    const lockedText=await page.locator('#panel .duo-skill-identity').innerText();
    assert.match(lockedText,/🔒/);
    assert.ok(!lockedText.includes(init.name),'NO locked skill identity spoiler');
    assert.ok(!lockedText.includes('演出预览'),'NO preview only wording that grants unreleased art');
    const unlocked=await page.evaluate(()=>{
      const [a,b]=State.S.cats;
      const rel=CatRelations.pair(a,b);
      rel.value=20;
      State.save();UI.openBondPanel();
      return rel.value;
    });
    assert.equal(unlocked,20);
    assert.equal(await page.locator('#duo-skill-canvas').count(),1,'earned tier1 cut-in');
    assert.equal(await page.locator('#duo-preview').count(),1,'earned full-screen animation link');
    assert.equal(await page.locator('.duo-unlocked-card').count(),1,
      'Earned pair should appear as a direct visual card');
    assert.match(await page.locator('.duo-unlocked-card').innerText(),new RegExp(init.name));
    assert.equal(await page.locator('select#duo-a,select#duo-b').count(),0,
      'No cat dropdowns even after unlocking');
    assert.match(await page.locator('#panel .duo-skill-identity').innerText(),new RegExp(init.name));
    assert.match(await page.locator('.duo-move-evolution').innerText(),/🔒 \?\?\?/);
    const link=await page.evaluate(()=>{
      const a=State.S.cats[0],b=State.S.cats[1];
      return new URL('duo-preview.html?a='+encodeURIComponent(a.uid)+'&b='+encodeURIComponent(b.uid),location.href).href;
    });
    const allowed=await context.newPage();await allowed.goto(link,{waitUntil:'domcontentloaded'});
    await allowed.waitForFunction(()=>!!window.__duoPreviewReady);
    assert.equal(await allowed.locator('#unlocked').isVisible(),true,'earned saved pair sees preview');
    await allowed.close();
    // Editing query parameters alone must not leak a second unearned pair.
    await page.evaluate(()=>{
      const c=State.makeCat('sanhua');State.S.cats.push(c);State.save();
    });
    const third=await page.evaluate(()=>State.S.cats[2].uid);
    const denied=await context.newPage();
    await denied.goto('http://127.0.0.1:8765/cat-bond/duo-preview.html?a='+encodeURIComponent(init.uidA)+'&b='+encodeURIComponent(third),{waitUntil:'domcontentloaded'});
    assert.equal(await denied.locator('#unlocked').isVisible(),false,'unearned querystring pair remains locked');
    assert.equal(await denied.locator('#locked').isVisible(),true);
    await denied.close();
    // A second earned pair should show up immediately without cat dropdowns.
    const second=await page.evaluate(()=>{
      const cats=State.S.cats;
      const rel=CatRelations.pair(cats[1],cats[2]);
      rel.value=25;
      State.save();
      UI.openBondPanel();
      return CatRelations.title(cats[1],cats[2]).name;
    });
    assert.equal(await page.locator('.duo-unlocked-card').count(),2);
    assert.match(await page.locator('.duo-unlocked-section').innerText(),new RegExp(second));
    await page.locator('.duo-unlocked-card').filter({hasText:second}).click();
    assert.match(await page.locator('#panel .duo-skill-identity').innerText(),new RegExp(second));
    assert.deepEqual(errors,[],'no game page errors');
    console.log('LOCKED DUO SPOILER TEST PASS',profile.name,'no canvas until trust 20, gated direct route');
    await context.close();
  }
}finally{await browser.close()}
