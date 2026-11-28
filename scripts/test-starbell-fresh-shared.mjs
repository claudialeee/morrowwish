// Shared normal-player campaign acceptance. Local strict fresh or exact-SHA live with earned checkpoint resume; no synthetic saves or forced wins.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const origin=process.env.CAT_BOND_SMOKE_ORIGIN||'http://127.0.0.1:8765';
const portrait=process.env.STARBELL_WORK_PROFILE==='portrait',lang=process.env.STARBELL_LANG||'zh';
const local=process.env.STARBELL_MODE==='local',tr=(zh,en)=>lang==='zh'?zh:en;
assert.ok(['zh','en'].includes(lang));
const profile=portrait?'portrait':'wide';
const hash=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
const unpack=async()=>{let raw;try{raw=await readFile('resume/checkpoint.json','utf8');}catch(e){if(e.code==='ENOENT')return null;throw e;}const {digest,...p}=JSON.parse(raw);assert.equal(hash(p),digest,'Checkpoint checksum');assert.equal(p.sha,process.env.SOURCE_SHA);assert.equal(p.origin,origin);assert.equal(p.profile,profile);assert.equal(p.lang,lang);assert.equal(p.slot,'slot1');assert.ok(p.storageState.origins.some(o=>o.origin===origin));assert.ok(p.completed.length>=5);assert.deepEqual(p.completed,campaign.scenes.slice(0,p.completed.length).map(s=>s.id));return p;};
const resume=local?null:await unpack();
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({... (portrait?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}:{viewport:{width:1280,height:800},reducedMotion:'reduce'}),...(resume?{storageState:resume.storageState}:{})});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort()});
const press=async l=>portrait?l.tap({timeout:12000}):l.click({timeout:12000});
const url=origin+'/cat-bond/?qa=live-fresh-20261127&lang='+lang;
const read=()=>page.evaluate(()=>({v:CatBondResonance.view(),s:CatBondResonance.snapshot(),mode:__game.scene,region:WorldMap.currentRegion}));
const show=async()=>{await mkdir('artifacts/live-fresh',{recursive:true});await page.screenshot({path:'artifacts/live-fresh/'+(portrait?'portrait':'wide')+'-final.png'});};
try{
 await page.goto(url);
 if(!local)assert.equal(await page.locator('body').getAttribute('data-source-sha'),process.env.SOURCE_SHA,'Exact live build');
 await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
 assert.equal(await page.evaluate(()=>Boolean(window.__STARBELL_DEVELOPER__)),false);
 const won=resume?.won.slice()||[],films=resume?.films.slice()||[];
 let last='',savedCount=resume?.completed.length||0;
 const checkpoint=async ({v,s,mode},force=false)=>{
  if(local||mode==='battle'||!s.completed.length||(!force&&s.completed.length<=savedCount))return;
  const persisted=await page.evaluate(()=>{const entry=State.getSaveSlot('slot1');return entry?.data?.state?.resonance||entry?.data?.resonance||null;});
  // Wait for the normal game autosave; never alter the slot or inject progression.
  if(!persisted||JSON.stringify(persisted.completed)!==JSON.stringify(s.completed)||JSON.stringify(persisted.evidence)!==JSON.stringify(s.evidence)||persisted.scene!==s.scene)return;
  assert.deepEqual(s.completed,campaign.scenes.slice(0,s.completed.length).map(x=>x.id));
  for(const scene of campaign.scenes.filter(x=>s.completed.includes(x.id)))for(const op of scene.requires){assert.ok(s.evidence[scene.id]?.includes(op),'Missing earned '+scene.id+'/'+op);if(op.startsWith('battle:'))assert.ok(won.includes(scene.id),'Missing recorded real win '+scene.id);}
  const payload={sha:process.env.SOURCE_SHA,origin,profile,lang,slot:'slot1',scene:s.scene,completed:s.completed,evidence:s.evidence,won:won.slice(),films:films.slice(),storageState:await context.storageState(),sourceRun:process.env.GITHUB_RUN_ID,previousRun:resume?.sourceRun||null};
  await mkdir('artifacts/earned',{recursive:true});
  await writeFile('artifacts/earned/checkpoint.tmp',JSON.stringify({...payload,digest:hash(payload)}));
  await rename('artifacts/earned/checkpoint.tmp','artifacts/earned/checkpoint.json');
  savedCount=s.completed.length;
  console.log('EARNED CHECKPOINT',profile,savedCount,s.scene);
 };
 if(resume){
  await press(page.locator('#intro-continue'));await press(page.locator('#intro-slot-list [data-slot="slot1"]'));
  await page.waitForFunction(()=>['map','yard'].includes(__game.scene));
  const restored=await read();
  assert.deepEqual(restored.s.completed,resume.completed,'Resume preserves all earned scenes');
  assert.deepEqual(restored.s.evidence,resume.evidence,'Resume preserves all earned operations');
  assert.equal(restored.s.scene,resume.scene);
  assert.equal(await page.evaluate(()=>State.activeSlot()),'slot1');
  await checkpoint(restored,true);
  console.log('RESUMED EARNED SLOT',profile,resume.completed.length,resume.scene,resume.sourceRun);
 }else{
 assert.equal(await page.evaluate(()=>State.getSaveSlot('slot1')),null,'No preexisting slot on initial run');
 await press(page.locator('#intro-start'));await press(page.locator('#intro-slot-list [data-slot="slot1"]'));
 await page.waitForFunction(()=>CatBondResonance.view().current?.id==='prologue:P-05');
 assert.equal(await page.evaluate(()=>State.S.cats.length),1);
 const intro=page.locator('#cb-player-first-intro');
 await press(intro.getByRole('button',{name:tr('开始探索','Start exploring'),exact:true}));
 await press(page.locator('[data-npc-talk="muling"]'));
 const encounter=page.locator('#cb-traveler-encounter');await encounter.waitFor();
 for(let i=0;i<6;i++)await press(encounter.getByRole('button',{name:i===5?tr('告别','Say goodbye'):tr('继续','Continue'),exact:true}));
 await encounter.waitFor({state:'detached'});
 assert.equal(await page.evaluate(()=>CatBondResonance.view().openingMet),true);
 const guide=page.locator('.sg-prologue-guide');
 await press(guide.locator('.sg-quest-toggle'));
 await press(guide.getByRole('button',{name:tr('下一场景 · 风铃镇','Next scene · Windchime Town'),exact:true}));
 await page.waitForFunction(()=>CatBondResonance.view().current?.id==='harbor:H-01');
 console.log('FRESH SLOT OPENING PASS',lang,portrait?'portrait':'wide');
 }
 await checkpoint(await read());
 const deadline=Date.now()+16*60*1000;
 let progressKey='',progressAt=Date.now();
 for(let step=0;step<2200&&Date.now()<deadline;step++){
   const {v,s,mode,region}=await read();const id=v.current?.id||'ended';if(id!==last){console.log('NORMAL CONTINUATION',lang,id,mode,region);last=id;}
   await checkpoint({v,s,mode});
   const keyNow=JSON.stringify([id,v.cursor,v.choice,v.objective,mode,s.revision,await page.locator('.rw-puzzle-controls:visible').innerText({timeout:500}).catch(()=>null),await page.locator('.sky-lookout-view:visible').getAttribute('data-pose',{timeout:500}).catch(()=>null)]);
   if(keyNow!==progressKey){progressKey=keyNow;progressAt=Date.now();}else if(Date.now()-progressAt>90000)throw Error('No story/UI progress for 90s '+id+' '+JSON.stringify({objective:v.objective,cursor:v.cursor,mode,visible:await page.locator('button:visible').allTextContents()}));
   if(v.ending){assert.equal(s.completed.length,campaign.scenes.length);assert.equal(s.melodies.length,6);assert.equal(s.support.length,6);assert.ok(s.evidence['finale:B-03'].includes('battle:central-echo'));assert.ok(s.evidence['epilogue:E-03'].includes('npc:second-garden-key'));await page.locator('.res-ending-title').waitFor({timeout:12000});await show();break;}
   const ack=page.locator('[data-canon-acknowledgement]:visible button');if(await ack.count()&&await ack.isVisible()){if(!films.includes(id))films.push(id);await press(ack);await page.waitForTimeout(60);continue;}
   const key=page.locator('.res-key-panel:visible button');if(await key.count()&&await key.isVisible()){await press(key);await page.waitForTimeout(100);continue;}
   const finalResult=page.locator('#cb-finale-result:visible');if(await finalResult.count()){assert.equal(await finalResult.getAttribute('data-finale-outcome'),'saved');await press(finalResult.locator('[data-finale-return]'));continue;}
   const reward=page.locator('#library-battle-ok:visible');if(await reward.count()){await press(reward);continue;}
   // Tea rest is a real player interaction: dialogue stays gated until sitting or walking.
   const lookout=page.locator('.sky-lookout-view[data-pose="arrival"]:visible');
   if(id==='sky:S-04'&&await lookout.count()){
    await press(page.getByRole('button',{name:tr('坐到暮铃身边','Sit beside Luna'),exact:true}));
    await page.waitForFunction(()=>document.querySelector('.sky-lookout-view')?.dataset.pose==='sit');
    console.log('LIVE TEA REST INPUT',lang);continue;
   }
   const choices=page.locator('.res-host:visible .res-choices button:visible');if(await choices.count()){await press(choices.first());continue;}
   const line=page.locator('.res-host:visible .res-line:visible');if(await line.count()&&v.lineReady&&v.cursor<v.current.lines.length){await press(line);await page.waitForTimeout(50);continue;}
   const prep=page.locator('#bp-go:visible');if(await prep.count()){const mode=page.locator('[data-battle-auto="true"]:visible');await press(mode);await press(prep);continue;}
   if(mode==='battle'){
    const help=page.locator('#battle-help-start:visible');if(await help.count()){await press(help);continue;}
    const tutorial=page.locator('#battle-tutorial-skip:visible');if(await tutorial.count()){await press(tutorial);continue;}
    const result=await page.evaluate(()=>{const g=__game,b=g.battle;if(!b)return null;for(let i=0;i<16000&&!b.done;i++)b.update(1/60);const r={done:b.done,result:b.result,t:b.t};if(b.done&&g.battle===b)g.endBattle();return r;});
    assert.ok(result?.done&&result.result==='win',id+' real battle: '+JSON.stringify(result));won.push(id);console.log('REAL BATTLE WIN',lang,id,JSON.stringify(result));continue;
   }
   const row=page.locator('.rw-puzzle-controls:visible'),surface=page.locator('.rw-surface:visible');
   if(await row.count()){
   if(!(await read()).v.objective.some(x=>x.startsWith('puzzle:')||x==='explore:routing-record')&&!(await row.getByRole('button',{name:/☾/}).count())){await page.waitForTimeout(350);continue;}
    const op=(await read()).v.objective.find(x=>x.startsWith('puzzle:')||x==='explore:routing-record');
    const button=name=>row.getByRole('button',{name,exact:true});
    const labels={'岔路':'Fork','拨动月叶':'Turn moonleaf','地下':'Roots','帮小猫离开根丛':'Free the trapped kitten','对岸':'Far bank','追上逃走的影子':'Follow the escaping shadows','查公开日志':'Inspect public log','查线路图':'Inspect route map','查借阅簿':'Inspect ledger','向暮铃求证':'Ask Luna','换位置，摇铃':'Move and ring','选左边的猫':'Choose the left cat','选右边的猫':'Choose the right cat'};
    const click=async name=>press(button(tr(name,labels[name]||name.replace('跳向星石 ','Jump to stone '))));
   const settled=async()=>{if(op)await page.waitForFunction(({id,op})=>CatBondResonance.snapshot().evidence[id]?.includes(op),{id,op},{timeout:45000});await row.waitFor({state:'hidden',timeout:45000});};
    const tapAt=async(x,y)=>{const b=await surface.boundingBox();assert.ok(b);if(portrait)await page.touchscreen.tap(b.x+x*b.width,b.y+y*b.height);else await page.mouse.click(b.x+x*b.width,b.y+y*b.height);};
    if(await row.locator('[data-spatial="bellPattern"]').count()||await row.getByRole('button',{name:/☾/}).count()){for(const glyph of ['☾','☀','✦'])await press(row.getByRole('button',{name:new RegExp(glyph)}));continue;}
    if(op==='puzzle:moonleaf-crossing'){for(const n of ['岔路','拨动月叶','地下','帮小猫离开根丛','对岸'])await click(n);await settled();continue;}
    if(op==='puzzle:shadow-bridge'){for(const x of [.19,.51,.68,.82,.18])await tapAt(x,.45);await click('追上逃走的影子');await settled();continue;}
    if(op==='explore:routing-record'){for(const n of ['查公开日志','查线路图','查借阅簿','向暮铃求证'])await click(n);await settled();continue;}
    if(op==='puzzle:joint-flight'){await tapAt(.35,.28);await row.waitFor({state:'hidden',timeout:60000});continue;}
    if(op==='puzzle:library-echo'){await click('换位置，摇铃');const left=await row.locator('[data-mirror-response]').evaluate(e=>e.dataset.leftFacing===e.dataset.position);await click(left?'选左边的猫':'选右边的猫');await settled();continue;}
    if(op==='puzzle:star-steps'){for(const n of [2,4,8])await click('跳向星石 '+n);await settled();continue;}
    const enabled=await row.locator('button:visible:enabled').all();
    if(enabled.length===1){await press(enabled[0]);continue;}
    throw Error('Unhandled puzzle '+op+' '+await row.innerText());
   }
   const next=page.locator('[data-next-scene="'+id+'"]:visible:enabled').first();if(await next.count()){try{if(portrait)await next.tap({timeout:1500});else await next.click({timeout:1500});}catch(e){if(e.name!=="TimeoutError")throw e;/* The map may have been replaced by a cinematic, result, or walking state between frames. Re-read the real UI; the ending assertions remain mandatory. */}await page.waitForTimeout(180);continue;}
   if(mode==='yard'&&id.startsWith('epilogue:')){const talk=page.locator('.sg-prologue-guide .sg-main-continue:visible');if(await talk.count()){await press(talk);await page.waitForTimeout(180);continue;}}
   if(await page.locator('.res-chapter-cinematic:visible').count()){await page.waitForTimeout(500);continue;}
   await page.waitForTimeout(250);
 }
 const final=await read();assert.ok(final.v.ending,'Continuation failed: '+JSON.stringify({id:final.v.current?.id,objective:final.v.objective,mode:final.mode,region:final.region,won,films}));
 for(const id of ['harbor:H-04','forest:R-04','forge:E-03','sky:S-03','library:M-02','starfall:F-04','finale:B-01','finale:B-03'])assert.ok(won.includes(id),'Missing actual battle '+id);assert.ok(final.s.evidence['starfall:F-02']?.includes('cinematic:starfall-memory')&&final.s.evidence['finale:B-04']?.includes('cinematic:final-note'),'Both required cinematics must complete in the fresh slot');
 assert.equal(await page.evaluate(()=>State.listSaveSlots().find(s=>s.id==='slot1').regionLabelEn),'Sunlit Garden');
 assert.deepEqual(errors,[]);console.log(local?'FRESH NORMAL CAMPAIGN TO ENDING PASS':'LIVE FRESH SLOT TO ENDING PASS',lang,JSON.stringify({won,films,resumed:!!resume,sourceRun:resume?.sourceRun||null,sha:process.env.SOURCE_SHA}));
}catch(e){await show().catch(()=>{});console.error('NORMAL CONTINUATION FAIL',lang,String(e),JSON.stringify(await read().catch(()=>null)).slice(0,2500),errors);throw e;}finally{await browser.close();}
