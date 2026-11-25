/* Chromium QA: the 63 complete original paintings, across phone and desktop. */
import assert from 'node:assert/strict';import fs from 'node:fs';import {chromium} from 'playwright';
const dir='artifacts/cat-bond-21x3';fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:860},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/cat-bond/duo-showcase.html?visual-qa=original-only',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.CatBondPremiumCinematics?.ready&&window.CatBondDuoHero?.assetReady&&window.__catBondDuoGallery?.ready&&document.querySelectorAll('.stage-breed-preview').length===63&&document.querySelectorAll('.duo-card .skill-preview').length===21,null,{timeout:45000});
 const audit=await page.evaluate(()=>{
  const p=window.CatBondPremiumCinematics,cv=document.createElement('canvas');cv.width=620;cv.height=349;
  const c=cv.getContext('2d',{willReadFrequently:true}),hashes=[],frames=[];
  for(const key of p.keys)for(const tier of [1,2,3]){
   c.clearRect(0,0,cv.width,cv.height);p.draw(c,cv.width,cv.height,{elements:key,max:2.75,t:1.2,tier,thumbnail:true,originalArt:true,hideCaptions:true});
   const d=c.getImageData(0,0,cv.width,cv.height).data;let h=2166136261>>>0,visible=0;
   for(let i=0;i<d.length;i+=40){h=Math.imul((h^d[i])>>>0,16777619)>>>0;h=Math.imul((h^d[i+1])>>>0,16777619)>>>0;h=Math.imul((h^d[i+2])>>>0,16777619)>>>0;if(d[i+3]>200)visible++;}
   hashes.push(h.toString(16));frames.push({key,tier,visible});
  }
  const motionPhases=[.14,.40,.73],motionHashes=[],motionLayouts=[];
  for(const phase of motionPhases){
   c.clearRect(0,0,cv.width,cv.height);
   p.draw(c,cv.width,cv.height,{elements:'fire+light',max:2.75,t:2.75*(1-phase),
     tier:3,galleryPreview:true,originalArt:true,hideCaptions:true});
   const d=c.getImageData(0,0,cv.width,cv.height).data;let h=2166136261>>>0;
   for(let i=0;i<d.length;i+=16)h=Math.imul((h^d[i])>>>0,16777619)>>>0;
   motionHashes.push(h.toString(16));motionLayouts.push(p.lastLayout);
  }
  const zooms=motionLayouts.map(x=>x.camera.zoom);
  const cameraMoves=Math.max(...zooms)-Math.min(...zooms)>.0005||
    new Set(motionLayouts.map(x=>JSON.stringify([x.camera.panX,x.camera.panY,x.camera.rotationRadians]))).size===3;
  return{keys:p.keys.length,count:frames.length,unique:new Set(hashes).size,frames,original:p.originalPaintingDefault,
   actorFallback:p.actorFallbackEnabled,heroSource:window.CatBondDuoHero.assetSource,
   motionUnique:new Set(motionHashes).size,cameraMoves,
   paintingDrawCount:motionLayouts[2].paintingDrawCount,actorLayerCount:motionLayouts[2].actorLayerCount,
   animatedEffects:motionLayouts[2].animatedEffects};
 });
 assert.equal(audit.keys,21);assert.equal(audit.count,63);assert.equal(audit.unique,63,'all 63 paintings should be distinct');
 assert.equal(audit.original,true);assert.equal(audit.actorFallback,false);assert.equal(audit.heroSource,'63-original-painted-storyboards');
 assert.equal(audit.motionUnique,3,'the same original painting must visibly animate at three cinematic beats');
 assert.equal(audit.cameraMoves,true,'the original painting camera must gently drift without splitting characters');
 assert.equal(audit.paintingDrawCount,1,'the complete original painting must be composited exactly once');
 assert.equal(audit.actorLayerCount,0,'no second cat actor layer may be added');
 assert.equal(audit.animatedEffects,true,'the original-art preview must retain animated effects');
 assert.ok(audit.frames.every(x=>x.visible>1000));
 assert.equal(await page.locator('#mode-breeds').count(),0);assert.equal(await page.locator('#pick-cat-a').count(),0);
 assert.equal(await page.locator('script[src*="duo-breed-actors"]').count(),0);
 await page.locator('#duo-player').screenshot({path:dir+'/desktop-original-16x9.png'});
 const layouts=[];
 for(const v of [{name:'phone-portrait',width:390,height:844},{name:'phone-landscape',width:844,height:390},{name:'desktop',width:1280,height:720},{name:'small-phone',width:320,height:568}]){
  const l=await page.evaluate(({width,height})=>{const cv=document.createElement('canvas');cv.width=width;cv.height=height;window.CatBondPremiumCinematics.draw(cv.getContext('2d'),width,height,{elements:'fire+light',max:2.75,t:1.4,tier:3,hideCaptions:true});return window.CatBondPremiumCinematics.lastLayout;},v);
  assert.ok(Math.abs(l.artAspect-16/9)<.00001,v.name);assert.equal(l.actorFallback,false);assert.ok(l.art.width<=v.width+1&&l.art.height<=v.height+1);
  layouts.push({name:v.name,art:l.art,aspect:l.artAspect});await page.setViewportSize({width:v.width,height:v.height});await page.screenshot({path:dir+'/'+v.name+'.png',fullPage:true});
 }
 // Inspect live-compositing output on transparent canvases rather than
 // the intentionally opaque gallery background. Real combat uses this path.
 const alphaAudit=await page.evaluate(()=>{
  const p=window.CatBondPremiumCinematics,rows=[];
  for(const [width,height] of [[1280,720],[390,844],[844,390]])for(const tier of [1,2,3]){
   const cv=document.createElement('canvas');cv.width=width;cv.height=height;
   const c=cv.getContext('2d',{willReadFrequently:true});
   p.draw(c,width,height,{elements:'fire+light',max:2.75,t:2.75*.52,tier,hideCaptions:true});
   const corner=c.getImageData(0,0,1,1).data[3],middle=c.getImageData(Math.floor(width/2),Math.floor(height/2),1,1).data[3];
   rows.push({width,height,tier,corner,middle,layout:p.lastLayout});
  }
  return rows;
 });
 assert.ok(alphaAudit.every(row=>row.corner<128&&row.middle>180),'Live artwork must retain a translucent perimeter and readable center at all tiers and device shapes');
 assert.ok(alphaAudit.every(row=>row.layout.effectTier===row.tier&&row.layout.actorLayerCount===0&&row.layout.paintingDrawCount===1),'Live three-tier compositing must draw exactly one original painting');
 fs.writeFileSync(dir+'/live-alpha-audit.json',JSON.stringify(alphaAudit,null,2));
 assert.deepEqual(errors,[]);console.log('CAT BOND ORIGINAL ART QA PASS '+JSON.stringify({frames:audit.count,unique:audit.unique,layouts}));
}finally{await browser.close();}
