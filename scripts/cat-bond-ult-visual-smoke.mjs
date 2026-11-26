// Cat Bond six-element real-browser VFX regression: screenshot the ACTUAL
// battle renderer at an authored mid-impact frame on desktop and phone.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {chromium} from 'playwright';

const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const pairs=[
  ['fire','jinwu','sunflare'],
  ['water','lanbao','tsunamiPaw'],
  ['grass','senlin','sunbloom'],
  ['elec','xianluo','thunderYowl'],
  ['dark','xingchen','voidMaw'],
  ['light','yuelian','moonlitHalo'],
  ['light','yuelian','moonfang'],
];
const browser=await chromium.launch({headless:true});
try{
 for(const spec of [{name:'desktop',width:1180,height:760,isMobile:false},
                    {name:'phone',width:390,height:844,isMobile:true}]){
  const page=await browser.newPage({viewport:{width:spec.width,height:spec.height},
    isMobile:spec.isMobile,hasTouch:spec.isMobile,deviceScaleFactor:spec.isMobile?2:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__game&&window.State&&window.Battle?.CaptureBattle);
  await page.locator('#intro-start').click();
  // Complete the real starter picker so the intro/panel cannot cover the arena.
  await page.locator('#panel.open .dex-cell').first().click();
  const hashes=[];
  for(const [element,breed,skillId] of pairs){
   const result=await page.evaluate(({element,breed,skillId})=>{
    const g=window.__game,cat=State.makeCat(breed,{level:20,affinity:90});
    State.S.cats=[cat];State.S.battlePrefs={
      ...(State.S.battlePrefs||{}),manualTutorialSeen:true,
      tutorialSeen:true,autoBattle:false};
    g.startBattle([cat],GameData.speciesById('doudou'));
    const b=g.battle;
    b.coach=null;b.autoMode=false;b.ult=100;b.ultCd=0;b.t=.8;
    const skill=Skills.skillById(skillId);
    if(!skill)throw Error('Missing skill '+skillId);
    b.me().ultSkill=skill;
    for(const [i,e] of b.enemies.entries()){
      e.x=b.me().x+160+i*44;e.y=b.me().y+i*34;
      e.maxhp=5000;e.hp=5000;e.inv=0;e.flash=0;
    }
    const cast=b.ultimate();
    const stroke=b.skillStrokes.findLast(v=>v.kind==='ultimate'&&v.skillId===skillId);
    if(!stroke)throw Error('No element-specific stroke '+element);
    stroke.life=stroke.max*.53;
    if(b.ultHero||window.CatBondUltHero)throw Error('Full-screen cat cut-in is forbidden');
    if(!window.CatBondUltVFX?.has(skillId))throw Error('No unique VFX '+skillId);
    // Keep all combatants at regular world scale; no giant full-stage cat.
    const oldCatDraw=window.CatArt.drawCat;let maxCatScale=0;
    window.CatArt.drawCat=function(ctx,x,y,opts){
      maxCatScale=Math.max(maxCatScale,opts?.scale||0);
      return oldCatDraw.apply(this,arguments);
    };
    try{g.draw();}finally{window.CatArt.drawCat=oldCatDraw;}
    return {cast:cast===true,element,shape:stroke.kind,local:true,maxCatScale,sk:skill.id,
      isDeathRay:!!b.deathRay,canvasW:g.W,canvasH:g.H};
   },{element,breed,skillId});
   assert.equal(result.cast,true,element+' casts its ultimate');
   assert.equal(result.shape,'ultimate',element+' uses the six-element renderer');
   assert.ok(result.local,skillId+' draws in the battle arena');
   assert.ok(result.maxCatScale<=1.2,
     skillId+' must not change normal cat size: '+result.maxCatScale);
   if(element==='dark')assert.equal(result.isDeathRay,false,
     'void maw must have a gravitational vortex, never an automatic laser');
   assert.ok(result.canvasW>200&&result.canvasH>250,'arena is visible');
   const path='/tmp/cat-bond-ult-'+spec.name+'-'+skillId+'.png';
   await page.screenshot({path,animations:'disabled'});
   const data=fs.readFileSync(path);
   assert.ok(data.length>15000,'screenshot should contain a real rendered game: '+element);
   hashes.push(crypto.createHash('sha256').update(data).digest('hex'));
   console.log('ULT REAL-BROWSER FRAME '+spec.name+' '+skillId+' '+JSON.stringify(result));
  }
  assert.equal(new Set(hashes).size,8,'all eight separate skill effects must differ');
  assert.deepEqual(errors,[],'no JS exceptions in real-browser battle render');
  await page.close();
 }
 console.log('CAT BOND EIGHT LOCAL ULT VFX SCREENSHOT QA PASS');
}finally{await browser.close()}
