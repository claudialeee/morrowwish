// Measure actual RPG encounters from explicitly synthetic chapter checkpoints.
// Subsequent actions and battle results are real browser inputs and game outcomes.
// Never grant story evidence, change HP, inject wins or tune stats.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {attachExperienceRecorder} from './cat-bond-experience-recorder.mjs';
const root=process.argv[2]||'artifacts/cat-bond-experience',out=root+'/rpg-combat',origin='http://127.0.0.1:8765';
await fs.mkdir(out,{recursive:true});
const cases=[
 {id:'forest-auto',scene:'forest:R-03',region:'forest',op:'battle:root-echo',label:'Dispel the mimicking echo',auto:true},
 {id:'forest-manual',scene:'forest:R-03',region:'forest',op:'battle:root-echo',label:'Dispel the mimicking echo',auto:false},
 {id:'starfall-auto',scene:'starfall:F-04',region:'starfall',op:'battle:observatory-echo',label:'Observatory guardian · Echo orbit',auto:true}
];
const results=[],browser=await chromium.launch({headless:true});
process.env.CAT_BOND_EXPERIENCE='1';
try{for(const test of cases){
 let ctx,page;
 const errors=[];let initial=null,elapsed=null,last=null;const samples=[];
 try{
  const fixture=JSON.parse(await fs.readFile(root+'/synthetic-checkpoints/'+test.scene.replace(':','-')+'.json','utf8'));
  assert.equal(fixture.provenance,'synthetic engine-model browser-restored');
  ctx=await browser.newContext({storageState:fixture.storageState,viewport:{width:1440,height:900}});
  page=await ctx.newPage();page.setDefaultTimeout(18000);page.on('pageerror',e=>errors.push(e.message));
  await attachExperienceRecorder(ctx,page,{id:'battle-'+test.id,root:out,synthetic:true});
  await page.goto(origin+'/cat-bond/?lang=en&rpgDev=1');
  await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
  await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();
  await page.waitForFunction(id=>CatBondResonance.view().current?.id===id&&WorldMap.mode==='region',test.scene);
  async function clickWorld(label){
   const b=page.getByRole('button',{name:label,exact:true});
   if(!await b.isVisible()){
    await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-explore"]').click();
    const prev=page.locator('[data-fit-prev]:visible'),next=page.locator('[data-fit-next]:visible');
    for(let i=0;i<12&&!await b.isVisible()&&await prev.count()&&await prev.isEnabled();i++)await prev.click();
    for(let i=0;i<12&&!await b.isVisible()&&await next.count()&&await next.isEnabled();i++)await next.click();
   }
   await b.click();
  }
  const waitOp=op=>page.waitForFunction(op=>CatBondResonance.view().objective[0]===op,op);
  if(test.region==='forest'){
   await clickWorld('Meet Yahe · Stabilize the channel');await waitOp('explore:water-marks');
   await clickWorld('Inspect the wet water marks');await waitOp(test.op);
  }else await waitOp(test.op);
  await clickWorld(test.label);
  await page.locator('#panel [data-battle-auto="'+test.auto+'"]').click();
  await page.locator('#bp-go').click();await page.locator('#battle-ui.on').waitFor();
  await page.waitForFunction(region=>__game.battle?.libraryEncounter?.region===region,test.region);
  const tutorial=page.locator('#battle-tutorial-skip');if(await tutorial.isVisible())await tutorial.click();
  const state=()=>page.evaluate(()=>{
   const b=__game.battle;if(!b)return null;
   return {t:b.t,auto:!!b.autoMode,result:b.result,team:b.team.map(f=>({actor:f.cat?.storyActor||f.cat?.species||null,level:f.cat?.level??null,hp:f.hp,maxhp:f.maxhp,alive:f.alive})),enemies:b.enemies.map(f=>({hp:f.hp,maxhp:f.maxhp,alive:f.alive})),duoUses:b.duoUses||0};
  });
  initial=await state();assert.equal(initial.auto,test.auto,'Mode selected via battle prompt');
  await page.screenshot({path:out+'/'+test.id+'-start.png'});
  const start=Date.now();let tick=0;
  // Manual policy is a deliberately simple keypress baseline, not expert play.
  // All attacks and movement go through actual browser events.
  while(Date.now()-start<150000){
   if(await page.evaluate(()=>__game.scene!=='battle'))break;
   last=await state();if(!last)break;
   if(tick%4===0)samples.push(last);
   if(!test.auto){
    const aim=await page.evaluate(()=>{
     const b=__game.battle,me=b?.me?.(),enemy=b?.enemies?.find(e=>e.alive);
     const canvas=[...document.querySelectorAll('canvas')].find(c=>c.getClientRects().length&&c.width>=300&&c.height>=200);
     if(!me||!enemy||!canvas)return null;const r=canvas.getBoundingClientRect();
     return {x:r.left+enemy.x*r.width/canvas.width,y:r.top+enemy.y*r.height/canvas.height,key:Math.abs(enemy.x-me.x)>Math.abs(enemy.y-me.y)?(enemy.x>me.x?'d':'a'):(enemy.y>me.y?'s':'w')};
    });
    if(aim&&aim.x>=0&&aim.y>=0&&aim.x<1440&&aim.y<900){await page.mouse.move(aim.x,aim.y);await page.mouse.down();await page.keyboard.down(aim.key);await page.keyboard.press(['q','e','r','Space'][tick%4]);await page.waitForTimeout(200);await page.keyboard.up(aim.key);await page.mouse.up();}
   }
   await page.waitForTimeout(test.auto?500:150);tick++;
  }
  elapsed=(Date.now()-start)/1000;
  await page.waitForFunction(()=>__game.scene==='map',null,{timeout:10000});
  const panel=page.locator('#panel.open');await panel.waitFor();
  const title=await panel.locator('h2').first().innerText(),won=await page.evaluate(op=>!CatBondResonance.view().objective.includes(op),test.op);
  const displayedWin=/Hollow echo dispelled|Orbital guardian defeated/.test(title);
  assert.equal(won,displayedWin,'Visible result and durable narrative evidence must agree');
  assert.deepEqual(errors,[]);
  const result={id:test.id,status:'measured',outcome:won?'win':'non-win',title,wallSeconds:elapsed,gameSeconds:last?.t,initial,last,samples};
  results.push(result);await page.screenshot({path:out+'/'+test.id+'-result.png'});
  console.log('RPG COMBAT',JSON.stringify({id:test.id,outcome:result.outcome,title,wallSeconds:elapsed,gameSeconds:last?.t,team:initial.team,duoUses:last?.duoUses}));
 }catch(e){results.push({id:test.id,status:'failed-to-measure',error:String(e).slice(0,2000),pageErrors:errors,initial,last,samples});console.error('RPG COMBAT ERROR',test.id,String(e));await page?.screenshot({path:out+'/'+test.id+'-FAIL.png'}).catch(()=>{});}
 finally{await ctx?.close();}
}}finally{
 await browser.close();
 await fs.writeFile(out+'/index.json',JSON.stringify({provenance:'synthetic starting chapter, actual game inputs/outcomes',limitations:['Default legal recruited roster; prior XP, captures and economy are not reproduced.','One run per mode, not a win-rate estimate.','Manual policy is simple scripted input, not human expert skill.'],results},null,2));
}
if(results.some(r=>r.status!=='measured'))process.exitCode=1;
