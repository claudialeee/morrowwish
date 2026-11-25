// Read-only cinematic review. No game bundle, save state, narrative engine or runtime permission override.
// The normal game still requires independently approved manifest shots.
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {campaign} from "../public/cat-bond/js/resonance/campaign.mjs";
const manifest=JSON.parse(await fs.readFile(new URL("../public/cat-bond/assets/cinematics/asset-manifest.json",import.meta.url),"utf8"));
const origin="http://127.0.0.1:8765",out="artifacts/cat-bond-starfall/visual-review";
await fs.mkdir(out,{recursive:true});
const shots=["starfall:F-02","starfall:F-05"].map(id=>{
 const current=campaign.scenes.find(s=>s.id===id),specs=manifest.stagingShots[id];
 return {id,title:current.title,chapter:{zh:"猫猫纽带 · 美术审查",en:"Cat Bond · Art review"},allowSkip:false,mode:"auto",
 frames:specs.flatMap((shot,i)=>{
  const asset=manifest.assets.find(a=>a.id===shot.assetId);assert(asset&&asset.path.endsWith(".webp"));
  const base={image:asset.path,alt:shot.alt,durationMs:shot.durationMs,camera:shot.camera,transitionMs:shot.transitionMs};
  return shot.lines.length?shot.lines.map(index=>{const line=current.lines[index],speaker=campaign.cast[line.speaker].name;return {...base,id:id+"-"+i+"-"+index,subtitle:{zh:{speaker:speaker.zh,text:line.text.zh},en:{speaker:speaker.en,text:line.text.en}}}}):[{...base,id:id+"-"+i,subtitle:{zh:{speaker:"",text:shot.caption.zh},en:{speaker:"",text:shot.caption.en}}}];
 })};
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
    await page.waitForFunction(t=>document.querySelector(".cbcp-subtitle").textContent===t,frame.subtitle[lang].text);
    const layout=await page.evaluate(()=>{const img=document.querySelector(".cbcp-art:last-of-type"),sub=document.querySelector(".cbcp-subtitle-wrap"),r=sub.getBoundingClientRect();return {decoded:!!img?.complete&&img.naturalWidth>0,subtitleFits:r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,overflow:sub.scrollWidth>sub.clientWidth+1}});
    assert.ok(layout.decoded&&layout.subtitleFits&&!layout.overflow,JSON.stringify({name,id:frame.id,lang,layout}));
    if(name==="portrait"){const crop=await page.evaluate(()=>{const image=document.querySelector(".cbcp-art:last-of-type"),stage=document.querySelector(".cbcp-stage"),r=image.getBoundingClientRect(),s=stage.getBoundingClientRect();return {fit:getComputedStyle(image).objectFit,coverage:r.height/s.height}});assert.ok(crop.fit==="cover"&&crop.coverage>=.95,JSON.stringify({frame:frame.id,crop}));}
    await page.screenshot({path:out+"/"+name+"-"+frame.id.replaceAll(":","-")+"-"+lang+".png"});
    result.push({profile:name,scene:scene.id,frame:frame.id,lang,...layout});
   }
  }
  assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>!!window.reviewError),false);
  await page.close();
 }
}finally{await fs.writeFile(out+"/results.json",JSON.stringify({scope:"candidate-art-only, NOT gameplay acceptance or runtime approval",results:result},null,2));await browser.close();}
