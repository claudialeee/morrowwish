// Fresh normal-player campaign; all progression follows visible controls. No imported saves or developer state.
// Battle engine fast-forward runs the original update loop, never forces a result.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
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
 await page.goto(url);await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
 await press(page.locator('#intro-start'));await press(page.locator('#intro-slot-list [data-slot="slot1"]'));
 await page.locator('#cb-player-first-intro').waitFor();
 await press(page.locator('#cb-player-first-intro').getByRole('button',{name:portrait?'跳过介绍':'Skip introduction',exact:true}));
 assert.equal(await page.evaluate(()=>window.__STARBELL_DEVELOPER__),false);
 assert.equal(await page.evaluate(()=>State.S.cats.length),1);
 await press(page.locator('.sg-prologue-guide .sg-quest-toggle'));
 await press(page.locator('.sg-prologue-guide').getByRole('button',{name:portrait?'跳过此次相遇':'Skip this encounter',exact:true}));
 await page.waitForFunction(()=>CatBondResonance.view().current?.id==='harbor:H-01');
 const row=page.locator('.rw-puzzle-controls:visible'),surface=page.locator('.rw-surface');
 const button=(zh,en,within=page)=>within.getByRole('button',{name:portrait?zh:en,exact:true});
 const puzzleClick=(zh,en)=>press(button(zh,en,row));
 async function solve(op){
  console.log('FRESH PUZZLE',lang,op);
  if(op==='puzzle:moonleaf-crossing'){await puzzleClick('岔路','Fork');await puzzleClick('拨动月叶','Turn moonleaf');await puzzleClick('地下','Roots');await puzzleClick('帮小猫离开根丛','Free the trapped kitten');await puzzleClick('对岸','Far bank');}
  else if(op==='puzzle:shadow-bridge'){for(const x of [.19,.51,.68,.82,.18]){const b=await surface.boundingBox();if(portrait)await page.touchscreen.tap(b.x+x*b.width,b.y+.45*b.height);else await page.mouse.click(b.x+x*b.width,b.y+.45*b.height);}await puzzleClick('追上逃走的影子','Follow the escaping shadows');}
  else if(op==='puzzle:joint-flight'){const b=await surface.boundingBox(),x=b.x+b.width*.35,y=b.y+b.height*.28;if(portrait)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);}
  else if(op==='puzzle:library-echo'){await puzzleClick('换位置，摇铃','Move and ring');const left=await page.locator('[data-mirror-response]').evaluate(e=>e.dataset.leftFacing===e.dataset.position);await press(left?button('选左边的猫','Choose the left cat',row):button('选右边的猫','Choose the right cat',row));}
  else if(op==='explore:routing-record'){await puzzleClick('查公开日志','Inspect public log');await puzzleClick('查线路图','Inspect route map');await puzzleClick('查借阅簿','Inspect ledger');await puzzleClick('向暮铃求证','Ask Luna');}
  else if(op==='puzzle:star-steps'){for(const n of [2,4,8])await puzzleClick('跳向星石 '+n,'Jump to stone '+n);}
  else throw Error('Unexpected active puzzle '+op);
 }
 const puzzles=new Set();
 const won=[],films=[],completed=new Set();let last='';
 const deadline=Date.now()+15*60*1000;
 for(let step=0;step<1000&&Date.now()<deadline;step++){
   const {v,s,mode,region}=await read();const id=v.current?.id||'ended';if(id!==last){console.log('NORMAL CONTINUATION',lang,id,mode,region);last=id;}
   if(v.ending){assert.equal(s.completed.length,campaign.scenes.length);assert.equal(s.melodies.length,6);assert.equal(s.support.length,6);assert.ok(s.evidence['finale:B-03'].includes('battle:central-echo'));assert.ok(s.evidence['epilogue:E-03'].includes('npc:second-garden-key'));await page.locator('.res-ending-title').waitFor({timeout:12000});await show();break;}
   const ack=page.locator('[data-canon-acknowledgement]:visible button');if(await ack.count()&&await ack.isVisible()){if(!films.includes(id))films.push(id);await press(ack);await page.waitForTimeout(60);continue;}
   const key=page.locator('.res-key-panel:visible button');if(await key.count()&&await key.isVisible()){await press(key);await page.waitForTimeout(100);continue;}
   const finalResult=page.locator('#cb-finale-result:visible');if(await finalResult.count()){assert.equal(await finalResult.getAttribute('data-finale-outcome'),'saved');await press(finalResult.locator('[data-finale-return]'));continue;}
   const reward=page.locator('#library-battle-ok:visible');if(await reward.count()){await press(reward);continue;}
   const lookout=page.locator('.sky-lookout-view[data-pose="arrival"]:visible');if(await lookout.count()){await press(button('坐到暮铃身边','Sit beside Luna'));continue;}
   const choices=page.locator('.res-host:visible .res-choices button:visible');if(await choices.count()){await press(choices.first());continue;}
   const line=page.locator('.res-host:visible .res-line:visible');if(await line.count()&&v.lineReady&&v.cursor<v.current.lines.length){await press(line);await page.waitForTimeout(50);continue;}
   if(await row.count()&&await row.isVisible()){const op=v.objective[0];if(!puzzles.has(id+':'+op)){await solve(op);puzzles.add(id+':'+op);}await page.waitForTimeout(250);continue;}
   const prep=page.locator('#bp-go:visible');if(await prep.count()){const best=page.locator('#bp-best-team:visible');if(await best.count())await press(best);const duo=page.locator('#bp-chosen-duo:visible');if(await duo.count())await press(duo);const mode=page.locator('[data-battle-auto="true"]:visible');await press(mode);await press(prep);continue;}
   if(mode==='battle'){
    if(await page.locator('#duo-burst:not([hidden])').isVisible()){await page.waitForTimeout(400);continue;}
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
 for(const id of ['harbor:H-04','forest:R-04','forge:E-03','sky:S-03','library:M-02','starfall:F-04','finale:B-01','finale:B-03'])assert.ok(won.includes(id),'Actual victory missing: '+id);assert.ok(films.includes('starfall:F-02')&&films.includes('finale:B-04'),'Normal-mode art fallback verified');
 assert.equal(await page.evaluate(()=>State.listSaveSlots().find(s=>s.id==='slot1').regionLabelEn),'Sunlit Garden');
 assert.deepEqual(errors,[]);console.log('FRESH NORMAL CAMPAIGN TO ENDING PASS',lang,JSON.stringify({won,films}));
}catch(e){await show().catch(()=>{});console.error('NORMAL CONTINUATION FAIL',lang,String(e),JSON.stringify(await read().catch(()=>null)).slice(0,2500),errors);throw e;}finally{await browser.close();}
