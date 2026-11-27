// Offline-only Starbell trailer footage. Synthetic entry points, REAL subsequent inputs.
// Never publish or mutate production game/saves. Source: Canon 2.2 browser acceptance routes.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const origin='http://127.0.0.1:8765';
const root=process.argv[2]||'artifacts/starbell-trailer';
const fixtureRoot=process.env.STARBELL_FIXTURES||'artifacts/cat-bond-experience/synthetic-checkpoints';
const width=Number(process.env.TRAILER_WIDTH||540),height=width*16/9;
assert.ok(Number.isInteger(height)&&width>=360,'Use a native 9:16 viewport (540, 720 or 1080)');
await fs.mkdir(root,{recursive:true});
const revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const browser=await chromium.launch({headless:process.env.TRAILER_HEADFUL!=='1'});
const clips={
 garden:{scene:null,seconds:4,run:async h=>{await h.fresh();await h.mark('butterfly');for(let i=1;i<=3;i++){await h.page.locator('[data-garden-explore="butterfly"]').click();await h.page.waitForFunction(n=>GardenExploration.read(State.S).butterfly===n,i);await h.page.waitForTimeout(650);}}},
 meet:{scene:null,seconds:5,run:async h=>{await h.fresh();await h.page.locator('[data-npc-talk="muling"]').click();const encounter=h.page.locator('#cb-traveler-encounter');await encounter.waitFor();await h.mark('first encounter');await h.page.waitForTimeout(4500);await encounter.getByRole('button',{name:'Find the chart pieces',exact:true}).click();await encounter.waitFor({state:'detached'});for(const id of ['chart-0','chart-echo','chart-1'])await h.page.locator('[data-garden-explore="'+id+'"]').click();await h.page.locator('[data-npc-talk="muling"]').click();await h.mark('optional map encounter');await h.page.waitForTimeout(4000);}},
 chase:{scene:'harbor:H-02',seconds:4,run:async h=>{await h.click('Chase the runaway chime');const chase=h.page.locator('[data-spatial="chase"]');await chase.waitFor();await h.mark('real chase');const s=h.page.locator('.rw-surface'),b=await s.boundingBox();assert.ok(b);await h.page.waitForTimeout(600);await s.click({position:{x:b.width*.8,y:b.height*.35}});await h.page.waitForTimeout(3500);}},
 forest:{scene:'forest:R-02',seconds:4,run:async h=>{await h.click('Moonleaf bridge');const p=h.page.locator('.rw-puzzle-controls');await p.waitFor();await h.click('Fork',p);await h.click('Roots',p);await h.mark('grow the moonleaf bridge');await h.click('Turn moonleaf',p);await h.page.waitForTimeout(1200);await h.click('Roots',p);await h.page.waitForTimeout(800);await h.click('Free the trapped kitten',p);}},
 shadow:{scene:'forge:E-01',seconds:4,run:async h=>{await h.click('Lantern festival · Shadow show');const p=h.page.locator('.rw-puzzle-controls');await p.waitFor();await h.mark('shadow puppets');for(const label of ['Cat','Aim left','Aim right']){await h.click(label,p);await h.page.waitForTimeout(900);}}},
 glide:{scene:'sky:S-01',seconds:5,run:async h=>{await h.click('Catch the wind · Practice gliding');const status=h.page.locator('[data-sky-flight-status][data-route="open"]');await status.waitFor();const b=await h.page.locator('.rw-surface').boundingBox();assert.ok(b);await h.mark('continuous gliding');await h.page.mouse.click(b.x+b.width*.35,b.y+b.height*.30);await h.page.waitForFunction(()=>Number(document.querySelector('[data-sky-flight-status]')?.dataset.progress)>=.74,null,{timeout:20000});await h.page.mouse.click(b.x+b.width*.35,b.y+b.height*.50);await status.waitFor({state:'hidden',timeout:20000});}},
 battle:{scene:'harbor:H-04',seconds:8,run:async h=>{await h.click('Belllight beast');await h.page.locator('#panel [data-battle-auto="true"]').click();await h.page.locator('#bp-go').click();await h.page.locator('#battle-ui.on').waitFor();const tutorial=h.page.locator('#battle-tutorial-skip');if(await tutorial.isVisible())await tutorial.click();await h.mark('real battle; verify duo separately');await h.page.waitForTimeout(12000);h.extra.duoUses=await h.page.evaluate(()=>window.__game?.battle?.duoUses??null);}},
 lookout:{scene:'sky:S-04',seconds:5,run:async h=>{await h.click('Talk to Muling');const view=h.page.locator('.sky-lookout-view');await view.waitFor();await h.click('Walk around the lookout');await h.click('Sit beside Muling');assert.equal(await view.getAttribute('data-pose'),'sit');await h.page.locator('.sky-lookout-painting').evaluate(img=>img.decode());await h.mark('sit together');await h.page.waitForTimeout(5000);}},
 mystery:{scene:'harbor:H-03',seconds:4,run:async h=>{await h.click('Talk to Yandeng');const dlg=h.page.locator('.res-host[data-scene="harbor:H-03"]');await dlg.waitFor();await h.mark('old tune clue');for(let i=0;i<3;i++){if(!await dlg.isVisible())break;await h.page.waitForTimeout(1500);if(await dlg.isVisible())await dlg.locator('.res-line').click();}}},
 title:{scene:null,seconds:4,run:async h=>{await h.page.waitForFunction(()=>document.querySelector('#cb-title-name')?.textContent==='Echoes of the Starbell');await h.mark('official title');await h.page.waitForTimeout(5000);}}
};
const selected=(process.env.TRAILER_CLIPS||Object.keys(clips).join(',')).split(',');
assert.ok(selected.every(id=>clips[id]),'Unknown trailer clip');
const report={revision,viewport:{width,height},provenance:'local browser capture; synthetic checkpoint entries disclosed, no simulated footage',clips:[]};
try{
 for(const id of selected){
  const def=clips[id],entry={id,scene:def.scene,status:'failed',marks:[],extra:{},errors:[]};
  let context,page,video;
  try{
   const fixture=def.scene?JSON.parse(await fs.readFile(path.join(fixtureRoot,def.scene.replace(':','-')+'.json'),'utf8')):null;
   if(fixture){assert.equal(fixture.provenance,'synthetic engine-model browser-restored');assert.equal(fixture.revision,revision,'Regenerate checkpoint for checked-out commit');}
   context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:'en-US',recordVideo:{dir:path.join(root,'raw'),size:{width,height}},...(fixture?{storageState:fixture.storageState}:{})});
   await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort();});
   const started=Date.now();
   page=await context.newPage();video=page.video();page.setDefaultTimeout(18000);
   page.on('pageerror',e=>entry.errors.push(e.message));
   await page.goto(origin+'/cat-bond/?lang=en&rpgDev=1');
   await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
   async function click(label,scope=page){
    const b=scope.getByRole('button',{name:label,exact:true}).first();
    if(scope===page&&!await b.isVisible()){
     if(await page.locator('.rw-region-toggle[aria-expanded="false"],.rw-atlas-menu:not([open]) > summary').count()){await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-explore"]').click();}
     const optional=page.locator('.rw-optional-actions:not([open]) > summary:visible');if(!await b.isVisible()&&await optional.count())await optional.first().click();
     for(const selector of ['[data-fit-prev]:visible','[data-fit-next]:visible']){const nav=page.locator(selector);for(let i=0;i<20&&!await b.isVisible()&&await nav.count()&&await nav.isEnabled();i++)await nav.click();}
    }
    await b.click();
   }
   if(fixture){
    await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();
    await page.waitForFunction(s=>CatBondResonance.view().current?.id===s,def.scene);
    await page.waitForFunction(()=>['map','yard'].includes(__game.scene));
    const region=def.scene.split(':')[0];
    if(await page.evaluate(r=>__game.scene==='map'&&(WorldMap.mode!=='region'||WorldMap.currentRegion!==r),region))await page.locator('[data-next-scene="'+def.scene+'"]:visible').click();
    await page.waitForFunction(()=>WorldMap.mode==='region');
   }
   const fresh=async()=>{await page.locator('#intro-start').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();await page.locator('#cb-player-first-intro').getByRole('button',{name:'Start exploring',exact:true}).click();await page.waitForFunction(()=>__game.scene==='yard'&&State.S.cats[0]?.species==='jinjc');};
   const mark=async label=>{entry.marks.push({label,approxSeconds:(Date.now()-started)/1000,scene:await page.evaluate(()=>CatBondResonance.view().current?.id||null)});};
   await def.run({page,click,fresh,mark,extra:entry.extra});
   await page.waitForTimeout(1000);
   await page.screenshot({path:path.join(root,id+'.png')});
   assert.deepEqual(entry.errors,[]);
   assert.ok(entry.marks.length);
   entry.status='captured-not-editorially-approved';
  }catch(e){entry.error=String(e);if(page)await page.screenshot({path:path.join(root,id+'-FAIL.png')}).catch(()=>{});}
  finally{if(context)await context.close();if(video){const src=await video.path();const dest=path.join(root,id+'.webm');await fs.rename(src,dest);entry.file=id+'.webm';}}
  report.clips.push(entry);await fs.writeFile(path.join(root,'capture-index.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(entry));
 }
}finally{await browser.close();}
if(report.clips.some(c=>c.status==='failed'))process.exitCode=1;
