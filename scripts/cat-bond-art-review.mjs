import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 const p=await browser.newPage({viewport:{width:1500,height:1080},deviceScaleFactor:1});
 const base=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
 await p.goto(base+'/cat-bond/assets/duo-premium-sheet.webp',{waitUntil:'load'});
 await p.screenshot({path:'/tmp/catbond-review-premium-sheet.png',fullPage:true});
 await p.goto(base+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.CatBondDuoHero?.assetReady&&window.CatBondDuoDirector?.keys?.length===21);
 const ret=await p.evaluate(()=>{
  const cv=document.createElement('canvas');cv.width=1120;cv.height=630;
  cv.style.cssText='display:block;width:1120px;height:630px;background:#eee';
  document.body.innerHTML='';document.body.style.margin='0';document.body.appendChild(cv);
  const actors=[{uid:'a',species:'tangyuan',nickname:'白猫'},{uid:'b',species:'sanhua',nickname:'三花'}];
  const pairs=['fire+light','grass+light','dark+elec','water+water'];
  const output=[];
  for(let i=0;i<pairs.length;i++){
   const c=document.createElement('canvas');c.width=1120;c.height=630;c.style='width:1120px;height:630px';
   const ctx=c.getContext('2d');
   CatBondDuoHero.draw(ctx,1120,630,{max:2.75,t:1.9,elements:pairs[i],name:pairs[i],tier:3,
      catUids:['a','b']},uid=>actors.find(x=>x.uid===uid));
   c.id='duo-sample-'+i;document.body.appendChild(c);
   output.push(c.id);
  }
  cv.remove();
  return {count:output.length,assets:CatBondDuoHero.assetSource};
 });
 assert.equal(ret.count,4);
 for(let i=0;i<4;i++)await p.locator('#duo-sample-'+i).screenshot({path:'/tmp/catbond-review-duo-'+i+'.png'});
 console.log('REVIEW ART SNAPSHOT '+JSON.stringify(ret));
 await p.close();
}finally{await browser.close()}
