// Synthetic chapter START only. Every subsequent story event, win and save uses the real browser runtime.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const portrait=process.env.STARBELL_FINALE_PROFILE==='portrait',lang=portrait?'zh':'en';
const origin=process.env.CAT_BOND_SMOKE_ORIGIN||'http://127.0.0.1:8765';
const output='artifacts/canon3-finale/'+(portrait?'portrait':'wide');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext(portrait?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:800}});
const page=await context.newPage();page.setDefaultTimeout(20000);
const errors=[],trace=[],wins=[],lines=[];page.on('pageerror',e=>errors.push(e.message));
await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort()});
const press=async l=>{await l.waitFor({state:'visible'});await (portrait?l.tap():l.click());};
const text=(zh,en)=>lang==='zh'?zh:en;
const shot=async id=>page.screenshot({path:output+'/'+id+'.png'});
const view=()=>page.evaluate(()=>CatBondResonance.view());
const scene=async id=>page.waitForFunction(id=>CatBondResonance.view().current?.id===id,id);
const next=async id=>press(page.locator('[data-next-scene="'+id+'"]:visible'));
async function dialogue(id){
 await scene(id);
 for(let i=0;i<30;i++){
  const v=await view();if(v.current?.id!==id)return;
  const panel=page.locator('.res-host[data-scene="'+id+'"]');
  if(v.current.choices.length&&!v.choice&&(v.current.choiceTiming==='beforeAction'||v.cursor===(v.current.choiceAt??v.current.lines.length))){
   if(!await panel.isVisible())await next(id);
   await press(panel.getByRole('button',{name:v.current.choices[0].label[lang],exact:true}));continue;
  }
  if(!v.lineReady||v.cursor>=v.current.lines.length)return;
  if(!await panel.isVisible()){
   if(id.startsWith('epilogue:'))await press(page.locator('.sg-prologue-guide').getByRole('button',{name:text('与暮铃交谈','Talk to Luna'),exact:true}));
   else await next(id);
  }
  const line=panel.locator('.res-line');await line.waitFor();assert.equal(await line.innerText(),v.current.lines[v.cursor].text[lang]);lines.push([id,v.cursor,await line.innerText()]);
  await press(line);await page.waitForFunction(({id,cursor})=>{const v=CatBondResonance.view();return v.current?.id!==id||v.cursor!==cursor;},{id,cursor:v.cursor});
 }
 throw Error('dialogue stalled '+id);
}
async function fight(id,op){
 await scene(id);await next(id);
 await press(page.locator('#panel [data-battle-auto="true"]'));await press(page.locator('#bp-go'));
 await page.waitForFunction(id=>__game.scene==='battle'&&__game.battle?.resonanceFinale?.id===id,id);
 const tutorial=page.locator('#battle-tutorial-skip');if(await tutorial.isVisible())await press(tutorial);
 if(await page.locator('#battle-help-start').isVisible())await press(page.locator('#battle-help-start'));
 const before=await page.evaluate(()=>({team:__game.battle.team.map(x=>x.cat.storyActor||x.cat.species),duo:__game.battle.duo&&[__game.battle.duo.a.storyActor||__game.battle.duo.a.species,__game.battle.duo.b.storyActor||__game.battle.duo.b.species],hp:__game.battle.enemies[0].hp,portrait:__game.battle.H>__game.battle.W}));
 assert.equal(before.portrait,portrait);if(id==='finale:B-03'){assert.ok(before.team.includes('muling'));assert.deepEqual(new Set(before.duo),new Set(['jinjc','muling']));}
 await shot(id.replace(':','-')+'-start');
 let peakDuo=0,final=null;
 // Accelerate the actual production update loop as in the existing regional guardian browser gate.
 // No finish(true), damage/HP edits, position changes, or direct evidence calls.
 for(let batch=0;batch<230;batch++){
  const r=await page.evaluate(()=>{const g=__game,b=g.battle;if(!b)return null;let duo=b.duoUses||0;for(let i=0;i<100&&!b.done;i++){b.update(1/60);duo=Math.max(duo,b.duoUses||0);}const f=b.resonanceFinale;const result={done:b.done,result:b.result,t:b.t,elapsed:f.elapsed,duo,nodes:f.nodes.map(n=>({region:n.region,done:n.done,integrity:n.integrity})),team:b.team.map(x=>({actor:x.cat.storyActor||x.cat.species,hp:x.hp}))};if(b.done&&g.battle===b)g.endBattle();return result;});
  if(!r)break;peakDuo=Math.max(peakDuo,r.duo);final=r;trace.push({id,...r});if(r.done)break;
  if(r.duo>0&&id==='finale:B-03'&&!wins.some(w=>w.id===id)){/* captured in trace below */}
 }
 const result=page.locator('#cb-finale-result');await result.waitFor({timeout:30000});const outcome=await result.getAttribute('data-finale-outcome');assert.equal(outcome,'saved',JSON.stringify({id,final,outcome}));
 assert.ok(await page.evaluate(({id,op})=>CatBondResonance.snapshot().evidence[id]?.includes(op),{id,op}),'verified battle saved');
 if(id==='finale:B-03'){assert.equal((await page.evaluate(()=>CatBondResonance.snapshot().support)).length,6);assert.ok(peakDuo>0,'Luna + protagonist actually cast duo during the last battle');}
 wins.push({id,op,outcome,peakDuo,before,final});console.log('REAL FINALE WIN',JSON.stringify(wins.at(-1)));await shot(id.replace(':','-')+'-result');await press(result.locator('[data-finale-return]'));
}
try{
 await page.goto(origin+'/cat-bond/?developer=1&rpgDev=1&qa=canon3-final-continuous&region=finale&reset=1&lang='+lang);
 await page.locator('#starbell-developer-menu').waitFor();
 // Only initial fixture: ordinary mid-game roster, all six local bells restored, Luna away.
 await page.evaluate(()=>{if(!window.__STARBELL_DEVELOPER__)throw Error('developer isolation required');CatBondResonance.close();UI.closeAll();const root=State.S;const catList=[...root.cats,...Object.values(root.storyAway||{})];for(const cat of catList){while(cat.level<6)State.addXp(cat,State.xpToNext(cat.level));Skills.autoLearn(cat);}root.difficulty='casual';root.gameStarted=true;root.battleTutorialDone=true;root.firstDuoShowcasePending=false;root.battlePrefs={...root.battlePrefs,autoBattle:true,modeChosen:true,tutorialSeen:true,manualTutorialSeen:true};if(!State.save().ok)throw Error('fixture save failed');});
 const start=await page.evaluate(()=>({scene:CatBondResonance.view().current.id,ring:CatBondResonance.view().ring,bells:CatBondResonance.snapshot().melodies,away:!!State.S.storyAway?.muling,coins:State.S.coins,slot:State.activeSlot()}));assert.equal(start.scene,'finale:B-01');assert.equal(start.ring,true);assert.equal(start.bells.length,6);assert.equal(start.away,true);
 await dialogue('finale:B-01');await fight('finale:B-01','battle:inward-gates');await scene('finale:B-02');
 assert.ok(!(await view()).objective.some(o=>o.startsWith('battle:')),'no third battle');
 await dialogue('finale:B-02');await scene('finale:B-03');
 assert.ok(await page.evaluate(()=>State.S.cats.some(c=>c.storyActor==='muling')&&!State.S.storyAway?.muling),'Luna returned through real dialogue completion');
 await fight('finale:B-03','battle:central-echo');
 if((await view()).current?.id==='finale:B-03')await dialogue('finale:B-03');
 await scene('finale:B-04');await page.waitForFunction(()=>CatBondChapterCinematics.starfallReleaseReady()||CatBondChapterCinematics.developmentReady(),null,{timeout:20000});
 await next('finale:B-04');await page.locator('.cbcp-art').first().waitFor({timeout:20000});await shot('memory-returns');
 await page.waitForFunction(()=>CatBondResonance.view().current?.chapter==='epilogue',null,{timeout:120000});
 if(await page.evaluate(()=>__game.scene!=='yard'))await next('epilogue:E-01');
 await scene('epilogue:E-02');await page.waitForFunction(()=>__game.scene==='yard');assert.equal(await page.locator('#first-quest').isVisible(),false);
 await dialogue('epilogue:E-02');await scene('epilogue:E-03');await dialogue('epilogue:E-03');
 await press(page.locator('.res-key-panel').getByRole('button',{name:text('交给暮铃','Give Luna the key'),exact:true}));
 const title=page.locator('.res-ending-title');await title.waitFor();await title.locator('img').evaluate(img=>img.decode());await shot('ending');
 await press(title.getByRole('button',{name:text('回到阳光花园','Return to Sunlit Garden'),exact:true}));
 const end=await page.evaluate(()=>({ending:CatBondResonance.view().ending,story:CatBondResonance.snapshot(),coins:State.S.coins,slot:State.activeSlot(),place:__game.scene,luna:State.S.cats.some(c=>c.storyActor==='muling'),publicKeys:['catbond_save_v1','catbond_save_slots_v1','catbond_active_slot_v1'].map(k=>localStorage.getItem(k))}));
 assert.equal(end.ending,true);assert.equal(end.story.completed.length,40);assert.equal(end.place,'yard');assert.equal(end.luna,true);assert.equal(end.coins,start.coins+180);assert.equal(end.slot,start.slot);assert.ok(end.publicKeys.every(x=>x===null));assert.deepEqual(wins.map(w=>w.op),['battle:inward-gates','battle:central-echo']);assert.deepEqual(errors,[]);
 await fs.writeFile(output+'/result.json',JSON.stringify({status:'passed',profile:portrait?'portrait':'wide',start,end,wins,lines,trace,errors},null,2));console.log('PASS CANON3 CONTINUOUS FINALE',JSON.stringify({profile:portrait?'portrait':'wide',wins:wins.map(w=>[w.op,w.peakDuo]),completed:end.story.completed.length,place:end.place}));
}catch(e){await shot('FAIL').catch(()=>{});await fs.writeFile(output+'/result.json',JSON.stringify({status:'failed',error:String(e),stack:e.stack,view:await view().catch(()=>null),wins,lines,trace,errors},null,2));console.error('FINALE FAIL',String(e),JSON.stringify({scene:(await view().catch(()=>null))?.current?.id,wins,errors}));process.exitCode=1;}finally{await browser.close();}
