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
   await page.waitForFunction(()=>document.querySelector(".res-host .res-portrait")?.naturalWidth>100);
   const line=page.locator(".res-host .res-line");
   assert.match(await line.textContent(),p.lang==="zh"?/灯亮了/:/If the light comes on/);
   await panel.getByRole("button",{name:p.lang==="zh"?"EN":"中文",exact:true}).click();
   assert.match(await line.textContent(),p.lang==="zh"?/If the light comes on/:/灯亮了/);
   await panel.getByRole("button",{name:p.lang==="zh"?"中文":"EN",exact:true}).click();
   const fits=await panel.evaluate(el=>{const b=el.getBoundingClientRect();return b.left>=-1&&b.top>=-1&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1});
   assert.ok(fits,"Dialogue overflows viewport "+p.name);
   await page.screenshot({path:dir+"/"+p.name+"-dialogue.png"});
   for(let i=0;i<5;i++)await panel.getByRole("button",{name:p.lang==="zh"?"继续":"Continue",exact:true}).click();
   assert.equal(await page.locator(".res-host .res-choices button").count(),2);
   await page.screenshot({path:dir+"/"+p.name+"-choice.png"});
   await page.getByRole("button",{name:p.choice,exact:true}).click();
   await page.waitForFunction(()=>CatBondResonance.view().current?.id==="harbor:H-03");
   assert.equal(await page.evaluate(id=>CatBondResonance.view().trust[id],p.npc),2);
   assert.ok(await page.evaluate(()=>CatBondResonance.view().objective.includes("explore:tide-logbook")));
   assert.equal(await page.evaluate(()=>!!State.S.npcStories?.harborKeeper),false);
   assert.equal(await page.evaluate(()=>CatBondResonance.view().lineReady),false);
   // Resume same slot from the actual title flow. The canonical choice must survive.
   await page.reload({waitUntil:"domcontentloaded"});
   await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
   await page.locator("#intro-continue").click();
   await page.locator('#intro-slot-list [data-slot="slot1"]').click();
   await page.waitForFunction(()=>window.__CAT_BOND_STARTED__&&CatBondResonance.view().current?.id==="harbor:H-03");
   assert.equal(await page.evaluate(id=>CatBondResonance.view().trust[id],p.npc),2);
   assert.deepEqual(errors,[],"Browser JS errors");
   console.log(p.name+": normal boot, seeded story, bilingual dialogue, portrait loaded, choice, trust, quest gate and reload PASS");
  }catch(e){console.error("Browser diagnostics",p.name,errors,await page.evaluate(()=>({scene:window.__game?.scene,cats:window.State?.S?.cats?.length,legacy:!!window.CatBondStory,current:window.CatBondResonance?.view()?.current?.id,body:document.body.innerText.slice(0,400)})).catch(()=>null));await page.screenshot({path:dir+"/"+p.name+"-failure.png"}).catch(()=>{});throw e}
  finally{await ctx.close()}
 }
}finally{await browser.close()}
