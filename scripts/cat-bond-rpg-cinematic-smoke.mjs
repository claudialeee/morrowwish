// Real Chromium release gate for The Last Page's animated opening and ending.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const failures=[];
function hashCanvas(canvas){
 const ctx=canvas.getContext('2d'),d=ctx.getImageData(0,0,canvas.width,canvas.height).data;
 let h=2166136261>>>0,alpha=0;
 for(let i=0;i<d.length;i+=31){h=Math.imul(h^d[i],16777619)>>>0;h=Math.imul(h^d[i+1],16777619)>>>0;if(i%4===3&&d[i]>30)alpha++;}
 return {hash:h.toString(16),alpha};
}
try{
 for(const profile of [
  {name:'phone',width:390,height:844,mobile:true},
  {name:'desktop',width:1180,height:760,mobile:false}
 ]){
  const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},
   isMobile:profile.mobile,hasTouch:profile.mobile,deviceScaleFactor:profile.mobile?2:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(origin+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>window.__game&&window.CatBondArtworkStatus?.breedsLoaded===true&&
     window.CatArt?.drawCat&&window.CatBondStory?.playEnding,{timeout:30000});
   await page.evaluate(()=>{
    const audio=window.MorrowwishAudio;
    window.__rpgStoryAudio=[];
    if(audio?.effect){const original=audio.effect.bind(audio);audio.effect=(kind,...args)=>{
     window.__rpgStoryAudio.push('effect:'+kind);return original(kind,...args);
    };}
    if(audio?.note){const original=audio.note.bind(audio);audio.note=(frequency,...args)=>{
     window.__rpgStoryAudio.push('note:'+frequency);return original(frequency,...args);
    };}
   });
   await page.locator('#intro-start').click();
   await page.locator('#intro-slot-panel.is-open').waitFor({state:'visible',timeout:10000});
   await page.locator('#intro-slot-list [data-slot="slot1"]').click();
   await page.waitForFunction(()=>window.__CAT_BOND_STARTED__===true,{timeout:15000});
   await page.locator('#panel.open .dex-cell').first().click();
   const opening=page.locator('.cb-story-overlay.is-visible');
   await opening.waitFor({state:'visible',timeout:15000});
   const first=await page.evaluate(()=>{
    const root=document.querySelector('.cb-story-overlay'),layer=root?.querySelector('.cb-story-actors');
    const player=root?.querySelector('[data-cb-scene-player]'),companion=root?.querySelector('[data-cb-scene-companion]');
    const art=root?.querySelector('.cb-story-art');
    const measure=c=>{
     if(!c)return null;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
     let h=2166136261>>>0,alpha=0;
     for(let i=0;i<d.length;i+=31){h=Math.imul(h^d[i],16777619)>>>0;h=Math.imul(h^d[i+1],16777619)>>>0;if(i%4===3&&d[i]>30)alpha++;}
     return {hash:h.toString(16),alpha};
    };
    return {kind:root?.dataset.kind,region:root?.dataset.region,step:root?.dataset.sceneIndex,
     atmosphere:!!root?.querySelector('.cb-story-atmosphere'),
     player:measure(player),companion:measure(companion),backdrop:measure(art),
     shadow:layer?.classList.contains('has-shadow'),hasCompanion:layer?.classList.contains('has-companion')};
   });
   assert.equal(first.kind,'prologue','first-run opening must be a real prologue cutscene');
   assert.equal(first.region,'home');
   assert.equal(first.step,'0');
   assert.equal(first.atmosphere,true,'opening needs layered environmental atmosphere');
   assert.ok(first.player?.alpha>400,'player must be drawn from the original cat art');
   assert.ok(first.companion?.alpha>200,'Muling shadow must be visible in the opening');
   assert.ok(first.backdrop?.alpha>1000,'the painted region backdrop must be present');
   assert.equal(first.shadow,true,'opening must foreshadow Muling, not reveal them');
   await page.waitForTimeout(240);
   const moving=await page.locator('[data-cb-scene-player]').evaluate(el=>{
    const d=el.getContext('2d').getImageData(0,0,el.width,el.height).data;
    let h=2166136261>>>0;for(let i=0;i<d.length;i+=31){h=Math.imul(h^d[i],16777619)>>>0;h=Math.imul(h^d[i+1],16777619)>>>0;}
    return h.toString(16);
   });
   assert.notEqual(first.player.hash,moving,'watercolor performers must animate between frames');
   const cues=await page.evaluate(()=>window.__rpgStoryAudio);
   assert.ok(cues.includes('effect:discover')&&cues.includes('note:660'),
    'the opening bell must trigger its own sound cue');
   await page.screenshot({path:'/tmp/cat-bond-rpg-'+profile.name+'-prologue.png'});
   await page.locator('.cb-story-next').click();
   await page.waitForFunction(()=>document.querySelector('.cb-story-overlay')?.dataset.sceneIndex==='1');
   const npc=await page.evaluate(()=>{
    const root=document.querySelector('.cb-story-overlay'),layer=root?.querySelector('.cb-story-actors');
    return {region:root?.dataset.region,shadow:layer?.classList.contains('has-shadow'),
     companion:layer?.classList.contains('has-companion')};
   });
   assert.equal(npc.region,'home');
   assert.equal(npc.shadow,false,'Kite should replace the Muling silhouette in the garden scene');
   assert.equal(npc.companion,true,'the named NPC must be present as a scene actor');
   await page.locator('.cb-story-skip').click();
   await page.waitForFunction(()=>window.__game?.scene==='map',{timeout:12000});
   await page.evaluate(()=>window.CatBondStory.playEnding(true));
   const ending=page.locator('.cb-story-overlay.is-visible[data-kind="ending"]');
   await ending.waitFor({state:'visible',timeout:10000});
   const finaleStart=await page.evaluate(()=>{
    const root=document.querySelector('.cb-story-overlay');
    const canvas=root?.querySelector('[data-cb-scene-companion]');
    const d=canvas?.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    let alpha=0;if(d)for(let i=3;i<d.length;i+=4)if(d[i]>30)alpha++;
    return {kind:root?.dataset.kind,step:root?.dataset.sceneIndex,region:root?.dataset.region,alpha};
   });
   assert.equal(finaleStart.kind,'ending');
   assert.equal(finaleStart.step,'0');
   assert.ok(finaleStart.alpha>200,'Muling must appear in the finale');
   for(let step=1;step<=4;step++){
    await page.locator('.cb-story-next').click();
    await page.waitForFunction(n=>document.querySelector('.cb-story-overlay')?.dataset.sceneIndex===String(n),step);
    if(step===4){
     assert.equal(await page.locator('.cb-story-portraits.is-visible').count(),1,
      'the ending must record the player and Muling together on its final page');
     await page.screenshot({path:'/tmp/cat-bond-rpg-'+profile.name+'-ending.png'});
    }
   }
   const endingCues=await page.evaluate(()=>window.__rpgStoryAudio);
   assert.ok(endingCues.includes('effect:complete'),'the ending must resolve with its own sound cue');
   await page.locator('.cb-story-next').click();
   await page.waitForFunction(()=>window.__game?.scene==='yard',{timeout:12000});
   assert.deepEqual(errors,[],'no runtime errors in the opening or ending cutscenes');
   console.log('CAT BOND RPG CINEMATIC PASS '+profile.name,JSON.stringify({opening:first.player,actorChanged:first.player.hash!==moving,ending:finaleStart}));
  }catch(error){failures.push(profile.name+': '+error.message);console.error('CAT BOND RPG CINEMATIC FAIL',failures.at(-1));}
  finally{await context.close();}
 }
}finally{await browser.close();}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}
