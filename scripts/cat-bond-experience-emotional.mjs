// Targeted real-input dialogue checks from explicitly synthetic chapter fixtures.
// This does not assert enjoyment or earlier player-earned progression.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {attachExperienceRecorder} from './cat-bond-experience-recorder.mjs';
const root=process.argv[2]||'artifacts/cat-bond-experience';
const origin='http://127.0.0.1:8765',out=root+'/emotional-targets';
await fs.mkdir(out,{recursive:true});
const cases=[
 {scene:'sky:S-04',next:'sky:S-05',choice:'Sit with her for a while',option:'company'},
 {scene:'library:M-03',next:'library:M-04',choice:'I feel hurt',option:'hurt'},
 {scene:'starfall:F-03',next:'starfall:F-04'},
 {scene:'epilogue:E-02',next:'epilogue:E-03',choice:'Give everyone some time',option:'space'},
 {scene:'epilogue:E-03',ending:true}
];
const browser=await chromium.launch({headless:true}),results=[];
process.env.CAT_BOND_EXPERIENCE='1';
try{
for(const test of cases){
 let ctx,page;
 const name=test.scene.replace(':','-'),observed=[],errors=[];
 try{
  const fixture=JSON.parse(await fs.readFile(root+'/synthetic-checkpoints/'+name+'.json','utf8'));
  assert.equal(fixture.provenance,'synthetic engine-model browser-restored');
  ctx=await browser.newContext({storageState:fixture.storageState,viewport:{width:1440,height:900}});
  page=await ctx.newPage();page.setDefaultTimeout(12000);
  await attachExperienceRecorder(ctx,page,{id:'target-'+name,root:out,synthetic:true});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/cat-bond/?lang=en&rpgDev=1');
  await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
  await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();
  await page.waitForFunction(id=>CatBondResonance.view().current?.id===id,test.scene);
  await page.waitForFunction(()=>['map','yard'].includes(__game.scene));
  const initial=await page.evaluate(()=>({party:State.S.cats.map(c=>c.storyActor||c.species),away:State.S.storyAway?.muling?.uid||null}));
  const button=label=>page.getByRole('button',{name:label,exact:true});
  if(await page.evaluate(()=>__game.scene)==='yard'){
   const talk=button('Talk to Muling');if(await talk.count())await talk.first().click();else await page.locator('[data-npc-talk="muling"]').click();
  }else{
   const talk=button('Talk to Muling');
   if(!await talk.isVisible()){
    await page.locator('#map-menu').click();
    await page.locator('#cb-system-menu [data-system="world-explore"]').click();
   }
   await talk.click();
  }
  const dialogue=page.locator('.res-host[data-scene="'+test.scene+'"]');
  await dialogue.waitFor();
  for(let i=0;i<40;i++){
   const view=await page.evaluate(()=>CatBondResonance.view());
   if(view.current?.id!==test.scene||!view.lineReady||view.cursor>=view.current.lines.length)break;
   const line=view.current.lines[view.cursor];
   const text=dialogue.locator('.res-line');
   await page.waitForFunction(t=>document.querySelector('.res-host .res-line')?.textContent===t,line.text.en);
   observed.push({cursor:view.cursor,speaker:line.speaker,text:await text.innerText()});
   if(i===0||i===view.current.lines.length-1)await page.screenshot({path:out+'/'+name+'-line-'+view.cursor+'.png'});
   // Legacy tea animation disables advance briefly. Wait for the real UI, not time mutation.
   const skip=dialogue.getByRole('button',{name:'Skip dialogue',exact:true});
   if(await skip.count())await page.waitForFunction(()=>!document.querySelector('.res-host .res-skip-top')?.disabled);
   await text.click();
   await page.waitForFunction(({id,cursor})=>{const v=CatBondResonance.view();return v.current?.id!==id||v.cursor>cursor;},{id:test.scene,cursor:view.cursor});
  }
  assert.ok(observed.length>0,'No rendered dialogue observed');
  if(test.choice){
   await dialogue.getByRole('button',{name:test.choice,exact:true}).click();
   await page.waitForFunction(({id,option})=>State.S.resonance.choices[id]===option,{id:test.scene,option:test.option});
  }
  if(test.ending){
   await button('Give Muling the key').click();
   await page.getByRole('heading',{name:'THE BELL RINGS AGAIN'}).waitFor();
   await page.screenshot({path:out+'/'+name+'-ending.png'});
   assert.equal(await page.evaluate(()=>CatBondResonance.view().ending),true);
   assert.equal(await page.evaluate(()=>State.S.cats.find(c=>c.storyActor==='muling')?.uid),initial.away);
   await button('Return to Sunlit Garden').click();
   await page.waitForFunction(()=>__game.scene==='yard');
   const trust=await page.evaluate(()=>State.S.resonance.trust.muling);
   await button('Talk to Muling').click();
   let ambient=page.locator('.res-ambient-simple');
   await ambient.waitFor();assert.equal(await ambient.locator('h2').innerText(),'Decide together');
   await ambient.getByRole('button',{name:'Maybe later',exact:true}).click();
   assert.equal(await page.evaluate(()=>State.S.resonance.ambientDone.includes('muling:accountability')),false);
   await button('Talk to Muling').click();await ambient.waitFor();
   await ambient.getByRole('button',{name:'Ask everyone what they think',exact:true}).click();
   await ambient.getByRole('button',{name:'Return to exploration',exact:true}).waitFor();
   await page.screenshot({path:out+'/'+name+'-accountability.png'});
   await ambient.getByRole('button',{name:'Return to exploration',exact:true}).click();
   assert.equal(await page.evaluate(()=>State.S.resonance.ambientDone.includes('muling:accountability')),true);
   assert.equal(await page.evaluate(()=>State.S.resonance.trust.muling),trust+1);
   assert.equal(await page.evaluate(()=>CatBondResonance.view().ending),true);
   console.log('AMBIENT BROWSER PASS muling:accountability (after real epilogue input)');

  }else await page.waitForFunction(id=>CatBondResonance.view().current?.id===id,test.next);
  assert.deepEqual(errors,[]);
  results.push({scene:test.scene,status:'passed',observed,choice:test.choice||null,initial});
  console.log('TARGET DIALOGUE PASS',test.scene,observed.length,'lines');
 }catch(e){
  results.push({scene:test.scene,status:'failed',observed,error:String(e).slice(0,2000),pageErrors:errors});
  console.error('TARGET DIALOGUE FAIL',test.scene,String(e));
  await page?.screenshot({path:out+'/'+name+'-FAIL.png'}).catch(()=>{});
 }finally{await ctx?.close();}
}
}finally{await browser.close();await fs.writeFile(out+'/index.json',JSON.stringify({provenance:'synthetic starting checkpoints; subsequent real browser inputs',results},null,2));}
if(results.some(r=>r.status!=='passed'))process.exitCode=1;
