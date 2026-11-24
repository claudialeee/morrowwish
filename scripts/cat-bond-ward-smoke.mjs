// Live browser QA for paw-grounded ward geometry, drawn over real watercolor
// combat cats (bubble, full protect, reflect). Phone + desktop; kitten + grown.
import assert from 'node:assert/strict';
import {startNewAdventure,continueSavedAdventure} from './cat-bond-test-start.mjs';
import {chromium} from 'playwright';

const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true});
try{
 for(const spec of [
   {name:'phone',width:390,height:844,touch:true},
   {name:'desktop',width:1180,height:760,touch:false}
 ]){
  const page=await browser.newPage({viewport:{width:spec.width,height:spec.height},
    isMobile:spec.touch,hasTouch:spec.touch,deviceScaleFactor:spec.touch?2:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(origin+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.CatBondWardArt?.draw&&window.__game&&window.State?.makeCat);
   await startNewAdventure(page);
   for(const ward of ['shieldT','protectT','reflectT'])for(const stage of [0,2]){
    const result=await page.evaluate(({ward,stage})=>{
      const g=window.__game;
      const cat=State.makeCat('yuelian',{level:12,affinity:60});
      cat.stage=stage;
      State.S.cats=[cat];
      State.S.battlePrefs={...(State.S.battlePrefs||{}),
        manualTutorialSeen:true,tutorialSeen:true,autoBattle:false};
      g.startBattle([cat],GameData.speciesById('doudou'));
      const b=g.battle; b.coach=null;b.autoMode=false;
      const f=b.me();
      f.shieldT=0;f.reflectT=0;f.protectT=0;f[ward]=3;
      const original=window.CatBondWardArt.draw;
      const records=[];
      window.CatBondWardArt.draw=function(ctx,fighter,x,y,t,sourceScale,layer){
        if(fighter!==f)return original.apply(this,arguments);
        const translates=[],realTranslate=ctx.translate;
        ctx.translate=function(px,py){
          translates.push([px,py]);return realTranslate.call(this,px,py);
        };
        try{
          const ok=original.apply(this,arguments);
          const growth=f.cat?(Growth.visual(f.cat)?.scale||1):1;
          const expectedY=y+33*Math.min(1.2,Math.max(.8,sourceScale))*growth;
          records.push({layer,ok,actualY:translates[0]?.[1],expectedY,
            actualX:translates[0]?.[0],expectedX:x,sourceScale,stage});
          return ok;
        }finally{ctx.translate=realTranslate;}
      };
      try{g.draw()}finally{window.CatBondWardArt.draw=original;}
      return {records,role:b.catScale('active'),width:g.W,height:g.H};
    },{ward,stage});
    assert.equal(result.records.length,2,ward+' must have two ward paint passes');
    assert.deepEqual(result.records.map(r=>r.layer),['back','front'],
      ward+' back pass must precede front');
    for(const q of result.records){
      assert.equal(q.ok,true);
      assert.ok(Math.abs(q.actualY-q.expectedY)<.01,
        'WARD MUST COVER PAWS '+spec.name+' '+ward+' stage '+stage+': '+JSON.stringify(q));
      assert.ok(Math.abs(q.actualX-q.expectedX)<.01,
        'WARD MUST TRACK CAT '+spec.name+' '+ward+' stage '+stage+': '+JSON.stringify(q));
    }
    assert.ok(result.width>200&&result.height>300);
    await page.screenshot({path:'/tmp/cat-bond-ward-'+spec.name+'-'+ward+'-stage'+stage+'.png'});
    console.log('PAW-GROUNDED WARD PASS '+spec.name+' '+ward+' stage '+stage+
      ' '+JSON.stringify(result.records.map(({layer,actualY})=>({layer,actualY}))));
   }
   assert.deepEqual(errors,[],'No page errors during ward QA: '+spec.name);
  }finally{await page.close();}
 }
 console.log('CAT BOND 12 REAL BROWSER PAW-GROUNDED WARDS PASS');
}finally{await browser.close();}
