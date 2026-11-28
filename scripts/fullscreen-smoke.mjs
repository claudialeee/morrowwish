import { chromium } from 'playwright';
import assert from 'node:assert/strict';

// The fullscreen feature deliberately targets only the interactive game stage,
// never documentElement; mobile tests force iPhone Safari's fallback behavior.
const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const allGames=['pawsibly-innocent','elsewhere','tiny-town','cat-bond','flip-dash','parcel-panic','pocket-aquarium'];
const games=process.env.GAME_TEST_SCOPE?allGames.filter(g=>g===process.env.GAME_TEST_SCOPE):allGames;
if(!games.length)throw new Error('Unknown GAME_TEST_SCOPE');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const failures=[];
async function check(game,width,mobile){
  const mini=['flip-dash','parcel-panic','pocket-aquarium'].includes(game);
  const ctx=await browser.newContext({viewport:{width,height:mobile?844:800},isMobile:mobile,hasTouch:mobile});
  const page=await ctx.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.message)));
  try {
    await page.goto(origin+'/'+game+'/?lang=zh',{waitUntil:'domcontentloaded',timeout:35000});
    // Elsewhere only reveals its gameplay toolbar after a life begins.
    if(game==='elsewhere'){
      if(mobile)await page.locator('[data-random-world]').first().tap();
      else await page.locator('[data-random-world]').first().click();
      await page.waitForFunction(()=>!document.getElementById('play-view')?.classList.contains('hidden'));
    }
    if(game==='pawsibly-innocent')await page.locator('#menuButton').click();
    const button=page.locator(mini?'#mw-mini-fullscreen':'#mw-fullscreen-toggle');
    await button.waitFor({state:'visible',timeout:15000});
    const surface=page.locator(mini?(game==='pocket-aquarium'?'.mw-mini-aquarium-frame':'.mw-mini-arcade-frame'):'.mw-immersive-target');
    assert.equal(await surface.count(),1,game+' must identify one actual play area');
    const hit=await button.boundingBox();
    assert.ok(hit&&hit.width>=(game==='pawsibly-innocent'?42:60)&&hit.height>=40,'Fullscreen button is not finger-friendly');
    if(mobile)await surface.evaluate(e=>Object.defineProperty(e,'requestFullscreen',{value:undefined,configurable:true}));
    if(mobile)await button.tap();else await button.click();
    await page.waitForFunction(()=>document.documentElement.classList.contains('mw-fs-active')||document.documentElement.classList.contains('mw-mini-fullscreen-on'));
    const opened=await page.evaluate((mini)=>{
      const play=document.querySelector(mini?'.mw-mini-arcade-frame,.mw-mini-aquarium-frame':'.mw-immersive-target'),r=play.getBoundingClientRect();
      return {native:document.fullscreenElement===play,fallback:play.classList.contains(mini?'mw-mini-fullscreen-fallback':'mw-immersive-fallback'),
        x:r.x,y:r.y,w:r.width,h:r.height,vw:innerWidth,vh:innerHeight,
        pressed:document.getElementById(mini?'mw-mini-fullscreen':'mw-fullscreen-toggle')?.getAttribute('aria-pressed'),
        rootFullscreen:document.fullscreenElement===document.documentElement};
    },mini);
    assert.equal(opened.pressed,'true','Fullscreen button must reflect pressed state');
    assert.equal(opened.rootFullscreen,false,'Never fullscreen the webpage root');
    assert.ok(opened.w<=width+4&&opened.w>=width-6,'Game surface should fill phone/desktop width: '+JSON.stringify(opened));
    assert.ok(opened.h<=opened.vh+5,'Game surface should not exceed viewport: '+JSON.stringify(opened));
    if(mobile)assert.ok(opened.fallback&&!opened.native,'iPhone fallback must apply only to game stage: '+JSON.stringify(opened));
    if(mobile&&width===390){
      if(game==='flip-dash'||game==='parcel-panic'){
        const coverage=await page.locator('#game').evaluate(canvas=>{
          const r=canvas.getBoundingClientRect();
          return{width:canvas.width,height:canvas.height,w:r.width,h:r.height};
        });
        assert.equal(coverage.width,540,'Portrait fullscreen needs a 540px backing canvas');
        assert.equal(coverage.height,960,'Portrait fullscreen needs a 960px backing canvas');
        assert.ok(coverage.h>coverage.w*1.6,'Canvas must be portrait: '+JSON.stringify(coverage));
        assert.ok(coverage.h>500,'Canvas must fill the phone, not a letterboxed strip: '+JSON.stringify(coverage));
      }
      if(game==='pawsibly-innocent'){
        const yarn=page.locator('#tool');
        assert.ok(await yarn.isVisible(),'Yarn gameplay control must stay in fullscreen');
      }
      if(game==='flip-dash'||game==='parcel-panic'){
        const start=page.locator('#play-btn');
        if(await start.isVisible())await start.tap();
      }
      if(game==='pocket-aquarium'){
        const start=page.locator('#start');
        if(await start.isVisible())await start.tap();
      }
      if(game==='elsewhere'){
        assert.ok(await page.locator('#play-view').isVisible(),'Story choices must remain playable');
      }
    }
    if(game==='pawsibly-innocent')await page.locator('#menuButton').click();
    if(mobile)await button.tap();else await button.click();
    await page.waitForFunction(()=>!document.documentElement.classList.contains('mw-fs-active')&&!document.documentElement.classList.contains('mw-mini-fullscreen-on'));
    assert.equal(await button.getAttribute('aria-pressed'),'false','Exit must restore windowed play');
    if(errors.length)throw Error('Uncaught errors: '+errors.join('; '));
    console.log('GAME SURFACE FULLSCREEN PASS',game,width,JSON.stringify(opened));
  } finally { await ctx.close(); }
}
// Both orientations must work independently, and sensor/viewport rotation during
// one fullscreen session must never change the game's chosen layout.
async function checkEntryOrientation(game,landscapeEntry){
  const start=landscapeEntry?{width:844,height:390}:{width:390,height:844};
  const rotated=landscapeEntry?{width:390,height:844}:{width:844,height:390};
  const ctx=await browser.newContext({viewport:start,isMobile:true,hasTouch:true});
  const page=await ctx.newPage();
  try{
    await page.goto(origin+'/'+game+'/?lang=zh',{waitUntil:'domcontentloaded',timeout:35000});
    const surface=page.locator(game==='pocket-aquarium'?'.mw-mini-aquarium-frame':'.mw-mini-arcade-frame');
    const button=page.locator('#mw-mini-fullscreen');
    await button.waitFor({state:'visible'});
    // Keep requestFullscreen available: the touchscreen path must avoid it.
    await surface.evaluate(el=>el.requestFullscreen=()=>{throw Error('Mobile native fullscreen must not be called')});
    await button.tap();
    const dims=async()=>page.evaluate(()=>{
      const c=document.querySelector('#game');
      const f=document.querySelector('.mw-mini-arcade-frame,.mw-mini-aquarium-frame');
      return {portrait:f.classList.contains('mw-mini-portrait'),
       fallback:f.classList.contains('mw-mini-fullscreen-fallback'),
       width:c?.width,height:c?.height,
       frame:f.getBoundingClientRect().toJSON()};
    });
    const initial=await dims();
    assert.ok(initial.fallback,'Touchscreen must use orientation-preserving fallback');
    if(game!=='pocket-aquarium'){
      assert.equal(initial.portrait,!landscapeEntry,game+' entry orientation');
      assert.equal(initial.width,landscapeEntry?960:540,game+' entry canvas width');
      assert.equal(initial.height,landscapeEntry?540:960,game+' entry canvas height');
    }
    await page.setViewportSize(rotated);
    await page.waitForTimeout(160);
    // Global controls must never float over the fullscreen exit control.
    assert.equal(await page.locator('#mw-language').isVisible(),false,
      game+' language overlay must not block the fullscreen exit button');
    const after=await dims();
    assert.ok(after.fallback,game+' should remain fullscreen');
    if(game!=='pocket-aquarium'){
      assert.equal(after.portrait,initial.portrait,game+' sensor rotation must not switch mode');
      assert.equal(after.width,initial.width,game+' width must stay fixed');
      assert.equal(after.height,initial.height,game+' height must stay fixed');
    }
    await button.tap();
    await page.waitForFunction(()=>!document.documentElement.classList.contains('mw-mini-fullscreen-on'));
    console.log('ORIENTATION LOCK PASS',game,landscapeEntry?'landscape':'portrait');
  }finally{await ctx.close()}
}
try{
  for(const width of [390,320])for(const game of games){
    try{await check(game,width,true)}catch(e){failures.push(game+' '+width+': '+e.message);console.error('FULLSCREEN FAIL',failures.at(-1))}
  }
  for(const game of games){
    try{await check(game,1280,false)}catch(e){failures.push(game+' desktop: '+e.message);console.error('FULLSCREEN FAIL',failures.at(-1))}
  }
  for(const game of ['flip-dash','parcel-panic','pocket-aquarium'].filter(g=>games.includes(g)))for(const landscape of [false,true]){
    try{await checkEntryOrientation(game,landscape)}catch(e){
      failures.push(game+' '+(landscape?'landscape':'portrait')+' orientation: '+e.message);
      console.error('FULLSCREEN ORIENTATION FAIL',failures.at(-1));
    }
  }
}finally{await browser.close()}
if(failures.length){console.error('Fullscreen failures:\n'+failures.join('\n'));process.exitCode=1}
else console.log((process.env.GAME_TEST_SCOPE||'All 7 games')+' use play-surface fullscreen with reversible mobile fallback');
