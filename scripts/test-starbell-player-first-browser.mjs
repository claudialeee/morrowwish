import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {makeEngine} from '../public/cat-bond/js/resonance/engine.mjs';
import {layouts} from '../public/cat-bond/js/resonance/world-exploration.mjs';
import {skyLaunch} from '../public/cat-bond/js/resonance/sky-flight.mjs';
const origin=process.env.CAT_BOND_SMOKE_ORIGIN||'http://127.0.0.1:8765';
const profile=process.env.STARBELL_MINIGAME_PROFILE||'wide',portrait=profile==='portrait',touch=portrait||profile==='landscape',lang=process.env.STARBELL_MINIGAME_LANG||(portrait?'zh':'en');
const browser=await chromium.launch({headless:true});
const late=new Set(['mechanism:muling-unlock','npc:public-accountability','npc:second-garden-key']);
const ok=(r,m)=>assert.ok(r?.ok,m+': '+JSON.stringify(r));
function checkpoint(target,op){
 const e=makeEngine(campaign);
 for(const s of campaign.scenes){
  if(s.id===target){for(const prior of s.requires.slice(0,s.requires.indexOf(op)))if(e.view().objective.includes(prior))ok(e.record(s.id,prior),s.id+'/'+prior);return e.snapshot();}
  if(s.id==='prologue:P-05'&&!e.view().openingMet)ok(e.meetTraveler(),s.id);
  if(s.choiceTiming==='beforeAction'&&s.choices.length)ok(e.choose(s.choices[0].id),s.id);
  if(s.id==='finale:B-03')for(let i=0;i<campaign.regions.length;i++)ok(e.supportAction(campaign.regions[i],campaign.support[i]),s.id);
  for(const a of s.requires.filter(o=>!late.has(o)))if(e.view().objective.includes(a))ok(e.record(s.id,a),s.id+'/'+a);
  while(e.view().cursor<s.lines.length){if(s.choiceAt===e.view().cursor&&!e.view().choice)ok(e.choose(s.choices[0].id),s.id);ok(e.nextLine(),s.id);}
  if(s.choiceTiming!=='beforeAction'&&s.choices.length&&!e.view().choice)ok(e.choose(s.choices[0].id),s.id);
  for(const a of s.requires.filter(o=>late.has(o)))if(e.view().objective.includes(a))ok(e.record(s.id,a),s.id);
  ok(e.finish(),s.id);
 }
 throw Error('Missing checkpoint '+target);
}
const artOnly=process.env.STARBELL_ART_ONLY==='1';
const cases=[
 ['forest','forest:R-02','puzzle:moonleaf-crossing'],
 ['forge','forge:E-02','puzzle:shadow-bridge'],
 ['sky','sky:S-03','puzzle:joint-flight'],
 ['library','library:M-02','puzzle:library-echo'],
 ['library','library:M-04','explore:routing-record'],
 ['starfall','starfall:F-01','puzzle:star-steps']
].filter(([, ,op])=>!artOnly||['puzzle:shadow-bridge','puzzle:star-steps'].includes(op));
const failures=[];
try{for(const [region,scene,op] of cases){
 const context=await browser.newContext(portrait?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:touch?{viewport:{width:844,height:390},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:800}});
 if(artOnly)await context.addInitScript(()=>{const original=CanvasRenderingContext2D.prototype.drawImage;window.__starbellArtDraws={};CanvasRenderingContext2D.prototype.drawImage=function(img,...args){const src=img?.src||'';if(this.canvas.classList?.contains('rw-surface')&&src.includes('/canon22-final-art/')){const key=src.split('/').pop().split('?')[0];window.__starbellArtDraws[key]=(window.__starbellArtDraws[key]||0)+1;}return original.call(this,img,...args);};});
 const page=await context.newPage();page.setDefaultTimeout(20000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort()});
 const press=async l=>touch?l.tap():l.click();
 const button=(zh,en,within=page)=>within.getByRole('button',{name:lang==='zh'?zh:en,exact:true});
 const row=page.locator('.rw-puzzle-controls:visible'),surface=page.locator('.rw-surface');
 try{
  const snapshot=checkpoint(scene,op),point=(region==='sky'&&skyLaunch[op]||layouts[region].features[op]).slice(0,2);
  await page.goto(origin+'/cat-bond/?developer=1&qa=minigame&region='+region+'&reset=1&lang='+lang);
  await page.locator('#starbell-developer-menu').waitFor();
  await page.evaluate(({snapshot,region,point})=>{
   if(!window.__STARBELL_DEVELOPER__)throw Error('Isolated developer slot required');
   CatBondResonance.close();UI.closeAll();
   const cats=['jinjc','story_muling'].map(species=>State.makeCat(species,{affinity:35,protagonist:species==='jinjc'}));
   Object.assign(State.S,{cats,gameStarted:true,coins:500,fish:20,difficulty:'casual',catchCount:2,firstDuoShowcasePending:false,battleTutorialDone:true,battlePrefs:{autoBattle:true,modeChosen:true,tutorialSeen:true,manualTutorialSeen:true,teamUids:cats.map(x=>x.uid)},resonance:snapshot,resonanceExploration:{location:region,positions:{[region]:{x:point[0],y:point[1]}},interactions:{},pickups:{},cargo:null}});
   if(!State.save().ok)throw Error('Checkpoint save failed');
   if(!WorldMap.enterRegion(region))throw Error('Region entry failed');
  },{snapshot,region,point});
  await press(page.locator('[data-next-scene="'+scene+'"]:visible'));
  await page.waitForFunction(()=>document.querySelector('.rw-world')?.dataset.artReady==='true');
  if(op==='puzzle:chime-chase'){
   await row.waitFor();
   const choose=(glyph)=>row.getByRole('button',{name:new RegExp(glyph)});
   await press(choose('✦'));await page.waitForFunction(()=>/0\/3/.test(document.querySelector('.rw-minigame-progress')?.textContent||''));
   for(const glyph of ['☾','☀','✦'])await press(choose(glyph));
  }else{
   await row.waitFor();const click=(zh,en)=>press(button(zh,en,row));
   if(op==='puzzle:moonleaf-crossing'){await click('岔路','Fork');if(!portrait){await click('树冠','Canopy');await click('岔路','Fork');}await click('拨动月叶','Turn moonleaf');await click('地下','Roots');await click('帮小猫离开根丛','Free the trapped kitten');await click('对岸','Far bank');}
   if(artOnly){const names=op==='puzzle:shadow-bridge'?['shadow-cat-crouch.webp','shadow-cat-listen.webp','shadow-cat.webp']:['star-step-stone.webp'];for(const name of names){const info=await page.evaluate(async name=>{const im=new Image();im.src='/cat-bond/assets/canon22-final-art/'+name;await im.decode();const cv=document.createElement('canvas');cv.width=im.width;cv.height=im.height;const c=cv.getContext('2d');c.drawImage(im,0,0);const a=c.getImageData(0,0,cv.width,cv.height).data;let transparent=0,opaque=0;for(let i=3;i<a.length;i+=4){if(a[i]===0)transparent++;if(a[i]>200)opaque++;}return {w:im.width,h:im.height,transparent,opaque};},name);assert(info.transparent>0&&info.opaque>0,name+' alpha');if(name!=='shadow-cat.webp')assert.deepEqual([info.w,info.h],[640,name==='star-step-stone.webp'?400:640]);}}
   if(op==='puzzle:shadow-bridge'){const finish=button('追上逃走的影子','Follow the escaping shadows',row);assert.ok(await finish.isDisabled());if(artOnly)await page.waitForFunction(()=>window.__starbellArtDraws['shadow-cat-crouch.webp']>0);for(const [j,x] of [.19,.51,.68,.82,.18].entries()){const b=await surface.boundingBox();if(touch)await page.touchscreen.tap(b.x+x*b.width,b.y+.45*b.height);else await page.mouse.click(b.x+x*b.width,b.y+.45*b.height);if(j<4)assert.ok(await finish.isDisabled());if(artOnly&&j<4){const name=j<2?'shadow-cat.webp':'shadow-cat-listen.webp';await page.waitForFunction(n=>window.__starbellArtDraws[n]>0,name);}}await press(finish);}
   if(op==='explore:routing-record'){const ask=button('向暮铃求证','Ask Luna',row);assert.ok(await ask.isDisabled());await click('查公开日志','Inspect public log');await click('查线路图','Inspect route map');assert.ok(await ask.isDisabled());await click('查借阅簿','Inspect ledger');await press(ask);}
   if(op==='puzzle:joint-flight'){const b=await surface.boundingBox(),x=b.x+b.width*.35,y=b.y+b.height*(portrait?.72:.28);if(touch)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);if(portrait){const land=page.locator('[data-sky-land]');await page.waitForFunction(()=>{const b=document.querySelector('[data-sky-land]');return b&&!b.disabled},{},{timeout:25000});await press(land);await page.waitForFunction(()=>document.querySelector('[data-sky-flight-status]')?.dataset.phase==='resting');await click('降低','Descend');}}
   if(op==='puzzle:library-echo'){const left=button('选左边的猫','Choose the left cat',row),right=button('选右边的猫','Choose the right cat',row);assert.ok(await left.isDisabled()&&await right.isDisabled());await click('换位置，摇铃','Move and ring');const response=page.locator('[data-mirror-response]');const side=await response.evaluate(e=>e.dataset.leftFacing===e.dataset.position?'left':'right');await press(side==='left'?left:right);}
   if(op==='puzzle:two-route-model'){await click('观看两种可能的未来','Watch two possible futures');await click('继续剧情','Continue story');}
   if(op==='puzzle:star-steps'){if(artOnly)await page.waitForFunction(()=>window.__starbellArtDraws['star-step-stone.webp']>=8);for(const n of portrait?[3,5,7,8]:[2,4,8])await click('跳向星石 '+n,'Jump to stone '+n);}
  }
  await page.waitForFunction(({scene,op})=>CatBondResonance.snapshot().evidence[scene]?.includes(op),{scene,op},{timeout:45000});
  assert.deepEqual(errors,[]);console.log('PASS',lang,op);
 }catch(e){failures.push({op,error:String(e),pageErrors:errors});console.error('FAIL',op,String(e),errors);}
 finally{await context.close();}
}}finally{await browser.close();}
assert.deepEqual(failures,[]);
