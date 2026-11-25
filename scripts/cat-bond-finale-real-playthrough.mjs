// Normal-player continuation from the fresh-slot Harbor/Forest browser playthrough.
// No save/evidence writes, injected story state, debug combat launch, or engine calls.
// Read-only snapshots assert outcomes. Candidate cinematics are enabled ONLY in
// this isolated browser, and must not count as production art approval.
import assert from 'node:assert/strict';
export async function continueToFinale({page,context,options,name,button,scene,shot,puzzle,travel,ship}){
 const view=()=>page.evaluate(()=>CatBondResonance.view());
 const check=(op)=>page.waitForFunction(op=>!CatBondResonance.view().objective.includes(op),op);
 const log=async(id)=>{console.log(name,'NORMAL PLAYER',id,JSON.stringify(await page.evaluate(()=>({scene:CatBondResonance.view().current?.id,links:CatBondResonance.view().links,melodies:CatBondResonance.view().melodies.length,ending:CatBondResonance.view().ending}))));await shot(id.replaceAll(':','-'));};
 async function dialogue(id,choice){
  const panel=page.locator('.res-host[data-scene="'+id+'"]');
  for(let i=0;i<30;i++){
   const v=await view();if(v.current?.id!==id)return;
   const canChoose=!v.choice&&v.current.choices.length&&(v.current.choiceTiming==='beforeAction'||v.cursor===v.current.lines.length);
   if(!canChoose&&(!v.lineReady||v.cursor>=v.current.lines.length)){if(id==='epilogue:E-03'){await page.locator('.res-key-piece').waitFor();return;}if(await panel.isVisible()&&!await panel.locator('.res-key-panel').isVisible()){const close=button('Close',panel);if(await close.isVisible())await close.click();}return;}
   if(!await panel.isVisible()){if(await button('Journal').isVisible())await button('Journal').click();else await button('Talk to Muling',page.locator('.sg-prologue-guide')).click();await panel.waitFor();}
   if(canChoose){await button(choice||v.current.choices[0].label.en,panel).click();continue;}
   await panel.locator('.res-line').filter({hasText:v.current.lines[v.cursor].text.en}).waitFor();
   await button('Continue',panel).click();
  }
  throw Error('Dialogue did not finish: '+id);
 }
 async function talk(id,npc,choice){await scene(id);await button('Talk to '+npc).click();await page.locator('.res-host[data-scene="'+id+'"]').waitFor();await dialogue(id,choice);}
 async function invite(npc){const b=button('Invite '+npc);await b.click();await b.waitFor({state:'hidden'});}
 async function restore(label,inputs,people,melody,notes,region){
  await puzzle(label,inputs);for(const npc of people)await invite(npc);await puzzle(melody,notes);await check('melody:'+region);
 }
 async function beginBattle(label,auto=true){await button(label).click();await page.locator('#panel [data-battle-auto="'+auto+'"]').click();await page.locator('#bp-go').click();await page.locator('#battle-ui.on').waitFor();const tutorial=page.locator('#battle-tutorial-skip');if(await tutorial.isVisible())await tutorial.click();}
 async function finishBattle(timeout=300000){await page.waitForFunction(()=>__game.scene!=='battle',null,{timeout});const result=page.locator('#cb-finale-result');if(await result.isVisible()){await shot('finale-result-'+Date.now());await result.locator('[data-finale-return]').click();}}
 async function forgeFight(){
  await beginBattle('Forge guardian');await shot('forge-real-guardian');
  for(let n=0;n<180;n++){if(await page.locator('#cb-forge-result').isVisible())break;const support=page.locator('[data-forge-support-button]');if(await support.isVisible()&&await support.isEnabled())await support.click();await page.waitForTimeout(850);}
  await page.locator('#cb-forge-result').waitFor({timeout:180000});await shot('forge-real-result');await page.locator('[data-forge-return]').click();await check('battle:forge-guardian');
 }
 async function ensureDuo(){
  for(let attempt=0;attempt<3&&(await page.evaluate(()=>State.S.cats.length))<2;attempt++){
   await beginBattle('Approach wild cat');await finishBattle();const close=page.locator('#cr-ok,#battle-recovery-ok');await close.waitFor();await close.click();
  }
  assert.ok(await page.evaluate(()=>State.S.cats.length>=2),'Obtain two cats through normal capture');
  await travel('Rootsleep Forest');
  const memory=button('Promise Under Petals');await memory.waitFor();await memory.click();await page.locator('#panel.open').waitFor();
  await shot('earned-duo-promise');await page.locator('#panel .card-close').click();
  assert.ok(await page.evaluate(()=>{const p=CatRelations.chosen();return p.length===2&&CatRelations.memoryList(...p).includes('sakura')&&CatRelations.pair(...p).value>=20;}),'Actual forest duo promise');
  await travel('Emberforge City');
 }
 await ensureDuo();
 await puzzle('Safety blueprint',['Frame','Pipes','Valve']);await dialogue('forge:E-02','Publish the accident record now');
 await scene('forge:E-03');await puzzle('Furnace controls',['Heat','Heat','Heat','Heat','Vent','Vent','Vent']);await dialogue('forge:E-03');await forgeFight();
 await dialogue('forge:E-03');await scene('forge:E-04');
 await restore('Hearth sanctuary',['Heat','Heat','Heat','Heat','Vent'],['Jinpo','Xiaomao'],'Song of Ember',['High','Middle','Low'],'forge');
 await dialogue('forge:E-04');await scene('sky:S-01');await log('chapter-3-clear');
 await travel('Skyspine Isles');await talk('sky:S-01','Yuanfan');await scene('sky:S-02');
 await button('Flight recorder').click();await check('explore:flight-recorder');await dialogue('sky:S-02');
 await talk('sky:S-03','Yuanfan','Let Yuanfan lead');await puzzle('Joint gliding platform',['Descend','Climb','Descend']);await dialogue('sky:S-03');
 await talk('sky:S-04','Muling');await scene('sky:S-05');
 await restore('Windwing sanctuary',['Climb','Descend','Climb'],['Lingyu','Yuanfan'],'Open Sky',['Middle','High','Low'],'sky');
 await scene('library:M-01');await log('chapter-4-clear');
 await travel('Moonmirror Library');await talk('library:M-01','Moye');await scene('library:M-02');
 await puzzle('Mirror records',['Testimony','Calendar','Record']);await talk('library:M-03','Muling');
 await scene('library:M-04');await button('Routing record').click();await check('explore:routing-record');await dialogue('library:M-04',"I want to understand, but it doesn't change what you did");
 await scene('library:M-05');await talk('library:M-05','Muling','Release all records now');
 await restore('Moonmirror sanctuary',['Calendar','Testimony','Record'],['Moye','Baikan'],'Reflections',['High','Low','Middle'],'library');
 await dialogue('library:M-05');await scene('starfall:F-01');await log('chapter-5-clear');
 await travel('Starfall Expanse');await talk('starfall:F-01','Xingya');await scene('starfall:F-02');
 await puzzle('Star chart',['Outer ring','Outer ring','Outer ring','Middle ring','Inner ring','Inner ring']);await button('Catastrophe record').click();await check('explore:catastrophe-record');
 await talk('starfall:F-03','Muling');await scene('starfall:F-04');await scene('starfall:F-04');await button('Invite Xingya').or(button('Talk to Xingya')).click();await dialogue('starfall:F-04','Let Xingya coordinate repairs');
 await puzzle('Distributed observatory',['West','Relay','East']);
 await restore('Starfall sanctuary',['Outer ring','Middle ring','Middle ring','Middle ring','Inner ring'],['Xingya','Lichuan'],'Beyond Stars',['Low','Middle','High'],'starfall');
 const regions={harbor:'Misttide Harbor',forest:'Rootsleep Forest',forge:'Emberforge City',sky:'Skyspine Isles',library:'Moonmirror Library',starfall:'Starfall Expanse'};
 const routes=[['harbor','forest','Beacon-guided supplies','Herbs and waterway map'],['forest','forge','Cooling water and herbs','Pumps and tools'],['forge','sky','Wind vanes and flight parts','Wind data and airship route'],['sky','library','Courier route','Archived flight maps'],['library','starfall','Star chart and coordinates','Astronomical observations'],['starfall','harbor','Navigation bell and star compass','Harbor navigation response']];
 async function gotoRegion(region){if(await page.evaluate(()=>WorldMap.mode==='region'&&WorldMap.currentRegion)===region)return;if(await page.evaluate(()=>WorldMap.mode==='map'))await button(regions[region]).click();else await travel(regions[region]);await page.waitForFunction(r=>WorldMap.currentRegion===r&&WorldMap.mode==='region',region);}
 for(const [a,b,forward,back] of routes){const key=a+':'+b;let v=await view();for(let i=v.links[key].length;i<4;i++){const actor=[a,b,b,a][i];await gotoRegion(actor);await ship(actor,i<2?forward:back);await page.waitForFunction(({key,i})=>CatBondResonance.view().links[key].length===i+1,{key,i});}}
 await gotoRegion('starfall');await dialogue('starfall:F-04');await scene('starfall:F-05');
 assert.ok((await view()).ring);assert.equal((await view()).melodies.length,6);await log('chapter-6-real-ring');
 // The production release gate is still off. This local preview flag grants
 // permission to PLAY candidate paintings, not story/quest completion.
 assert.equal(await page.evaluate(()=>window.__CAT_BOND_INTEGRATION_ART__),false);
 await page.evaluate(()=>{window.__CAT_BOND_INTEGRATION_ART__=true;});
 async function cinematic(id){
  await scene(id);await button('Watch the story scene').click();await page.locator('.cbcp-art').first().waitFor();
  let previous='',frames=0;const until=Date.now()+180000;
  while((await view()).current?.id===id){
   if(Date.now()>until)throw Error('Cinematic did not naturally finish '+id);
   const current=await page.evaluate(()=>{const a=[...document.querySelectorAll('.cbcp-art')].at(-1);return a?.complete&&a.naturalWidth?{src:a.src,subtitle:document.querySelector('.cbcp-subtitle')?.textContent,kicker:document.querySelector('.cbcp-kicker')?.textContent}:null;});
   const key=current&&current.src+'|'+current.subtitle+'|'+current.kicker;if(key&&key!==previous){previous=key;await page.waitForTimeout(700);await shot(id.replace(':','-')+'-shot-'+(++frames));}
   await page.waitForTimeout(300);
  }
  assert.ok(frames>=2,id+' must render more than one shot');return frames;
 }
 const openingShots=await cinematic('starfall:F-05');await scene('finale:B-01');
 const before=await page.evaluate(()=>JSON.stringify(State.S.resonance));await beginBattle('Approach the Star Bell');
 await shot('B-01-retreat');await page.locator('#btn-flee').click();await finishBattle();
 assert.equal(await page.evaluate(()=>JSON.stringify(State.S.resonance)),before,'Retreat must not award any story progress');
 await beginBattle('Approach the Star Bell');await shot('B-01-inward-locks');await finishBattle();await check('battle:inward-gates');await dialogue('finale:B-01');await scene('finale:B-02');
 await beginBattle('Approach the Star Bell',false);
 await page.locator('[data-finale-clue]').click();await page.waitForFunction(()=>__game.battle?.enemies?.filter(e=>e.alive).every(e=>Number.isFinite(e.echoGap)));
 await shot('B-02-catdex');
 const targets=await page.evaluate(()=>{const list=__game.battle.enemies.filter(e=>e.alive&&e.echoCat&&State.S.dex[e.echoCat.species]>0);return {genuine:list.find(e=>Math.abs(e.echoGap-e.echoHabit)<.2)?.i,falseReply:list.find(e=>Math.abs(e.echoGap-e.echoHabit)>.2)?.i};});
 assert.ok(Number.isInteger(targets.genuine)&&Number.isInteger(targets.falseReply),'Real recorded pair with measured rhythms');
 await page.locator('[data-finale-focus] [data-echo="'+targets.genuine+'"]').click();
 await page.waitForFunction(()=>__game.battle?.resonanceFinale?.wrongCount>0);await shot('B-02-wrong-reply');
 await page.locator('[data-finale-focus] [data-echo="'+targets.falseReply+'"]').click();
 await page.waitForFunction(i=>__game.battle.enemies.find(e=>e.i===i)?.dexVerified,targets.falseReply);await shot('B-02-verified-reply');
 await page.locator('#btn-auto').click();
 let usedDuo=false,usedPromise=false;
 for(let i=0;i<220;i++){const state=await page.evaluate(()=>{const b=__game.battle;return b?.resonanceFinale?.id==='finale:B-02'?{uses:b.duoUses,quiet:b.resonanceFinale.echoQuietUntil}:null;});if(!state)break;if(state.uses>0&&!usedDuo){usedDuo=true;await shot('B-02-duo');}if(state.quiet>0)usedPromise=true;await page.waitForTimeout(450);}
 await finishBattle();await check('battle:identify-echo');assert.ok(usedDuo&&usedPromise,'Actual duo cast and promise interruption in B-02');
 await dialogue('finale:B-02');await scene('finale:B-03');
 await beginBattle('Approach the Star Bell',false);await shot('B-03-unprotected');
 // Ordinary retreat/defeat input only: no battle.finish(), HP or position writes.
 let naturalDefeat=false;const deadline=Date.now()+90000;
 while(Date.now()<deadline){const a=await page.evaluate(()=>{const b=__game.battle;return b?{f:b.resonanceFinale?.failedProtection,allDown:b.team.every(x=>!x.alive)}:null});if(!a){naturalDefeat=true;break;}if(a.f||a.allDown){naturalDefeat=true;break;}await page.waitForTimeout(500);}
 if(await page.locator('#battle-ui.on').isVisible()){if(naturalDefeat)await finishBattle();else{await page.locator('#btn-flee').click();await finishBattle();}}
 assert.ok((await view()).objective.includes('battle:central-echo'),'Uncompleted support cannot commit victory');
 const rewardBefore=await page.evaluate(()=>State.S.coins);await beginBattle('Approach the Star Bell');await shot('B-03-ring');
 const supported=new Set();for(let i=0;i<360;i++){const a=await page.evaluate(()=>__game.battle?.resonanceFinale?.nodes?.filter(n=>n.done).map(n=>n.region)||null);if(!a)break;for(const x of a)if(!supported.has(x)){supported.add(x);await shot('B-03-support-'+x);}await page.waitForTimeout(400);}
 await finishBattle();await check('battle:central-echo');assert.equal((await view()).completed.includes('finale:B-03'),false);assert.equal((await page.evaluate(()=>CatBondResonance.snapshot().support)).length,6);assert.equal(await page.evaluate(()=>State.S.coins),rewardBefore+180);await dialogue('finale:B-03');
 await button('Help Muling release the last lock').click();const latch=button('Hold the bell chain');await latch.waitFor();await latch.focus();await page.keyboard.down('Space');await page.waitForTimeout(1700);await page.keyboard.up('Space');
 const endingShots=await cinematic('finale:B-04'),epilogueShots=await cinematic('epilogue:E-01');
 await page.waitForFunction(()=>__game.scene==='yard');await scene('epilogue:E-02');
 await button('Talk to Muling',page.locator('.sg-prologue-guide')).click();await dialogue('epilogue:E-02');await scene('epilogue:E-03');
 await button('Talk to Muling',page.locator('.sg-prologue-guide')).click();await dialogue('epilogue:E-03');
 const key=page.locator('.res-key-piece'),board=page.locator('.res-key-board');await key.waitFor();await shot('E-03-key');const k=await key.boundingBox(),b=await board.boundingBox();
 const from={x:k.x+k.width/2,y:k.y+k.height/2},to={x:b.x+b.width*.77,y:b.y+b.height*.54};
 if(options.hasTouch){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[to]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}else{await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:10});await page.mouse.up();}
 await page.getByRole('heading',{name:'THE BELL RINGS AGAIN'}).waitFor();await shot('complete-ending');await button('Return to Sunlit Garden').click();assert.ok((await view()).ending);
 await button('Continue exploring',page.locator('.sg-prologue-guide')).click();
 const repairs=[
 ['harbor',['Left mirror','Center mirror','Center mirror','Right mirror'],['Jiedeng','Qilan']],
 ['forest',['Upstream','Branch','Roots'],['Yahe','Yuchuan']],
 ['forge',['Heat','Heat','Heat','Heat','Vent'],['Jinpo','Xiaomao']],
 ['sky',['Climb','Descend','Climb'],['Lingyu','Yuanfan']],
 ['library',['Calendar','Testimony','Record'],['Moye','Baikan']],
 ['starfall',['Outer ring','Middle ring','Middle ring','Middle ring','Inner ring'],['Xingya','Lichuan']]];
 for(const [region,inputs,npcs] of repairs){await gotoRegion(region);await puzzle('Muling’s letter · Repair the sanctuary',inputs);for(const n of npcs){const control=button('Invite to garden: '+n);await control.click();await control.waitFor({state:'hidden'});}await page.waitForFunction(r=>CatBondResonance.view().postgame.includes('postgame:reunion-'+r),region);await shot('postgame-'+region);}
 await gotoRegion('starfall');await beginBattle('Star Bell Ruins · Legendary challenge');await shot('postgame-ruins');await finishBattle();await page.locator('#cr-ok,#battle-recovery-ok').click();assert.equal((await view()).postgame.length,13);
 await beginBattle('Star Bell Ruins · Duo Promise challenge');await shot('postgame-duo-ruins');await finishBattle();await page.locator('#cr-ok,#battle-recovery-ok').click();assert.ok((await view()).ruins.duoClears>=1,'Earn a real Duo Promise ruins victory');
 const saved=await page.evaluate(()=>({returned:CatBondResonance.view().returned.length,cats:State.S.cats.map(c=>c.uid),coins:State.S.coins,postgame:CatBondResonance.view().postgame,ruins:CatBondResonance.view().ruins.clears}));assert.equal(saved.returned,12);
 await button('Sunlit Garden',page.locator('.rw-head')).click();await page.waitForFunction(()=>__game.scene==='yard');await shot('postgame-garden');
 await page.reload();await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();await page.waitForFunction(()=>CatBondResonance.view().ending);
 assert.deepEqual(await page.evaluate(()=>({returned:CatBondResonance.view().returned.length,cats:State.S.cats.map(c=>c.uid),coins:State.S.coins,postgame:CatBondResonance.view().postgame,ruins:CatBondResonance.view().ruins.clears})),saved);await shot('postgame-reloaded');
 await button('Garden Restoration',page.locator('.sg-prologue-guide')).click();await page.locator('[data-garden-project="starfall"]').click();const restoreMemorial=page.locator('[data-restore-project="starfall"]');if(await restoreMemorial.count())await restoreMemorial.click();await page.locator('[data-tend-project="starfall"]').waitFor();const oldVisits=await page.evaluate(()=>GardenProjects.progress().find(p=>p.id==='starfall').visits);await page.locator('[data-tend-project="starfall"]').click();await page.waitForFunction(v=>GardenProjects.progress().find(p=>p.id==='starfall').visits>v,oldVisits,{timeout:60000});await shot('postgame-real-garden-care');
 assert.ok(naturalDefeat,'Actual defeat remains unverified if player had to withdraw');
 return {normalFullPlaythrough:true,stagingCinematics:true,naturalDefeat,usedDuo,usedPromise,openingShots,endingShots,epilogueShots,postgame:saved.postgame.length,returned:saved.returned};
}
