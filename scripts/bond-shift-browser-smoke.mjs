// Real browser input. This must never force battle victory or mutate game state.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const origin=process.env.BOND_PROTOTYPE_ORIGIN||'http://127.0.0.1:8765';
fs.mkdirSync('artifacts/bond-shift',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
  const desktop=await browser.newContext({viewport:{width:1216,height:805},deviceScaleFactor:1});
  const page=await desktop.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/cat-bond/prototypes/bond-shift/',{waitUntil:'load'});
  await page.locator('#modal-btn').click();
  await page.waitForFunction(()=>window.__bondShiftDebug?.()?.stage==='encounter');
  // Guardian cannot be used before a genuine bond encounter.
  await page.keyboard.press('Digit2');
  assert.equal((await page.evaluate(()=>window.__bondShiftDebug().form)),'hunter');
  // Actual keyboard movement and held attack against the first real enemy.
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(1280);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('KeyJ');
  await page.waitForFunction(()=>window.__bondShiftDebug?.()?.guardianUnlocked===true,{timeout:20000}).catch(async e=>{
    const state=await page.evaluate(()=>window.__bondShiftDebug?.());
    throw new Error('First real-input fight did not finish: '+JSON.stringify(state)+' :: '+e.message);
  });
  await page.keyboard.up('KeyJ');
  assert.equal(await page.locator('#modal-title').textContent(),'第一次羁绊变身');
  await page.screenshot({path:'artifacts/bond-shift/01-unlocked.png'});
  await page.locator('#modal-btn').click();
  await page.keyboard.press('Digit2');
  await page.waitForFunction(()=>window.__bondShiftDebug?.()?.form==='guardian');
  await page.keyboard.press('KeyQ');
  await page.keyboard.press('KeyE');
  await page.screenshot({path:'artifacts/bond-shift/02-guardian.png'});
  const state=await page.evaluate(()=>window.__bondShiftDebug?.());
  assert.equal(state.stage,'together');
  assert.equal(state.guardianUnlocked,true);
  assert.ok(state.stats.hunterHits>0,'Starter fight must be won with real attacks');
  assert.deepEqual(errors,[],'Desktop script errors');
  await desktop.close();

  // Mobile touch-control smoke: start and operate visible buttons.
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const touch=await mobile.newPage(),touchErrors=[];
  touch.on('pageerror',e=>touchErrors.push(e.message));
  await touch.goto(origin+'/cat-bond/prototypes/bond-shift/',{waitUntil:'load'});
  await touch.locator('#modal-btn').tap();
  await touch.locator('[data-act="attack"]').tap();
  await touch.locator('[data-act="guard"]').tap();
  assert.equal(await touch.evaluate(()=>window.__bondShiftDebug?.()?.stage),'encounter');
  await touch.screenshot({path:'artifacts/bond-shift/03-portrait.png',fullPage:true});
  assert.deepEqual(touchErrors,[],'Mobile script errors');
  await mobile.close();
  console.log('Bond Shift real-input browser smoke PASS (desktop first battle, shift, mobile controls).');
} finally { await browser.close(); }
