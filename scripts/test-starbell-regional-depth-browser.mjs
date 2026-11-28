import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname} from "node:path";
import {chromium} from "playwright";
// Isolated component browser test: actual shipped UI and proof logic, not a simulated campaign clear.
const root=resolve("public/cat-bond"),mime={".mjs":"text/javascript",".js":"text/javascript",".css":"text/css",".webp":"image/webp",".png":"image/png"};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,"http://localhost");if(url.pathname==="/"){res.writeHead(200,{"Content-Type":"text/html"});res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden}#stage{position:relative;width:100%;height:100%;overflow:hidden;font-family:system-ui}</style><main id="stage"></main>');return;}const p=resolve(root,"."+decodeURIComponent(url.pathname));assert(p.startsWith(root+"/"));const bytes=await readFile(p);res.writeHead(200,{"Content-Type":mime[extname(p)]||"application/octet-stream"});res.end(bytes);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const browser=await chromium.launch({headless:true});
try{
 for(const [width,height] of [[1280,720],[390,844],[844,390]])for(const lang of ["en","zh"]){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000});
  const page=await ctx.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("http://127.0.0.1:"+server.address().port);
  await page.evaluate(async lang=>{const ui=await import("/js/resonance/adventure-play.mjs?v=regional-depth-20261127"),logic=await import("/js/resonance/side-adventures.mjs?v=regional-depth-20261127");window.MorrowwishI18n={get:()=>lang};window.State={S:{}};window.__game={scene:"map"};window.openActivity=r=>{const d=logic.sideAdventures[r];let w={location:r,positions:{[r]:{x:d.at[0],y:d.at[1]}},interactions:{}};window.awards=0;return ui.mountSideAdventure(r,{commit:trace=>{const result=logic.applySideEvent(r,w,{regions:[r]},trace);if(result.ok){window.awards++;w=result.next;}return result;}});};},lang);
  const click=async id=>{const b=page.locator('[data-play-action="'+id+'"]');await b.scrollIntoViewIfNeeded();if(width<1000)await b.tap();else await b.click();};
  const complete=()=>page.locator(".cb-adventure-overlay").getAttribute("data-complete");
  const set=async(i,side)=>{await click("weight-"+i);await click("basket-"+side);};
  for(const region of ["harbor","forest","forge","sky","library","starfall"]){
   assert(await page.evaluate(r=>window.openActivity(r),region));
   await page.locator(".cb-adventure-card").waitFor();
   await page.waitForFunction(()=>document.querySelector("#cb-adventure-play-css")?.sheet);
   if(region==="harbor"){await click("step-0-0");await click("step-1-2");await click("wait");await click("step-1-1");await click("step-2-2");}
   if(region==="forest"){for(const i of [1,3])await click("pick-"+i);await click("brew");assert.equal(await complete(),null);for(const i of [0,2])await click("pick-"+i);await click("brew");}
   if(region==="forge"){for(let i=0;i<3;i++)await click("rotate");await click("light");assert.equal(await complete(),null);await click("flip");await click("light");}
   if(region==="sky"){for(const [i,s] of [[0,2],[1,1],[2,1],[3,2]])await set(i,s);assert(await page.locator('[data-play-action="launch"]').isDisabled());for(const [i,s] of [[0,1],[1,2],[2,2],[3,1]])await set(i,s);await click("launch");}
   if(region==="library"){for(const i of [0,1,2])await click("page-"+i);await click("bind");assert.equal(await complete(),null);for(const i of [1,2,0])await click("page-"+i);await click("bind");}
   if(region==="starfall"){await click("star-2");await click("star-4");await click("undo");for(const i of [1,3,4])await click("star-"+i);}
   assert.equal(await complete(),"true",region);assert.equal(await page.evaluate(()=>window.awards),1);
   assert(await page.locator(".cb-adventure-reward").isVisible());assert(await page.locator(".cb-adventure-card").evaluate(e=>e.scrollWidth<=e.clientWidth+3),"horizontal overflow "+region);
   await page.locator(".cb-adventure-continue").click();assert.equal(await page.locator(".cb-adventure-overlay").count(),0);
   console.log("PASS",width,height,lang,region);
  }
  assert.deepEqual(errors,[]);await ctx.close();
 }
}finally{await browser.close();server.close();}
