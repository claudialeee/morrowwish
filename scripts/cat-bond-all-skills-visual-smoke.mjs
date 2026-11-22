// Production-facing browser visual gate for every normal-skill identity.
// Uses the REAL battle canvas, original watercolor cats and the integrated
// CatBondSkillFX hooks. One cast+contact screenshot per skill and device.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {chromium} from 'playwright';

const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const spec of [
  {name:'phone',width:400,height:844,mobile:true},
  {name:'desktop',width:1180,height:760,mobile:false}
 ]){
  const page=await browser.newPage({viewport:{width:spec.width,height:spec.height},
    deviceScaleFactor:spec.mobile?2:1,isMobile:spec.mobile,hasTouch:spec.mobile});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(origin+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__game&&window.CatBondSkillFX?.ids?.length===40
     &&window.CatBondArtworkStatus?.breedsLoaded,{timeout:30000});
   await page.locator('#intro-start').click();
   await page.locator('#panel.open .dex-cell').first().click();
   const ids=await page.evaluate(()=>Array.from(CatBondSkillFX.ids));
   assert.equal(ids.length,40);
   const hashes=[];
   for(const id of ids){
    const record=await page.evaluate(id=>{
      const g=window.__game,sk=Skills.skillById(id);
      if(!sk||sk.ultCost)throw Error('No normal skill '+id);
      const native=GameData.SPECIES.find(sp=>Skills.elementOf(sp.id)===sk.element);
      if(!native)throw Error('No cat for element '+sk.element);
      const cat=State.makeCat(native.id,{affinity:70});
      cat.level=15;State.S.cats=[cat];
      State.S.battlePrefs={...(State.S.battlePrefs||{}),
        manualTutorialSeen:true,tutorialSeen:true,autoBattle:false};
      g.startBattle([cat],GameData.speciesById('doudou'));
      const b=g.battle,f=b.me(),target=b.enemies[0];
      b.coach=null;b.autoMode=false;b.t=2.1;
      if(!target||!f)throw Error('No real combatants '+id);
      f.x=g.W*.32;f.y=g.H*.60;target.x=g.W*.64;target.y=g.H*.60;
      target.hp=target.maxhp=5000;target.speed=0;target.kbx=0;target.kby=0;
      b.skillStrokes=[];
      const support=sk.kind==='heal'||sk.kind==='buff';
      const emitted=support?CatBondSkillFX.support(b,f,sk):
        CatBondSkillFX.cast(b,f,sk,0);
      if(!emitted)throw Error('Cast signature failed '+id);
      if(!support&&!CatBondSkillFX.hit(b,target,sk,24,false))
        throw Error('Contact art failed '+id);
      b.skillStrokes.forEach(s=>s.life=s.max*.64);
      target.status={...(target.status||{}),burn:1.6,shock:1};
      const original=CatBondSkillFX.draw;let drawn=0;
      CatBondSkillFX.draw=function(ctx,s,time){
        if(s?.skillId===id)drawn++;
        return original.apply(this,arguments);
      };
      try{g.draw()}finally{CatBondSkillFX.draw=original;}
      if(drawn<(support?1:2))throw Error('Signature not in actual battle '+id+': '+drawn);
      if(window.CatBondUltHero||b.ultHero)throw Error('full-screen art during normal skill');
      return {id,skillName:sk.name,style:sk.kind,drawn,
        hasCast:b.skillStrokes.some(s=>s.kind==='signatureCast'),
        hasHit:b.skillStrokes.some(s=>s.kind==='signatureHit'),
        dimensions:[g.W,g.H]};
    },id);
    assert.ok(record.dimensions[0]>250&&record.dimensions[1]>250);
    const file='/tmp/cat-bond-all-skills-'+spec.name+'-'+id+'.png';
    await page.screenshot({path:file,animations:'disabled'});
    const bytes=fs.readFileSync(file);
    assert.ok(bytes.length>9000,'blank real-battle frame '+id);
    hashes.push(crypto.createHash('sha256').update(bytes).digest('hex'));
    console.log('SKILL-ID REAL BATTLE '+spec.name+' '+JSON.stringify(record));
   }
   assert.equal(new Set(hashes).size,40,
     '40 original-skill silhouettes must be distinct on '+spec.name);
   assert.deepEqual(errors,[],'unhandled game errors on '+spec.name);
   console.log('ALL 40 NORMAL SKILLS PASS '+spec.name);
  }finally{await page.close();}
 }
 console.log('CAT BOND ALL 40 SKILL-ID ARENA VISUAL QA PASS');
}finally{await browser.close();}
