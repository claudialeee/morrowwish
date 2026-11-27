import assert from "node:assert/strict";
import {chromium} from "playwright";
const origin=process.env.CAT_BOND_SMOKE_ORIGIN||"http://127.0.0.1:8766";
const browser=await chromium.launch({headless:true});
const plans={harbor:["step-0-0","step-1-1","step-2-2"],forest:["pick-1","pick-3","brew"],forge:["rotate","rotate","rotate","light"],sky:["weight-0","weight-3","weight-1","weight-1","weight-2","weight-2","launch"],library:["page-1","page-2","page-0","bind"],starfall:["star-1","star-2","star-3","star-4"]};
try{
await Promise.all([{name:"desktop",viewport:{width:1280,height:800}},{name:"portrait",viewport:{width:390,height:844},hasTouch:true,isMobile:true},{name:"landscape",viewport:{width:844,height:390},hasTouch:true,isMobile:true}].map(async({name,...device})=>{
 const context=await browser.newContext(device),page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
 try{
 // Isolated browser harness: exact shipped modules/assets, explicit synthetic slot.
 // Real world entry is independently exercised by the preview smoke.
 await page.route("**/__adventure_browser_harness__",r=>r.fulfill({contentType:"text/html",body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font:16px system-ui}#stage{position:fixed;inset:0}</style><div id="stage"><button id="underlying">Underlying</button></div>'}));
 await page.goto(origin+"/cat-bond/__adventure_browser_harness__");
 await page.evaluate(async()=>{window.State={S:{cats:["qilan","yahe","xiaomao"].map(storyActor=>({storyActor})),coins:50,fish:10}};window.__game={scene:"map"};let lang="en";window.MorrowwishI18n={get:()=>lang,set:l=>{lang=l;window.dispatchEvent(new Event("morrowwish-language-change"))}};window.play=await import("./js/resonance/adventure-play.mjs");window.side=await import("./js/resonance/side-adventures.mjs");window.world={location:null,positions:{},interactions:{}};window.openSide=r=>{world.location=r;const at=side.sideAdventures[r].at;world.positions[r]={x:at[0],y:at[1]};return play.mountSideAdventure(r,{guard:()=>world.location===r,commit:trace=>{const res=side.applySideEvent(r,world,{regions:[r]},trace);if(res.ok)world=res.next;return res;}})};});
 const visible=async modal=>{await modal.waitFor({state:"visible"});await modal.locator(".cb-adventure-bg").evaluate(img=>img.decode());const b=await modal.locator(".cb-adventure-card").boundingBox();assert.ok(b&&b.x>=-1&&b.y>=-1&&b.x+b.width<=device.viewport.width+1&&b.y+b.height<=device.viewport.height+1,name+" modal in bounds");assert.ok(await page.locator("#underlying").evaluate(x=>x.inert));};
 const input=async(modal,a)=>{const b=modal.locator("[data-play-action='"+a+"']");await b.scrollIntoViewIfNeeded();const rect=await b.boundingBox();assert.ok(rect&&rect.height>=39&&rect.width>=40,name+" touch target "+a);await b.click();};
 const close=async(modal,label="Return")=>{await modal.getByRole("button",{name:label,exact:true}).click();await modal.waitFor({state:"detached"});assert.equal(await page.locator("#underlying").evaluate(x=>x.inert),false);};
 for(const [id,steps] of Object.entries({qilan:["deploy","cast"],yahe:["deploy","escort"],xiaomao:["deploy","warn","impact"]})){
  assert.ok(await page.evaluate(id=>play.mountTalentTrial(id),id));const m=page.locator("[data-adventure=trial-"+id+"]");await visible(m);
  await input(m,"deploy");await m.getByRole("button",{name:"Restart",exact:true}).click();assert.ok(await m.locator("[data-play-action=deploy]").isVisible());
  for(const a of steps)await input(m,a);assert.equal(await m.getAttribute("data-complete"),"true");
  assert.equal(await page.evaluate(()=>JSON.stringify(State.S)),JSON.stringify({cats:["qilan","yahe","xiaomao"].map(storyActor=>({storyActor})),coins:50,fish:10}));
  await page.screenshot({path:"preview-adventure-"+name+"-trial-"+id+".png"});await close(m);
 }
 for(const [region,steps] of Object.entries(plans)){
  assert.ok(await page.evaluate(r=>openSide(r),region));let m=page.locator("[data-adventure=side-"+region+"]");await visible(m);
  await input(m,steps[0]);await close(m,"Leave for now");assert.equal(await page.evaluate(r=>!!world.interactions[side.sideKey(r)],region),false);
  assert.ok(await page.evaluate(r=>openSide(r),region));await visible(m);await page.evaluate(()=>MorrowwishI18n.set("zh"));assert.ok(/[\u4e00-\u9fff]/.test(await m.locator("h2").first().innerText()));await page.evaluate(()=>MorrowwishI18n.set("en"));
  await page.screenshot({path:"preview-adventure-"+name+"-"+region+".png"});
  for(const a of steps)await input(m,a);assert.equal(await m.getAttribute("data-complete"),"true");assert.ok(await page.evaluate(r=>world.interactions[side.sideKey(r)]===true,region));await close(m);
 }
 assert.deepEqual(errors,[]);console.log("ADVENTURE BROWSER PASS "+name+" · all nine activities, cancel/restart, touch targets, locale, saves");
 }finally{await context.close();}
}));
}finally{await browser.close();}
