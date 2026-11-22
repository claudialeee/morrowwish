// Verify the user's key cinematic requirement: ONE complete painted duo
// scene per spell, never clipped left and right character paintings.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:780}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.CatBondPremiumCinematics?.ready&&window.CatBondDuoDirector?.keys?.length===21,{timeout:20000});
 const records=await page.evaluate(()=>{
  const pair=[{uid:'a',species:'tangyuan'},{uid:'b',species:'sanhua'}];
  const orig=CanvasRenderingContext2D.prototype.drawImage;
  const cv=document.createElement('canvas');cv.width=640;cv.height=360;
  let calls=[];
  try{
   CanvasRenderingContext2D.prototype.drawImage=function(...args){
     calls.push({argc:args.length,srcW:args[3],srcH:args[4],x:args[5],y:args[6],w:args[7],h:args[8]});
     return orig.apply(this,args);
   };
   return CatBondDuoDirector.keys.map(key=>{
     calls=[];
     const ctx=cv.getContext('2d');ctx.clearRect(0,0,640,360);
     CatBondPremiumCinematics.draw(ctx,640,360,{
       elements:key,max:2.75,t:1.85,tier:3,catUids:['a','b'],name:key
     },uid=>pair.find(c=>c.uid===uid));
     return {key,calls:[...calls]};
   });
  }finally{CanvasRenderingContext2D.prototype.drawImage=orig}
 });
 assert.equal(records.length,21);
 for(const item of records){
  assert.equal(item.calls.length,1,item.key+' must draw one full painting, not multiple cuts');
  assert.ok(item.calls[0].w>400,item.key+' should render a full-sized coherent painting');
 }
 assert.deepEqual(errors,[]);
 console.log('ONE CONTINUOUS PAINTING PER DUO PASS; verified all 21 element combinations');
}finally{await browser.close()}
