// Real browser QA: all 13 debuff silhouettes plus eight hit-feel classes and
// live heal/barrier/cleanse. Captures the actual game canvas, not mock art.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {chromium} from 'playwright';
const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const categories=[
  ...['burn','soak','shock','oil','chill','dizzy','bleed','blind',
      'bind','expose','weaken','rust','rewind'].map(tag=>({type:'status',tag})),
  ...['light','heavy','crit','stagger','kill','heal','guard','reflect',
      'cleanse','barrier','wardFade'].map(tag=>({type:'impact',tag})),
  {type:'support',tag:'grooming'},{type:'support',tag:'bubbleVeil'},
  {type:'support',tag:'protect'},{type:'support',tag:'mirrorWall'},
  {type:'support',tag:'knead'}
];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const device of [
   {name:'desktop',width:1160,height:760,mobile:false},
   {name:'phone',width:390,height:844,mobile:true}
 ]){
  const page=await browser.newPage({viewport:{width:device.width,height:device.height},
    isMobile:device.mobile,hasTouch:device.mobile,deviceScaleFactor:device.mobile?2:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(origin+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__game&&window.CatBondSkillFX?.ids?.length===40
     &&window.Skills?.TAG_INFO&&window.VFX);
   await page.locator('#intro-start').click();
   await page.locator('#panel.open .dex-cell').first().click();
   const hashes=[];
   for(const category of categories){
    const actual=await page.evaluate(({type,tag})=>{
      const g=window.__game;
      const cat=State.makeCat('yuelian',{affinity:70});
      cat.level=16;State.S.cats=[cat];
      State.S.battlePrefs={...(State.S.battlePrefs||{}),
        manualTutorialSeen:true,tutorialSeen:true,autoBattle:false};
      g.startBattle([cat],GameData.speciesById('doudou'));
      const b=g.battle,me=b.me(),enemy=b.enemies[0];
      b.coach=null;b.autoMode=false;b.t=2.5;b.vfx.clear();
      enemy.hp=enemy.maxhp=5000;enemy.inv=0;enemy.flash=0;
      enemy.x=g.W*.65;enemy.y=g.H*.57;
      me.x=g.W*.33;me.y=g.H*.57;
      let called=0;
      const drawStatus=CatBondSkillFX.drawStatus;
      CatBondSkillFX.drawStatus=function(...args){
        if(args[1]===enemy||args[1]===me)called++;
        return drawStatus.apply(this,args);
      };
      try{
       if(type==='status'){
        if(!Skills.TAG_INFO[tag])throw Error('Invalid battle status '+tag);
        enemy.status={[tag]:1.4};enemy.tags=[tag];
       }else if(type==='impact'){
        b.vfx.impactType(enemy.x,enemy.y,tag,{color:'#fff0be'});
        if(!b.vfx.fx.length)throw Error('Missing hit-feel '+tag);
       }else{
        const sk=tag==='protect'?Skills.skillById('guardStance'):
          Skills.skillById(tag);
        if(!sk)throw Error('Unknown support skill '+tag);
        if(tag==='grooming'){
          me.hp=me.maxhp*.55;me.status={burn:2};me.tags=['burn'];
          if(!b.castSupportSkill(me,sk,0)||me.status.burn)
            throw Error('Grooming did not heal and cleanse');
        }else if(tag==='knead'){
          if(!b.castSupportSkill(me,sk,0)||me.kneadStacks!==1)
            throw Error('Knead did not stack');
        }else{
          me.protectT=0;me.shieldT=0;me.reflectT=0;
          const mode=tag==='bubbleVeil'?'barrier':
            tag==='mirrorWall'?'reflect':'protect';
          if(!b.castWard(me,mode))throw Error('Ward not active '+tag);
        }
       }
       g.draw();
      }finally{CatBondSkillFX.drawStatus=drawStatus;}
      if(type==='status'&&(!called||!enemy.status[tag]))throw Error('Status not in real combat '+tag);
      if(type==='support'&&tag==='knead'&&me.kneadStacks!==1)throw Error('Knead stack missing');
      return {type,tag,called,effects:b.vfx.fx.length,arena:[g.W,g.H],
        originalCat:!!window.CatMotion?.draw,fullScreenUlt:!!b.ultHero};
    },category);
    assert.ok(actual.originalCat&&!actual.fullScreenUlt);
    assert.ok(actual.arena[0]>250&&actual.arena[1]>250);
    const file='/tmp/cat-bond-fx-review-'+device.name+'-'+category.type+'-'+category.tag+'.png';
    await page.screenshot({path:file,animations:'disabled'});
    const bytes=fs.readFileSync(file);assert.ok(bytes.length>9500,'Blank screenshot '+file);
    hashes.push(crypto.createHash('sha256').update(bytes).digest('hex'));
    console.log('CAT BOND FX REAL BROWSER '+device.name+' '+JSON.stringify(actual));
   }
   assert.equal(new Set(hashes).size,categories.length,
     'All status/hit/support frames must be distinguishable on '+device.name);
   assert.deepEqual(errors,[],'No unhandled combat render errors on '+device.name);
  }finally{await page.close()}
 }
 console.log('CAT BOND 13 STATUS + 11 HIT FEEL + 5 SUPPORT REAL BROWSER QA PASS');
}finally{await browser.close()}
