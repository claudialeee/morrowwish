// Isolated input/rotation regression, NOT full campaign progression evidence.
// A real new slot is opened with touch; only battle entry is a synthetic fixture.
// All input and state changes after battle entry are actual native touch events.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const origin=process.env.CAT_BOND_SMOKE_ORIGIN||'http://127.0.0.1:8765';
const out='artifacts/starbell-portrait-input';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort();});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);
 const shot=name=>page.screenshot({path:out+'/'+name+'.png'});
 await page.goto(origin+'/cat-bond/?lang=en&rpgDev=1');
 await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
 await page.locator('#intro-start').tap();
 await page.locator('#intro-slot-list [data-slot="slot1"]').tap();
 await page.locator('#cb-player-first-intro').getByRole('button',{name:'Start exploring',exact:true}).tap();
 await page.waitForFunction(()=>State.S.cats.length===1&&__game.scene==='yard');
 const before=await page.evaluate(()=>({actors:State.S.cats.map(c=>c.id),story:CatBondResonance.view().current?.id}));
 // Rotate the actual title/game viewport without resetting or replacing the save.
 for(const viewport of [{width:844,height:390},{width:390,height:844}]){
  await page.setViewportSize(viewport);
  await page.waitForFunction(v=>Math.abs(__game.W-document.querySelector('#scene').getBoundingClientRect().width)<2&&innerWidth===v.width,viewport);
  assert.deepEqual(await page.evaluate(()=>({actors:State.S.cats.map(c=>c.id),story:CatBondResonance.view().current?.id})),before);
 }
 await page.reload();await page.locator('#intro-continue').tap();
 await page.locator('#intro-slot-list [data-slot="slot1"]').tap();
 await page.waitForFunction(()=>State.S.cats.length===1&&__game.scene==='yard');
 assert.deepEqual(await page.evaluate(()=>({actors:State.S.cats.map(c=>c.id),story:CatBondResonance.view().current?.id})),before,'Real slot retains actors and story through orientation and reload');
 await shot('yard-reloaded');
 // Deliberately isolate the shared combat engine; no claimed story victory.
 await page.evaluate(()=>{
  State.S.battlePrefs={...State.S.battlePrefs,autoBattle:false,manualTutorialSeen:true};
  const wild=GameData.SPECIES[1];
  __game.startBattle(State.S.cats.slice(0,1),wild,{pack:[wild],masteryChallenge:true});
 });
 await page.locator('#battle-ui.on').waitFor();
 await page.waitForFunction(()=>__game.battle&&!__game.battle.autoMode&&!__game.battleTutorial);
 const read=()=>page.evaluate(()=>{
  const g=__game,b=g.battle,f=b.me(),s=document.querySelector('#scene').getBoundingClientRect(),d=document.querySelector('#battle-ui .move-bar').getBoundingClientRect();
  return {t:b.t,x:f.x,y:f.y,w:b.W,h:b.H,top:b.topMargin,bottom:b.bottomMargin,auto:b.autoMode,joy:g.joystick.active,dx:g.joystick.dx,dodge:f.dodgeCd,q:f.cd.q,e:f.cd.e,fieldBottom:s.top+b.H-b.bottomMargin,dockTop:d.top,dockBottom:d.bottom,stageBottom:document.querySelector('#stage').getBoundingClientRect().bottom};
 });
 async function inspectDock(portrait){
  const d=await page.evaluate(()=>[...document.querySelectorAll('#battle-ui .move-bar .move')].filter(e=>e.getBoundingClientRect().width>0).map(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return{id:e.id,w:r.width,h:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,hit:e.contains(hit)};}));
  assert.ok(d.length>=5&&d.every(b=>b.w>0&&b.h>0&&b.left>=-1&&b.right<=page.viewportSize().width+1&&b.top>=-1&&b.bottom<=page.viewportSize().height+1&&b.hit),'All visible skills tappable '+JSON.stringify(d));
  if(portrait){assert.ok(d.every(b=>b.w>=44&&b.h>=44),'Minimum touch targets '+JSON.stringify(d));const s=await read();assert.ok(s.fieldBottom<=s.dockTop+2&&s.dockBottom<=s.stageBottom+1,'Dock clearance '+JSON.stringify(s));}
 }
 await inspectDock(true);await shot('portrait-manual-start');
 // Real native CDP touch gesture, not a dispatched synthetic TouchEvent.
 const cdp=await context.newCDPSession(page);
 const canvas=await page.locator('#scene').boundingBox(),s=await read();
 const p={x:canvas.x+canvas.width*.20,y:canvas.y+(s.top+s.h-s.bottom)/2};
 assert.equal(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.id,p),'scene','Joystick start is not covered by HUD');
 const xBefore=s.x;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});
 try{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x+55,y:p.y}]});
  await page.waitForFunction(x=>__game.joystick.active&&__game.joystick.dx>.25&&__game.battle.me().x>x+5,xBefore);
 }finally{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 await page.waitForFunction(()=>!__game.joystick.active);
 // Actual dodge and equipped skill buttons must cause their cooldowns to change.
 await page.waitForFunction(()=>__game.battle.me().dodgeCd<=0);
 await page.locator('#mv-dodge').tap();
 await page.waitForFunction(()=>__game.battle.me().dodgeCd>0);
 await page.waitForFunction(()=>__game.battle.me().cd.q<=0);
 await page.locator('#mv-q').tap();
 await page.waitForFunction(()=>__game.battle.me().cd.q>0);
 await shot('portrait-manual-skill');
 const original=await read();
 for(const [name,viewport] of [['landscape',{width:844,height:390}],['portrait',{width:390,height:844}]]){
  await page.setViewportSize(viewport);
  await page.waitForFunction(v=>{const g=__game,b=g.battle;return innerWidth===v.width&&b&&Math.abs(b.W-g.W)<2&&Math.abs(b.H-g.H)<2&&!g.joystick.active&&((v.width<v.height)===(b.W<b.H));},viewport);
  const now=await read();
  assert.ok(!now.auto&&now.t>=original.t&&now.x>=0&&now.x<=now.w&&now.y>=now.top-2&&now.y<=now.h-now.bottom+2,'Rotation keeps same live manual battle '+JSON.stringify(now));
  await inspectDock(name==='portrait');await shot('rotated-'+name);
 }
 assert.deepEqual(errors,[]);console.log('PORTRAIT INPUT PASS: real slot reload, joystick displacement, dodge, skill cooldown, live rotation and hit testing');
 await context.close();
}finally{await browser.close();}
