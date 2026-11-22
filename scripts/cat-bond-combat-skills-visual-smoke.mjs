// Actual Chromium + game-canvas combat QA: native-watercolor cat remains in
// the arena; water gun, sustained lightning, short sweeping fire, electric
// chain, slow seeking orb and physical melee/dash get separate visual frames.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {chromium} from 'playwright';

const base=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const moves=[
 ['waterJet','lanbao','channel'],
 ['thunderStream','xianluo','channel'],
 ['flameSweep','jinwu','channel'],
 ['lightningOrb','xianluo','orb'],
 ['boltArc','xianluo','chain'],
 ['voltRush','xianluo','dash'],
 ['shadowSwipe','xingchen','melee'],
];
const browser=await chromium.launch({headless:true});
try{
 for(const device of [
  {name:'desktop',width:1160,height:760,mobile:false},
  {name:'phone',width:390,height:844,mobile:true}
 ]){
  const page=await browser.newPage({viewport:{width:device.width,height:device.height},
    isMobile:device.mobile,hasTouch:device.mobile,
    deviceScaleFactor:device.mobile?2:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.__game&&!!window.Battle?.CaptureBattle);
  await page.locator('#intro-start').click();
  await page.locator('#panel.open .dex-cell').first().click();
  const hashes=[];
  for(const [id,breed,kind] of moves){
   const record=await page.evaluate(({id,breed,kind})=>{
    const cat=State.makeCat(breed,{affinity:90});cat.level=12;
    State.S.cats=[cat];
    State.S.battlePrefs={...(State.S.battlePrefs||{}),
      manualTutorialSeen:true,tutorialSeen:true,autoBattle:false};
    const g=window.__game;
    g.startBattle([cat],GameData.speciesById('doudou'));
    const b=g.battle,f=b.me(),sk=Skills.skillById(id);
    if(!b||!f||!sk)throw Error('Cannot start '+id);
    b.coach=null;b.autoMode=false;b.aim=0;b.t=.6;
    const target=b.enemies[0];
    if(!target)throw Error('missing opponent');
    target.x=f.x+100;target.y=f.y;
    target.maxhp=5000;target.hp=5000;target.speed=0;
    target.flash=0;target.inv=0;target.kbx=0;target.kby=0;
    const hp=target.hp;
    let mode='';
    if(kind==='channel'){
      b.castOffensiveSkill(f,0,sk,1,'#b5daff',true);
      if(b.beams.length!==1||!f._beamRoot)throw Error('missing live channel '+id);
      for(let t=0;t<5;t++)b.tickBeams(.08);
      if(b.beams.length!==1)throw Error('channel ended too soon '+id);
      if(target.hp>=hp)throw Error('channel never dealt any damage '+id);
      mode='continuous';
      if(id==='flameSweep'){
        const a=b.beams[0].aim;
        b.tickBeams(.38);
        if(Math.abs(a-b.beams[0].aim)<.2)throw Error('head did not sweep');
      }
    }else if(kind==='orb'){
      if(!b.castDistinctProjectile(f,sk,0,'#ffdeae',18))throw Error('no homing orb');
      const p=b.projectiles.at(-1);
      if(!p||p.kind!=='lightningOrb'||p.spd>150||p.homing<3)throw Error('orb not slow homing');
      target.y=f.y-70;const before=p.ang;
      b.tick(.08);
      if(!(p.ang<before-.04))throw Error('orb did not turn toward enemy');
      mode='seeking';
    }else if(kind==='chain'){
      b.chainBolt(f,0,sk,18,'#ffe7a1');
      if(target.hp>=hp)throw Error('chain is not hitting');
      mode='chain';
    }else if(kind==='dash'){
      target.x=f.x+95;
      b.dashLunge(f,0,sk,18,'#ffe4a1');
      if(target.hp<hp)throw Error('dash dealt ranged damage on cast');
      const x0=f.x;
      for(let j=0;j<6;j++)b.tick(.055);
      if(f.x<=x0+17)throw Error('dash never moved');
      if(target.hp>=hp)throw Error('dash never collided');
      if(f.x>x0+133)throw Error('dash travelled beyond short melee range');
      mode='collision';
    }else{
      target.x=f.x+146;
      b.meleeStrike(f,0,sk,18,'#c9a6df');
      if(target.hp!==hp)throw Error('claw hit from out of range');
      target.x=f.x+56;target.flash=0;target.inv=0;
      b.meleeStrike(f,0,sk,18,'#c9a6df');
      if(target.hp>=hp)throw Error('close claw never hit');
      mode='close-contact';
    }
    if(window.CatBondUltHero||b.ultHero)throw Error('full-screen cat overlay');
    g.draw();
    return {id,mode,hpLost:Math.round(hp-target.hp),
      arena:[g.W,g.H],catX:Math.round(f.x),hasBeam:b.beams.length>0,
      projectiles:b.projectiles.length};
   },{id,breed,kind});
   assert.ok(record.arena[0]>250&&record.arena[1]>240);
   const file='/tmp/cat-bond-skill-'+device.name+'-'+id+'.png';
   await page.screenshot({path:file,animations:'disabled'});
   const data=fs.readFileSync(file);
   assert.ok(data.length>12000,'real game screenshot is not blank '+id);
   hashes.push(crypto.createHash('sha256').update(data).digest('hex'));
   console.log('REAL COMBAT '+device.name+' '+JSON.stringify(record));
  }
  assert.equal(new Set(hashes).size,moves.length,'all skills must look different');
  assert.deepEqual(errors,[],'browser game has no uncaught errors');
  await page.close();
 }
 console.log('CAT BOND SEVEN COMBAT SKILLS REAL BROWSER QA PASS');
}finally{
 await browser.close();
}
