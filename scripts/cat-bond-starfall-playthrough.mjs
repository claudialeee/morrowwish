// Normal-player continuation of the fresh-slot Harbor/Forest/Forge browser run.
// All game progression uses visible controls. Browser evaluation only reads state or checks rendered content.
import assert from "node:assert/strict";
export async function playStarfallFromForge({page,button,scene,shot,puzzle,readDialogue,travel,ship,profile}){
 const get=()=>page.evaluate(()=>CatBondResonance.view());
 const objective=op=>page.waitForFunction(op=>!CatBondResonance.view().objective.includes(op),op);
 const talk=async(name,id,choice)=>{await button("Talk to "+name).click();await readDialogue(id,choice)};
 const invite=async name=>{await button("Invite "+name).click();await button("Invite "+name).waitFor({state:"hidden"})};
 const chapterDialog=async(id,choice)=>{
  const overlay=page.locator('.res-host[data-scene="'+id+'"]');
  if(!await overlay.isVisible()){await button("Journal").click();await overlay.waitFor();}
  await readDialogue(id,choice);
 };
 const observe=async(id)=>{
  const overlay=page.locator('.res-host[data-scene="'+id+'"]');
  await overlay.waitFor();
  const expected=(await get()).current.lines;
  for(let i=0;i<expected.length;i++){
   await page.waitForFunction(({id,i})=>CatBondResonance.view().current?.id===id&&CatBondResonance.view().cursor===i,{id,i});
   await page.waitForFunction(text=>document.querySelector(".res-host .res-line")?.textContent===text,expected[i].text.en);
   const portrait=overlay.locator(".res-portrait");
   if(await portrait.isVisible())await portrait.evaluate(img=>img.decode());
   if(i===0||i===8){await shot(id.replace(":","-")+"-en-"+i);await overlay.locator("[data-res-language]").click();await page.waitForFunction(text=>document.querySelector(".res-host .res-line")?.textContent===text,expected[i].text.zh);await shot(id.replace(":","-")+"-zh-"+i);await overlay.locator("[data-res-language]").click();}
   await button("Continue",overlay).click();
  }
  return expected.length;
 };
 const movie=async(label,id,next)=>{
  await button(label).click();
  await page.locator(".res-chapter-cinematic .cbcp-art").first().waitFor({timeout:20000});
  await page.locator(".res-chapter-cinematic .cbcp-art").first().evaluate(img=>img.decode());
  await shot(id.replace(":","-")+"-cinematic-en");
  await page.locator(".res-chapter-cinematic .cbcp-language").click();
  await page.waitForFunction(()=>MorrowwishI18n.get()==="zh");
  await shot(id.replace(":","-")+"-cinematic-zh");
  await page.locator(".res-chapter-cinematic .cbcp-language").click();
  await scene(next);
 };
 // Complete remaining earlier chapters from the actual normal-flow save.
 await puzzle("Safety blueprint",["Frame","Pipes","Valve"]);
 await chapterDialog("forge:E-02","Publish the accident record now");
 await scene("forge:E-03");
 await puzzle("Furnace controls",["Heat","Heat","Heat","Heat","Vent","Vent","Vent"]);
 await chapterDialog("forge:E-03");
 await button("Forge guardian").click();
 await page.locator("#bp-go").click();
 await page.locator("#battle-ui.on").waitFor();
 const tutorial=page.locator("#battle-tutorial-skip");if(await tutorial.isVisible())await tutorial.click();
 if(!await page.evaluate(()=>__game.battle.autoMode))await page.locator("#btn-auto").click();
 await shot("forge-guardian");
 const result=page.locator("#cb-forge-result");const support=page.locator("[data-forge-support-button]");
 for(let i=0;i<100&&!await result.isVisible();i++){if(await support.isVisible()&&await support.isEnabled())await support.click();await page.waitForTimeout(2000);}
 await result.waitFor({timeout:60000});
 assert.ok((await get()).completed.includes("forge:E-03")||!(await get()).objective.includes("battle:forge-guardian"),"Forge guardian must actually be won");
 await result.locator("[data-forge-return]").click();
 await scene("forge:E-04");
 await puzzle("Hearth sanctuary",["Heat","Heat","Heat","Heat","Vent"]);
 await invite("Jinpo");await invite("Xiaomao");
 await puzzle("Song of Ember",["High","Middle","Low"]);
 await chapterDialog("forge:E-04");await scene("sky:S-01");
 await travel("Skyspine Isles");await talk("Yuanfan","sky:S-01");await scene("sky:S-02");
 await button("Flight recorder").click();await chapterDialog("sky:S-02");await scene("sky:S-03");
 await talk("Yuanfan","sky:S-03","Let Yuanfan lead");
 await puzzle("Joint gliding platform",["Descend","Climb","Descend"]);await chapterDialog("sky:S-03");await scene("sky:S-04");
 await talk("Muling","sky:S-04");await scene("sky:S-05");
 await puzzle("Windwing sanctuary",["Climb","Descend","Climb"]);await invite("Lingyu");await invite("Yuanfan");
 await puzzle("Open Sky",["Middle","High","Low"]);await scene("library:M-01");
 await travel("Moonmirror Library");await talk("Moye","library:M-01");await scene("library:M-02");
 await puzzle("Mirror records",["Testimony","Calendar","Record"]);await scene("library:M-03");
 await talk("Muling","library:M-03");await scene("library:M-04");
 await button("Routing record").click();await chapterDialog("library:M-04","I need some distance");await scene("library:M-05");
 await talk("Muling","library:M-05","Release all records now");
 await puzzle("Moonmirror sanctuary",["Calendar","Testimony","Record"]);await invite("Moye");await invite("Baikan");
 await puzzle("Reflections",["High","Low","Middle"]);await scene("starfall:F-01");
 // Independent approval is a real release gate, never overridden by QA.
 if(!await page.evaluate(()=>CatBondChapterCinematics.starfallReleaseReady())){await shot("starfall-art-approval-blocked");throw Error("Starfall formal runtime art approval missing for F-02 or F-05; no staging override permitted");}
 // F-01: both resident interactions, not a generic completion.
 await travel("Starfall Expanse");await shot("starfall-arrival");
 const trustBefore=(await get()).trust;await button("Talk to Xingya").click();await objective("npc:central-dispute");assert.equal((await get()).trust.xingya,trustBefore.xingya+1);
 assert.ok((await get()).objective.includes("npc:central-dispute-lichuan"));
 await button("Talk to Lichuan").click();await objective("npc:central-dispute-lichuan");assert.equal((await get()).trust.lichuan,trustBefore.lichuan+1);const disputeLines=await observe("starfall:F-01");
 await scene("starfall:F-02");
 assert.equal(await button("Observatory · Complete record").count(),0);
 await button("Crater · Impact fragment").click();await objective("explore:crater-fragment");
 await button("Hollow Echo illusions").click();const controls=page.locator(".rw-puzzle-controls");await controls.waitFor();await shot("starfall-echo-puzzle");
 await button("Left beacon",controls).click();assert.ok((await get()).objective.includes("puzzle:echo-navigation"));await page.getByText("Recalibrating after an illusion",{exact:false}).waitFor();
 for(const name of ["Middle beacon","Right beacon","Left beacon"])await button(name,controls).click();
 await objective("puzzle:echo-navigation");
 await puzzle("Star chart",["Outer ring","Outer ring","Outer ring","Middle ring","Inner ring","Inner ring"]);
 await button("Ruins · Sanctuary record").click();await objective("explore:ruin-fragment");
 await button("Observatory · Complete record").click();await objective("explore:catastrophe-record");
 await movie("Remember the choice","starfall:F-02","starfall:F-03");
 await button("Talk to Muling").click();const confrontationLines=await observe("starfall:F-03");await scene("starfall:F-04");
 const choice=profile==="portrait"?"Share decisions among settlements":"Let Xingya coordinate repairs";await talk(profile==="portrait"?"Lichuan":"Xingya","starfall:F-04",choice);
 await puzzle("Distributed observatory",["West","Relay","East"]);
 await puzzle("Starfall sanctuary",["Outer ring","Middle ring","Middle ring","Middle ring","Inner ring"]);
 await invite("Xingya");await page.reload();await page.locator("#intro-continue").click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();
 await scene("starfall:F-04");if(await button("Starfall Expanse").isVisible())await button("Starfall Expanse").click();
 await button("Invite Lichuan").waitFor();assert.equal(await button("Invite Xingya").isVisible(),false);
 await invite("Lichuan");const beforeMelody=(await get()).trust;await puzzle("Beyond Stars",["Low","Middle","High"]);const afterMelody=(await get()).trust;assert.equal(afterMelody.xingya,beforeMelody.xingya+1);assert.equal(afterMelody.lichuan,beforeMelody.lichuan+1);
 assert.equal((await get()).ring,false,"Sixth melody cannot replace incomplete cargo");
 assert.equal((await get()).lineReady,false);
 await shot("starfall-missing-exchanges");
 const routes=[
  ["harbor","forest","Beacon-guided supplies","Herbs and waterway map"],
  ["forest","forge","Cooling water and herbs","Pumps and tools"],
  ["forge","sky","Wind vanes and flight parts","Wind data and airship route"],
  ["sky","library","Courier route","Archived flight maps"],
  ["library","starfall","Star chart and coordinates","Astronomical observations"],
  ["starfall","harbor","Navigation bell and star compass","Harbor navigation response"]
 ];
 const names={harbor:"Misttide Harbor",forest:"Rootsleep Forest",forge:"Emberforge City",sky:"Skyspine Isles",library:"Moonmirror Library",starfall:"Starfall Expanse"};
 for(const [a,b,forward,back] of routes){
   const key=a+":"+b;
   for(let i=(await get()).links[key].length;i<4;i++){
    const actor=[a,b,b,a][i],cargo=i<2?forward:back;
    const label=names[actor]+" · "+(i%2?"Receive ":"Send ")+cargo;
    await button(label).click();
    await page.waitForFunction(actor=>WorldMap.mode==="region"&&WorldMap.currentRegion===actor,actor);
    await ship(actor,cargo);
    assert.equal((await get()).links[key].length,i+1,"Only the actual delivery may advance "+key);
   }
 }
 const ready=await get();assert.equal(ready.ring,true);assert.equal(ready.melodies.length,6);assert.equal(ready.sanctuaries.length,6);
 assert.equal(Object.values(ready.links).reduce((n,s)=>n+s.length,0),24);
 assert.ok(ready.support.every(s=>s.ready&&s.received.length===2));
 if(await page.evaluate(()=>WorldMap.currentRegion)!=="starfall")await button("Return to Starfall").click();
 await chapterDialog("starfall:F-04");await scene("starfall:F-05");
 await movie("Watch the story scene","starfall:F-05","finale:B-01");
 await shot("starfall-finale-entry");
 const complete=await get();assert.ok(["F-01","F-02","F-03","F-04","F-05"].every(id=>complete.completed.includes("starfall:"+id)));
 // Reload the exact player slot and enter the real phase-one setup (no battle result injection).
 await page.reload();await page.locator("#intro-continue").click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();
 await scene("finale:B-01");if(await button("Starfall Expanse").isVisible())await button("Starfall Expanse").click();
 await button("Approach the Star Bell").click();await page.locator("#bp-go").waitFor();await shot("finale-battle-setup");
 return {profile,disputeLines,confrontationLines,deliveries:24,melodies:6,sanctuaries:6,restoredSlot:true,finaleEntry:true,normalPlayerFlow:true};
}
