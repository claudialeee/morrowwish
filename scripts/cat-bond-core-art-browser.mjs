import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=process.argv[2]||'artifacts/cat-bond-experience',out=root+'/core-art';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),origin='http://127.0.0.1:8765';
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort()});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/cat-bond/?lang=zh&rpgDev=1');
 await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatArt&&window.GameData);
 const assets=await page.evaluate(async()=>{
  const manifest=await fetch('/cat-bond/assets/core-art-remaster/manifest.json').then(r=>r.json());
  return Promise.all([...manifest.characters,...manifest.story].map(async c=>{
   const image=new Image();image.src='/cat-bond/assets/'+c.asset;await image.decode();
   const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
   const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,128,128);const pixels=ctx.getImageData(0,0,128,128).data;
   let transparent=0,opaque=0;for(let i=3;i<pixels.length;i+=4){if(pixels[i]<16)transparent++;if(pixels[i]>240)opaque++;}
   return {id:c.id,group:c.group||'story',width:image.naturalWidth,height:image.naturalHeight,transparent,opaque};
  }));
 });
 assert.equal(assets.length,24);
 for(const asset of assets){assert.ok(asset.width>0&&asset.height>0&&asset.opaque>0,asset.id);if(asset.group!=='story')assert.ok(asset.transparent>0,asset.id+' transparent background');}
 // Test-only gallery invokes the same CatArt renderer used by the live game. It does not alter saves.
 const roster=await page.evaluate(async()=>{
  const list=[GameData.speciesById('jinjc'),GameData.speciesById('story_muling'),...GameData.SPECIES];
  const stage=document.createElement('section');stage.id='core-art-review-gallery';stage.style.cssText='position:fixed;inset:0;z-index:999999;background:#f5ebda;color:#42392f;display:grid;grid-template-columns:repeat(6,1fr);gap:10px;padding:16px;overflow:auto';
  document.body.append(stage);
  for(const sp of list){
   const cell=document.createElement('div'),canvas=document.createElement('canvas'),name=document.createElement('p');
   canvas.width=200;canvas.height=225;canvas.style.cssText='width:160px;height:180px';
   name.textContent=sp.name+' · '+sp.id;cell.style.cssText='text-align:center;min-height:235px';cell.append(canvas,name);stage.append(cell);
   CatArt.renderCatThumb(canvas,sp);
  }
  const until=Date.now()+15000;
  function visible(c){const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>128)n++;return n>300;}
  while(Date.now()<until&&!Array.from(stage.querySelectorAll('canvas')).every(visible))await new Promise(r=>setTimeout(r,100));
  return Array.from(stage.querySelectorAll('canvas')).map((c,i)=>({id:list[i].id,rendered:visible(c)}));
 });
 assert.equal(roster.length,18);assert.ok(roster.every(x=>x.rendered),'all cats must render via actual game renderer');
 // Verify the actual combat prototype consumes the species-specific passive.
 // These isolated calculations are not player-input battle outcomes.
 const passiveChecks=await page.evaluate(()=>{
  const P=Battle.CaptureBattle.prototype,results=[];
  const battle=Object.create(P);battle.t=0;
  for(const sp of GameData.SPECIES){
   const p=Skills.breedPassive(sp.id),f={cat:{species:sp.id},hp:100,maxhp:100,alive:true,moving:false,shieldT:0},target={hp:100,maxhp:100};
   if(p.when==='low')f.hp=30;
   if(p.when==='moving')f.moving=true;
   if(p.when==='shield')f.shieldT=1;
   if(['targetLow','targetCritical'].includes(p.when))target.hp=20;
   battle.t=p.when==='late'?9:p.when==='mid'?10:0;
   const actual=battle.passiveFactor(f,p.channel,target);
   const outgoing=battle.outgoingBuffMult(f);
   results.push({id:sp.id,channel:p.channel,expected:p.factor,actual,outgoing,expectedOutgoing:p.channel==='damage'?p.factor:1});
  }
  return results;
 });
 assert.equal(passiveChecks.length,16);
 for(const c of passiveChecks){assert.equal(c.actual,c.expected,c.id+' actual battle passive');assert.equal(c.outgoing,c.expectedOutgoing,c.id+' outgoing multiplier');}
 await fs.writeFile(out+'/battle-passive-hooks.json',JSON.stringify(passiveChecks,null,2));
 console.log('BROWSER PASSIVE HOOK PASS',passiveChecks.length,'actual battle prototype checks');
 assert.deepEqual(errors,[]);await page.screenshot({path:out+'/rendered-gallery.png'});await fs.writeFile(out+'/index.json',JSON.stringify({assets,roster},null,2));console.log('CORE ART BROWSER PASS',assets.length,'decoded images,',roster.length,'actual game-rendered cats');
}finally{await browser.close();}
