// Shared real-player start flow for Cat Bond browser QA.
// Follow the actual active campaign's title, opening and physical garden flow.
export async function startNewAdventure(page,{slot='slot1',scene='map'}={}){
 const start=page.locator('#intro-start');
 if(await start.isVisible().catch(()=>false)){
  await start.click({timeout:10000});
  await page.locator('#intro-slot-panel.is-open').waitFor({state:'visible',timeout:10000});
  await page.locator('#intro-slot-list [data-slot="'+slot+'"]').click({timeout:10000});
  await page.waitForFunction(()=>window.__CAT_BOND_STARTED__===true,null,{timeout:15000});
  if(await page.evaluate(()=>!!window.__CAT_BOND_CANONICAL_ACTIVE__)){await finishCanonicalOpening(page);}else{
  await page.waitForFunction(()=>State.S.cats[0]?.species==='jinjc'&&State.S.cats.length===1);
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
 await page.waitForFunction(()=>document.querySelector("#cb-player-first-intro")||document.querySelector(".cbcp-art")?.naturalWidth>0);
 const playerFirst=await page.evaluate(()=>CatBondResonance.view().current?.id==="prologue:P-05");
 if(playerFirst){const intro=page.locator("#cb-player-first-intro");await intro.waitFor({state:"visible"});await intro.getByRole("button",{name:/^(Start exploring|开始探索)$/}).click();await page.waitForFunction(()=>State.S.cats.length===1&&State.S.cats[0].species==="jinjc"&&__game.scene==="yard");await onStage("fixed protagonist");const guide=page.locator(".sg-prologue-guide");await guide.getByRole("button",{name:/^(Main quest|主线任务)$/}).click();await guide.getByRole("button",{name:/^(Skip this encounter|跳过此次相遇)$/}).click();await page.waitForFunction(()=>CatBondResonance.view().current?.id==="harbor:H-01"&&__game.scene==="map");await page.locator("#map-menu").click();await page.locator("#cb-system-menu [data-system=\"world-atlas\"]").click();await page.waitForFunction(()=>WorldMap.mode==="map");await onStage("world map");return;}

 await page.waitForFunction(()=>window.CatBondResonance?.view()?.current?.id==='prologue:P-01'&&document.querySelector('.cbcp-art')?.naturalWidth>0);
 const skip=page.locator('.cbcp-skip');await skip.waitFor();await onStage('prologue P-01');await skip.click();
 await page.waitForFunction(()=>window.CatBondResonance?.view()?.current?.id==='prologue:P-04');
 await page.waitForFunction(()=>State.S.cats[0]?.species==='jinjc'&&State.S.cats.length===1&&!document.querySelector('#panel.open .cat-starter-card'));
 await onStage('fixed protagonist');
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

// Discover through actual directional input, not a hidden DOM click or save mutation.
export async function gardenDiscovery(page,id,{touch=false}={}){
 const marker=page.locator('[data-garden-explore="'+id+'"]');
 // The draw loop sets the world point on its first eligible frame after dialogue closes.
 // Wait for that frame instead of treating a still-hidden newly unlocked chart as missing.
 await page.waitForFunction(id=>{const b=document.querySelector('[data-garden-explore="'+id+'"]');return !!(b?._gardenWorldPoint&&window.__game?.yardPlayer?.()&&!document.querySelector('.res-host'));},id,{timeout:15000});
 for(let i=0;i<45&&!await marker.isVisible();i++){
  const d=await marker.evaluate(b=>{const g=window.__game,p=g?.yardPlayer?.(),t=b._gardenWorldPoint;return p&&t?{dx:(t.x-p.x)/g.W,dy:(t.y-p.y)/g.H}:null});
  if(!d)throw Error('Missing discovery route: '+id);
  const key=Math.abs(d.dx)>Math.abs(d.dy)?(d.dx>0?'ArrowRight':'ArrowLeft'):(d.dy>0?'ArrowDown':'ArrowUp');
  await page.keyboard.down(key);try{await page.waitForTimeout(180);}finally{await page.keyboard.up(key);}
 }
 await marker.waitFor({state:'visible',timeout:5000});
 if(touch)await marker.tap();else await marker.click();
 const predicates={'chart-0':s=>s.parts.includes(0),'chart-1':s=>s.parts.includes(1),'chart-echo':s=>s.chartEcho,seed:s=>s.seed};
 if(predicates[id])await page.waitForFunction(id=>{const s=GardenExploration.read(State.S);return id==='seed'?s.seed:id==='chart-echo'?s.chartEcho:s.parts.includes(Number(id.at(-1)));},id,{timeout:15000});
 if(id==='door')await page.waitForFunction(()=>!__game._yardArrival,null,{timeout:15000});
}
