// Shared real-player start flow for Cat Bond browser QA.
// A new adventure has three deliberate stages: save slot, starter, prologue.
export async function startNewAdventure(page,{slot='slot1',scene='map'}={}){
 const start=page.locator('#intro-start');
 if(await start.isVisible().catch(()=>false)){
  await start.click({timeout:10000});
  await page.locator('#intro-slot-panel.is-open').waitFor({state:'visible',timeout:10000});
  await page.locator('#intro-slot-list [data-slot="'+slot+'"]').click({timeout:10000});
  await page.waitForFunction(()=>window.__CAT_BOND_STARTED__===true,{timeout:15000});
  await page.locator('#panel.open .dex-cell').first().waitFor({state:'visible',timeout:15000});
  await page.locator('#panel.open .dex-cell').first().click({timeout:10000});
  const skip=page.locator('.cb-story-overlay.is-visible .cb-story-skip');
  await skip.waitFor({state:'visible',timeout:15000});
  await skip.click({timeout:10000});
 }
 await page.waitForFunction(()=>window.__CAT_BOND_STARTED__===true&&window.__game?.scene==='map',
  {timeout:15000});
 if(scene==='yard'){
  await page.evaluate(()=>{window.UI?.closeAll?.();window.WorldMap?.exitToYard?.();});
  await page.waitForFunction(()=>window.__game?.scene==='yard',{timeout:10000});
 }
 return page.evaluate(()=>({started:!!window.__CAT_BOND_STARTED__,scene:window.__game?.scene}));
}
export async function continueSavedAdventure(page,{slot='slot1',scene='map'}={}){
 const proceed=page.locator('#intro-continue');
 if(await proceed.isVisible().catch(()=>false)){
  await proceed.click({timeout:10000});
  await page.locator('#intro-slot-panel.is-open').waitFor({state:'visible',timeout:10000});
  await page.locator('#intro-slot-list [data-slot="'+slot+'"]').click({timeout:10000});
 }
 await page.waitForFunction(()=>window.__CAT_BOND_STARTED__===true&&window.__game?.scene==='map',
  {timeout:15000});
 if(scene==='yard'){
  await page.evaluate(()=>{window.UI?.closeAll?.();window.WorldMap?.exitToYard?.();});
  await page.waitForFunction(()=>window.__game?.scene==='yard',{timeout:10000});
 }
 return page.evaluate(()=>({started:!!window.__CAT_BOND_STARTED__,scene:window.__game?.scene}));
}
