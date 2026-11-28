// Actual normal-mode browser continuation from an isolated, reconstructed F-02 save.
// The fixture sets only the pre-existing chapter; no progression, battle result or save is injected after load.
// Battle engine fast-forward runs the original update loop, never forces a result.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {makeEngine} from '../public/cat-bond/js/resonance/engine.mjs';
import {developerCheckpoint} from '../public/cat-bond/js/resonance/developer-preview.mjs';
import {mkdir} from 'node:fs/promises';
const origin=process.env.CAT_BOND_SMOKE_ORIGIN||'http://127.0.0.1:8765';
const portrait=process.env.STARBELL_WORK_PROFILE==='portrait',lang=portrait?'zh':'en';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext(portrait?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}:{viewport:{width:1280,height:800},reducedMotion:'reduce'});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort()});
const press=async l=>portrait?l.tap({timeout:12000}):l.click({timeout:12000});
const url=origin+'/cat-bond/?qa=work-closure&lang='+lang;
const read=()=>page.evaluate(()=>({v:CatBondResonance.view(),s:CatBondResonance.snapshot(),mode:__game.scene,region:WorldMap.currentRegion}));
const show=async()=>{await mkdir('artifacts/work-closure',{recursive:true});await page.screenshot({path:'artifacts/work-closure/'+lang+'-final.png'});};
try{
 const {initial,story}=developerCheckpoint('starfall:F-02'),engine=makeEngine(campaign,story);
 assert(engine.record('starfall:F-02','explore:catastrophe-record').ok);
 const blocked=engine.snapshot();assert.equal(blocked.melodies.length,5);
 await page.goto(url);await page.locator('#intro-start').waitFor();
 const labels=await page.locator('#cb-home').evaluate(a=>({text:a.textContent,aria:a.getAttribute('aria-label')}));
 assert.ok(lang==='zh'?labels.aria.includes('返回'):!/[\u4e00-\u9fff]/.test(labels.text+labels.aria));
 await page.evaluate(async({initial,blocked,portrait})=>{
   if(window.__STARBELL_DEVELOPER__)throw Error('Normal mode required');
   const {storyPartyPatch}=await import('/cat-bond/js/resonance/story-party.mjs');
   const hero=State.makeCat('jinjc',{affinity:35,protagonist:true});
   const root={...structuredClone(State.S),cats:[hero],dex:{jinjc:1},gameStarted:true,coins:500,fish:25,difficulty:'casual',tutorialDone:true,battleTutorialDone:true,catchCount:8,firstDuoShowcasePending:false,resonance:blocked,resonanceExploration:{location:'starfall',positions:{starfall:{x:.92,y:.30}},interactions:{},pickups:{},cargo:null},battlePrefs:{autoBattle:true,modeChosen:true,tutorialSeen:true,manualTutorialSeen:true}};
   const party=storyPartyPatch(root,initial,blocked,State.makeCat.bind(State));if(party)Object.assign(root,party.fields);
   for(const cat of [...root.cats,...Object.values(root.storyAway||{})]){while(cat.level<7)State.addXp(cat,State.xpToNext(cat.level));Skills.autoLearn(cat);}
   root.firstDuoShowcasePending=false;
   // Reconstruct the stale interrupted presentation reported by Work; not the user's private save.
   if(!portrait)root.chapterPresentation={slotId:'slot1',revision:blocked.revision,snapshot:{sceneId:'starfall:F-02',frameIndex:9999,elapsedMs:0,paused:true}};
   if(!State.importSaveSlot('slot1',root).ok)throw Error('Fixture import failed');
 },{initial,blocked,portrait});
 await page.reload();await page.locator('#intro-continue').waitFor();await press(page.locator('#intro-continue'));await press(page.locator('#intro-slot-list [data-slot="slot1"]'));
 await page.waitForFunction(()=>__game.scene==='map'&&WorldMap.currentRegion==='starfall'&&CatBondResonance.view().current?.id==='starfall:F-02');
 assert.equal(await page.evaluate(()=>State.listSaveSlots().find(s=>s.id==='slot1').regionLabelEn),'Starfall Expanse');
 const won=[],films=[],completed=new Set();let last='';
 const deadline=Date.now()+8*60*1000;
 for(let step=0;step<300&&Date.now()<deadline;step++){
   const {v,s,mode,region}=await read();const id=v.current?.id||'ended';if(id!==last){console.log('NORMAL CONTINUATION',lang,id,mode,region);last=id;}
   if(v.ending){assert.equal(s.completed.length,campaign.scenes.length);assert.equal(s.melodies.length,6);assert.equal(s.support.length,6);assert.ok(s.evidence['finale:B-03'].includes('battle:central-echo'));assert.ok(s.evidence['epilogue:E-03'].includes('npc:second-garden-key'));await page.locator('.res-ending-title').waitFor({timeout:12000});await show();break;}
   const ack=page.locator('[data-canon-acknowledgement]:visible button');if(await ack.count()&&await ack.isVisible()){if(!films.includes(id))films.push(id);await press(ack);await page.waitForTimeout(60);continue;}
   const key=page.locator('.res-key-panel:visible button');if(await key.count()&&await key.isVisible()){await press(key);await page.waitForTimeout(100);continue;}
   const finalResult=page.locator('#cb-finale-result:visible');if(await finalResult.count()){assert.equal(await finalResult.getAttribute('data-finale-outcome'),'saved');await press(finalResult.locator('[data-finale-return]'));continue;}
   const reward=page.locator('#library-battle-ok:visible');if(await reward.count()){await press(reward);continue;}
   const choices=page.locator('.res-host:visible .res-choices button:visible');if(await choices.count()){await press(choices.first());continue;}
   const line=page.locator('.res-host:visible .res-line:visible');if(await line.count()&&v.lineReady&&v.cursor<v.current.lines.length){await press(line);await page.waitForTimeout(50);continue;}
   const prep=page.locator('#bp-go:visible');if(await prep.count()){const mode=page.locator('[data-battle-auto="true"]:visible');await press(mode);await press(prep);continue;}
   if(mode==='battle'){
    const help=page.locator('#battle-help-start:visible');if(await help.count()){await press(help);continue;}
    const tutorial=page.locator('#battle-tutorial-skip:visible');if(await tutorial.count()){await press(tutorial);continue;}
    const result=await page.evaluate(()=>{const g=__game,b=g.battle;if(!b)return null;for(let i=0;i<16000&&!b.done;i++)b.update(1/60);const r={done:b.done,result:b.result,t:b.t};if(b.done&&g.battle===b)g.endBattle();return r;});
    assert.ok(result?.done&&result.result==='win',id+' real battle: '+JSON.stringify(result));won.push(id);console.log('REAL BATTLE WIN',lang,id,JSON.stringify(result));continue;
   }
   const next=page.locator('[data-next-scene="'+id+'"]:visible');if(await next.count()&&await next.isEnabled()){try{if(portrait)await next.tap({timeout:2500});else await next.click({timeout:2500});}catch(e){if(e.name!=="TimeoutError")throw e;/* The map may have been replaced by a cinematic, result, or walking state between frames. Re-read the real UI; the ending assertions remain mandatory. */}await page.waitForTimeout(180);continue;}
   if(mode==='yard'&&id.startsWith('epilogue:')){const talk=page.locator('.sg-prologue-guide .sg-main-continue:visible');if(await talk.count()){await press(talk);await page.waitForTimeout(180);continue;}}
   if(await page.locator('.res-chapter-cinematic:visible').count()){await page.waitForTimeout(500);continue;}
   await page.waitForTimeout(250);
 }
 const final=await read();assert.ok(final.v.ending,'Continuation failed: '+JSON.stringify({id:final.v.current?.id,objective:final.v.objective,mode:final.mode,region:final.region,won,films}));
 assert.ok(won.includes('starfall:F-04')&&won.includes('finale:B-01')&&won.includes('finale:B-03'));assert.ok(films.includes('starfall:F-02')&&films.includes('finale:B-04'),'Normal-mode art fallback verified');
 assert.equal(await page.evaluate(()=>State.listSaveSlots().find(s=>s.id==='slot1').regionLabelEn),'Sunlit Garden');
 assert.deepEqual(errors,[]);console.log('WORK CLOSURE NORMAL SAVE TO ENDING PASS',lang,JSON.stringify({won,films}));
}catch(e){await show().catch(()=>{});console.error('NORMAL CONTINUATION FAIL',lang,String(e),JSON.stringify(await read().catch(()=>null)).slice(0,2500),errors);throw e;}finally{await browser.close();}
