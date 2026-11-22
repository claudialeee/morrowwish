// Live canvas QA: deep purple baked into the source painting must be
// transformed into pale game-matched colors, without blurring black cats.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1120,height:780},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.CatBondPremiumCinematics?.ready&&window.CatBondPremiumCinematics?.pastelAdjusted,{timeout:30000});
 const results=await page.evaluate(async()=>{
  const base=await new Promise((res,rej)=>{
   const im=new Image();im.onload=()=>res(im);im.onerror=rej;
   im.src='assets/duo-premium-sheet.webp';
  });
  const frames=[
   {key:'dark+dark',frame:4},
   {key:'dark+elec',frame:5},
   {key:'dark+fire',frame:6},
   {key:'dark+grass',frame:7}
  ];
  const assess=ctx=>{
   const {data}=ctx.getImageData(0,0,640,360);
   let purples=0,dark=0,n=0,avg=0;
   for(let y=42;y<320;y+=3)for(let x=40;x<600;x+=3){
     const i=(y*640+x)*4,r=data[i],g=data[i+1],b=data[i+2];
     const lum=r*.299+g*.587+b*.114;
     if(r>g*1.32&&b>g*1.4&&b>r*.95)purples++;
     if(lum<90)dark++;
     avg+=lum;n++;
   }
   return {purpleRatio:purples/n,darkRatio:dark/n,luminance:avg/n};
  };
  return frames.map(({key,frame})=>{
   const old=document.createElement('canvas'),now=document.createElement('canvas');
   old.width=now.width=640;old.height=now.height=360;
   const raw=old.getContext('2d'),out=now.getContext('2d');
   raw.drawImage(base,(frame%2)*base.naturalWidth/2,
      Math.floor(frame/2)*base.naturalHeight/4,
      base.naturalWidth/2,base.naturalHeight/4,0,0,640,360);
   CatBondPremiumCinematics.draw(out,640,360,{
     elements:key,max:2.75,t:1.73,tier:3,name:key,catUids:['a','b']
   },uid=>uid==='a'?{uid:'a',species:'tangyuan'}:{uid:'b',species:'sanhua'});
   const before=assess(raw),after=assess(out);
   document.body.appendChild(now);
   now.id='pastel-'+frame;
   return {key,before,after};
  });
 });
 for(const x of results){
   assert.ok(x.after.purpleRatio<x.before.purpleRatio*.72,
     x.key+' still has a purple backdrop '+JSON.stringify(x));
   assert.ok(x.after.luminance>x.before.luminance+12,
     x.key+' still too dark '+JSON.stringify(x));
 }
 assert.deepEqual(errors,[],'no runtime errors');
 await page.locator('#pastel-4').screenshot({path:'/tmp/cat-bond-pastel-moon.png'});
 await page.locator('#pastel-5').screenshot({path:'/tmp/cat-bond-pastel-storm.png'});
 await page.locator('#pastel-6').screenshot({path:'/tmp/cat-bond-pastel-fire.png'});
 console.log('PASTEL DUO ART PASS '+JSON.stringify(results));
}finally{await browser.close()}
