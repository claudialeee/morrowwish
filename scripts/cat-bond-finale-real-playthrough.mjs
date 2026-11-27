import {captureExperienceMilestone} from './cat-bond-experience-recorder.mjs';
// Normal-player continuation from the fresh-slot Harbor/Forest browser playthrough.
// No save/evidence writes, injected story state, debug combat launch, or engine calls.
// Read-only snapshots assert outcomes. Candidate cinematics are enabled ONLY in
// this isolated browser, and must not count as production art approval.
import assert from 'node:assert/strict';
export async function continueToFinale({page,context,options,name,button,scene,shot,puzzle,travel,ship,skyFlight,startAtFinale=false}){
 const view=()=>page.evaluate(()=>CatBondResonance.view());
 const check=(op)=>page.waitForFunction(op=>!CatBondResonance.view().objective.includes(op),op);
 const log=async(id)=>{console.log(name,'NORMAL PLAYER',id,JSON.stringify(await page.evaluate(()=>({scene:CatBondResonance.view().current?.id,links:CatBondResonance.view().links,melodies:CatBondResonance.view().melodies.length,ending:CatBondResonance.view().ending}))));await shot(id.replaceAll(':','-'));};
 async function dialogue(id,choice){
  const panel=page.locator('.res-host[data-scene="'+id+'"]');
  for(let i=0;i<30;i++){
   const v=await view();if(v.current?.id!==id)return;
   const canChoose=!v.choice&&v.current.choices.length&&(v.current.choiceTiming==='beforeAction'||v.cursor===v.current.lines.length);
   if(!canChoose&&(!v.lineReady||v.cursor>=v.current.lines.length)){if(id==='epilogue:E-03'){await page.locator('.res-key-piece').waitFor();return;}if(await panel.isVisible()&&!await panel.locator('.res-key-panel').isVisible()){const close=button('Close',panel);if(await close.isVisible())await close.click();}return;}
   if(!await panel.isVisible()){const screen=await page.evaluate(()=>({scene:__game.scene,mode:WorldMap.mode}));if(screen.scene==='yard')await button('Talk to Muling',page.locator('.sg-prologue-guide')).click();else if(screen.mode==='map')await button('Journal').click();else {const continuation=button('Continue story',page.locator('.rw-world-actions'));if(canChoose&&v.current.choiceTiming==='beforeAction'){const actor=v.current.choices.find(c=>c.label.en===choice)||v.current.choices[0];const npc=await page.evaluate(id=>CatBondResonance.npcProfile(id)?.name?.en,actor.npc);if(!npc)throw Error('No actor for choice '+id);await button('Talk to '+npc).or(button('Invite '+npc)).click();}else await continuation.click();}await panel.waitFor();}
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
 async function finishBattle(timeout=300000){await page.waitForFunction(()=>__game.scene!=='battle',null,{timeout});const result=page.locator('#cb-finale-result');let outcome=null;if(await result.isVisible()){outcome=await result.getAttribute('data-finale-outcome');assert.ok(outcome,'Finale result must expose its actual outcome');await shot('finale-result-'+Date.now());await result.locator('[data-finale-return]').click();}return outcome;}
 async function forgeFight(){
  await beginBattle('Forge guardian');await shot('forge-real-guardian');
  for(let n=0;n<180;n++){if(await page.locator('#cb-forge-result').isVisible())break;const support=page.locator('[data-forge-support-button]');if(await support.isVisible()&&await support.isEnabled())await support.click();await page.waitForTimeout(850);}
  await page.locator('#cb-forge-result').waitFor({timeout:180000});await shot('forge-real-result');await page.locator('[data-forge-return]').click();await check('battle:forge-guardian');
 }
 async function ensureDuo(returnRegion='Emberforge City'){
  for(let attempt=0;attempt<3&&(await page.evaluate(()=>State.S.cats.length))<2;attempt++){
   await beginBattle('Approach wild cat');await finishBattle();const close=page.locator('#cr-ok,#battle-recovery-ok');await close.waitFor();await close.click();
  }
  assert.ok(await page.evaluate(()=>State.S.cats.length>=2),'Obtain two cats through normal capture');
  const earned=await page.evaluate(()=>{const p=CatRelations.chosen();return p.length===2&&CatRelations.memoryList(...p).includes('sakura')&&CatRelations.pair(...p).value>=20;});
  if(earned)return;
  await travel('Rootsleep Forest');
  const memory=button('Promise Under Petals');await memory.waitFor();await memory.click();await page.locator('#panel.open').waitFor();
  await shot('earned-duo-promise');await button('Explore more',page.locator('#panel')).click();await page.locator('#panel.open').waitFor({state:'hidden'});
  assert.ok(await page.evaluate(()=>{const p=CatRelations.chosen();return p.length===2&&CatRelations.memoryList(...p).includes('sakura')&&CatRelations.pair(...p).value>=20;}),'Actual forest duo promise');
  await travel(returnRegion);
 }
 const regions={harbor:'Misttide Harbor',forest:'Rootsleep Forest',forge:'Emberforge City',sky:'Skyspine Isles',library:'Moonmirror Library',starfall:'Starfall Expanse',finale:'Star Bell'};
 async function gotoRegion(region){if(await page.evaluate(()=>WorldMap.mode==='region'&&WorldMap.currentRegion)===region)return;if(await page.evaluate(()=>WorldMap.mode==='map'))await button(regions[region]).click();else await travel(regions[region]);await page.waitForFunction(r=>WorldMap.currentRegion===r&&WorldMap.mode==='region',region);}
 if(!startAtFinale){
 await ensureDuo();
 await puzzle('Safety blueprint',['Frame','Pipes','Valve']);await dialogue('forge:E-02','Publish the accident record now');
 await scene('forge:E-03');await puzzle('Furnace controls',['Heat','Heat','Heat','Heat','Vent','Vent','Vent']);await dialogue('forge:E-03');await forgeFight();
 await dialogue('forge:E-03');await scene('forge:E-04');
 await restore('Hearth sanctuary',['Heat','Heat','Heat','Heat','Vent'],['Jinpo','Xiaomao'],'Song of Ember',['Flower bell · High','Starlight · Middle','Dew · Low'],'forge');
 await dialogue('forge:E-04');await scene('sky:S-01');await log('chapter-3-clear');
 await travel('Skyspine Isles');await talk('sky:S-01','Yuanfan');await scene('sky:S-02');
 await button('Flight recorder').click();await check('explore:flight-recorder');await dialogue('sky:S-02');
 await talk('sky:S-03','Yuanfan','Let Yuanfan lead');await puzzle('Joint gliding platform',['Descend','Climb','Descend']);await dialogue('sky:S-03');
 await talk('sky:S-04','Muling');await scene('sky:S-05');
 await restore('Windwing sanctuary',['Climb','Descend','Climb'],['Lingyu','Yuanfan'],'Open Sky',['Starlight · Middle','Flower bell · High','Dew · Low'],'sky');
 await scene('library:M-01');await log('chapter-4-clear');
 await travel('Moonmirror Library');await talk('library:M-01','Moye');await scene('library:M-02');
 await puzzle('Mirror records',['Testimony','Calendar','Record']);await talk('library:M-03','Muling');
 await scene('library:M-04');await button('Routing record').click();await check('explore:routing-record');await dialogue('library:M-04',"I want to understand, but it doesn't change what you did");
 await scene('library:M-05');await talk('library:M-05','Muling','Release all records now');
 await restore('Moonmirror sanctuary',['Calendar','Testimony','Record'],['Moye','Baikan'],'Reflections',['Flower bell · High','Dew · Low','Starlight · Middle'],'library');
 await dialogue('library:M-05');await scene('starfall:F-01');await log('chapter-5-clear');
 await travel('Starfall Expanse');await talk('starfall:F-01','Xingya');await scene('starfall:F-02');
 await puzzle('Star chart',['Outer ring','Outer ring','Outer ring','Middle ring','Inner ring','Inner ring']);await button('Catastrophe record').click();await check('explore:catastrophe-record');
 await talk('starfall:F-03','Muling');await scene('starfall:F-04');await scene('starfall:F-04');await button('Invite Xingya').or(button('Talk to Xingya')).click();await dialogue('starfall:F-04','Let Xingya coordinate repairs');
 await puzzle('Distributed observatory',['West','Relay','East']);
 await restore('Starfall sanctuary',['Outer ring','Middle ring','Middle ring','Middle ring','Inner ring'],['Xingya','Lichuan'],'Beyond Stars',['Dew · Low','Starlight · Middle','Flower bell · High'],'starfall');
 const ready=await view();assert.equal(ready.ring,true);assert.equal(ready.cargoComplete,false);assert.ok(ready.support.every(s=>s.ready));
 await gotoRegion('starfall');await dialogue('starfall:F-04');await scene('starfall:F-05');
 assert.ok((await view()).ring);assert.equal((await view()).melodies.length,6);await log('chapter-6-real-ring');
 }
 // Staging assets are allowed only in the explicit loopback development session.
 await page.waitForFunction(()=>CatBondChapterCinematics.starfallReleaseReady()||CatBondChapterCinematics.developmentReady(),null,{timeout:15000});
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
 const openingShots=startAtFinale?null:await cinematic('starfall:F-05');await scene('finale:B-01');
 // The combined normal-player route has its own Chapter III–VI driver.
 // It does not call ensureDuo() above. Earn the actual optional forest
 // promise in the same save before attempting its finale-only effect.
 if(startAtFinale){await gotoRegion('starfall');await ensureDuo('Starfall Expanse');}
 await gotoRegion('finale');
 assert.equal(await page.evaluate(()=>State.S.resonanceExploration.location),'finale','Independent finale location');
 assert.ok(await page.evaluate(()=>{const p=CatRelations.chosen();return p.length===2&&CatRelations.memoryList(...p).includes('sakura');}),'Earned forest promise before finale');
 // Earlier chapters may have saved the strongest roster rather than the
 // pledged pair. Put the two actual cats on the field through the Book's
 // normal roster controls; never edit the save or the combat team directly.
 const pairIds=await page.evaluate(()=>CatRelations.chosen().map(c=>c.uid));
 const teamIds=await page.evaluate(()=>UI.getPreferredBattleTeam().map(c=>c.uid));
 if(!pairIds.every(uid=>teamIds.slice(0,2).includes(uid))){
  await button('Resonance Book',page.locator('.rw-head')).click();
  await page.locator('[data-book-tab="party"]').click();
  const roster=teamIds.slice();
  for(const [position,uid] of pairIds.entries()){
   if(!roster.includes(uid)){
    await page.locator('.map-squad-choice[data-uid="'+uid+'"]').click();
    if(roster.length>=5)roster[roster.length-1]=uid;else roster.push(uid);
   }
   for(let i=roster.indexOf(uid);i>position;i--){
    await page.locator('#panel [data-order-index="'+i+'"][data-order-shift="-1"]').click();
    [roster[i-1],roster[i]]=[roster[i],roster[i-1]];
   }
  }
  await page.locator('#map-squad-save').click();await page.locator('#panel.open').waitFor({state:'hidden'});
 }
 assert.ok(await page.evaluate(()=>{const p=CatRelations.chosen();return p.every(c=>UI.getPreferredBattleTeam().slice(0,2).some(t=>t.uid===c.uid));}),'Both pledged cats must be on the actual starting team');
 const before=await page.evaluate(()=>JSON.stringify(State.S.resonance));await beginBattle('Approach the Star Bell');
 await shot('B-01-retreat');assert.equal(await page.locator('[data-finale-regions] meter').count(),6);await page.locator('#btn-flee').click();assert.equal(await finishBattle(),'withdrawal','Actual retreat result');
 assert.equal(await page.evaluate(()=>WorldMap.currentRegion),'finale','Retreat returns to the Star Bell, not Starfall');
 assert.equal(await page.evaluate(()=>JSON.stringify(State.S.resonance)),before,'Retreat must not award any story progress');
 await beginBattle('Approach the Star Bell');await shot('B-01-inward-locks');assert.equal(await finishBattle(),'saved','B-01 victory must save');await check('battle:inward-gates');await dialogue('finale:B-01');await scene('finale:B-02');
 await beginBattle('Approach the Star Bell',false);
 await page.locator('[data-finale-clue]').click();await page.waitForFunction(()=>__game.battle?.enemies?.filter(e=>e.alive).every(e=>Number.isFinite(e.echoGap)));
 await shot('B-02-catdex');
 if(name==='portrait'){
  const fit=await page.evaluate(()=>{
   const panel=document.getElementById('cb-finale-hud'),rect=panel.getBoundingClientRect(),frame=document.getElementById('battle-ui').getBoundingClientRect();
   const visible=el=>el.getClientRects().length&&!el.hidden&&getComputedStyle(el).visibility!=='hidden';
   const overlap=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
   const controls=[...document.querySelectorAll('#battle-ui .move-bar .move,#battle-touch-joystick,#duo-burst,#ult-wrap,#battle-squad-rail')].filter(visible);
   return {inside:rect.top>=frame.top-1&&rect.bottom<=frame.bottom+1&&rect.left>=frame.left-1&&rect.right<=frame.right+1,clear:controls.every(el=>!overlap(rect,el.getBoundingClientRect()))};
  });assert.deepEqual(fit,{inside:true,clear:true},'Portrait Catdex must not cover battle controls or team rails');
 }
 const targets=await page.evaluate(()=>{const list=__game.battle.enemies.filter(e=>e.alive&&e.echoCat&&State.S.dex[e.echoCat.species]>0);return {genuine:list.find(e=>Math.abs(e.echoGap-e.echoHabit)<.2)?.i,falseReply:list.find(e=>Math.abs(e.echoGap-e.echoHabit)>.2)?.i};});
 assert.ok(Number.isInteger(targets.genuine)&&Number.isInteger(targets.falseReply),'Real recorded pair with measured rhythms');
 await page.locator('[data-finale-focus] [data-echo="'+targets.genuine+'"]').click();
 await page.waitForFunction(()=>__game.battle?.resonanceFinale?.wrongCount>0);await shot('B-02-wrong-reply');
 await page.locator('[data-finale-focus] [data-echo="'+targets.falseReply+'"]').click();
 await page.waitForFunction(i=>__game.battle.enemies.find(e=>e.i===i)?.dexVerified,targets.falseReply);await shot('B-02-verified-reply');
 // Identify the other measured false replies using the actual manual Catdex
 // buttons before attacking. An automatic win can finish before a charged
 // skill gets used, so specifically exercise the player's manual Duo control.
 const remaining=await page.evaluate(()=>__game.battle.enemies.filter(e=>e.alive&&!e.dexVerified&&Number.isFinite(e.echoGap)&&Math.abs(e.echoGap-e.echoHabit)>.2).map(e=>e.i));
 for(const i of remaining){await page.locator('[data-finale-focus] [data-echo="'+i+'"]').click();await page.waitForFunction(i=>__game.battle.enemies.find(e=>e.i===i)?.dexVerified,i);}
 const duo=page.locator('#duo-burst');await duo.waitFor();
 await page.waitForFunction(()=>{const b=__game.battle,el=document.getElementById('duo-burst');return b?.resonanceFinale?.id==='finale:B-02'&&el&&!el.hidden&&!el.disabled;},null,{timeout:45000});
 await duo.click();
 await page.waitForFunction(()=>__game.battle?.duoUses>0&&__game.battle?.resonanceFinale?.echoQuietUntil>0,null,{timeout:15000});
 const usedDuo=true,usedPromise=true;await shot('B-02-duo');
 await page.locator('#btn-auto').click();
 assert.equal(await finishBattle(),'saved','B-02 victory must save');await check('battle:identify-echo');assert.ok(usedDuo&&usedPromise,'Actual duo cast and promise interruption in B-02');
 await dialogue('finale:B-02');await scene('finale:B-03');
 await beginBattle('Approach the Star Bell',false);await shot('B-03-unprotected');
 // Ordinary retreat/defeat input only: no battle.finish(), HP or position writes.
 let naturalDefeat=false;const deadline=Date.now()+90000;
 while(Date.now()<deadline){const a=await page.evaluate(()=>{const b=__game.battle;return b?{f:b.resonanceFinale?.failedProtection,allDown:b.team.every(x=>!x.alive)}:null});if(!a||a.f||a.allDown)break;await page.waitForTimeout(500);}
 if(await page.locator('#battle-ui.on').isVisible()&&Date.now()>=deadline)await page.locator('#btn-flee').click();
 const defeatOutcome=await finishBattle();naturalDefeat=['protection-defeat','party-defeat'].includes(defeatOutcome);console.log(name,'B-03 REAL DEFEAT',defeatOutcome);
 assert.ok(naturalDefeat,'B-03 must show an actual defeat, not a withdrawal or missing battle');
 assert.ok((await view()).objective.includes('battle:central-echo'),'Uncompleted support cannot commit victory');
 const rewardBefore=await page.evaluate(()=>State.S.coins);await beginBattle('Approach the Star Bell');await shot('B-03-ring');assert.equal(await page.locator('[data-finale-regions] meter').count(),6);
 const supported=new Set();for(let i=0;i<360;i++){const a=await page.evaluate(()=>__game.battle?.resonanceFinale?.nodes?.filter(n=>n.done).map(n=>n.region)||null);if(!a)break;for(const x of a)if(!supported.has(x)){supported.add(x);await shot('B-03-support-'+x);}await page.waitForTimeout(400);}
 assert.equal(await finishBattle(),'saved','B-03 victory must save');await check('battle:central-echo');assert.equal((await view()).completed.includes('finale:B-03'),false);assert.equal((await page.evaluate(()=>CatBondResonance.snapshot().support)).length,6);assert.equal(await page.evaluate(()=>State.S.coins),rewardBefore+180);await dialogue('finale:B-03');
 await button('Help Muling release the last lock').click();const latch=button('Hold the bell chain');await latch.waitFor();
 // Releasing early or canceling must leave the objective unchanged.
 const holdLatch=async duration=>{const rect=await latch.boundingBox();const point={x:Math.round(rect.x+rect.width/2),y:Math.round(rect.y+rect.height/2)};if(options.hasTouch){const cdp=await context.newCDPSession(page);try{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await page.waitForTimeout(duration);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}finally{await cdp.detach();}}else{await latch.focus();await page.keyboard.down('Space');try{await page.waitForTimeout(duration);}finally{await page.keyboard.up('Space');}}};
 await holdLatch(250);assert.ok((await view()).objective.includes('mechanism:muling-unlock'),'Short hold cannot complete the final latch');await button('Back',page.locator('.res-finale-latch')).click();await page.locator('.res-finale-latch').waitFor({state:'detached'});assert.ok((await view()).objective.includes('mechanism:muling-unlock'),'Cancel cannot grant completion');await button('Help Muling release the last lock').click();await latch.waitFor();await holdLatch(1800);await scene('finale:B-04');
 const endingShots=await cinematic('finale:B-04'),epilogueShots=await cinematic('epilogue:E-01');
 await page.waitForFunction(()=>__game.scene==='yard');await scene('epilogue:E-02');
 await button('Talk to Muling',page.locator('.sg-prologue-guide')).click();await dialogue('epilogue:E-02');await scene('epilogue:E-03');
 await button('Talk to Muling',page.locator('.sg-prologue-guide')).click();await dialogue('epilogue:E-03');
 const key=page.locator('.res-key-piece'),board=page.locator('.res-key-board');await key.waitFor();await shot('E-03-key');const k=await key.boundingBox(),b=await board.boundingBox();
 const from={x:k.x+k.width/2,y:k.y+k.height/2},to={x:b.x+b.width*.77,y:b.y+b.height*.54};
 if(options.hasTouch){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[to]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}else{await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:10});await page.mouse.up();}
 await page.getByRole('heading',{name:'THE BELL RINGS AGAIN'}).waitFor();await shot('complete-ending');await button('Return to Sunlit Garden').click();assert.ok((await view()).ending);
 await captureExperienceMilestone(page,'ending');
 await button('Continue exploring',page.locator('.sg-prologue-guide')).click();
 const repairs=[
 ['harbor',['Left mirror','Center mirror','Center mirror','Right mirror'],['Jiedeng','Qilan']],
 ['forest',['Upstream','Branch','Roots'],['Yahe','Yuchuan']],
 ['forge',['Heat','Heat','Heat','Heat','Vent'],['Jinpo','Xiaomao']],
 ['sky',['Climb','Descend','Climb'],['Lingyu','Yuanfan']],
 ['library',['Moon window','Neighbor bridge','Reciprocal reply'],['Moye','Baikan']],
 ['starfall',['Outer ring','Middle ring','Middle ring','Middle ring','Inner ring'],['Xingya','Lichuan']]];
 for(const [region,inputs,npcs] of repairs){await gotoRegion(region);if(region==='sky'&&skyFlight)await skyFlight('Muling’s letter · Repair the sanctuary',[.67,.30,.64]);else await puzzle('Muling’s letter · Repair the sanctuary',inputs);for(const n of npcs){const control=button('Invite to garden: '+n);await control.click();await control.waitFor({state:'hidden'});}await page.waitForFunction(r=>CatBondResonance.view().postgame.includes('postgame:reunion-'+r),region);await shot('postgame-'+region);}
 await gotoRegion('starfall');
 async function ruinsVictory(label,duoMode){
  for(let attempt=1;attempt<=3;attempt++){
   const prior=(await view()).ruins;
   await beginBattle(label,!duoMode);await shot((duoMode?'postgame-duo-ruins':'postgame-ruins')+'-'+attempt);
   assert.ok(await page.evaluate(()=>!!__game.battle?.postgameRuins),'Real ruins encounter must be attached to battle');
   if(duoMode){
    await page.waitForFunction(()=>{const b=__game.battle,el=document.getElementById('duo-burst');return b?.postgameRuins?.promised&&el&&!el.hidden&&!el.disabled;},null,{timeout:45000});
    await page.locator('#duo-burst').click();
    await page.waitForFunction(()=>__game.battle?.duoUses>0,null,{timeout:15000});
    await page.locator('#btn-auto').click();
   }
   const deadline=Date.now()+300000;
   while(await page.locator('#battle-ui.on').isVisible()){
    if(Date.now()>deadline)throw Error('Ruins battle timeout '+label);
    const support=page.locator('#cb-region-combat button');
    if(await support.isVisible()&&await support.isEnabled())await support.click();
    await page.waitForTimeout(600);
   }
   await finishBattle();const outcome=page.locator('[data-ruins-result]');await outcome.waitFor();
   const result=await outcome.getAttribute('data-ruins-result');await shot('ruins-result-'+(duoMode?'duo':'legendary')+'-'+attempt);
   console.log(name,'RUINS RESULT',label,attempt,result,JSON.stringify((await view()).ruins));
   assert.notEqual(result,'save-failed','Real victory must persist its ruins reward');
   if(result==='saved'){
    await page.locator('#cr-ok').waitFor();assert.equal((await view()).ruins.clears,prior.clears+1);
    if(duoMode){assert.equal(await outcome.getAttribute('data-ruins-duo'),'true');assert.equal((await view()).ruins.duoClears,prior.duoClears+1);}
    await page.locator('#cr-ok').click();return;
   }
   assert.equal(result,'defeat');assert.deepEqual((await view()).ruins,prior,'Defeat grants no ruins progress');
   await page.locator('#battle-recovery-ok').click();
  }
  throw Error('No real victory after three player retries: '+label);
 }
 await ruinsVictory('Star Bell Ruins · Legendary challenge',false);assert.equal((await view()).postgame.length,13);
 await ruinsVictory('Star Bell Ruins · Duo Promise challenge',true);assert.ok((await view()).ruins.duoClears>=1,'Earn a real Duo Promise ruins victory');
 const saved=await page.evaluate(()=>({returned:CatBondResonance.view().returned.length,cats:State.S.cats.map(c=>c.uid),coins:State.S.coins,postgame:CatBondResonance.view().postgame,ruins:CatBondResonance.view().ruins.clears}));assert.equal(saved.returned,12);
 await button('Sunlit Garden',page.locator('.rw-head')).click();await page.waitForFunction(()=>__game.scene==='yard');await shot('postgame-garden');
 await page.reload();await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();await page.waitForFunction(()=>CatBondResonance.view().ending&&__game.scene==='yard');
 assert.deepEqual(await page.evaluate(()=>({returned:CatBondResonance.view().returned.length,cats:State.S.cats.map(c=>c.uid),coins:State.S.coins,postgame:CatBondResonance.view().postgame,ruins:CatBondResonance.view().ruins.clears})),saved);await shot('postgame-reloaded');
 await button('Garden Restoration',page.locator('.sg-prologue-guide')).click();await page.locator('[data-garden-project="starfall"]').click();const restoreMemorial=page.locator('[data-restore-project="starfall"]');if(await restoreMemorial.count())await restoreMemorial.click();await page.locator('[data-tend-project="starfall"]').waitFor();const oldVisits=await page.evaluate(()=>GardenProjects.progress().find(p=>p.id==='starfall').visits);await page.locator('[data-tend-project="starfall"]').click();await page.waitForFunction(v=>GardenProjects.progress().find(p=>p.id==='starfall').visits>v,oldVisits,{timeout:60000});await shot('postgame-real-garden-care');
 await captureExperienceMilestone(page,'postgame');
 assert.ok(naturalDefeat,'Actual defeat remains unverified if player had to withdraw');
 return {normalFullPlaythrough:true,stagingCinematics:true,naturalDefeat,usedDuo,usedPromise,openingShots,endingShots,epilogueShots,postgame:saved.postgame.length,returned:saved.returned};
}
