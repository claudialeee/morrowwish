// Isolated real-browser renderer acceptance. Samples are not a full-pack or gameplay pass.
import assert from 'node:assert/strict';
import {readdir,readFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve('public/cat-bond'),out='artifacts/starbell-duo-portrait';
const files=(await readdir(root+'/assets/mobile-portrait/duo')).filter(f=>f.endsWith('.webp')).sort();
assert.ok(files.length>0&&files.length<=63,'sample pack count');
await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{
 try{
  if(req.url==='/fixture'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><canvas id="c"></canvas>');return;}
  const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!path.startsWith(root+sep))throw Error('outside root');
  const b=await readFile(path);res.setHeader('Content-Type',extname(path)==='.webp'?'image/webp':extname(path)==='.js'?'text/javascript':'application/octet-stream');res.end(b);
 }catch{res.statusCode=404;res.end('not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/fixture');
 await page.evaluate(()=>{window.CatBondDuoAssetBase='/assets/';document.body.style.margin='0';document.querySelector('canvas').style.display='block';});
 await page.addScriptTag({url:origin+'/js/duo-premium.js'});
 await page.waitForFunction(()=>window.CatBondPremiumCinematics?.ready===true);
 const cases=files.map(f=>{const m=f.match(/^([a-z]+)-([a-z]+)-tier-([123])\.webp$/);assert.ok(m,f);return {key:m[1]+'+'+m[2],tier:Number(m[3]),file:f};});
 for(const sample of cases){
  await page.evaluate(({key,tier})=>{window.CatBondPremiumCinematics.preparePortrait(key,tier);},sample);
  await page.waitForFunction(({key,tier})=>window.CatBondPremiumCinematics.portraitReady(key,tier),sample,{timeout:10000});
  for(const [w,h] of [[320,568],[390,844],[430,932]]){
   await page.setViewportSize({width:w,height:h});
   const v=await page.evaluate(({key,tier,w,h})=>{
    const c=document.querySelector('canvas');c.width=w*2;c.height=h*2;c.style.width=w+'px';c.style.height=h+'px';const g=c.getContext('2d');g.setTransform(2,0,0,2,0,0);
    const api=window.CatBondPremiumCinematics,seq={elements:key,tier,t:1.6,max:3.2,name:'Duo Special',hideCaptions:true};
    const result=api.draw(g,w,h,seq),l=api.lastLayout;
    const corners=[[0,0],[c.width-1,0],[0,c.height-1],[c.width-1,c.height-1],[c.width>>1,c.height>>1]].map(([x,y])=>g.getImageData(x,y,1,1).data[3]);
    return {result,l,corners,loaded:api.preparePortrait(key,tier).im.naturalWidth};
   },{...sample,w,h});
   assert.ok(v.result&&v.loaded>=720);assert.equal(new URL(v.l.asset,origin).pathname,'/assets/mobile-portrait/duo/'+sample.file);assert.equal(v.l.extendedPainting,false);assert.equal(v.l.actorLayerCount,0);assert.equal(v.l.paintingDrawCount,1);assert.deepEqual(v.l.art,{x:0,y:0,width:w,height:h});assert.ok(v.corners.every(a=>a>=250),'all viewport corners painted at peak '+JSON.stringify(v));
   // Explicitly capture the native painting rather than a screenshot of the test log.
   if(cases.length<=6||w===390)await page.screenshot({path:out+'/'+sample.file.replace('.webp','')+'-'+w+'.png'});
   // At the start/end of a live cut-in no art should cover the battle canvas.
   const faded=await page.evaluate(({key,tier,w,h})=>{const c=document.querySelector('canvas'),g=c.getContext('2d');g.clearRect(0,0,w,h);window.CatBondPremiumCinematics.draw(g,w,h,{elements:key,tier,t:3.2,max:3.2});return g.getImageData(0,0,1,1).data[3];},{...sample,w,h});assert.equal(faded,0);
  }
 }
 const missingPair=await page.evaluate(files=>window.CatBondPremiumCinematics.keys.flatMap(key=>[1,2,3].map(tier=>({key,tier,file:key.replace('+','-')+'-tier-'+tier+'.webp'}))).find(x=>!files.includes(x.file))||null,files);
 if(missingPair){
  await page.evaluate(({key,tier})=>{window.CatBondPremiumCinematics.preparePortrait(key,tier);},missingPair);
  await page.waitForFunction(({key,tier})=>window.CatBondPremiumCinematics.preparePortrait(key,tier).status==='error',missingPair);
  const missing=await page.evaluate(({key,tier})=>{const api=window.CatBondPremiumCinematics,c=document.querySelector('canvas'),g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);api.draw(g,390,844,{elements:key,tier,t:1.6,max:3.2});return {alpha:g.getImageData(0,0,1,1).data[3],ready:api.portraitReady(key,tier)};},missingPair);
  assert.deepEqual(missing,{alpha:0,ready:false},'missing paintings must never use a fallback');
 }
 await page.setViewportSize({width:844,height:390});
 const wide=await page.evaluate(()=>{const c=document.querySelector('canvas');c.width=844;c.height=390;c.style.width='844px';c.style.height='390px';window.CatBondPremiumCinematics.draw(c.getContext('2d'),844,390,{elements:'dark+dark',tier:1,t:1.6,max:3.2,hideCaptions:true});return window.CatBondPremiumCinematics.lastLayout;});
 assert.equal(wide.source,'63-original-painted-storyboards');assert.equal(wide.actorLayerCount,0);assert.equal(wide.paintingDrawCount,1);await page.screenshot({path:out+'/landscape-original.png'});
 assert.deepEqual(errors,[]);
 console.log('DUO RENDERER SAMPLES PASS',cases.length,'of 63; three portrait sizes and original landscape');
 if(files.length!==63)console.log('FULL PACK RELEASE BLOCKED',63-files.length,'missing paintings');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
