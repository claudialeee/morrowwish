// Chromium QA: retired growth must preserve the original illustration without simulated transformations.
// Regression guard for the skinny synthetic SVG adults shown in Moonshadow Ruins.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try {
  for(const p of [{name:'phone',width:390,height:844,mobile:true},
                  {name:'desktop',width:1180,height:760,mobile:false}]){
    const context=await browser.newContext({viewport:{width:p.width,height:p.height},
      isMobile:p.mobile,hasTouch:p.mobile});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:8765/cat-bond/adult-preview.html',
      {waitUntil:'domcontentloaded'});
    const expectedBreeds=await page.evaluate(()=>window.GameData?.SPECIES?.length||0);
    assert.ok(expectedBreeds>=32,'All established breeds and new playable cats are present');
    try {
      await page.waitForFunction(()=>window.CatBondAdultArt?.loadedCount===window.GameData?.SPECIES?.length,
        null,{timeout:25000});
    } catch(error) {
      const diagnostics=await page.evaluate(()=>({
        adultArtPresent:!!window.CatBondAdultArt,
        breedCount:window.CatBondAdultArt?.breedCount,
        loadedCount:window.CatBondAdultArt?.loadedCount,
        watercolorStatus:window.CatBondArtworkStatus?.breedsLoaded,
        originalStatus:window.CatBondArtworkStatus?.originalLoaded,
        catRendererPresent:!!window.CatArt,
        gameDataPresent:!!window.GameData,
        cards:document.querySelectorAll('.breed-card').length,
        statusText:document.querySelector('#load-status')?.textContent,
        resourceEntries:performance.getEntriesByType('resource')
          .filter(x=>/watercolor|real-kittens|adult-art/.test(x.name))
          .map(x=>({url:x.name,transferSize:x.transferSize,duration:Math.round(x.duration)}))
      }));
      console.error('CAT BOND ADULT ART LOAD DIAGNOSTIC',p.name,JSON.stringify({diagnostics,errors}));
      throw error;
    }
    const check=await page.evaluate(()=>{
      const cards=[...document.querySelectorAll('.breed-card')];
      const thumbs=cards.map(c=>[...c.querySelectorAll('canvas')]);
      const pixels=cv=>{
        const w=cv.width,h=cv.height,d=cv.getContext('2d').getImageData(0,0,w,h).data;
        let visible=0,left=w,right=0,top=h,bottom=0;
        for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>70){
          visible++;left=Math.min(left,x);right=Math.max(right,x);
          top=Math.min(top,y);bottom=Math.max(bottom,y);
        }
        return {visible,aspect:(right-left+1)/(bottom-top+1)};
      };
      const bounds=thumbs.map(row=>row.map(pixels));
      const maxAspectChange=Math.max(...bounds.map(([kitten,adult])=>Math.max(
        kitten.aspect/(adult.aspect||.001),adult.aspect/(kitten.aspect||.001))));
      return {breeds:cards.length,failed:CatBondAdultArt.failedCount,
        loaded:CatBondAdultArt.loadedCount,
        sourceKind:CatBondAdultArt.sourceKind,
        preservesOriginalProportions:CatBondAdultArt.preservesOriginalProportions,
        matureArtIsSeparateImage:CatBondAdultArt.matureArtIsSeparateImage,
        adultUnique:new Set(thumbs.map(v=>v[1].toDataURL())).size,
        allVisible:thumbs.every(v=>v.length===3)&&bounds.every(row=>row.every(c=>c.visible>100)),
        sameArt:thumbs.every(v=>v[0].toDataURL()===v[1].toDataURL()&&v[0].toDataURL()===v[2].toDataURL()),
        neutralStages:[1,2].every(stage=>{const v=Growth.visual({stage,awaken:'agi'});return v.scale===1&&!v.aura&&!v.sparkle&&!v.gem;}),
        maxAspectChange};
    });
    assert.equal(check.breeds,expectedBreeds);
    assert.equal(check.loaded,expectedBreeds);
    assert.equal(check.failed,0);
    assert.equal(check.sourceKind,'original-watercolor-atlas',
      'adult should preserve watercolor breed fur and facial proportions');
    assert.equal(check.preservesOriginalProportions,true);
    assert.equal(check.matureArtIsSeparateImage,false,
      'adult cannot replace painted cat with a narrow SVG model');
    assert.equal(check.adultUnique,expectedBreeds,'all collectible breeds must retain unique coats');
    assert.ok(check.allVisible,'no blank illustration at any growth stage');
    assert.equal(check.sameArt,true,'legacy stages must use identical art, not fabricated growth');
    assert.equal(check.neutralStages,true,'legacy stage visuals must not enlarge or decorate cats');
    assert.ok(check.maxAspectChange<1.001,
      'grown cat changed aspect ratio beyond original watercolor proportions: '+check.maxAspectChange);
    assert.deepEqual(errors,[]);
    await page.screenshot({path:'/tmp/cat-bond-adult-'+p.name+'.png',fullPage:true});
    console.log(expectedBreeds+' ADULT BREEDS REAL CHROMIUM PASS',p.name,JSON.stringify(check));
    await context.close();
  }
  // Growth feature retired: assert neither a button nor an awakening option
  // exists, even after all previous level and affection requirements are met.
  const context=await browser.newContext({viewport:{width:390,height:844},
    isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:8765/cat-bond/?autodev',
    {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__game&&window.State?.S?.cats?.length>=4,
    null,{timeout:12000});
  const removed=await page.evaluate(()=>{
    const cat=State.S.cats[0];cat.level=25;cat.affinity=100;
    State.S.raising=State.S.raising||{};
    State.S.raising.starShards=100;
    const beforeStage=cat.stage||0,beforeShards=State.S.raising.starShards;
    UI.openCatDetail(cat);
    return {button:!!document.getElementById('cd-grow'),
      awakeningChoices:document.querySelectorAll('#cat-detail [data-awaken]').length,
      ceremony:!!document.getElementById('cb-growth-canvas'),
      handlerPresent:typeof UI.doGrow==='function',
      stageChanged:(cat.stage||0)!==beforeStage,
      shardsChanged:State.S.raising.starShards!==beforeShards,
      trainingButton:!!document.getElementById('cd-trainnext'),
      redundantFiveLevelButton:!!document.getElementById('cd-trainfive')};
  });
  assert.deepEqual(removed,{button:false,awakeningChoices:0,ceremony:false,
    handlerPresent:false,stageChanged:false,shardsChanged:false,
    trainingButton:true,redundantFiveLevelButton:false});
  const disabled=await page.evaluate(()=>{
    const cat=State.S.cats[0],before=cat.stage||0;
    const result=Growth.advance(cat,'agi');
    return {ok:result.ok,disabled:result.disabled,unchanged:(cat.stage||0)===before};
  });
  assert.deepEqual(disabled,{ok:false,disabled:true,unchanged:true});
  await context.close();
  console.log('GROWTH CONTROLS RETIRED; PLAYER TRAINING PRESERVED');
}finally{await browser.close();}
