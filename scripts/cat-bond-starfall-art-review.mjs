// Read-only cinematic review. No game bundle, save state, narrative engine or runtime permission override.
// The normal game still requires independently approved manifest shots.
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {campaign} from "../public/cat-bond/js/resonance/campaign.mjs";
import {buildCanonicalScene} from "../public/cat-bond/js/resonance-cinematic.mjs";
const manifest=JSON.parse(await fs.readFile(new URL("../public/cat-bond/assets/cinematics/asset-manifest.json",import.meta.url),"utf8"));
const origin="http://127.0.0.1:8765",out="artifacts/cat-bond-starfall/visual-review";
await fs.mkdir(out,{recursive:true});
// Use the actual canonical staging adapter, including region montage and actor layers.
const ids=["starfall:F-02","starfall:F-05","finale:B-04","epilogue:E-01"];
const shots=ids.map(id=>{
 const current=campaign.scenes.find(s=>s.id===id);
 const view={current,choice:null,objective:current.requires.filter(o=>o.startsWith("cinematic:")),cursor:0,lineReady:true};
 const blocked=buildCanonicalScene({campaign,manifest,view,staging:false});
 assert.equal(blocked.ok,false,id+" remains unapproved; this script must not authorize production");
 const result=buildCanonicalScene({campaign,manifest,view,staging:true});
 assert.ok(result.ok,id+": "+result.reason);return {...result.scene,allowSkip:false};
});
const browser=await chromium.launch({headless:true}),result=[];
try{
 for(const [name,width,height] of [["desktop",1440,900],["portrait",390,844],["landscape",844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.route(origin+"/cat-bond/__art-review",r=>r.fulfill({contentType:"text/html",body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;width:100%;height:100%;background:#101d28}#review{position:fixed;inset:0}</style></head><body><div id="review"></div><script src="js/cinematic-presentation.js"></script></body></html>'}));
  await page.goto(origin+"/cat-bond/__art-review");
  await page.evaluate(scenes=>{if(window.State||window.CatBondResonance)throw Error("Review must not mount gameplay");window.reviewPlayer=CatBondCinematicPresentation.create(document.querySelector("#review"),{language:"en",onError:e=>{window.reviewError=e}});reviewPlayer.registerAll(scenes);},shots);
  for(const scene of shots)for(const [i,frame] of scene.frames.entries()){
   await page.evaluate(({id,i})=>reviewPlayer.play(id,{frameIndex:i,paused:true,elapsedMs:Math.min(800,reviewPlayer.scenes.get(id).frames[i].durationMs-1)}),{id:scene.id,i});
   await page.waitForFunction(id=>document.querySelector("#review").dataset.ready==="true"&&document.querySelector("#review").dataset.frameId===id,frame.id);
   for(const lang of ["en","zh"]){
    await page.evaluate(lang=>reviewPlayer.setLanguage(lang),lang);
    if(frame.subtitle)await page.waitForFunction(t=>document.querySelector(".cbcp-subtitle")?.textContent===t,frame.subtitle[lang].text);
    const layout=await page.evaluate(()=>{
     const stack=document.querySelector(".cbcp-art-stack"),img=[...stack.querySelectorAll(".cbcp-art")].at(-1),sub=document.querySelector(".cbcp-subtitle-wrap"),r=sub.getBoundingClientRect(),bounds=stack.getBoundingClientRect();
     const layers=[...stack.children].slice([...stack.children].indexOf(img)+1).filter(el=>el.classList.contains("cbcp-layer"));
     return {decoded:!!img?.complete&&img.naturalWidth>0,layers:layers.length,layerDecoded:layers.every(el=>el.complete&&el.naturalWidth>0),layerVisible:layers.every(el=>{const b=el.getBoundingClientRect();return b.width>0&&b.height>0&&b.right>bounds.left&&b.left<bounds.right&&b.bottom>bounds.top&&b.top<bounds.bottom}),subtitleFits:sub.hidden||r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,overflow:!sub.hidden&&sub.scrollWidth>sub.clientWidth+1};
    });
    assert.ok(layout.decoded&&layout.layerDecoded&&layout.layerVisible&&layout.layers===(frame.layers||[]).length&&layout.subtitleFits&&!layout.overflow,JSON.stringify({name,id:frame.id,lang,layout}));
    await page.screenshot({path:out+"/"+name+"-"+frame.id.replaceAll(":","-")+"-"+lang+".png"});
    result.push({profile:name,scene:scene.id,frame:frame.id,lang,...layout});
   }
  }
  assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>!!window.reviewError),false);
  await page.close();
 }
}finally{await fs.writeFile(out+"/results.json",JSON.stringify({scope:"all four candidate cinematics, three viewports and both languages; NOT subjective visual approval or gameplay acceptance",results:result},null,2));await browser.close();}
