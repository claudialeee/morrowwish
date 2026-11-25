// Real game startup + browser-level integration test. Canonical story fixture is
// deliberate: the independent six-region map and prologue have not been merged.
import assert from "node:assert/strict";
import {chromium} from "playwright";
import fs from "node:fs";
const dir="artifacts/cat-bond-resonance-host";fs.mkdirSync(dir,{recursive:true});
const origin="http://127.0.0.1:8765";
const browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
const profiles=[{name:"desktop",width:1280,height:800,mobile:false,lang:"en",choice:"Comfort Qilan first",npc:"qilan"},{name:"portrait",width:390,height:844,mobile:true,lang:"zh",choice:"先询问岬灯过去的风暴",npc:"jiedeng"},{name:"landscape",width:844,height:390,mobile:true,lang:"en",choice:"Comfort Qilan first",npc:"qilan"}];
try{
 for(const p of profiles){
  const ctx=await browser.newContext({viewport:{width:p.width,height:p.height},deviceScaleFactor:p.mobile?2:1,isMobile:p.mobile,hasTouch:p.mobile});
  const page=await ctx.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
  // Never send telemetry or cloud-save requests to production.
  await page.route("**/*",r=>{const url=new URL(r.request().url());return url.origin!==origin||url.pathname.startsWith("/api/")?r.abort():r.continue()});
  try{
   await page.goto(origin+"/cat-bond/?lang="+p.lang,{waitUntil:"domcontentloaded",timeout:30000});
   await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance&&window.CatBondResonanceNPC,null,{timeout:15000});
   await page.locator("#intro-start").click();
   await page.locator('#intro-slot-list [data-slot="slot1"]').click();
   await page.waitForFunction(()=>window.__CAT_BOND_STARTED__===true,null,{timeout:15000});
   await page.locator("#panel.open .dex-cell").first().click();
   await page.waitForFunction(()=>window.__game?.scene==="map"&&State.S.cats.length>0,null,{timeout:15000});
   assert.equal(await page.evaluate(()=>typeof window.CatBondStory),"undefined","Legacy narrative must not mount");
   assert.equal(await page.locator("#cb-story-tracker").count(),0);assert.equal(await page.evaluate(()=>!!window.CatBondCloudSave),true,"Encrypted cloud API preserved");
   // Fixture advances only through the canonical engine; it is not a release path or fake screenshot.
   await page.evaluate(async()=>{
    const {campaign}=await import("/cat-bond/js/resonance/campaign.mjs"),{makeEngine}=await import("/cat-bond/js/resonance/engine.mjs");
    const e=makeEngine(campaign);
    for(const s of campaign.scenes){
     if(s.id==="harbor:H-02")break;
     for(const op of s.requires)if(!e.record(s.id,op).ok)throw Error("fixture evidence");
     for(const l of s.lines)if(!e.nextLine().ok)throw Error("fixture line");
     if(!e.finish().ok)throw Error("fixture finish");
    }
    State.S.resonance=e.snapshot();State.S.resonanceExploration={location:"harbor",positions:{},interactions:{}};
    if(!State.save().ok)throw Error("fixture save");
    window.dispatchEvent(new CustomEvent("cat-bond-resonance-npc-request",{detail:{sceneId:"harbor:H-02",npcId:"jiedeng",region:"harbor"}}));
   });
   const panel=page.locator(".res-host .res-dialogue");
   await panel.waitFor({state:"visible",timeout:10000});
   await page.waitForFunction(()=>{const root=document.querySelector(".res-host"),line=root?.querySelector(".res-line");if(!root||!line||getComputedStyle(root).opacity!=="1")return false;const b=line.getBoundingClientRect();return !!root.contains(document.elementFromPoint(b.left+b.width/2,b.top+b.height/2))},null,{timeout:5000});
   await page.waitForFunction(()=>document.querySelector(".res-host .res-portrait")?.naturalWidth>100);
   const line=page.locator(".res-host .res-line");
   assert.match(await line.textContent(),p.lang==="zh"?/灯亮了/:/If the light comes on/);
   await panel.getByRole("button",{name:p.lang==="zh"?"EN":"中文",exact:true}).click();
   assert.match(await line.textContent(),p.lang==="zh"?/If the light comes on/:/灯亮了/);
   await panel.getByRole("button",{name:p.lang==="zh"?"中文":"EN",exact:true}).click();
   const fits=await panel.evaluate(el=>{const b=el.getBoundingClientRect();return b.left>=-1&&b.top>=-1&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1});
   assert.ok(fits,"Dialogue overflows viewport "+p.name);
   const dialoguePixels=await page.screenshot({path:dir+"/"+p.name+"-dialogue.png"});
   for(let i=0;i<5;i++)await panel.getByRole("button",{name:p.lang==="zh"?"继续":"Continue",exact:true}).click();
   assert.equal(await page.locator(".res-host .res-choices button").count(),2);
   const choicePixels=await page.screenshot({path:dir+"/"+p.name+"-choice.png"});
   assert.ok(!dialoguePixels.equals(choicePixels),"Dialogue and choice screenshots must visibly differ");
   await page.getByRole("button",{name:p.choice,exact:true}).click();
   await page.waitForFunction(()=>CatBondResonance.view().current?.id==="harbor:H-03");
   assert.equal(await page.evaluate(id=>CatBondResonance.view().trust[id],p.npc),2);
   assert.ok(await page.evaluate(()=>CatBondResonance.view().objective.includes("explore:tide-logbook")));
   assert.equal(await page.evaluate(()=>!!State.S.npcStories?.harborKeeper),false);
   assert.equal(await page.evaluate(()=>CatBondResonance.view().lineReady),false);
   // Exercise the real ambient board through pointer input after entering the actual yard.
   // NPC dispatch is a fixture because the canonical map/garden branches are not yet merged.
   await page.evaluate(()=>{WorldMap.exitToYard();CatBondResonanceNPC.talk("muling","garden")});
   const board=page.locator(".res-ambient-board");
   await board.waitFor({state:"visible",timeout:5000});
   await page.waitForFunction(()=>getComputedStyle(document.querySelector(".res-ambient")).opacity==="1");
   await page.screenshot({path:dir+"/"+p.name+"-tea.png"});
   async function drag(from,to,vertical=0){
    const a=await from.boundingBox(),b=to?await to.boundingBox():null;assert.ok(a&&(!to||b));
    const sx=a.x+a.width/2,sy=a.y+a.height/2,tx=b?b.x+b.width/2:sx,ty=b?b.y+b.height/2:sy+vertical;
    if(p.mobile){const cdp=await ctx.newCDPSession(page);await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:sx,y:sy}]});for(let i=1;i<=8;i++)await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:sx+(tx-sx)*i/8,y:sy+(ty-sy)*i/8}]});await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});await cdp.detach();}
    else{await page.mouse.move(sx,sy);await page.mouse.down();await page.mouse.move(tx,ty,{steps:12});await page.mouse.up();}
   }
   const piece=id=>board.locator('[data-piece="'+id+'"]');
   await drag(piece("leaves"),piece("pot"));await drag(piece("kettle"),piece("pot"));await drag(piece("pot"),piece("cup"));
   await page.locator(".res-ambient-result").waitFor({state:"visible",timeout:5000});
   assert.ok(await page.evaluate(()=>CatBondResonance.snapshot().ambientDone.includes("muling:tea")));
   await page.screenshot({path:dir+"/"+p.name+"-tea-complete.png"});
   await page.locator(".res-ambient-result button").click();
   // Resume same slot from the actual title flow. The canonical choice must survive.
   await page.reload({waitUntil:"domcontentloaded"});
   await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
   await page.locator("#intro-continue").click();
   await page.locator('#intro-slot-list [data-slot="slot1"]').click();
   await page.waitForFunction(()=>window.__CAT_BOND_STARTED__&&CatBondResonance.view().current?.id==="harbor:H-03");
   assert.equal(await page.evaluate(id=>CatBondResonance.view().trust[id],p.npc),2);
   assert.ok(await page.evaluate(()=>CatBondResonance.snapshot().ambientDone.includes("muling:tea")),"Tea completion must survive reload");
   // Separate canonical prologue fixture validates the physical bell, without
   // claiming that missing approved cinematics have been played.
   await page.evaluate(async()=>{const {campaign}=await import("/cat-bond/js/resonance/campaign.mjs"),{makeEngine}=await import("/cat-bond/js/resonance/engine.mjs");const e=makeEngine(campaign);for(const s of campaign.scenes){if(s.id==="prologue:P-04")break;for(const op of s.requires)e.record(s.id,op);for(const l of s.lines)e.nextLine();e.finish()}State.S.resonance=e.snapshot();State.save();WorldMap.exitToYard()});
   const bell=page.locator(".res-garden-bell");await bell.waitFor({state:"visible",timeout:7000});
   await page.screenshot({path:dir+"/"+p.name+"-garden-bell.png"});
   await drag(bell,null,65);
   await page.waitForFunction(()=>CatBondResonance.view().current?.id==="prologue:P-04"&&!CatBondResonance.view().objective.includes("explore:garden-bell"));
   assert.ok(await page.locator(".res-host .res-dialogue").isVisible());
   await page.screenshot({path:dir+"/"+p.name+"-awakening.png"});
   // E-02/E-03 browser fixture: the actual canonical dialogue and key gesture
   // are exercised, but the preceding unintegrated campaign is not claimed played.
   await page.evaluate(async()=>{
    CatBondResonance.close();
    const {campaign}=await import("/cat-bond/js/resonance/campaign.mjs"),{makeEngine}=await import("/cat-bond/js/resonance/engine.mjs");
    const e=makeEngine(campaign),ok=r=>{if(!r.ok)throw Error("Ending fixture: "+r.reason)};
    const links=()=>{for(const [a,b,x,y] of campaign.links)for(let i=0;i<4;i++)e.exchange({a,b,stage:["sendA","receiveB","sendB","receiveA"][i],actor:[a,b,b,a][i],action:[x,x,y,y][i]})};
    for(const sc of campaign.scenes){if(sc.id==="epilogue:E-02")break;
      if(sc.choiceTiming==="beforeAction"&&sc.choices.length)ok(e.choose(sc.choices[0].id));
      if(sc.id==="finale:B-03")for(let i=0;i<6;i++)ok(e.supportAction(campaign.regions[i],campaign.support[i]));
      for(const op of sc.requires.filter(o=>o!=="mechanism:muling-unlock"))ok(e.record(sc.id,op));
      if(sc.id==="starfall:F-04")links();
      for(const l of sc.lines)ok(e.nextLine());
      if(sc.choiceTiming==="afterDialogue"&&sc.choices.length)ok(e.choose(sc.choices[0].id));
      if(sc.requires.includes("mechanism:muling-unlock"))ok(e.record(sc.id,"mechanism:muling-unlock"));
      ok(e.finish());links();
    }
    State.S.resonance=e.snapshot();State.S.resonanceExploration={location:"starfall",positions:{},interactions:{}};ok(State.save());WorldMap.exitToYard();
    CatBondResonanceNPC.talk("muling","garden");
   });
   await panel.waitFor({state:"visible"});
   assert.match(await line.textContent(),p.lang==="zh"?/削弱了封印/:/weakened the seal/);
   await page.screenshot({path:dir+"/"+p.name+"-accountability.png"});
   for(let i=0;i<3;i++)await panel.getByRole("button",{name:p.lang==="zh"?"继续":"Continue",exact:true}).click();
   await page.waitForFunction(()=>CatBondResonance.view().current?.id==="epilogue:E-03");
   assert.equal(await page.evaluate(()=>CatBondResonance.view().muling),"accountable");
   await page.evaluate(()=>CatBondResonanceNPC.talk("muling","garden"));
   await panel.waitFor({state:"visible"});
   for(let i=0;i<6;i++)await panel.getByRole("button",{name:p.lang==="zh"?"继续":"Continue",exact:true}).click();
   const keyPanel=page.locator(".res-key-panel"),key=keyPanel.locator(".res-key-piece"),receiver=keyPanel.locator(".res-key-recipient");
   await keyPanel.waitFor({state:"visible"});
   await page.waitForFunction(()=>document.querySelector(".res-key-recipient img")?.naturalWidth>100&&document.querySelector(".res-key-piece img")?.naturalWidth>100);
   assert.equal(await page.evaluate(()=>CatBondResonance.view().ending),false);
   await keyPanel.getByRole("button",{name:p.lang==="zh"?"EN":"中文",exact:true}).click();
   assert.match(await keyPanel.locator("h2").textContent(),p.lang==="zh"?/second garden key/:/第二把花园钥匙/);
   await keyPanel.getByRole("button",{name:p.lang==="zh"?"中文":"EN",exact:true}).click();
   await page.screenshot({path:dir+"/"+p.name+"-second-key.png"});
   await drag(key,null,-32);
   assert.equal(await page.evaluate(()=>CatBondResonance.view().ending),false,"Invalid drop must not complete");
   await drag(key,receiver);
   await page.waitForFunction(()=>CatBondResonance.view().ending);
   assert.equal(await page.evaluate(()=>CatBondResonance.view().muling),"reconciled");
   await page.reload({waitUntil:"domcontentloaded"});
   await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
   await page.locator("#intro-continue").click();
   await page.locator('#intro-slot-list [data-slot="slot1"]').click();
   await page.waitForFunction(()=>window.__CAT_BOND_STARTED__&&CatBondResonance.view().ending);
   assert.equal(await page.evaluate(()=>CatBondResonance.view().muling),"reconciled");
   assert.deepEqual(errors,[],"Browser JS errors");
   console.log(p.name+": normal boot, seeded story, bilingual dialogue, portrait loaded, choice, trust, quest gate and reload PASS");
  }catch(e){console.error("Browser diagnostics",p.name,errors,await page.evaluate(()=>({scene:window.__game?.scene,cats:window.State?.S?.cats?.length,legacy:!!window.CatBondStory,current:window.CatBondResonance?.view()?.current?.id,body:document.body.innerText.slice(0,400)})).catch(()=>null));await page.screenshot({path:dir+"/"+p.name+"-failure.png"}).catch(()=>{});throw e}
  finally{await ctx.close()}
 }
}finally{await browser.close()}
