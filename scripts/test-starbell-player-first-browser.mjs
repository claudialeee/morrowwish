import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {makeEngine} from '../public/cat-bond/js/resonance/engine.mjs';
import {layouts} from '../public/cat-bond/js/resonance/world-exploration.mjs';
import {skyLaunch} from '../public/cat-bond/js/resonance/sky-flight.mjs';
const origin=process.env.CAT_BOND_SMOKE_ORIGIN||'http://127.0.0.1:8765';
const portrait=process.env.STARBELL_MINIGAME_PROFILE==='portrait',lang=portrait?'zh':'en';
const browser=await chromium.launch({headless:true});
const late=new Set(['mechanism:muling-unlock','npc:public-accountability','npc:second-garden-key']);
const ok=(r,m)=>assert.ok(r?.ok,m+': '+JSON.stringify(r));
function checkpoint(target,op){
 const e=makeEngine(campaign);
 for(const s of campaign.scenes){
  if(s.id===target){for(const prior of s.requires.slice(0,s.requires.indexOf(op)))ok(e.record(s.id,prior),s.id+'/'+prior);return e.snapshot();}
  if(s.id==='prologue:P-05'&&!e.view().openingMet)ok(e.meetTraveler(),s.id);
  if(s.choiceTiming==='beforeAction'&&s.choices.length)ok(e.choose(s.choices[0].id),s.id);
  if(s.id==='finale:B-03')for(let i=0;i<campaign.regions.length;i++)ok(e.supportAction(campaign.regions[i],campaign.support[i]),s.id);
  for(const a of s.requires.filter(o=>!late.has(o)))ok(e.record(s.id,a),s.id+'/'+a);
  while(e.view().cursor<s.lines.length){if(s.choiceAt===e.view().cursor&&!e.view().choice)ok(e.choose(s.choices[0].id),s.id);ok(e.nextLine(),s.id);}
  if(s.choiceTiming!=='beforeAction'&&s.choices.length&&!e.view().choice)ok(e.choose(s.choices[0].id),s.id);
  for(const a of s.requires.filter(o=>late.has(o)))ok(e.record(s.id,a),s.id);
  ok(e.finish(),s.id);
 }
 throw Error('Missing checkpoint '+target);
}
const cases=[
 ['harbor','harbor:H-02','puzzle:chime-chase'],
 ['forest','forest:R-02','puzzle:moonleaf-crossing'],
 ['forge','forge:E-02','puzzle:shadow-bridge'],
 ['sky','sky:S-03','puzzle:joint-flight'],
 ['library','library:M-02','puzzle:library-echo'],
 ['library','library:M-05','puzzle:two-route-model'],
 ['starfall','starfall:F-01','puzzle:star-steps']
];
const failures=[];
try{for(const [region,scene,op] of cases){
 const context=await browser.newContext(portrait?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:800}});
 const page=await context.newPage();page.setDefaultTimeout(20000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort()});
 const press=async l=>portrait?l.tap():l.click();
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
   const follow=page.locator('[data-chase-follow]'),shortcut=page.locator('[data-chase-shortcut]');
   await follow.waitFor();await press(follow);await press(portrait?shortcut:follow);await press(follow);
   await page.waitForFunction(()=>{const e=document.querySelector('[data-chase-follow]');return e&&!e.disabled&&/Pounce|扑住/.test(e.textContent)});
   await press(follow);
  }else{
   await row.waitFor();const click=(zh,en)=>press(button(zh,en,row));
   if(op==='puzzle:moonleaf-crossing'){await click('岔路','Fork');await click(portrait?'地下':'树冠',portrait?'Roots':'Canopy');if(portrait)await click('帮小猫离开根丛','Free the trapped kitten');await click('对岸','Far bank');}
   if(op==='puzzle:shadow-bridge'){const finish=button('追上逃走的影子','Follow the escaping shadows',row);assert.ok(await finish.isDisabled());await click('照向左边','Light left');await click('照向中间','Light center');assert.ok(await finish.isDisabled());await click('照向右边','Light right');await press(finish);}
   if(op==='puzzle:joint-flight'){const b=await surface.boundingBox(),x=b.x+b.width*.35,y=b.y+b.height*(portrait?.72:.28);if(portrait)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);}
   if(op==='puzzle:library-echo'){const left=button('选左边的猫','Choose the left cat',row),right=button('选右边的猫','Choose the right cat',row);assert.ok(await left.isDisabled()&&await right.isDisabled());await click('换位置，摇铃','Move and ring');const response=page.locator('[data-mirror-response]');const side=await response.evaluate(e=>e.dataset.leftFacing===e.dataset.position?'left':'right');await press(side==='left'?left:right);}
   if(op==='puzzle:two-route-model'){await click('观看两种可能的未来','Watch two possible futures');await click('继续剧情','Continue story');}
   if(op==='puzzle:star-steps'){for(const n of portrait?[3,5,7,8]:[2,4,6,8])await click('跳向星石 '+n,'Jump to stone '+n);}
  }
  await page.waitForFunction(({scene,op})=>CatBondResonance.snapshot().evidence[scene]?.includes(op),{scene,op},{timeout:45000});
  assert.deepEqual(errors,[]);console.log('PASS',lang,op);
 }catch(e){failures.push({op,error:String(e),pageErrors:errors});console.error('FAIL',op,String(e),errors);}
 finally{await context.close();}
}}finally{await browser.close();}
assert.deepEqual(failures,[]);
