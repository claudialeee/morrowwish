// Production-facing browser visual gate for every normal-skill identity.
// Uses the REAL battle canvas, original watercolor cats and the integrated
// CatBondSkillFX hooks. One cast+contact screenshot per skill and device.
import assert from 'node:assert/strict';
import {startNewAdventure,continueSavedAdventure} from './cat-bond-test-start.mjs';
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
   await page.waitForFunction(()=>window.__game&&window.CatBondSkillFX?.ids?.length>=40
     &&window.CatBondArtworkStatus?.breedsLoaded,null,{timeout:45000});
   await startNewAdventure(page);
   const ids=await page.evaluate(()=>Array.from(CatBondSkillFX.ids));
   const expected=await page.evaluate(()=>Skills.SKILLS.filter(sk=>!sk.ultCost&&!sk.isBasic).map(sk=>sk.id));
   assert.ok(ids.length>=40,'At least 40 hand-authored normal VFX must remain');
   assert.deepEqual(new Set(ids),new Set(expected),
     'Every real normal skill, including generated archetypes, must have an individual VFX ID');
   assert.ok(ids.includes('frostClaw'),
     'Approved Water Frost Claw must receive real per-skill battle VFX on both devices');
   const waterCat=await page.evaluate(()=>{
     const c=State.makeCat('ripplet',{affinity:95});
     c.level=18;c.skillAwakened=true;c.skillEdited=true;
     c.loadout=[null,'gen_elec_melee','boltArc','thunderYowl'];
     c.autoSkillLoadout=c.loadout.slice();c.learned=['mirrorWall'];
     Skills.ensureLoadout(c);
     return {primary:Skills.elementOf(c.species),secondary:Skills.secondaryOf(c.species),
       equipped:c.loadout.filter(Boolean).map(id=>Skills.skillById(id)?.element),
       native:Skills.learnableSkills(c).map(s=>s.element)};
   });
   assert.equal(waterCat.primary,'water');
   assert.equal(waterCat.secondary,null);
   assert.ok([...waterCat.equipped,...waterCat.native].every(el=>el==='water'),
     'Current water cat must NEVER equip old Electric saves or learn Electricity');
   const hashes=[];
   for(const id of ids){
    const record=await page.evaluate(id=>{
      const g=window.__game,sk=Skills.skillById(id);
      if(!sk||sk.ultCost)throw Error('No normal skill '+id);
      // Element-neutral utility skills (e.g. the reflect wall) match no element;
      // any painted cat can showcase them, so fall back to the roster's first.
      const native=(sk.unlock?.species?.[0]&&GameData.speciesById(sk.unlock.species[0]))||GameData.SPECIES.find(sp=>Skills.elementOf(sp.id)===sk.element)
        ||(sk.element==='neutral'?GameData.SPECIES[0]:null);
      if(!native)throw Error('No cat for element '+sk.element);
      const cat=State.makeCat(native.id,{affinity:70});
      cat.level=15;State.S.cats=[cat];
      State.S.battlePrefs={...(State.S.battlePrefs||{}),
        manualTutorialSeen:true,tutorialSeen:true,autoBattle:false};
      g.startBattle([cat],GameData.SPECIES[0]);
      const b=g.battle,f=b.me(),target=b.enemies[0];
      b.coach=null;b.autoMode=false;b.t=2.1;
      if(!target||!f)throw Error('No real combatants '+id);
      f.x=g.W*.32;f.y=g.H*.60;target.x=g.W*.64;target.y=g.H*.60;
      target.hp=target.maxhp=5000;target.speed=0;target.kbx=0;target.kby=0;
      target.inv=0;target.flash=0;
      b.skillStrokes=[];b.vfx.clear();
      const support=sk.kind==='heal'||sk.kind==='buff';
      const melee=sk.kind==='melee';
      // These authored effects no longer paint an obsolete circular caster glyph.
      // Exercise the real gameplay payload and assert its renderer, not a fake cast stamp.
      const physical=['waterJet','shadowTendrils','magneticField','arcanePulse'].includes(id);
      let physicalHook=null,physicalMethod=null;
      if(physical){
        b.aim=0; f.y=target.y;
        f.x=Math.max(46,Math.min(f.x,g.W-46-180));
        target.x=f.x+(id==='magneticField'?(sk.reach||180):Math.min(100,(sk.reach||240)*.6));
        target.inv=target.flash=target.shieldT=target.protectT=target.reflectT=0;
        const before=target.hp;
        b.castOffensiveSkill(f,0,{...sk,_castTarget:{x:target.x,y:target.y}},sk.power,b.elemColor(sk.element),true);
        if(id==='magneticField'){
          if(!b.fields.some(field=>field.kind==='magneticField'))throw Error('Magnetic poles not created');
          b.tickFields(.6);physicalHook=window.CatBondMagneticFX;physicalMethod='draw';
        }else if(id==='arcanePulse'){
          if(b._umbralLobs.length!==3)throw Error('Three artillery launches required');
          b.tickUmbralLobs(.82);physicalHook=CatBondSkillFX;physicalMethod='drawUmbralLob';
        }else{
          if(!b.beams.some(beam=>beam.sk.id===id))throw Error('Live channel not created '+id);
          b.tickBeams(.25);physicalHook=CatBondSkillFX;physicalMethod='drawCombatBeam';
        }
        if(!(target.hp<before))throw Error('Physical skill caused no real damage '+id);
        if(typeof physicalHook?.[physicalMethod]!=='function')throw Error('Missing renderer '+id);
      }
      const emitted=physical?true:support?CatBondSkillFX.support(b,f,sk):
        CatBondSkillFX.cast(b,f,sk,0);
      if(!emitted)throw Error('Cast signature failed '+id);
      if(melee){
        // Drive ACTUAL close-range damage + physical brush VFX, rather than
        // faking a signatureCast circle at the caster and a separate magic hit.
        target.x=f.x+52;target.y=f.y;
        const before=target.hp;
        b.meleeStrike(f,0,sk,24,'#e6b7fa');
        const blades=b.vfx.fx.filter(effect=>effect.type==='slash');
        if(!(target.hp<before))throw Error('Real melee contact did not land '+id);
        // Heavy strikes intentionally have a 0.34s weighted follow-through; regular strikes 0.26s.
        if(blades.length!==1||blades[0].radius>60||blades[0].heavy!==!!sk.heavy||Math.abs(blades[0].max-(sk.heavy?.34:.26))>1e-6)
          throw Error('Melee must use exactly one short brush stroke '+id);
        if(b.skillStrokes.some(stroke=>stroke.kind==='clawSlash'||
          stroke.kind==='signatureCast'))throw Error('Duplicate melee cast layers '+id);
        if(!b.skillStrokes.some(stroke=>stroke.kind==='signatureHit'&&stroke.skillId===id))
          throw Error('Melee contact did not spawn its own skill accent '+id);
        // Sample mid-sweep; the first frame correctly contains no teleporting
        // fully painted slash, and the last frame is almost transparent.
        b.vfx.update(.055);
      }else if(!physical&&!support&&!CatBondSkillFX.hit(b,target,sk,24,false)){
        throw Error('Contact art failed '+id);
      }
      b.skillStrokes.forEach(s=>s.life=s.max*.64);
      target.status={...(target.status||{}),burn:1.6,shock:1};
      // mirrorWall deliberately uses a physical, world-space reflect ward
      // instead of a fake circular cast burst. Verify the real shield pass
      // on the painted fighter, not a signatureCast that should not exist.
      const isMirror=id==='mirrorWall';
      if(isMirror)f.reflectT=3;
      const original=CatBondSkillFX.draw,originalWard=window.CatBondWardArt?.draw;
      let drawn=0,wardDrawn=0,physicalDrawn=0;
      const originalPhysical=physicalHook?.[physicalMethod];
      if(physical)physicalHook[physicalMethod]=function(...args){
        const result=originalPhysical.apply(this,args);if(result!==false)physicalDrawn++;return result;
      };
      CatBondSkillFX.draw=function(ctx,s,time){
        if(s?.skillId===id)drawn++;
        return original.apply(this,arguments);
      };
      if(isMirror&&originalWard)CatBondWardArt.draw=function(ctx,unit,...args){
        if(unit===f)wardDrawn++;
        return originalWard.call(this,ctx,unit,...args);
      };
      try{g.draw()}finally{
        CatBondSkillFX.draw=original;
        if(physical)physicalHook[physicalMethod]=originalPhysical;
        if(isMirror&&originalWard)CatBondWardArt.draw=originalWard;
      }
      if(isMirror){
        if(wardDrawn<2||!f.reflectT)throw Error('Physical mirror wall not in real battle '+id+': '+wardDrawn);
      }else if(physical){
        if(physicalDrawn<1)throw Error('Physical renderer not used in live battle '+id);
      }else if(drawn<(support||melee?1:2)){
        throw Error('Signature not in actual battle '+id+': '+drawn);
      }
      if(b.ultHero||b.duoCinematic)throw Error('full-screen art during normal skill');
      return {id,skillName:sk.name,style:sk.kind,drawn,physicalDrawn,
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
   assert.equal(new Set(hashes).size,ids.length,
     'All original and generated skill silhouettes must be distinct on '+spec.name);
   assert.deepEqual(errors,[],'unhandled game errors on '+spec.name);
   console.log('ALL NORMAL SKILLS PASS '+spec.name);
  }finally{await page.close();}
 }
 console.log('CAT BOND ALL SKILL-ID ARENA VISUAL QA PASS');
}finally{await browser.close();}
