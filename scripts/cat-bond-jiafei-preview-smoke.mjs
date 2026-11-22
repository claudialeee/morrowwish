// Browser-accurate art QA, only for the unapproved Jiafei watercolor candidate.
// Exercise the production CatArt renderer and real battle canvas, not a mock screen.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
try {
 for(const spec of [{name:'phone',width:390,height:844,mobile:true},
                   {name:'desktop',width:1180,height:760,mobile:false}]){
  const context=await browser.newContext({viewport:{width:spec.width,height:spec.height},
    deviceScaleFactor:spec.mobile?2:1,isMobile:spec.mobile,hasTouch:spec.mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/cat-bond/?lang=zh',
    {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.CatBondArtworkStatus?.jiafeiLoaded===true&&
    window.CatBondArtworkStatus?.breedsLoaded===true,
    null,{timeout:15000});
  const check=await page.evaluate(()=>{
    const cat=GameData.speciesById('jiafei');
    const canvas=document.createElement('canvas');
    canvas.width=400;canvas.height=390;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    CatArt.drawCat(ctx,200,208,{species:cat,scale:2.6,pose:'sit',t:0.7});
    const data=ctx.getImageData(0,0,400,390).data;
    let opaque=0,left=400,right=0,top=390,bottom=0;
    for(let y=0;y<390;y++)for(let x=0;x<400;x++){
      if(data[(y*400+x)*4+3]>75){
       opaque++;left=Math.min(left,x);right=Math.max(right,x);
       top=Math.min(top,y);bottom=Math.max(bottom,y);
      }
    }
    // Reference is a normal production watercolor breed with identical scale.
    const refCanvas=document.createElement('canvas');
    refCanvas.width=400;refCanvas.height=390;
    const refCtx=refCanvas.getContext('2d',{willReadFrequently:true});
    CatArt.drawCat(refCtx,200,208,{species:GameData.speciesById('tangyuan'),
      scale:2.6,pose:'sit',t:0.7});
    const refPixels=refCtx.getImageData(0,0,400,390).data;
    let refTop=390,refBottom=-1,refLeft=400,refRight=-1;
    for(let y=0;y<390;y++)for(let x=0;x<400;x++){
      if(refPixels[(y*400+x)*4+3]>75){
        refTop=Math.min(refTop,y);refBottom=Math.max(refBottom,y);
        refLeft=Math.min(refLeft,x);refRight=Math.max(refRight,x);
      }
    }
    const thumb=document.createElement('canvas');
    thumb.width=160;thumb.height=160;
    CatArt.renderCatThumb(thumb,cat);
    const resource=performance.getEntriesByType('resource')
      .find(r=>r.name.includes('/cat-bond/assets/jiafei-watercolor-v2.webp'));
    return {rarity:cat?.rarity,buildType:Skills.buildTypeForBreed({species:'jiafei'}),
      loaded:CatBondArtworkStatus.jiafeiLoaded,resource:!!resource,
      opaque,box:{left,right,top,bottom},
      referenceBox:{left:refLeft,right:refRight,top:refTop,bottom:refBottom},
      drawing:canvas.toDataURL('image/png'),
      portrait:thumb.toDataURL('image/png')};
  });
  assert.equal(check.rarity,'SR');
  assert.equal(check.buildType,'tank');
  assert.equal(check.loaded,true);
  assert.equal(check.resource,true);
  assert.ok(check.opaque>20000,'Jiafei must render an opaque detailed subject');
  assert.ok(check.box.left>1&&check.box.right<399&&check.box.top>1&&check.box.bottom<389,
    'Jiafei must fit within the illustrated portrait and not be clipped: '+
      JSON.stringify(check.box));
  // Compare actual alpha-visible art, not the AVIF box or art dimensions.
  const h=check.box.bottom-check.box.top,refH=check.referenceBox.bottom-check.referenceBox.top;
  const w=check.box.right-check.box.left,refW=check.referenceBox.right-check.referenceBox.left;
  assert.ok(refH>100&&refW>100,'Normal watercolor reference must decode');
  assert.ok(h/refH>=.88&&h/refH<=1.12,
    'Jiafei must be the same perceived height as an ordinary watercolor cat: '+
      JSON.stringify({h,refH}));
  assert.ok(w/refW>=.84&&w/refW<=1.16,
    'Jiafei must keep a similar footprint, not a giant or tiny sprite: '+
      JSON.stringify({w,refW}));
  const save=(path,data)=>fs.writeFileSync(path,Buffer.from(data.split(',')[1],'base64'));
  save('/tmp/jiafei-review-'+spec.name+'-illustration.png',check.drawing);
  save('/tmp/jiafei-review-'+spec.name+'-portrait.png',check.portrait);

  // Walk through the actual start flow; then render Jiafei using the same
  // Battle draw path as players. The generated screenshot is not composited.
  await page.locator('#intro-start').click();
  await page.locator('#panel.open .dex-cell').first().click();
  const inBattle=await page.evaluate(()=>{
    const g=window.__game;
    const newCat=State.makeCat('jiafei',{affinity:80});
    newCat.level=10;
    State.S.cats.push(newCat);
    State.S.battlePrefs={...(State.S.battlePrefs||{}),
      manualTutorialSeen:true,tutorialSeen:true,autoBattle:false};
    g.startBattle([newCat],GameData.speciesById('doudou'));
    g.draw();
    return {exists:!!g.battle,cat:g.battle?.me()?.cat?.species};
  });
  assert.equal(inBattle.exists,true,'real battle launched');
  assert.equal(inBattle.cat,'jiafei','real battle uses SR Jiafei');
  await page.screenshot({path:'/tmp/jiafei-review-'+spec.name+'-battle.png'});
  assert.deepEqual(errors,[],'no JS page errors');
  console.log('JIAFEI REAL ART PREVIEW PASS',spec.name,
    JSON.stringify({...check,drawing:'<screenshot>',portrait:'<screenshot>',inBattle}));
  await context.close();
 }
}finally{await browser.close();}
