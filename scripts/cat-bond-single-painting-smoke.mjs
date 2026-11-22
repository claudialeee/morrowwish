// Verify the user's key cinematic requirement: ONE complete painted duo
// scene per spell, never clipped left and right character paintings.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:780}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
 // Both the original full-painting scene and optional breed-accurate actor
 // atlas must be ready before comparing actual drawing calls.
 await page.waitForFunction(()=>!!window.CatBondPremiumCinematics?.ready&&
   window.CatBondDuoDirector?.keys?.length===21&&window.CatBondDuoBreedActors?.ready,
   {timeout:20000});
 const records=await page.evaluate(()=>{
  const pair=[{uid:'a',species:'tangyuan'},{uid:'b',species:'sanhua'}];
  const orig=CanvasRenderingContext2D.prototype.drawImage;
  const cv=document.createElement('canvas');cv.width=640;cv.height=360;
  let calls=[];
  try{
   CanvasRenderingContext2D.prototype.drawImage=function(...args){
     calls.push({argc:args.length,sourceWidth:args[0]?.naturalWidth||args[0]?.width,
       sourceHeight:args[0]?.naturalHeight||args[0]?.height,
       srcW:args.length===9?args[3]:null,srcH:args.length===9?args[4]:null,
       x:args.length===9?args[5]:args[1],y:args.length===9?args[6]:args[2],
       w:args.length===9?args[7]:args[3],h:args.length===9?args[8]:args[4]});
     return orig.apply(this,args);
   };
   return CatBondDuoDirector.keys.map(key=>{
     const ctx=cv.getContext('2d');
     // Actual game default: one WHOLE original 63-frame painting with cats
     // already illustrated. Never add duplicate live cat sprites over it.
     calls=[];ctx.clearRect(0,0,640,360);
     CatBondPremiumCinematics.draw(ctx,640,360,{
       elements:key,max:2.75,t:1.85,tier:3,catUids:['a','b'],name:key
     },uid=>pair.find(c=>c.uid===uid));
     const original=[...calls];
     // Optional breed-specific alternate: a cat-free painted landscape, plus
     // TWO correctly selected complete watercolor cats from the 32-breed atlas.
     calls=[];ctx.clearRect(0,0,640,360);
     CatBondPremiumCinematics.draw(ctx,640,360,{
       elements:key,max:2.75,t:1.85,tier:3,catUids:['a','b'],
       name:key,originalArt:false
     },uid=>pair.find(c=>c.uid===uid));
     return {key,original,alternate:[...calls]};
   });
  }finally{CanvasRenderingContext2D.prototype.drawImage=orig}
 });
 assert.equal(records.length,21);
 for(const item of records){
  const orig=item.original.filter(call=>call.argc===9);
  const origAtlas=orig.filter(call=>call.sourceWidth===3584&&call.sourceHeight===2592);
  const origActors=orig.filter(call=>call.sourceWidth===1774&&call.sourceHeight===887);
  const origComposite=item.original.filter(call=>call.argc===5);
  assert.equal(origAtlas.length,1,item.key+' must display ONE complete original artwork');
  assert.equal(origActors.length,0,item.key+' must NOT paste duplicate actor sprites over painted cats');
  assert.equal(origComposite.length,1,item.key+' blends one complete painting into live battle');
  assert.ok(origComposite[0].w>400,item.key+' original painting spans the scene');

  const alternate=item.alternate.filter(call=>call.argc===9);
  const cleanScene=alternate.filter(call=>call.sourceWidth===512&&call.sourceHeight===288);
  const actors=alternate.filter(call=>call.sourceWidth===1774&&call.sourceHeight===887);
  const altComposite=item.alternate.filter(call=>call.argc===5);
  assert.equal(cleanScene.length,1,item.key+' alternate needs one CAT-FREE scene');
  assert.equal(actors.length,2,item.key+' alternate draws both WHOLE selected watercolor cats');
  assert.ok(actors.every(call=>call.srcW>215&&call.srcH>215&&call.h>175),
    item.key+' must retain both ears, tails and paws');
  assert.equal(altComposite.length,1,item.key+' alternate is composited only once');
 }
 assert.deepEqual(errors,[]);
 console.log('DUO ART PASS: 21 original complete paintings without duplicates AND 21 breed-matched alternatives with two whole cats');
}finally{await browser.close()}
