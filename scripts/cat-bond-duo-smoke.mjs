// Real browser regression for duo personalities, kinetic claw art and
// four-step pre-battle manual controls on both phone and desktop.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true});
const errors=[];
try{
 for(const profile of [
  {name:'phone',width:390,height:844,mobile:true,touch:true},
  {name:'desktop',width:1180,height:760,mobile:false,touch:false}
 ]){
  const context=await browser.newContext({
   viewport:{width:profile.width,height:profile.height},
   isMobile:profile.mobile,hasTouch:profile.touch,deviceScaleFactor:1
  });
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(profile.name+': '+e.message));
  await page.goto(origin+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.__game&&!!window.CatBondDuoHero&&!!window.CatRelations&&!!window.State);
  await page.waitForFunction(()=>window.CatBondDuoHero?.assetReady&&
    window.CatBondDuoHero?.assetCount===21,{timeout:18000});
  const entry=await page.evaluate(()=>{
   // Start through the real button and dismiss its starter chooser.
   document.getElementById('intro-start').click();
   window.UI.closeAll();
   const g=window.__game,State=window.State;
   const a=State.makeCat('tangyuan',{affinity:90});
   const b=State.makeCat('xiaohui',{affinity:90});
   a.personality='gentle';b.personality='shy';
   State.S.cats=[a,b];
   window.CatRelations.choose(a,b);
   window.CatRelations.pair(a,b).value=95;
   State.S.battlePrefs={...(State.S.battlePrefs||{}),autoBattle:false,modeChosen:true,
      manualTutorialSeen:false,tutorialSeen:false};
   g.startBattle([a,b],window.GameData.speciesById('jinwu'));
   return {manual:!g.battle.autoMode,paused:g.battleHelpOpen,coach:!!g.battle.coach};
  });
  assert.equal(entry.manual,true,'must enter manual battle');
  assert.equal(entry.paused,true,'manual tutorial must pause the arena before first input');
  assert.equal(entry.coach,true,'guided action practice must exist');
  for(let step=0;step<4;step++){
   const content=await page.locator('#battle-help-body').innerText();
   assert.match(content,/手机|触屏|Phone/,'tutorial must explain touch controls');
   assert.match(content,/电脑|键鼠|Computer/,'tutorial must explain desktop controls');
   if(step===1)assert.match(content,/WASD|方向键/);
   if(step===2)assert.match(content,/Space|空格/);
   if(step===3)assert.match(content,/20|60|90/);
   await page.locator('#battle-help-start').click();
  }
  assert.equal(await page.locator('#battle-help').isVisible(),false,
   'last tutorial step resumes playable fight');
  const result=await page.evaluate(()=>{
   const g=window.__game,State=window.State;
   const [a,b]=State.S.cats;
   const first=g.battle;
   first.coach=null;first.t=5;
   const shy=first.team[1];
   shy.hp=shy.maxhp*.55;
   first.hurtMe(12,shy.x,shy.y,shy);
   const guard=first.bondEvents?.guard||0;
   first.t+=1;
   first.tickBondStory();
   const courage=first.bondEvents?.courage||0;
   // Existing clever cats must also use the new feint; not only newly caught
   // mischievous kittens. The enemy AI has a real temporary focus target.
   a.personality='clever';b.personality='gentle';
   first._bondNextFeint=first.t;
   first.enemies.forEach(e=>{e.alive=true;e.x=first.team[0].x+72;e.y=first.team[0].y;e.hp=e.maxhp;});
   first.tickBondStory();
   const feint=first.bondEvents?.feint||0;
   const focus=first.enemies.some(e=>e._bondLureUid===a.uid&&e._bondLureUntil>first.t);
   first.t+=1;
   first.tickBondStory();
   const ambush=first.bondEvents?.ambush||0;
   // Snapshot a tier-3 duo cut-in through the real battle canvas.
   first.duoCharge=100;first.duoCd=0;first.coach=null;
   const cast=first.castDuo();
   if(first.duoCinematic)first.duoCinematic.t=first.duoCinematic.max-.95;
   const ctx=document.getElementById('scene').getContext('2d');
   let cutin=0;const before=window.CatBondDuoHero.draw;
   window.CatBondDuoHero.draw=function(...args){cutin++;return before(...args);};
   first.draw(ctx);
   window.CatBondDuoHero.draw=before;
   // Check the responsive guidance continues during actual controlled practice.
   const card=document.getElementById('battle-coach-card');
   return {guard,courage,feint,focus,ambush,cast,cutin,tier:first.duoCinematic?.tier,
      variant:first.duoCinematic?.variant,cardPresent:!!card,hero:typeof window.CatBondDuoHero.draw};
  });
  assert.ok(result.guard>=1,'gentle partner must actually defend vulnerable shy cat');
  assert.ok(result.courage>=1,'rescued shy cat must counterattack');
  assert.ok(result.feint>=1&&result.focus,'clever or mischievous cat must redirect enemy AI');
  assert.ok(result.ambush>=1,'partner must actually follow up with ambush damage');
  assert.equal(result.cast,true,'duo should be castable at full meter');
  assert.ok(result.cutin>=1,'game must draw new moving kitten art');
  assert.equal(result.tier,3,'90+ trust yields tier-3 art');
  assert.equal(result.variant,'finale','high trust must unlock finishing claw variant');
  assert.equal(result.cardPresent,true);
  // A complete real cast must release a visible, element-matched impact
  // AFTER the full-stage painting retreats. Verify the post-cut-in audio
  // request and live VFX on both real phone/desktop battle canvases.
  const aftershock=await page.evaluate(()=>{
    const b=window.__game.battle,c=b?.duoCinematic;
    if(!c)throw Error('Duo cut-in was not created');
    const audio=window.MorrowwishAudio;
    const orig=audio?.duoSignature;
    const requested=[];
    if(audio)audio.duoSignature=function(...args){
      requested.push({pair:args[0],tier:args[1],beat:args[2]});
      return orig?.apply(this,args);
    };
    try{
      // Jump to the end of the real 3.2s painting without resetting combat.
      // The first update resolves the deferred payload, the second must
      // produce a distinct audible/visible 1.1s arena aftershock.
      c.t=Math.max(.035,c.max-c.strikeAt+.012);
      b.update(.06);
      b.update(.22);
      const release=b._duoRelease;
      const state={alive:!!release,age:release?.age||0,pair:release?.elements||'',
        effects:b.vfx?.fx?.length||0,requested};
      if(release){
        let draws=0;
        const origDraw=window.CatBondDuoReleaseVFX.draw;
        window.CatBondDuoReleaseVFX.draw=function(...args){
          draws++;return origDraw(...args);
        };
        // Ensure the second wave still renders after the painting's removal.
        b.duoCinematic=null;
        try{b.draw(document.getElementById('scene').getContext('2d'));}
        finally{window.CatBondDuoReleaseVFX.draw=origDraw;}
        state.drawsAfterCutin=draws;
      }
      return state;
    }finally{if(audio)audio.duoSignature=orig;}
  });
  assert.equal(aftershock.alive,true,'Finisher VFX must survive the painting');
  assert.ok(aftershock.age>.20,'Finisher must advance in real combat time');
  assert.ok(aftershock.drawsAfterCutin>=1,'Finisher should draw in the revealed arena');
  assert.ok(aftershock.effects>=1,'Hit must spawn actual particles and rings');
  assert.ok(aftershock.requested.some(x=>x.beat==='release'&&x.pair),
    'The 21-element audio catalogue must receive a distinct RELEASE sound');
  const sigAudit=await page.evaluate(()=>{
    const S=window.CatBondDuoSignatures,keys=S?.keys||[];
    const canvas=document.createElement('canvas');canvas.width=480;canvas.height=290;
    const c=canvas.getContext('2d',{willReadFrequently:true});
    const hashes=[];
    for(const pair of keys){
      c.clearRect(0,0,480,290);
      S.paint(c,480,290,.57,3,pair);
      const bytes=c.getImageData(0,0,480,290).data;
      let hash=2166136261;
      for(let i=0;i<bytes.length;i+=23)hash=Math.imul(hash^bytes[i],16777619)>>>0;
      hashes.push(hash);
      const pose=S.course(S.get(pair).style,.5,480,290,145,3);
      if(![pose.x1,pose.y1,pose.x2,pose.y2].every(Number.isFinite))
        throw Error('invalid motion: '+pair);
      if(pose.x1<35||pose.x2>445)
        throw Error('clipped kitten movement: '+pair);
    }
    return {count:keys.length,unique:new Set(hashes).size};
  });
  assert.equal(sigAudit.count,21,'all elemental combinations need unique choreography');
  assert.equal(sigAudit.unique,21,'motifs should not be mere palette swaps');
  await page.screenshot({path:'/tmp/cat-bond-'+profile.name+'-duo.png'});
  // Privately test all 21 dynamic move rigs. This is a QA-only canvas,
  // not a public list of unearned duo moves.
  const visual=await page.evaluate(()=>{
    const Director=window.CatBondDuoDirector,Hero=window.CatBondDuoHero;
    const pairCats=State.S.cats.slice(0,2);
    const cv=document.createElement('canvas');cv.width=640;cv.height=360;
    const ctx=cv.getContext('2d',{willReadFrequently:true});
    const hash=()=>{
      const bytes=ctx.getImageData(0,0,640,360).data;let n=2166136261;
      for(let i=0;i<bytes.length;i+=43)n=Math.imul(n^bytes[i],16777619)>>>0;
      return n;
    };
    // Guard against invalid transforms: an earlier .size/.scale mismatch
    // silently drew giant cropped cats on phone even though images differed.
    const nativeScale=CanvasRenderingContext2D.prototype.scale;
    CanvasRenderingContext2D.prototype.scale=function(x,y){
      if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('NaN cinematic scale');
      return nativeScale.call(this,x,y);
    };
    const results=[],second=[];
    for(const key of Director.keys){
      ctx.clearRect(0,0,640,360);
      Hero.draw(ctx,640,360,{max:2.75,t:1.94,catUids:pairCats.map(c=>c.uid),
        elements:key,tier:3,name:key,strikeAt:.78},uid=>pairCats.find(c=>c.uid===uid));
      results.push(hash());
      ctx.clearRect(0,0,640,360);
      Hero.draw(ctx,640,360,{max:2.75,t:1.14,catUids:pairCats.map(c=>c.uid),
        elements:key,tier:3,name:key,strikeAt:.78},uid=>pairCats.find(c=>c.uid===uid));
      second.push(hash());
    }
    CanvasRenderingContext2D.prototype.scale=nativeScale;
    const firstHigh=Director.pose('grass+light',.03,640,360);
    const high=Director.pose('grass+light',.28,640,360);
    const sep=poses=>Math.abs(poses[1].x-poses[0].x);
    const soundCount=window.MorrowwishAudio?.status?.().combatSounds||0;
    const ids=pairCats.map(c=>c.uid);State.save();
    return {pairs:Director.keys.length,unique:new Set(results).size,
      moved:second.some((h,i)=>h!==results[i]),
      motionUnique:Director.isUnique(),highfive:Director.styles['grass+light'],
      pawApproach:sep(high)<sep(firstHigh),
      unlockedPair:ids,a:ids[0],b:ids[1],soundCount};
  });
  assert.equal(visual.pairs,21);
  assert.equal(visual.unique,21,'all 21 duo performances should visibly differ');
  assert.equal(visual.motionUnique,true);
  assert.equal(visual.moved,true,'actual poses and magical attacks must move');
  assert.equal(visual.highfive,'highfive');
  assert.equal(visual.pawApproach,true,'high-five kittens must approach one another');
  assert.equal(visual.soundCount,13,'combat sound categories must still load');
  // No one may browse unearned moves: only the current earned pair opens.
  await page.goto(origin+'/cat-bond/duo-preview.html?a='+
    encodeURIComponent(visual.a)+'&b='+encodeURIComponent(visual.b),
    {waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.__duoPreviewReady&&window.CatBondDuoHero?.assetReady,
    {timeout:18000});
  assert.equal(await page.locator('#duo-canvas').isVisible(),true);
  assert.equal(await page.locator('#signature-grid').count(),0,
    'no public 21-move overview, even after unlocking one move');
  assert.equal(await page.locator('#locked').isVisible(),false);
  await page.locator('.viewer').screenshot({path:'/tmp/cat-bond-'+profile.name+'-preview-stage.png'});
  const stranger=await browser.newContext();
  const locked=await stranger.newPage();
  await locked.goto(origin+'/cat-bond/duo-preview.html?a='+
    encodeURIComponent(visual.a)+'&b='+encodeURIComponent(visual.b),
    {waitUntil:'domcontentloaded'});
  assert.equal(await locked.locator('#locked').isVisible(),true,
    'a saved-game unlock is mandatory before displaying a duo animation');
  assert.equal(await locked.locator('#unlocked').isVisible(),false);
  assert.equal(await locked.locator('#signature-grid').count(),0);
  await stranger.close();
  console.log('DUO BOND PASS '+profile.name+' '+JSON.stringify({battle:result,visual}));
  // Player routes must never expose every unearned combo animation.
  const publicGallery=await page.request.get(origin+'/cat-bond/duo-gallery.html');
  assert.equal(publicGallery.status(),404,
    'complete developer-only gallery must not be served by public games');
  console.log('GALLERY GATE PASS '+profile.name+' 21-move index not publicly served');
  await context.close();
 }
 assert.deepEqual(errors,[],'uncaught browser errors');
}catch(err){console.error('DUO BOND FAIL',err);console.error('Browser errors',errors);process.exitCode=1;
}finally{await browser.close();}
