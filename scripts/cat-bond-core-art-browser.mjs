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
  const list=[GameData.speciesById('jinjc'),...Object.values(GameData.STORY_SPECIES),...GameData.SPECIES];
  const stage=document.createElement('section');stage.id='core-art-review-gallery';stage.style.cssText='position:fixed;inset:0;z-index:999999;background:#f5ebda;color:#42392f;display:grid;grid-template-columns:repeat(6,1fr);gap:10px;padding:16px;overflow:auto';
  document.body.append(stage);
  for(const sp of list){
   const cell=document.createElement('div'),canvas=document.createElement('canvas'),name=document.createElement('p');
   canvas.width=200;canvas.height=225;canvas.style.cssText='width:160px;height:180px';
   name.textContent=sp.name+' · '+sp.id;cell.dataset.reviewActor=sp.id;cell.style.cssText='text-align:center;min-height:235px';cell.append(canvas,name);stage.append(cell);
   CatArt.renderCatThumb(canvas,sp);
  }
  const until=Date.now()+15000;
  function visible(c){const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>128)n++;return n>300;}
  while(Date.now()<until&&!Array.from(stage.querySelectorAll('canvas')).every(visible))await new Promise(r=>setTimeout(r,100));
  return Array.from(stage.querySelectorAll('canvas')).map((c,i)=>({id:list[i].id,rendered:visible(c)}));
 });
 assert.equal(roster.length,30);assert.equal(new Set(roster.map(x=>x.id)).size,30);assert.ok(roster.every(x=>x.rendered),'all cats must render via actual game renderer');
 // Individual screenshots preserve evidence for actors below the gallery fold.
 await fs.mkdir(out+'/actors',{recursive:true});
 for(const actor of roster){assert.match(actor.id,/^[a-z0-9_]+$/);await page.locator('[data-review-actor="'+actor.id+'"]').screenshot({path:out+'/actors/'+actor.id+'.png'});}
 // Verify the actual combat prototype consumes the species-specific passive.
 // These isolated calculations are not player-input battle outcomes.
 const passiveChecks=await page.evaluate(()=>{
  const P=Battle.CaptureBattle.prototype,results=[];
  const roster=[...GameData.SPECIES,...Object.values(GameData.STORY_SPECIES)];
  const fighter=id=>({cat:{species:id},hp:100,maxhp:100,alive:true,moving:false,shieldT:0,x:0,y:0,cd:{q:3,e:3}});
  const makeBattle=()=>Object.assign(Object.create(P),{t:0,team:[],vfx:{text(){}},castWard(a,type,sk){a.shieldT=sk.wardDuration;a._wardReduction=sk.wardReduction;return true;}});
  for(const sp of roster){
   const p=Skills.breedPassive(sp.id),f=fighter(sp.id),target=fighter('biscuit'),battle=makeBattle();
   if(!p){results.push({id:sp.id,pass:false,reason:'missing passive'});continue;}
   if(p.event==='guard'){
    target.hp=35;battle.team=[f,target];
    const activated=battle.storyPassiveEvent(f,'guard'),duration=target.shieldT,reduction=target._wardReduction;
    target.shieldT=0;const blocked=!battle.storyPassiveEvent(f,'guard');
    battle.t=16;const reactivated=battle.storyPassiveEvent(f,'guard');
    target.shieldT=0;target.x=191;battle.t=32;const outOfRange=!battle.storyPassiveEvent(f,'guard');
    target.x=0;f.alive=false;const fainted=!battle.storyPassiveEvent(f,'guard');
    results.push({id:sp.id,channel:p.channel,activated,duration,reduction,blocked,reactivated,outOfRange,fainted,pass:activated&&duration===3&&reduction===.35&&blocked&&reactivated&&outOfRange&&fainted});continue;
   }
   if(p.event==='alternate'){
    const first=!battle.storyPassiveEvent(f,'alternate','q'),activated=battle.storyPassiveEvent(f,'alternate','e'),cd=f.cd.q;
    const blocked=!battle.storyPassiveEvent(f,'alternate','q');
    battle.t=5;const reactivated=battle.storyPassiveEvent(f,'alternate','e');
    f.alive=false;battle.t=10;const fainted=!battle.storyPassiveEvent(f,'alternate','q');
    results.push({id:sp.id,channel:p.channel,first,activated,cd,blocked,reactivated,fainted,pass:first&&activated&&cd===1.8&&blocked&&reactivated&&fainted});continue;
   }
   let eventOk=true;
   if(p.event==='dodge'){
    const initial=battle.passiveFactor(f,'damage');
    const activated=battle.storyPassiveEvent(f,'dodge');
    battle.t=1;const active=battle.passiveFactor(f,'damage');
    battle.t=2.5;const expired=battle.passiveFactor(f,'damage')===1;
    const blocked=!battle.storyPassiveEvent(f,'dodge');
    battle.t=10;const reactivated=battle.storyPassiveEvent(f,'dodge');
    eventOk=initial===1&&activated&&active===p.factor&&expired&&blocked&&reactivated;
   }
   if(p.when==='low')f.hp=30;
   if(p.when==='moving')f.moving=true;
   if(p.when==='shield')f.shieldT=1;
   if(['targetLow','targetCritical'].includes(p.when))target.hp=20;
   if(p.when!=='afterDodge')battle.t=p.when==='late'?9:p.when==='mid'?10:0;
   const actual=battle.passiveFactor(f,p.channel,target),outgoing=battle.outgoingBuffMult(f);
   const expectedOutgoing=p.channel==='damage'&&!['targetLow','targetCritical'].includes(p.when)?p.factor:1;
   const other=battle.passiveFactor(f,p.channel==='damage'?'incoming':'damage',target);
   battle.t=p.when==='late'?0:30;f.hp=p.when==='healthy'?30:100;f.moving=false;f.shieldT=0;target.hp=100;
   const inactive=battle.passiveFactor(f,p.channel,target);
   f.alive=false;const fainted=battle.passiveFactor(f,p.channel,target);
   results.push({id:sp.id,channel:p.channel,expected:p.factor,actual,outgoing,expectedOutgoing,other,inactive,fainted,eventOk,pass:actual===p.factor&&outgoing===expectedOutgoing&&other===1&&inactive===1&&fainted===1&&eventOk});
  }
  return results;
 });
 await fs.writeFile(out+'/battle-passive-hooks.json',JSON.stringify(passiveChecks,null,2));
 assert.equal(passiveChecks.length,29);
 assert.deepEqual(passiveChecks.filter(c=>!c.pass),[],'All active roster passives must pass actual battle prototype assertions');
 console.log('BROWSER PASSIVE HOOK PASS',passiveChecks.length,'actual battle prototype checks (not encounter outcomes)');
 assert.deepEqual(errors,[]);await page.locator('#core-art-review-gallery').evaluate(e=>e.scrollTop=0);await page.screenshot({path:out+'/rendered-gallery.png'});await fs.writeFile(out+'/index.json',JSON.stringify({assets,roster},null,2));console.log('CORE ART BROWSER PASS',assets.length,'decoded images,',roster.length,'actual game-rendered cats');
}finally{await browser.close();}
