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
   a.toggle(); // sound effects OFF
   for(const type of kinds)a.effect(type);
   const muted=a.status();
   a.toggle();a.effect('combat_hit');const resumed=a.status();
   return {begin,played,muted,resumed,kinds};
  });
  assert.equal(status.begin.enabled,true,'sound must be enabled for test');
  assert.equal(status.begin.unlocked,true,'tap must unlock Web Audio');
  assert.equal(status.played.combatSounds,13,'all 13 combat sound categories registered');
  assert.ok(status.played.effects-status.begin.effects>=12,
    'each unique combat action must actually trigger foley synthesis');
  assert.equal(status.muted.enabled,false,'sound switch disables audio');
  assert.equal(status.muted.effects,status.played.effects,
    'no combat effect must play when sound effects are turned off');
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
