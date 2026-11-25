// Shared real-player start flow for Cat Bond browser QA.
// Follow the actual active campaign's title, opening and physical garden flow.
export async function startNewAdventure(page,{slot='slot1',scene='map'}={}){
 const start=page.locator('#intro-start');
 if(await start.isVisible().catch(()=>false)){
  await start.click({timeout:10000});
  await page.locator('#intro-slot-panel.is-open').waitFor({state:'visible',timeout:10000});
  await page.locator('#intro-slot-list [data-slot="'+slot+'"]').click({timeout:10000});
  await page.waitForFunction(()=>window.__CAT_BOND_STARTED__===true,{timeout:15000});
  if(await page.evaluate(()=>!!window.__CAT_BOND_CANONICAL_ACTIVE__)){await finishCanonicalOpening(page);}else{
  await page.locator('#panel.open .dex-cell').first().waitFor({state:'visible',timeout:15000});
  await page.locator('#panel.open .dex-cell').first().click({timeout:10000});
  const skip=page.locator('.cb-story-overlay.is-visible .cb-story-skip');
  await skip.waitFor({state:'visible',timeout:15000});
  await skip.click({timeout:10000});}
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

export async function finishCanonicalOpening(page,{onStage=async()=>{}}={}){
 await page.waitForFunction(()=>window.CatBondResonance?.view()?.current?.id==='prologue:P-01'&&document.querySelector('.cbcp-art')?.naturalWidth>0);
 const skip=page.locator('.cbcp-skip');await skip.waitFor();await onStage('prologue P-01');await skip.click();
 await page.waitForFunction(()=>window.CatBondResonance?.view()?.current?.id==='prologue:P-04');
 await page.locator('#panel.open .cat-starter-card .dex-cell').first().waitFor();
 await onStage('starter');await page.locator('#panel.open .cat-starter-card .dex-cell').first().click();
 const guide=page.locator('.sg-prologue-guide');
 await guide.getByRole('button',{name:/^(Talk to Muling|与暮铃交谈)$/}).click();
 const awakening=page.locator('.res-host[data-scene="prologue:P-04"]');
 await awakening.getByRole('button',{name:/^(Skip dialogue|跳过对白)$/}).click();
 const bell=page.locator('.res-garden-bell');await bell.waitFor();
 await bell.focus();for(let i=0;i<3;i++)await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 const journey=page.locator('.res-host[data-scene="prologue:P-05"]');
 await journey.getByRole('button',{name:/^(Skip dialogue|跳过对白)$/}).click();
 await guide.getByRole('button',{name:/^(World map|前往世界地图)$/}).click();
 const atlasMenu=page.locator('.rw-atlas-menu:not([open]) > summary');if(await atlasMenu.count()){await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-explore"]').click();}
 await page.locator('.rw-regions [data-region="harbor"]').click();
 await page.waitForFunction(()=>window.CatBondResonance?.view()?.current?.id==='harbor:H-01');
 await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-atlas"]').click();
 await page.waitForFunction(()=>window.__game?.scene==='map'&&WorldMap.mode==='map');
 await onStage('world map');
}
