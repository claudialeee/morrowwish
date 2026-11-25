import {chromium} from "playwright";
import assert from "node:assert/strict";
const origin="http://127.0.0.1:8765";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const failures=[];
try{
 for(const [name,viewport,mobile] of [["desktop",{width:1280,height:820},false],["portrait",{width:390,height:844},true],["landscape",{width:844,height:390},true]]){
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
  // QA never contacts production metrics/cloud saves or other external services.
  await context.route("**/*",route=>route.request().url().startsWith(origin+"/")&&!route.request().url().includes("/api/")?route.continue():route.abort());
  const p=await context.newPage(),errors=[];
  p.on("pageerror",e=>errors.push(e.message));
  try{
   await p.goto(origin+"/cat-bond/?lang=en&combat=forge",{waitUntil:"domcontentloaded"});
   await p.waitForFunction(()=>!!window.__game&&!!window.CatBondForgeCombat,{timeout:20000});
   await p.locator("#intro-start").click();
   await p.locator('#intro-slot-list [data-slot="slot1"]').click();
   await p.locator("#panel.open .dex-cell").first().click();
   const skip=p.locator(".cb-story-overlay.is-visible .cb-story-skip");
   if(await skip.count())await skip.first().click({timeout:12000});
   await p.waitForFunction(()=>window.__game?.battle?.storyEncounterId==="forge:E-03",{timeout:30000});
   const close=p.locator("#battle-help-close");
   if(await close.isVisible())await close.click();
   await p.waitForFunction(()=>!window.__game.battleHelpOpen,{timeout:12000});
   assert.equal(await p.locator("#cb-forge-hud").count(),1);
   const overlap=await p.evaluate(()=>{const a=document.querySelector(".battle-topbar").getBoundingClientRect(),b=document.querySelector("#cb-forge-hud").getBoundingClientRect();return b.top<a.bottom&&b.bottom>a.top&&b.left<a.right&&b.right>a.left;});assert.equal(overlap,false,"Mechanic HUD must not overlap battle controls");
   const before=await p.evaluate(()=>({heat:__game.battle.forgeState.heat,charges:__game.battle.forgeState.supportCharges,coins:State.S.coins}));
   await p.locator("[data-forge-support-button]").click();
   await p.waitForFunction(()=>__game.battle.forgeState.supportCharges===1&&__game.battle.forgeState.ventOpen>0);
   await p.screenshot({path:"/tmp/cat-bond-rpg-"+name+"-forge.png"});
   const after=await p.evaluate(()=>({heat:__game.battle.forgeState.heat,charges:__game.battle.forgeState.supportCharges,canvas:document.querySelector("#scene").getBoundingClientRect().toJSON()}));
   assert.equal(before.charges,2);assert.equal(after.charges,1);assert.ok(after.heat<before.heat+1);assert.ok(after.canvas.width<=viewport.width+2);
   if(!await p.evaluate(()=>__game.battle.autoMode))await p.locator("#btn-auto").click();
   await p.waitForFunction(()=>__game.battle?.autoMode===true);
   const initial=await p.evaluate(()=>__game.battle.forgeState.elapsed);
   await p.waitForFunction(t=>__game.battle?.forgeState.elapsed>t+2,initial,{timeout:20000});
   await p.locator("#btn-flee").click();
   await p.locator("#cb-forge-result").waitFor({state:"visible",timeout:15000});
   assert.match(await p.locator("#cb-forge-result h2").innerText(),/WITHDRAWN|撤退/);
   await p.screenshot({path:"/tmp/cat-bond-rpg-"+name+"-withdrawn.png"});
   assert.equal(await p.evaluate(()=>State.S.coins),before.coins,"Preview cannot pay story rewards");
   await p.locator("[data-forge-retry]").click();
   await p.waitForFunction(()=>__game.battle?.forgeState.supportCharges===2,{timeout:15000});
   await p.locator("#btn-flee").click();
   await p.locator("[data-forge-return]").click();
   await p.waitForFunction(()=>__game.scene==="map"&&!__game.battle);
   assert.equal(await p.locator("#cb-forge-hud").count(),0);
   assert.deepEqual(errors,[],"Uncaught runtime errors");
   console.log(name+" PASS: real browser start, NPC support, auto mode, battle clock, retreat, retry, return");
  }catch(e){failures.push(name+": "+e.message+"; page errors: "+errors.join(" | "));console.error(failures.at(-1));await p.screenshot({path:"/tmp/cat-bond-rpg-"+name+"-failure.png"}).catch(()=>{});}
  finally{await context.close();}
 }
}finally{await browser.close();}
if(failures.length)throw Error(failures.join("\n"));
