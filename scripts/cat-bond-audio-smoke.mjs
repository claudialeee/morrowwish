// Confirm real short combat sounds, browser gesture unlock and global mute.
// Checks desktop and touch device so audio doesn't silently fail on phones.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const base=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
try{
 for(const device of [
   {name:'phone',viewport:{width:390,height:844},isMobile:true,hasTouch:true},
   {name:'desktop',viewport:{width:1130,height:740},isMobile:false,hasTouch:false}
 ]){
  const ctx=await browser.newContext({viewport:device.viewport,isMobile:device.isMobile,hasTouch:device.hasTouch});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/cat-bond/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.MorrowwishAudio?.effect&&!!window.__game);
  await page.locator('#intro-start').click();
  const status=await page.evaluate(()=>{
   const a=window.MorrowwishAudio;
   if(!a.isEnabled())a.toggle(); // explicit test gesture grants permission
   a.start();
   const begin=a.status();
   const kinds=['combat_swing','combat_claw','combat_projectile','combat_magic',
      'combat_beam','combat_dash','combat_hit','combat_dodge','combat_hurt',
      'combat_duo','combat_duo_impact','combat_ultimate','combat_win'];
   for(const type of kinds)a.effect(type);
   const played=a.status();
   // The duos have 21 distinct synthesized motifs, plus stronger tier-3
   // impact layers. Verify each signature on a real unlocked AudioContext.
   const keys=window.CatBondDuoDirector?.keys||[];
   const identities=[];
   const beforeDuo=a.status();
   for(const key of keys){
     if(!a.duoSignature(key,3,'cast'))throw Error('Duo sound missing: '+key);
     identities.push(a.status().lastSignature?.identity);
   }
   a.duoSignature('light+light',3,'impact');
   const signatureEnd=a.status();
   // Q/E/ultimate use skill-ID and element to create their own audible
   // identity; the last high-power attack must have a real heavy bass tier.
   const beforeSkills=a.status();
   const skillIdentities=[];
   for(const [name,element,power] of [
     ['pawSwipe','grass',1],['fireball','fire',1],['waterLash','water',2],
     ['shadowPounce','dark',2],['moonfang','light',3],['thunderstorm','elec',3]
   ]){
     if(!a.skillSignature(name,element,power))throw Error('Skill sound missing: '+name);
     skillIdentities.push(a.status().lastSkillSignature?.signature);
   }
   const skillEnd=a.status();
   a.toggle(); // sound effects OFF
   for(const type of kinds)a.effect(type);
   const silentSignature=a.duoSignature('fire+fire',3,'impact');
   const silentSkill=a.skillSignature('silencedUltimate','dark',3);
   const muted=a.status();
   a.toggle();a.effect('combat_hit');const resumed=a.status();
   return {begin,played,muted,resumed,kinds,
     keys,identities,signatureEnd,beforeDuo,silentSignature,beforeSkills,skillEnd,skillIdentities,silentSkill};
  });
  assert.equal(status.begin.enabled,true,'sound must be enabled for test');
  assert.equal(status.begin.unlocked,true,'tap must unlock Web Audio');
  assert.equal(status.played.combatSounds,13,'all 13 combat sound categories registered');
  assert.ok(status.played.effects-status.begin.effects>=12,
    'each unique combat action must actually trigger foley synthesis');
  assert.equal(status.muted.enabled,false,'sound switch disables audio');
  assert.equal(status.keys.length,21);
  assert.equal(status.begin.duoSignatureCount,21);
  assert.equal(new Set(status.identities).size,21,
    'all 21 skills must have distinguishable melodic signatures');
  assert.equal(status.signatureEnd.duoSignatureEvents-status.beforeDuo.duoSignatureEvents,22,
    '21 cast sounds and 1 impact with tier-3 bass must actually play');
  assert.equal(status.silentSignature,false,'duo impact must be silent when muted');
  assert.equal(status.silentSkill,false,'powerful skill impact must be silent when muted');
  assert.equal(new Set(status.skillIdentities).size,6,'Q/E/ultimate spell sounds must be distinct');
  assert.equal(status.skillEnd.skillSignatureEvents-status.beforeSkills.skillSignatureEvents,6,
    'six elemental skill sounds, including two heavy ultimates, must play');
  assert.equal(status.skillEnd.lastSkillSignature.power,3,'ultimate needs its heavy audio tier');
  assert.equal(status.muted.effects,status.skillEnd.effects,
    'muting must suppress regular, duo AND individual skill sounds');
  assert.equal(status.resumed.enabled,true);
  assert.equal(status.resumed.effects,status.muted.effects+1,
    'audio must resume when the user enables it again');
  assert.deepEqual(errors,[],'no browser audio exceptions');
  console.log('CAT BOND COMBAT AUDIO PASS '+device.name+' '+JSON.stringify({
    kinds:status.kinds.length,
    triggerCount:status.played.effects-status.begin.effects,
    audioContext:status.played.audioState,
    silentWhileMuted:true
  }));
  await ctx.close();
 }
}finally{await browser.close()}
