import {chromium} from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
const out="artifacts/cat-bond-resonance";fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const cases=[
 {region:"harbor",scene:"harbor:H-04",op:"puzzle:beam-mirrors",map:[.5,.18],target:[.14,.30],steps:[0,0,1,1,2]},
 {region:"forest",scene:"forest:R-03",op:"puzzle:paired-water-gates",map:[.79,.33],target:[.75,.61],steps:[0,0,1,2]},
 {region:"forge",scene:"forge:E-03",op:"puzzle:heat-pressure",map:[.79,.68],target:[.65,.47],steps:[0,0,0,0,1,1,1]},
 {region:"sky",scene:"sky:S-03",op:"puzzle:joint-flight",map:[.5,.85],target:[.59,.42],steps:[0,2,0]},
 {region:"library",scene:"library:M-02",op:"puzzle:mirror-records",map:[.21,.68],target:[.48,.68],steps:[1,2,0]},
 {region:"starfall",scene:"starfall:F-02",op:"puzzle:star-map",map:[.21,.33],target:[.41,.46],steps:[0,0,0,1,2,2]}
];
const profiles=[{id:"desktop-en",width:1440,height:960,lang:"en"},{id:"portrait-zh",width:390,height:844,lang:"zh"},{id:"landscape-en",width:844,height:390,lang:"en"}];
const results=[];
try{
 for(const profile of profiles){
  const page=await browser.newPage({viewport:{width:profile.width,height:profile.height},deviceScaleFactor:1,hasTouch:profile.id!=="desktop-en"});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.route("**/*",r=>r.request().url().startsWith("http://127.0.0.1:8765/")?r.continue():r.abort());
  await page.goto("http://127.0.0.1:8765/cat-bond/",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.WorldMap===window.CatBondCanonicalWorld);
  await page.evaluate(l=>window.MorrowwishI18n?.set?.(l),profile.lang);
  await page.locator("#intro-start").click();
  await page.locator('#intro-slot-list [data-slot="slot1"]').click();
  await page.locator("#panel .cat-starter-card .dex-cell").first().click();
  await page.waitForSelector(".rw-world:not([hidden]) .rw-surface");
  assert.equal(await page.evaluate(()=>State.S.cats.length),1,"real starter collection");
  assert.equal(await page.evaluate(()=>WorldMap.isUnlocked("harbor")),false,"no synthetic prologue completion");
  const surface=()=>page.locator(".rw-surface");
  const tap=async([x,y])=>{await surface().scrollIntoViewIfNeeded();const r=await surface().boundingBox();if(!r)throw Error("canvas missing");await page.mouse.click(r.x+x*r.width,r.y+y*r.height)};
  const waitArt=async()=>{await page.waitForFunction(()=>{const c=document.querySelector(".rw-surface");if(!c)return false;const d=c.getContext("2d").getImageData(0,0,c.width,c.height).data;const seen=new Set();for(let i=0;i<d.length;i+=404)seen.add(d[i]+","+d[i+1]+","+d[i+2]);return seen.size>80;});};
  await waitArt();
  await page.screenshot({path:out+"/"+profile.id+"-normal-start.png"});
  for(const tc of cases){
   // Fixture advances only upstream-owned narrative/choice/battle evidence to isolate the
   // real map interaction. This is NOT an end-to-end prologue or NPC/battle acceptance.
   await page.evaluate(async target=>{
    const {campaign}=await import("/cat-bond/js/resonance/campaign.mjs");
    const {makeEngine}=await import("/cat-bond/js/resonance/engine.mjs");
    const e=makeEngine(campaign);const yes=r=>{if(!r.ok)throw Error("Fixture: "+r.reason)};
    while(e.view().current.id!==target){const s=e.view().current;
     if(s.choices.length&&s.choiceTiming==="beforeAction")yes(e.choose(s.choices[0].id));
     for(const op of s.requires)yes(e.record(s.id,op));
     while(e.view().cursor<s.lines.length)yes(e.nextLine());
     if(s.choices.length&&!e.view().choice)yes(e.choose(s.choices[0].id));
     yes(e.finish());
    }
    const s=e.view().current;if(s.choices.length&&s.choiceTiming==="beforeAction")yes(e.choose(s.choices.find(c=>c.id==="calibrate")?.id||s.choices[0].id));
    State.S.resonance=e.snapshot();delete State.S.resonanceExploration;
    if(!State.save().ok)throw Error("Fixture save failed");
    window.__game.openWorldMap();window.dispatchEvent(new Event("cat-bond-resonance-changed"));
   },tc.scene);
   await waitArt();
   if(tc.region==="harbor"){
    await page.screenshot({path:out+"/"+profile.id+"-atlas.png"});
    await page.locator(".rw-controls button").filter({hasText:"+"}).click();
    await page.locator(".rw-controls button").last().click();
   }
   await tap(tc.map);
   await page.waitForFunction(r=>WorldMap.mode==="region"&&WorldMap.currentRegion===r,tc.region);
   await waitArt();
   await surface().screenshot({path:out+"/"+profile.id+"-"+tc.region+"-scene.png"});
   await tap(tc.target);
   // The operation cannot complete merely by selecting a landmark.
   assert.equal(await page.evaluate(({scene,op})=>State.S.resonance.evidence[scene]?.includes(op)||false,tc),false);
   await page.waitForSelector(".rw-puzzle-controls",{timeout:15000});
   const pos=await page.evaluate(r=>State.S.resonanceExploration.positions[r],tc.region);
   assert.ok(Math.hypot(pos.x-tc.target[0],pos.y-tc.target[1])<.08,"actual walking before puzzle");
   await surface().screenshot({path:out+"/"+profile.id+"-"+tc.region+"-mechanism.png"});
   const alternate=profile.lang==="zh"?"en":"zh";
   await page.evaluate(l=>window.MorrowwishI18n?.set?.(l),alternate);
   await page.waitForFunction(l=>window.MorrowwishI18n?.get?.()===l,alternate);
   await page.waitForSelector(".rw-puzzle-controls");
   await page.evaluate(l=>window.MorrowwishI18n?.set?.(l),profile.lang);
   for(const i of tc.steps){if(tc.region==="forest"){const c=page.locator('[data-water-step="'+i+'"]');if(profile.id==="desktop-en")await c.click();else await c.tap();}else await tap([.3+i*.2,.53]);}
   await page.waitForFunction(({scene,op})=>State.S.resonance.evidence[scene]?.includes(op),tc);
   assert.equal(await page.locator(".rw-puzzle-controls").count(),0,"puzzle closes on real completion");
   assert.equal(await page.evaluate(()=>!!State.S.lastResonanceWorld),false,"parallel plot model absent");
   results.push({profile:profile.id,region:tc.region,op:tc.op,walked:true,mechanism:true,languageSwitch:true});
   await page.locator(".rw-head button").first().click();
  }
  assert.deepEqual(errors,[],"browser errors: "+errors.join(" | "));
  await page.close();
 }
 console.log(JSON.stringify({profiles:profiles.length,physicalMechanisms:results.length,results}));
}finally{fs.writeFileSync(out+"/results.json",JSON.stringify(results,null,2));await browser.close();}
