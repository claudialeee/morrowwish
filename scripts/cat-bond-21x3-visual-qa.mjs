/* Real Chromium QA of approved Cat Bond paintings, not just source metadata.
 * Captures all 21 scenes, three bond levels, 390px phone and favorite art.
 * Do not post social content or change any player's game save.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const DIR='artifacts/cat-bond-21x3';
fs.mkdirSync(DIR,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1280,height:860},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push('Runtime: '+e.message));
try{
 await page.goto('http://127.0.0.1:8765/cat-bond/duo-showcase.html?visual-qa=21x3',
   {waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.CatBondPremiumCinematics?.ready&&
   window.__catBondDuoGallery?.ready&&
   window.CatBondDuoBreedActors?.ready&&
   document.querySelectorAll('.stage-breed-preview').length===63&&
   document.querySelectorAll('.duo-card .skill-preview').length===21&&
   document.querySelectorAll('.breed-card').length===32,{timeout:40000});
 const result=await page.evaluate(()=>{
  const keys=window.CatBondDuoDirector.keys;
  const painter=window.CatBondPremiumCinematics;
  const cv=document.createElement('canvas');cv.width=620;cv.height=349;
  const ctx=cv.getContext('2d',{willReadFrequently:true});
  const cats=[{uid:'q0',species:'tangyuan'},{uid:'q1',species:'sanhua'}];
  const frames=[];
  for(const key of keys){
   const variants=[];
   for(const tier of [1,2,3]){
    ctx.clearRect(0,0,cv.width,cv.height);
    const painted=painter.draw(ctx,cv.width,cv.height,{
      elements:key,max:2.75,t:2.75*.60,tier,catUids:cats.map(c=>c.uid),
      name:key,hideCaptions:true
    },uid=>cats.find(c=>c.uid===uid));
    if(!painted)throw Error('Painting failed '+key+' tier '+tier);
    const rgb=ctx.getImageData(0,0,cv.width,cv.height).data;
    let hash=2166136261>>>0,bright=0,purple=0,count=0;
    for(let i=0;i<rgb.length;i+=52){
      hash=Math.imul((hash^rgb[i])>>>0,16777619)>>>0;
      hash=Math.imul((hash^rgb[i+1])>>>0,16777619)>>>0;
      hash=Math.imul((hash^rgb[i+2])>>>0,16777619)>>>0;
      const r=rgb[i],g=rgb[i+1],b=rgb[i+2];
      if(r+g+b>60){
        bright+=(r+g+b)/3;
        if(r>g*1.3&&b>g*1.4&&b>r*.95)purple++;
        count++;
      }
    }
    variants.push({tier,hash:hash.toString(16),avgBrightness:count?+(bright/count).toFixed(1):0,
     purpleRatio:count?+(purple/count).toFixed(3):0});
    // Also verify the separate 32-breed mode remains intact without
    // silently replacing the default classic 63 original paintings.
    ctx.clearRect(0,0,cv.width,cv.height);
    if(!painter.draw(ctx,cv.width,cv.height,{
      elements:key,max:2.75,t:2.75*.60,tier,catUids:cats.map(c=>c.uid),
      name:key,hideCaptions:true,originalArt:false
    },uid=>cats.find(c=>c.uid===uid)))throw Error('Breed mode failed '+key+' tier '+tier);
   }
   frames.push({key,variants,palette:painter.paletteFor(key)});
  }
  return {keys:keys.length,palettes:painter.scenePaletteCount,
    grades:painter.gradedSceneCount,tiers:painter.tierVariants,
    source:window.CatBondDuoHero.assetSource,frames};
 });
 assert.equal(result.keys,21);
 assert.equal(result.palettes,21);
 assert.equal(await page.evaluate(()=>CatBondPremiumCinematics.originalPaintingDefault),true,
   'All 63 intact original watercolor scenes must be the default');
 assert.equal(await page.evaluate(()=>CatBondPremiumCinematics.restoredOriginalFrameCount),63);
 assert.equal(await page.locator('#mode-original').getAttribute('aria-pressed'),'true');
 await page.locator('#mode-breeds').click();
 assert.equal(await page.locator('#mode-breeds').getAttribute('aria-pressed'),'true');
 await page.locator('#mode-original').click();
 assert.equal(await page.locator('#mode-original').getAttribute('aria-pressed'),'true');
 assert.equal(result.grades,63,'Cache must hold the 63 untouched, separately painted scenes (no actor-tinted duplicates)');
 assert.equal(result.tiers,3);
 assert.equal(result.source,'32-actual-breed-watercolor-actors');
 const matches=await page.evaluate(()=>{
   const painter=window.CatBondPremiumCinematics;
   const art=window.CatBondDuoBreedActors;
   const breeds=window.GameData.SPECIES.map(s=>s.id);
   const cv=document.createElement('canvas');cv.width=480;cv.height=270;
   const c=cv.getContext('2d',{willReadFrequently:true});
   const actorA={uid:'qa-A',species:'tangyuan'},actorB={uid:'qa-B',species:'mengmai'};
   function hash(){
     c.clearRect(0,0,480,270);
     painter.draw(c,480,270,{elements:'dark+light',max:2.75,t:1.20,tier:3,
       catUids:['qa-A','qa-B'],hideCaptions:true,thumbnail:true,originalArt:false},
       id=>id==='qa-A'?actorA:actorB);
     const pix=c.getImageData(0,0,480,270).data;
     let h=2166136261>>>0;
     for(let i=0;i<pix.length;i+=44)
       h=Math.imul((h^pix[i])>>>0,16777619)>>>0;
     return h.toString(16);
   }
   const firstSide=breeds.map(id=>{actorA.species=id;return [id,hash()]});
   actorA.species='xuewa';
   const secondSide=breeds.map(id=>{actorB.species=id;return [id,hash()]});
   actorB.species='mengmai';
   const ordered=hash();
   actorA.species='mengmai';actorB.species='xuewa';
   const reversed=hash();
   return {n:art.breedCount,firstSide,secondSide,ordered,reversed,
     cached:painter.activePaintCacheEntries};
 });
 assert.equal(matches.n,32,'All 32 collectible breeds must have their own painted character');
 assert.equal(new Set(matches.firstSide.map(v=>v[1])).size,32,
   'All 32 first-side breeds must produce visibly distinct actual watercolor cats');
 assert.equal(new Set(matches.secondSide.map(v=>v[1])).size,32,
   'All 32 second-side breeds must produce visibly distinct actual watercolor cats');
 assert.notEqual(matches.ordered,matches.reversed,
   'Swapping the two player cats must visibly exchange both painted characters');
 assert.ok(matches.cached<=63,'Changing cats must not create unbounded scene caches');
 assert.equal(new Set(result.frames.map(x=>x.variants[2].hash)).size,21,
   '21 skill previews still visually identical; do not release');
 for(const entry of result.frames){
  assert.equal(new Set(entry.variants.map(x=>x.hash)).size,3,
    entry.key+' has identical visuals for bonds 20/60/90');
  for(const v of entry.variants)assert.ok(v.avgBrightness>30,
    entry.key+' rendered black/blank tier '+v.tier);
 }
 // Gallery UI must be actionable, not just a decorative list of cat names.
 await page.selectOption('#pick-cat-a','mengmai');
 await page.selectOption('#pick-cat-b','bosi');
 assert.equal(await page.locator('#pick-cat-a').inputValue(),'mengmai');
 assert.equal(await page.locator('#pick-cat-b').inputValue(),'bosi');
 await page.screenshot({path:DIR+'/gallery-32-breed-pickers.png',fullPage:false,animations:'disabled'});
 await page.screenshot({path:DIR+'/gallery-desktop.png',fullPage:true,animations:'disabled'});
 for(const [key,name] of [['dark+light','moon'],['fire+light','sun'],['grass+grass','spring'],['dark+elec','shadow-storm']]){
  for(const tier of [1,2,3]){
   await page.evaluate(({key,tier})=>{
    const cv=document.createElement('canvas');cv.id='qa-cinematic-frame';
    cv.width=960;cv.height=540;cv.style.cssText='position:fixed;inset:0;z-index:999999;width:960px;height:540px;background:#f3ede8';
    document.getElementById('qa-cinematic-frame')?.remove();
    document.body.appendChild(cv);
    const cats=[{uid:'q0',species:'tangyuan'},{uid:'q1',species:'sanhua'}];
    CatBondPremiumCinematics.draw(cv.getContext('2d'),960,540,{
      elements:key,max:2.75,t:2.75*.59,tier,catUids:cats.map(c=>c.uid),
      name:key,hideCaptions:false
    },uid=>cats.find(c=>c.uid===uid));
   },{key,tier});
   await page.locator('#qa-cinematic-frame').screenshot({
     path:DIR+'/'+name+'-tier-'+tier+'.png',animations:'disabled'});
  }
 }
 await page.evaluate(()=>document.getElementById('qa-cinematic-frame')?.remove());
 const mobile=await browser.newPage({viewport:{width:390,height:844},
   deviceScaleFactor:2,isMobile:true,hasTouch:true});
 mobile.on('pageerror',e=>errors.push('Mobile runtime: '+e.message));
 await mobile.goto('http://127.0.0.1:8765/cat-bond/duo-showcase.html?visual-qa=mobile',
   {waitUntil:'domcontentloaded'});
 await mobile.waitForFunction(()=>window.__catBondDuoGallery?.ready,{timeout:40000});
 const mobileLayout=await mobile.evaluate(()=>({
    viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
    cards:document.querySelectorAll('.duo-card').length,
    breeds:document.querySelectorAll('.breed-card').length
 }));
 assert.equal(mobileLayout.cards,21);
 assert.equal(mobileLayout.breeds,32);
 assert.ok(mobileLayout.documentWidth<=mobileLayout.viewport+4,
   'Mobile art gallery scrolls horizontally '+JSON.stringify(mobileLayout));
 await mobile.screenshot({path:DIR+'/gallery-mobile.png',fullPage:true,animations:'disabled'});
 // Real viewport coverage: 320px portrait, 390px portrait, 844px
 // landscape, and 1280px desktop. The painting must fill the entire
 // arena, keep cat anatomy intact, and dissolve at both ends of playback.
 const fullStage=await mobile.evaluate(()=>{
   const results=[],painter=window.CatBondPremiumCinematics;
   const pair=[{uid:'edge-a',species:'tangyuan'},
               {uid:'edge-b',species:'mengmai'}];
   const base=[45,61,57];
   for(const [W,H] of [[320,640],[390,844],[844,390],[1280,720]]){
     const cv=document.createElement('canvas');cv.width=W;cv.height=H;
     const g=cv.getContext('2d',{willReadFrequently:true});
     function render(progress){
       g.fillStyle='rgb('+base.join(',')+')';g.fillRect(0,0,W,H);
       return painter.draw(g,W,H,{
         elements:'fire+grass',max:3.2,t:3.2*(1-progress),tier:3,
         catUids:pair.map(cat=>cat.uid),hideCaptions:true
       },uid=>pair.find(cat=>cat.uid===uid));
     }
     const rgb=(x,y)=>[...g.getImageData(Math.floor(x),Math.floor(y),1,1).data].slice(0,3);
     const diff=c=>c.reduce((sum,v,i)=>sum+Math.abs(v-base[i]),0);
     render(.008);const entrance=diff(rgb(W*.5,H*.5));
     const drawn=render(.53);
     const center=diff(rgb(W*.5,H*.5));
     const top=diff(rgb(W*.5,H*.12)),bottom=diff(rgb(W*.5,H*.88));
     const left=diff(rgb(W*.15,H*.5)),right=diff(rgb(W*.85,H*.5));
     const corner=diff(rgb(1,1));
     render(.985);const exited=diff(rgb(W*.5,H*.5));
     results.push({W,H,drawn,entrance,center,top,bottom,left,right,corner,exited});
   }
   return results;
 });
 for(const p of fullStage){
   assert.equal(p.drawn,true,'Duo art did not render at '+p.W+'x'+p.H);
   assert.ok(p.center>65,'Center artwork missing '+JSON.stringify(p));
   assert.ok(p.top>40&&p.bottom>40,
     'Visible letterboxing instead of continuous painted scenery '+JSON.stringify(p));
   assert.ok(p.left>40&&p.right>40,
     'Painting leaves hard sidebars '+JSON.stringify(p));
   assert.ok(p.corner<55,'Hard rectangular painting edge '+JSON.stringify(p));
   assert.ok(p.entrance<30,'Painting enters too abruptly '+JSON.stringify(p));
   assert.ok(p.exited<8,'Painting does not disappear before impact '+JSON.stringify(p));
 }
 assert.equal(await mobile.evaluate(()=>CatBondPremiumCinematics.fullBleedResponsive),true);
 await mobile.close();
 assert.deepEqual(errors,[],'No uncaught JavaScript runtime errors');
 fs.writeFileSync(DIR+'/report.json',JSON.stringify({result,mobileLayout,fullStage,errors},null,2));
 console.log('CAT BOND FULL-STAGE CINEMATIC PASS: original 63 frames, all 32 optional breeds, 320/390 portrait, 844 landscape, 1280 desktop, eased in/out and afterglow-safe screen edges.');
}finally{await browser.close()}
