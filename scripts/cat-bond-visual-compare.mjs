// Normal-player visual comparison, not seeded saves or synthetic DOM.
// Run unchanged against the pinned baseline and the candidate local server.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const origin='http://127.0.0.1:8765',out=process.env.VISUAL_OUT||'artifacts/cat-bond-visual/after';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const rows=[];
try{
 for(const profile of [{name:'desktop',viewport:{width:1280,height:800}},{name:'portrait',viewport:{width:390,height:844},hasTouch:true,isMobile:true},{name:'landscape',viewport:{width:844,height:390},hasTouch:true,isMobile:true}]){
  for(const lang of ['en','zh']){
   const {name,...options}=profile,ctx=await browser.newContext(options),page=await ctx.newPage(),errors=[],shots=[];
   const tr=(en,zh)=>lang==='en'?en:zh;
   const button=(en,zh,scope=page)=>scope.getByRole('button',{name:tr(en,zh),exact:true});
   const scene=id=>page.waitForFunction(v=>window.CatBondResonance?.view()?.current?.id===v,id,{timeout:20000});
   const shot=async id=>{await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:out+'/'+name+'-'+lang+'-'+id+'.png',animations:'disabled'});shots.push(id)};
   const dialogue=async id=>{
    const box=page.locator('.res-host[data-scene="'+id+'"]');await box.waitFor();
    let steps=0;
    while(await box.isVisible()&&await button('Continue','继续',box).isEnabled()){
     assert.ok(++steps<40,'Dialogue did not advance: '+id);
     await button('Continue','继续',box).click();
    }
    if(await box.isVisible()&&await button('Close','关闭',box).isVisible())await button('Close','关闭',box).click();
   };
   const closePanel=async()=>{await page.locator('#panel>.panel-dismiss').click();await page.locator('#panel.open').waitFor({state:'hidden'});};
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',route=>/^(data:|blob:)/.test(route.request().url())||route.request().url().startsWith(origin+'/')?route.continue():route.abort());
   try{
    await page.goto(origin+'/cat-bond/?lang='+lang);
    await page.waitForFunction(()=>window.WorldMap===window.CatBondCanonicalWorld&&window.CatBondResonance&&window.__game&&window.CatBondArtworkStatus?.breedsLoaded&&window.CatBondArtworkStatus?.jiafeiLoaded,null,{timeout:30000});
    assert.equal(await page.evaluate(()=>MorrowwishI18n.get()),lang);
    await page.locator('#intro-start').waitFor();await shot('title');
    await page.locator('#intro-start').click();await page.locator('#intro-slot-list [data-slot="slot1"]').waitFor();await shot('slots');
    await page.locator('#intro-slot-list [data-slot="slot1"]').click();
    for(const id of ['prologue:P-01','prologue:P-02','prologue:P-03']){
     await scene(id);await page.waitForFunction(()=>document.querySelector('.cbcp-art')?.naturalWidth>0&&!document.querySelector('.cbcp-skip')?.disabled);
     await page.locator('.cbcp-art').first().evaluate(img=>img.decode());
     if(id==='prologue:P-01')await shot('opening');
     await page.locator('.cbcp-skip').click();
    }
    await scene('prologue:P-04');const starter=page.locator('#panel .cat-starter-card .dex-cell').first();await starter.waitFor();await shot('starter');
    await starter.click();await button('Talk to Muling','与暮铃交谈',page.locator('.sg-prologue-guide')).click();
    await page.locator('.res-host[data-scene="prologue:P-04"]').waitFor();await shot('muling-dialogue');
    await dialogue('prologue:P-04');
    const bell=page.locator('.res-garden-bell');await bell.waitFor();await shot('garden');
    const rect=await bell.boundingBox(),x=Math.floor(rect.x+rect.width/2),y=Math.floor(rect.y+rect.height/3);
    if(options.hasTouch){
     const cdp=await ctx.newCDPSession(page);
     await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
     await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+62}]});
     await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
    }else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+62,{steps:8});await page.mouse.up();}
    await scene('prologue:P-05');await dialogue('prologue:P-05');
    await button('World map','前往世界地图',page.locator('.sg-prologue-guide')).click();await page.locator('.rw-surface').waitFor();await shot('atlas');
    const nav=page.locator('.rw-system-nav');
    for(const [en,zh,id] of [['Catdex','猫咪图鉴','catdex'],['Party','出战队伍','party'],['Raise cats','猫咪养成','cultivation'],['Workshop','工坊','workshop']]){
     await button(en,zh,nav).click();await page.locator('#panel.open>.card').waitFor();await shot(id);
     if(id==='cultivation'){
      await page.locator('#panel [data-cat-view="duo"]').click();await shot('duo-bond');
     }
     await closePanel();
    }
    assert.deepEqual(errors,[]);rows.push({name,lang,shots,ok:true});
   }catch(error){
    await shot('failure').catch(()=>{});rows.push({name,lang,shots,ok:false,error:String(error),pageErrors:errors});
    console.error(name,lang,error);
   }finally{await ctx.close();}
  }
 }
}finally{await browser.close();await fs.writeFile(out+'/results.json',JSON.stringify(rows,null,2));}
assert.ok(rows.length===6&&rows.every(r=>r.ok),'One or more actual UI routes failed; review screenshots and results.json');
