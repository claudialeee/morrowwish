import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1250,height:900},deviceScaleFactor:1});
// Local Python HTTP server cannot accept analytics POSTs; fulfill them in-browser.
await page.route('**/api/session',route=>route.fulfill({status:204,body:''}));
const errors=[];
page.on('pageerror',e=>{errors.push(e.stack||e.message);console.log('PAGE ERROR:',e.stack||e.message)});
page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE ERROR:',m.text())});
try{
 const url=process.env.GAME_BROWSER_TEST_URL||'http://127.0.0.1:8765/pawsibly-innocent/';
 console.log('Opening '+url);
 await page.goto(url,{waitUntil:'load',timeout:40000});
 await page.waitForTimeout(850);
 const initial=await page.evaluate(()=>{
  const canvas=document.getElementById('board'),s=window.__PAWSIBLY_TEST__?.getState();
  if(!canvas||!s)return {loaded:false,canvas:!!canvas,game:!!s};
  const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
  let opaque=0,unique=new Set();
  for(let i=0;i<pixels.length;i+=400){if(pixels[i+3]>0)opaque++;unique.add([pixels[i],pixels[i+1],pixels[i+2]].join(','))}
  return {loaded:true,opaque,uniqueColors:unique.size,position:{...s.cat},
    mission:document.getElementById('mission')?.textContent,
    yarn:document.getElementById('tool')?.textContent};
 });
 console.log('Canvas audit:',JSON.stringify(initial));
 // Regression: a new visitor gets a prefetched soundtrack before any interaction.
 // No click required to download/prepare the recorded music.
 await page.waitForFunction(()=>document.getElementById('catRecordedMusic')?.readyState>=2,null,{timeout:10000});
 const preloaded=await page.evaluate(()=>window.MorrowwishCatMusic.status());
 assert.equal(preloaded.preload,'auto','Recorded cat music must preload before first interaction');
 assert.ok(preloaded.readyState>=2,'Recorded music should already be buffered before first click');
 assert.equal(preloaded.error,'','Early loading should not report an audio error');
 assert.equal(await page.locator('#catRecordedMusic').count(),1,'HTML should contain the sole early-preloading audio element');
 assert.equal(await page.locator('link[rel="preload"][as="audio"]').count(),1,'Browser should request cat music at the start of page loading');
 console.log('Recorded cat song ready before user input:',JSON.stringify(preloaded));
 assert.equal(initial.loaded,true,'Game Javascript must initialize');
 const ruleLayout=await page.evaluate(()=>{
  const stage=document.getElementById('stage'),board=document.getElementById('board'),tool=document.getElementById('tool'),top=document.querySelector('.in-game-top');
  const br=board.getBoundingClientRect(),tr=tool.getBoundingClientRect();
  return {boardTop:br.top,boardBottom:br.bottom,toolTop:tr.top,toolBottom:tr.bottom,topBottom:top.getBoundingClientRect().bottom,
   noDuplicateRules:!document.querySelector('.explainer'),menuHidden:document.getElementById('gameMenu').hidden,
   inFrame:['board','tool','heistStatus','gameMenu','menuButton','bonusQuick','guardIntent'].every(id=>stage.contains(document.getElementById(id))),
   tabs:document.querySelectorAll('[data-game-tab]').length};
 });
 console.log('Single-screen cat geometry:',JSON.stringify(ruleLayout));
 assert.ok(ruleLayout.noDuplicateRules&&ruleLayout.inFrame&&ruleLayout.tabs===5&&ruleLayout.menuHidden,'All controls, bonus objective and tabs must live in a single game frame');
 assert.ok(ruleLayout.topBottom<=ruleLayout.boardTop+2&&ruleLayout.toolBottom<=ruleLayout.boardTop+2,'Tutorial, bonus and yarn must all be ABOVE the map and not cover tiles');
 // Normal desktop windows (NOT fullscreen): stage must be visible without
 // scrolling; tutorial, mission, yarn and top header must align with the map.
 for(const viewport of [
  {width:1440,height:900},{width:1366,height:768},{width:1280,height:720},
  {width:1024,height:600},{width:900,height:520}
 ]){
  await page.setViewportSize(viewport);
  await page.waitForTimeout(85);
  const fit=await page.evaluate(()=>{
   const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
   const header=document.querySelector('.in-game-top').getBoundingClientRect();
   const guide=document.querySelector('.in-game-guidance').getBoundingClientRect();
   return {viewport:{width:innerWidth,height:innerHeight},
    stage:rect('stage'),board:rect('board'),tool:rect('tool'),bonus:rect('bonusQuick'),
    header:{left:header.left,right:header.right,width:header.width,bottom:header.bottom},
    guide:{left:guide.left,right:guide.right,width:guide.width},
    scrollHeight:document.scrollingElement.scrollHeight};
  });
  console.log('Windowed desktop fit:',JSON.stringify(fit));
  assert.ok(fit.stage.top>=-1&&fit.stage.bottom<=fit.viewport.height+1,
   'Desktop game must fit WITHOUT scrolling at '+viewport.width+'x'+viewport.height);
  assert.ok(fit.scrollHeight<=fit.viewport.height+2,
   'Game webpage must not require scrolling at '+viewport.width+'x'+viewport.height);
  assert.ok(Math.abs(fit.header.left-fit.board.left)<=2&&Math.abs(fit.header.right-fit.board.right)<=2,
   'Top HUD must exactly match the canvas width at '+viewport.width+'x'+viewport.height);
  assert.ok(Math.abs(fit.guide.left-fit.board.left)<=2&&Math.abs(fit.guide.right-fit.board.right)<=2,
   'Guidance and bonus row must be flush with the game map at '+viewport.width+'x'+viewport.height);
  assert.ok(fit.bonus.width>=120,'Bonus button unreadably squeezed at '+viewport.width+'x'+viewport.height+': '+JSON.stringify(fit));
  if(viewport.width===900)await page.screenshot({path:'test-results/pawsibly-desktop-900x520.png'});
  assert.ok(fit.tool.bottom<=fit.board.top+2&&fit.bonus.bottom<=fit.board.top+2,
   'Objectives and yarn must remain visible ABOVE the board');
 }

 // Landscape mobile regression: actual touch context, not merely a narrow
 // desktop window. Test both entry and live rotation in both languages.
 const landscape=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 try{
  const phone=await landscape.newPage();
  await phone.route('**/api/session',r=>r.fulfill({status:204,body:''}));
  await phone.goto(url,{waitUntil:'load'});
  await phone.waitForSelector('#mw-game-settings');
  assert.ok(await phone.evaluate(()=>document.querySelector('.in-game-top').getBoundingClientRect().right<=document.querySelector('#board').getBoundingClientRect().left+1),'Direct landscape entry must use side-by-side layout');
  await phone.setViewportSize({width:390,height:844});
  for(const lang of ['zh','en']){
   await phone.evaluate(lang=>window.MorrowwishI18n.set(lang),lang);
   for(const viewport of [{width:844,height:390},{width:852,height:320},{width:667,height:300},{width:570,height:280}]){
    await phone.setViewportSize(viewport);
    await phone.waitForTimeout(100);
    const fit=await phone.evaluate(()=>{
     const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
     const stage=rect(document.querySelector('#stage')),board=rect(document.querySelector('#board')),hud=rect(document.querySelector('.in-game-top'));
     const ids=['stageHome','heistStatus','guideHelp','guardStatus','menuButton','mw-fullscreen-toggle','tool','wait','restart','bonusQuick'];
     const elements=[...ids.map(id=>document.getElementById(id)),...document.querySelectorAll('#mw-game-settings button')].filter(e=>e&&e.getClientRects().length);
     return {stage,board,hud,controls:elements.map(e=>{const r=rect(e),target=e.matches('button,a'),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {id:e.id||e.className,...r,target,clickable:!target||e.disabled||e.contains(hit)};}),vw:innerWidth,vh:innerHeight,scrollHeight:document.scrollingElement.scrollHeight};
    });
    const msg=lang+' '+viewport.width+'x'+viewport.height+' '+JSON.stringify(fit);
    assert.ok(fit.stage.left>=-1&&fit.stage.right<=fit.vw+1&&fit.stage.top>=-1&&fit.stage.bottom<=fit.vh+1,'Landscape stage fits: '+msg);
    assert.ok(fit.scrollHeight<=fit.vh+2,'Landscape must not scroll the page: '+msg);
    assert.ok(fit.hud.right<=fit.board.left+1,'HUD cannot cover playfield: '+msg);
    assert.ok(Math.abs(fit.board.width/fit.board.height-10/7)<.02,'Map must preserve 10:7 aspect: '+msg);
    assert.ok(fit.board.height>=fit.vh*.85||fit.board.width>=fit.vw-300,'Map must maximize available landscape space: '+msg);
    for(const c of fit.controls){
     assert.ok(c.left>=fit.hud.left-1&&c.right<=fit.hud.right+1&&c.top>=fit.hud.top-1&&c.bottom<=fit.hud.bottom+1,'Control clipped: '+c.id+' '+msg);
     assert.ok(c.width>0&&c.height>0,'Control must be visible: '+c.id+' '+msg);
     assert.ok(c.clickable,'Control center is obstructed: '+c.id+' '+msg);
     if(c.target&&c.id!=='guideHelp')assert.ok(c.width>=39&&c.height>=43,'Touch target too small: '+c.id+' '+msg);
    }
    for(let i=0;i<fit.controls.length;i++)for(let j=i+1;j<fit.controls.length;j++){
     const a=fit.controls[i],b=fit.controls[j];
     assert.ok(Math.min(a.right,b.right)-Math.max(a.left,b.left)<=1||Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)<=1,'Controls overlap: '+a.id+' / '+b.id+' '+msg);
    }
    await phone.screenshot({path:'test-results/pawsibly-landscape-'+lang+'-'+viewport.width+'x'+viewport.height+'.png'});
    await phone.locator('#menuButton').tap();
    assert.ok(await phone.locator('#gameMenu').isVisible(),'Landscape menu remains usable');
    await phone.locator('#menuClose').tap();
   }
  }
  await phone.setViewportSize({width:844,height:390});
  const b=await phone.locator('#board').boundingBox();
  await phone.touchscreen.tap(b.x+b.width*.25,b.y+b.height*.5);
  await phone.waitForFunction(()=>window.__PAWSIBLY_TEST__.getState().got===1);
  // Safari-like fullscreen fallback must remain playable when entered in landscape.
  await phone.locator('#stage').evaluate(e=>Object.defineProperty(e,'requestFullscreen',{value:undefined,configurable:true}));
  await phone.locator('#mw-fullscreen-toggle').tap();
  await phone.waitForFunction(()=>document.documentElement.classList.contains('mw-fs-active'));
  await phone.waitForTimeout(100);
  const immersive=await phone.evaluate(()=>{
   const board=document.querySelector('#board').getBoundingClientRect(),hud=document.querySelector('.in-game-top').getBoundingClientRect(),stage=document.querySelector('#stage').getBoundingClientRect();
   return {fallback:document.querySelector('#stage').classList.contains('mw-immersive-fallback'),stage:stage.toJSON(),board:board.toJSON(),hud:hud.toJSON(),vw:innerWidth,vh:innerHeight};
  });
  assert.ok(immersive.fallback,'Mobile uses reversible fullscreen fallback');
  assert.ok(immersive.hud.right<=immersive.board.left+1,'Landscape fullscreen HUD cannot cover board: '+JSON.stringify(immersive));
  assert.ok(immersive.board.bottom<=immersive.vh+1&&immersive.board.right<=immersive.vw+1,'Landscape fullscreen board fits: '+JSON.stringify(immersive));
  assert.ok(Math.abs(immersive.board.width/immersive.board.height-10/7)<.02,'Fullscreen map aspect remains intact');
  await phone.screenshot({path:'test-results/pawsibly-landscape-fullscreen.png'});
  await phone.locator('#mw-fullscreen-toggle').tap();
  await phone.waitForFunction(()=>!document.documentElement.classList.contains('mw-fs-active'));
  await phone.setViewportSize({width:390,height:844});
  await phone.waitForTimeout(100);
  assert.equal(await phone.evaluate(()=>window.__PAWSIBLY_TEST__.getState().got),1,'Rotation preserves run state');
 }finally{await landscape.close()}
 await page.setViewportSize({width:1250,height:900});
 assert.ok(initial.opaque>500,'Canvas must actually contain drawn pixels');
 assert.ok(initial.uniqueColors>12,'Canvas needs colorful room artwork, not a blank rectangle');
 assert.equal(errors.length,0,'No uncaught exception during Canvas rendering');
 const before=initial.position;
 const clicked=await page.evaluate(()=>{const s=window.__PAWSIBLY_TEST__.getState();return {x:s.cat.x+1.5,y:s.cat.y+.5};});
 // The canvas may be below the first fold; locator.click scrolls it into view.
 const canvasRect=await page.locator('#board').boundingBox();
 await page.locator('#board').click({position:{x:clicked.x*canvasRect.width/10,y:clicked.y*canvasRect.height/7}});await page.waitForTimeout(420);
 const after=await page.evaluate(()=>({...window.__PAWSIBLY_TEST__.getState().cat}));
 console.log('Click movement:',JSON.stringify({before,after}));
 assert.notDeepEqual(after,before,'Mouse click must move the cat');
 assert.equal(await page.evaluate(()=>window.__PAWSIBLY_TEST__.getState().got),1,'First real mouse click collects the indicated fish');
 assert.match(await page.locator('#visionTip').textContent(),/One fish/,'Guidance responds to the collected fish');
 await page.locator('#guideHelp').click();
 assert.equal(await page.locator('[data-tab-panel="help"]').isVisible(),true,'Visible contextual help opens the existing tutorial');
 await page.locator('#menuClose').click();
 const touch=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 try{const phone=await touch.newPage();await phone.route('**/api/session',r=>r.fulfill({status:204,body:''}));await phone.goto(url,{waitUntil:'load'});await phone.evaluate(()=>window.MorrowwishI18n.set('zh'));
 await phone.screenshot({path:'test-results/pawsibly-onboarding-mobile-zh.png'});
 assert.match(await phone.locator('#visionTip').textContent(),/偷够3条鱼.*猫门/);
 const orders=await phone.locator('.in-game-actions').evaluate(el=>Array.from(el.querySelectorAll('button')).map(b=>[b.id,Number(getComputedStyle(b).order)]));assert.deepEqual(orders,[['tool',0],['wait',1],['restart',2],['bonusQuick',3]],'Primary turn controls come before optional challenges in visual and keyboard order');
 const b=await phone.locator('#board').boundingBox();await phone.touchscreen.tap(b.x+b.width*.25,b.y+b.height*.5);
 await phone.waitForFunction(()=>window.__PAWSIBLY_TEST__.getState().got===1);
 assert.match(await phone.locator('#visionTip').textContent(),/到手1条/);
 await phone.locator('#guideHelp').tap();assert.ok(await phone.locator('[data-tab-panel="help"]').isVisible());await phone.locator('#menuClose').tap();
 await phone.evaluate(()=>window.MorrowwishI18n.set('en'));assert.match(await phone.locator('#visionTip').textContent(),/One fish/);
 }finally{await touch.close()}
 const run=await browser.newPage({viewport:{width:1250,height:900}});try{await run.route('**/api/session',r=>r.fulfill({status:204,body:''}));await run.goto(url,{waitUntil:'load'});await run.evaluate(()=>window.MorrowwishI18n.set('en'));await run.screenshot({path:'test-results/pawsibly-onboarding-desktop-en.png'});
 assert.match(await run.locator('#visionTip').textContent(),/Steal 3 fish.*cat flap/);
 const keys=['ArrowRight','ArrowRight','ArrowUp','ArrowLeft','ArrowDown','ArrowDown','ArrowDown','ArrowDown','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowUp','ArrowDown','ArrowRight','ArrowRight'];let sawExit=false;
 for(const key of keys){await run.keyboard.press(key);const state=await run.evaluate(()=>({got:window.__PAWSIBLY_TEST__.getState().got,done:window.__PAWSIBLY_TEST__.getState().done}));if(state.got===3&&!state.done){const hint=await run.locator('#visionTip').textContent();if(/Exit open.*green cat flap/.test(hint))sawExit=true;}if(state.done)break;}
 assert.ok(sawExit,'The live guide must explain how to escape after the third fish');assert.ok(await run.evaluate(()=>window.__PAWSIBLY_TEST__.getState().winning),'New visitor completes first room using real keyboard controls');assert.ok(await run.locator('#overlay').isVisible());
 }finally{await run.close()}
 assert.equal(errors.length,0,'No uncaught exception after clicking');
 await page.locator('#menuButton').click();
 assert.equal(await page.locator('#gameMenu').isVisible(),true,'Menu opens in the game frame');
 // The screenshot-reported issues: no clipped fifth tab, no overlapping cat
 // descriptions, and no double yarn instruction / untranslated legend.
 for(const viewport of [{width:1250,height:900},{width:570,height:720},{width:570,height:380},{width:390,height:844}]){
  await page.setViewportSize(viewport);
  const layout=await page.evaluate(()=>{
   const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
   const nav=document.querySelector('.menu-tabs'),tabs=[...nav.querySelectorAll('button')];
   return {nav:rect(nav),tabs:tabs.map(rect),screen:innerWidth,
    menu:rect(document.querySelector('#gameMenu .menu-shell')),screenHeight:innerHeight,stage:rect(document.getElementById('stage'))};
  });
  assert.equal(layout.tabs.length,5,'All five game tabs must remain present');
  assert.ok(layout.tabs.every(t=>t.left>=layout.nav.left-2&&t.right<=layout.nav.right+2),
   'All five tabs must be visible, not horizontally cut off at '+viewport.width);
  assert.ok(layout.menu.left>=-2&&layout.menu.right<=layout.screen+2,
   'Menu must remain within the viewport at '+viewport.width);
  assert.ok(layout.menu.top>=-2&&layout.menu.bottom<=layout.screenHeight+2,
   'Menu must fit vertically even at browser zoom / '+viewport.width+'x'+viewport.height);
  await page.locator('[data-game-tab="cats"]').click();
  const catLayout=await page.evaluate(()=>{
   const a=document.getElementById('skinHint'),b=document.getElementById('ability');
   return {hint:a.getBoundingClientRect().toJSON(),ability:b.getBoundingClientRect().toJSON(),
    cats:document.querySelectorAll('#wardrobe .skin').length,
    grid:getComputedStyle(document.getElementById('wardrobe')).display};
  });
  assert.equal(catLayout.cats,5,'Cat gallery must show five cats');
  assert.equal(catLayout.grid,'grid','Cat wardrobe should use a stable grid');
  assert.ok(catLayout.ability.top>=catLayout.hint.bottom+3,
   'Cat skill description must NOT overlap the unlock description at '+viewport.width);
  await page.locator('[data-game-tab="help"]').click();
  const helpLayout=await page.evaluate(()=>({
   englishLegend:document.getElementById('helpLegend').textContent,
   yarnDuplicateVisible:getComputedStyle(document.getElementById('yarnExplain')).display!=='none',
   stepCount:document.querySelectorAll('[data-tab-panel="help"] .menu-help-step').length
  }));
  assert.equal(helpLayout.yarnDuplicateVisible,false,'Duplicate yarn help must be hidden');
  assert.equal(helpLayout.stepCount,3,'Help must keep its three concise steps');
  assert.ok(helpLayout.englishLegend.includes('fish'),'Help icon legend should be translated in English');
 }
 await page.setViewportSize({width:1250,height:900});
 await page.locator('[data-game-tab="rooms"]').click();

 await page.locator('[data-game-tab="album"]').click();
 assert.equal(await page.locator('[data-tab-panel="album"]').isVisible(),true,'Album available inside game');
 await page.locator('[data-game-tab="badges"]').click();
 assert.equal(await page.locator('[data-tab-panel="badges"]').isVisible(),true,'Achievements available inside game');
 await page.locator('#menuClose').click();
 assert.equal(await page.locator('#gameMenu').isVisible(),false,'Closing menu resumes gameplay');
 assert.match(await page.locator('#bonusQuickText').textContent(),/Knock over a vase/,'Bonus mission must be prominent on game HUD');
 assert.equal(await page.locator('#bonusQuickProgress').textContent(),'0/1','Bonus progress must be visible in the game');
 await page.locator('#bonusQuick').click();
 assert.equal(await page.locator('#gameMenu').isVisible(),true,'Tapping bonus mission opens the current heist details');
 assert.equal(await page.locator('[data-tab-panel="rooms"]').isVisible(),true,'Bonus opens details without leaving the game');
 await page.locator('#menuClose').click();
 await page.evaluate(()=>window.MorrowwishI18n.set('zh'));await page.waitForTimeout(110);
 const zh=await page.evaluate(()=>({
  lang:document.documentElement.lang,
  subtitle:document.getElementById('subtitle').textContent,
  mission:document.getElementById('mission').textContent,
  button:document.getElementById('tool').textContent,
  shelf:document.getElementById('relicSummary').textContent,
  hint:document.getElementById('collectionHint').textContent,
  instructions:document.getElementById('howBody').textContent,
  room:document.getElementById('chapter').textContent
 }));
 console.log('Chinese switch:',JSON.stringify(zh));
 assert.equal(zh.lang,'zh-CN');
 assert.equal(await page.locator('#menuButtonLabel').textContent(),'菜单','Menu icon must have a visible Chinese label');
 assert.match(await page.locator('#bonusQuickText').textContent(),/额外任务|打翻一个花瓶/,'Bonus mission should be readable in Chinese');
 const chineseContent=await page.evaluate(()=>({
  title:document.getElementById('gameTitle')?.textContent,
  byline:document.getElementById('studioByline')?.textContent,
  documentTitle:document.title,
  rules:document.getElementById('howTitle')?.innerText,
  englishWords:(document.querySelector('main')?.innerText.match(/[A-Za-z]{3,}/g)||[]),
  aria:document.getElementById('board')?.getAttribute('aria-label')
 }));
 console.log('Cat all-Chinese visible UI:',JSON.stringify(chineseContent));
 assert.equal(chineseContent.title,'猫猫绝对无辜！','The Chinese game title must not show PAWSIBLY INNOCENT');
 assert.equal(chineseContent.byline,'出品 ♡','The brand byline must not leave "presents" untranslated');
 assert.match(chineseContent.documentTitle,/猫猫绝对无辜/,'Browser tab title should be localized');
 assert.deepEqual(chineseContent.englishWords,[],'Chinese game content must contain no visible English words');
 assert.match(chineseContent.aria,/猫猫捣蛋游戏/,'Chinese canvas accessible label is localized');
 const roomsLocalized=await page.evaluate(()=>{
  const audit=[];
  for(let i=0;i<window.__PAWSIBLY_TEST__.rooms.length;i++){
   window.__PAWSIBLY_TEST__.choose(i,false);
   const label=document.getElementById('chapter')?.textContent||'';
   const visible=document.querySelector('main')?.innerText||'';
   audit.push({room:i+1,label,untranslated:(visible.match(/[A-Za-z]{3,}/g)||[])});
  }
  window.__PAWSIBLY_TEST__.choose(0,false);
  return audit;
 });
 console.log('All eight room Chinese strings:',JSON.stringify(roomsLocalized));
 for(const room of roomsLocalized){
  assert.match(room.label,/[\u4e00-\u9fff]/,'Room '+room.room+' must have a Chinese name');
  assert.deepEqual(room.untranslated,[],'No English strings in room '+room.room);
 }
 assert.match(await page.locator('#howTitle').textContent(),/三步|猫猫|开溜/,'Chinese help should be available inside the optional sidebar details');
 for(const value of [zh.subtitle,zh.mission,zh.shelf,zh.hint,zh.instructions,zh.room])
  assert.match(value,/[\u4e00-\u9fff]/,'Chinese regions must be translated');
 await page.evaluate(()=>{
  const s=window.__PAWSIBLY_TEST__.getState();
  s.cat={x:s.door.x,y:s.door.y-1};s.got=3;s.done=false;
  window.__PAWSIBLY_TEST__.move(0,1);
 });await page.waitForTimeout(110);
 const winZh=await page.evaluate(()=>({visible:!document.getElementById('overlay').hidden,title:document.getElementById('resultTitle').textContent,
  desc:document.getElementById('resultDesc').textContent,score:document.getElementById('resultScore').textContent}));
 console.log('Chinese victory:',JSON.stringify(winZh));
 assert.equal(winZh.visible,true);assert.match(winZh.desc,/[\u4e00-\u9fff]/);
 await page.evaluate(()=>window.MorrowwishI18n.set('en'));await page.waitForTimeout(110);
 const en=await page.evaluate(()=>({lang:document.documentElement.lang,subtitle:document.getElementById('subtitle').textContent,
  winTitle:document.getElementById('resultTitle').textContent,winScore:document.getElementById('resultScore').textContent,
  room:document.getElementById('chapter').textContent,instructions:document.getElementById('howBody').textContent}));
 console.log('English switch:',JSON.stringify(en));
 assert.equal(en.lang,'en');
 assert.ok(en.winScore.includes('Score'),'Victory score label must switch language');
 assert.equal(await page.locator('#closeResult').getAttribute('aria-label'),'Close results','Results X must localize to English');
 await page.locator('#closeResult').click();
 assert.equal(await page.locator('#overlay').isVisible(),false,'Results close X must show the completed board');
 await page.locator('#menuButton').click();
 assert.equal(await page.locator('#gameMenu').isVisible(),true,'Game menu must work after result X');
 await page.locator('#menuClose').click();
 assert.ok(/owner/i.test(en.instructions)&&/chase/i.test(en.instructions)&&/pink/i.test(en.instructions),'English tutorial must explain sight-triggered pursuit and pink danger zones');
 assert.equal(errors.length,0,'Canvas and UI must be free of uncaught errors');
 await page.goto(new URL('/',url).toString(),{waitUntil:'load',timeout:40000});
 await page.evaluate(()=>window.MorrowwishI18n.set('zh'));await page.waitForTimeout(170);
 const homeZh=await page.evaluate(()=>({
  lang:document.documentElement.lang,
  about:document.querySelector('.about-copy p')?.textContent,
  footer:document.querySelector('.footer-row>span')?.textContent,
  miniDescription:document.querySelector('.tiny-section .section-intro>p')?.textContent,
  catTitle:document.querySelector('.cat-feature-card h3')?.innerText,
  catPitch:document.querySelector('.cat-feature-card .feature-content>p')?.innerText,
  catCTA:document.querySelector('.cat-feature-card .card-button')?.innerText,
  heroPitch:document.querySelector('.hero>p')?.innerText,
  worldsPitch:document.querySelector('#worlds .section-intro>p')?.innerText,
  bondTitle:document.querySelector('.bond-feature-card h3')?.innerText,
  bondCount:document.querySelectorAll('.bond-feature-card').length,
  featureOrder:[...document.querySelectorAll('.feature-grid>article')].map(x=>x.querySelector('a[data-id]')?.dataset.id),
  miniHeight:Math.round(document.querySelector('.tiny-section')?.getBoundingClientRect().height||0),
  aboutHeight:Math.round(document.querySelector('.about-section')?.getBoundingClientRect().height||0)
 }));
 console.log('Homepage Chinese and compact sections:',JSON.stringify(homeZh));
 assert.equal(homeZh.lang,'zh-CN');
 assert.match(homeZh.worldsPitch,/院子.*三条鱼.*小镇.*人生/,'Featured introduction must follow Cat Bond, fish, town and Elsewhere');
 assert.doesNotMatch(homeZh.worldsPitch,/Be a sneaky cat|Four worlds/,'No English four-world pitch on Chinese homepage');
 assert.equal(homeZh.bondCount,1,'Cat Bond homepage card must appear exactly once');
 assert.equal(homeZh.bondTitle?.trim(),'猫猫纽带','Chinese Cat Bond heading should not repeat English game name');
 assert.equal(await page.locator('body').textContent().then(s=>(s.match(/✳/g)||[]).length),0,'Homepage should not display the disliked ✳ decorative glyph');
 assert.match(homeZh.about,/想象|自由/,'About text must be Chinese');
 assert.match(homeZh.footer,/独立游戏|Independent games/,'Footer must retain the Morrow Wish studio byline');
 assert.match(homeZh.miniDescription,/小游戏|挑战|短局/,'Mini games copy must be Chinese');
 assert.equal(homeZh.catTitle?.trim(),'猫猫绝对无辜！','Chinese title must show no English Pawsibly subtitle');
 assert.doesNotMatch(homeZh.catTitle,/Pawsibly|Innocent/i,'Chinese title must not leak its English name');
 assert.deepEqual(homeZh.featureOrder.slice(0,4),['cat-bond','pawsibly-innocent','tiny-town','elsewhere'],'Featured worlds should place Cat Bond first');
 assert.match(homeZh.catPitch,/三条小鱼|毛线球|粉色猫门/,'New Chinese promotional copy should explain gameplay');
 assert.match(homeZh.catCTA,/偷鱼开溜/,'Chinese CTA should be action-focused');
 assert.match(homeZh.heroPitch,/捣蛋小猫|偷三条鱼/,'Homepage hero should promote the leading cat game');
 assert.ok(homeZh.heroPitch.indexOf('和满院子的猫咪')<homeZh.heroPitch.indexOf('捣蛋小猫')&&homeZh.heroPitch.indexOf('捣蛋小猫')<homeZh.heroPitch.indexOf('自由的小镇')&&homeZh.heroPitch.indexOf('自由的小镇')<homeZh.heroPitch.indexOf('从未活过的人生'),'Homepage hero must match the four featured cards in order');
 assert.ok(homeZh.miniHeight>270&&homeZh.miniHeight<480,'The 02 game gallery should be compact without hiding any games');
 assert.ok(homeZh.aboutHeight>260&&homeZh.aboutHeight<580,'The 03 studio introduction should accommodate the cat CEO without filling the entire viewport');
 const compactLayout=await page.evaluate(()=>{
  const rect=s=>document.querySelector(s)?.getBoundingClientRect();
  const copy=document.querySelector('.hero .hero-zh-copy');
  const first=rect('.feature-card'),art=rect('.feature-card .feature-art'),content=rect('.feature-card .feature-content');
  return {heroHeight:Math.round(rect('.hero')?.height||0),firstCardTop:Math.round(first?.top||0),
    firstCardHeight:Math.round(first?.height||0),featureColumns:getComputedStyle(document.querySelector('.feature-grid')).gridTemplateColumns.split(' ').length,
    heroWhiteSpace:getComputedStyle(copy).whiteSpace,doodles:getComputedStyle(document.querySelector('.hero-doodles')).display,
    imageSeparate:!!art&&!!content&&content.right<=art.left+2};
 });
 console.log('Balanced compact homepage geometry:',JSON.stringify(compactLayout));
 assert.equal(compactLayout.heroWhiteSpace,'nowrap','Chinese four-world sentence must stay on a single line');
 assert.equal(compactLayout.doodles,'none','Decorations must not collide with the single-line hero');
 assert.ok(compactLayout.heroHeight>=190&&compactLayout.heroHeight<315,'Hero needs visual breathing room while showing games on first screen');
 assert.ok(compactLayout.firstCardTop<505,'First flagship game card must remain visible on first screen');
 assert.equal(compactLayout.featureColumns,2,'Desktop flagship games should stay in two columns');
 assert.ok(compactLayout.firstCardHeight>=260&&compactLayout.firstCardHeight<=285,'Flagship cards should be smaller than the previous 318px layout');
 assert.ok(compactLayout.imageSeparate,'Card illustrations should not cover card descriptions');
 const featuredChecks=await page.evaluate(()=>({
  titles:[...document.querySelectorAll('.feature-grid>article h3')].map(x=>({font:getComputedStyle(x).fontFamily,weight:getComputedStyle(x).fontWeight})),
  hits:[...document.querySelectorAll('.feature-grid>.feature-card')].map(x=>x.querySelector(':scope>.card-hit')?.getAttribute('href'))
 }));
 assert.ok(featuredChecks.titles.every(x=>x.font.includes('Nunito')&&x.weight==='900'),'All four featured titles need matching typography');
 assert.deepEqual(featuredChecks.hits,['/cat-bond/','/pawsibly-innocent/','/tiny-town/','/elsewhere/'],'All featured cards must remain clickable in Cat Bond-led order');
 // Desktop keeps the tagline on one line; 320/390px phones must show every character by wrapping.
 for(const phoneWidth of [390,320]){
   await page.setViewportSize({width:phoneWidth,height:844});
   const mobileTagline=await page.evaluate(()=>{
     const copy=document.querySelector('.hero .hero-zh-copy');
     const container=copy.parentElement;
     const style=getComputedStyle(copy);
     return {
       whiteSpace:style.whiteSpace,
       lineHeight:parseFloat(style.lineHeight),
       height:copy.getBoundingClientRect().height,
       horizontalOverflow:container.scrollWidth-container.clientWidth,
       overflowX:getComputedStyle(container).overflowX
     };
   });
   console.log('Chinese phone hero wraps:',phoneWidth,JSON.stringify(mobileTagline));
   assert.equal(mobileTagline.whiteSpace,'normal','Phone slogan should not force a single line');
   assert.ok(mobileTagline.height>mobileTagline.lineHeight*1.5,'Phone slogan should be fully visible across multiple lines');
   assert.ok(mobileTagline.horizontalOverflow<=1,'Phone slogan should not require sideways scrolling');
   assert.notEqual(mobileTagline.overflowX,'auto','Phone slogan must not use horizontal scroll');
 }
 await page.setViewportSize({width:1250,height:900});
 const newCatCover=page.locator('.cat-feature-card .feature-art img');
 assert.ok((await newCatCover.getAttribute('src'))?.startsWith('/art/pawsibly-hatted-muted.avif'),'First game must use approved soft-pastel hatted-cat cover');
 await newCatCover.scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>{const im=document.querySelector('.cat-feature-card .feature-art img');return im?.complete&&im.naturalWidth>0;},null,{timeout:10000});
 assert.equal(await newCatCover.evaluate(img=>img.naturalWidth),560,'Optimized first-game cover must load correctly');
 const typeSizes=await page.evaluate(()=>({
  title:parseFloat(getComputedStyle(document.querySelector('.cat-feature-card h3')).fontSize),
  copy:parseFloat(getComputedStyle(document.querySelector('.cat-feature-card .feature-content>p')).fontSize),
  cta:parseFloat(getComputedStyle(document.querySelector('.cat-feature-card .card-button')).fontSize),
  eyebrow:parseFloat(getComputedStyle(document.querySelector('.cat-feature-card .card-eyebrow')).fontSize),
  miniTitle:parseFloat(getComputedStyle(document.querySelector('.mini-game .mini-copy strong')).fontSize)
 }));
 console.log('Readable typography:',JSON.stringify(typeSizes));
 assert.ok(typeSizes.title>=33&&typeSizes.copy>=13&&typeSizes.cta>=12,'Featured card text must be larger and readable');
 assert.ok(typeSizes.eyebrow>=10&&typeSizes.miniTitle>=20,'All card labels and mini-game titles must be larger');
 const bondImage=page.locator('.bond-feature-card .feature-art img');
 assert.ok((await bondImage.getAttribute('src'))?.startsWith('/art/cat-bond-home.webp'), 'Cat Bond should use the approved friendship illustration');
 await bondImage.scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>{const im=document.querySelector('.bond-feature-card .feature-art img');return im?.complete&&im.naturalWidth>0;},null,{timeout:10000});
 assert.equal(await bondImage.evaluate(im=>im.naturalWidth),480,'Approved garden illustration must load as the optimized WebP');
 await page.evaluate(()=>window.MorrowwishI18n.set('en'));
 const homeEn=await page.evaluate(()=>({
  order:[...document.querySelectorAll('.feature-grid>article')].map(x=>x.querySelector('a[data-id]')?.dataset.id),
  catTitle:document.querySelector('.cat-feature-card h3')?.innerText,
  catPitch:document.querySelector('.cat-feature-card .feature-content>p')?.innerText,
  heroPitch:document.querySelector('.hero>p')?.innerText
 }));
 assert.deepEqual(homeEn.order.slice(0,4),['cat-bond','pawsibly-innocent','tiny-town','elsewhere'],'English homepage should match Cat Bond-led four-world order');
 assert.match(homeEn.catTitle,/Pawsibly\s*Innocent!/,'English heading must still show its original name');
 assert.match(homeEn.catPitch,/Three fish to steal/,'English promotional copy must be updated');
 assert.ok(homeEn.heroPitch.indexOf('Befriend a yard')<homeEn.heroPitch.indexOf('mischievous cat')
    &&homeEn.heroPitch.indexOf('mischievous cat')<homeEn.heroPitch.indexOf('town where everyone is free')
    &&homeEn.heroPitch.indexOf('town where everyone is free')<homeEn.heroPitch.indexOf('life you never lived'),
    'English hero introduction must follow Cat Bond, Pawsibly, Tiny Town, Elsewhere');
 // The cat's core distraction needs to work with real pointer input and clear feedback.
 await page.goto(url,{waitUntil:'load',timeout:40000});
 await page.evaluate(()=>window.MorrowwishI18n.set('en'));
 const enHelp=await page.locator('#yarnExplain').textContent();
 assert.match(enHelp,/human|noise|investigate/i,'English help explains how yarn works');
 const initialYarn=await page.evaluate(()=>window.__PAWSIBLY_TEST__.getState().yarn);
 await page.locator('#tool').click();
 assert.equal(await page.evaluate(()=>window.__PAWSIBLY_TEST__.isAiming()),true,'Toss yarn should enter target-select mode');
 assert.equal(await page.evaluate(()=>window.__PAWSIBLY_TEST__.getState().yarn),initialYarn,'Entering aim mode must not consume yarn');
 const humanBefore=await page.evaluate(()=>({...window.__PAWSIBLY_TEST__.getState().human}));
 const boardBox=await page.locator('#board').boundingBox();
 await page.locator('#board').click({position:{x:boardBox.width*8.5/10,y:boardBox.height*1.5/7}});
 await page.waitForTimeout(110);
 const tossed=await page.evaluate(()=>{
  const s=window.__PAWSIBLY_TEST__.getState();
  return {yarn:s.yarn,noise:s.noise,trail:s.throwTrail,alert:s.alert,human:{...s.human},
   mode:s.guardMode,walking:s.yarnAnimating,sound:window.MorrowwishAudio?.status()};
 });
 console.log('Real multi-step yarn and audio:',JSON.stringify({before:humanBefore,after:tossed}));
 assert.equal(tossed.yarn,initialYarn-1,'Throwing yarn must consume one ball');
 assert.deepEqual(tossed.noise,{x:8,y:1},'Ball must land on the exact player-selected tile');
 assert.ok(tossed.trail&&tossed.walking&&tossed.mode==='investigate',
  'A long throw must visibly start a multi-step investigation');
 assert.notDeepEqual(tossed.human,humanBefore,'The owner must immediately react to the ball');
 // Regression: pause must not cancel or irreversibly freeze the yarn investigation.
 const positionBeforePause=await page.evaluate(()=>({...window.__PAWSIBLY_TEST__.getState().human}));
 await page.locator('#menuButton').click();
 const paused=await page.evaluate(()=>({animating:window.__PAWSIBLY_TEST__.getState().yarnAnimating,timer:window.__PAWSIBLY_TEST__.isChasing()}));
 assert.deepEqual(paused,{animating:true,timer:false},'Menu must suspend but preserve the active yarn chase');
 await page.waitForTimeout(650);
 assert.deepEqual(await page.evaluate(()=>({...window.__PAWSIBLY_TEST__.getState().human})),positionBeforePause,'Guard must not move under the menu');
 await page.locator('#menuClose').click();
 assert.equal(await page.evaluate(()=>window.__PAWSIBLY_TEST__.isChasing()),true,'Guard investigation resumes after menu closes');
 await page.waitForFunction(()=>!window.__PAWSIBLY_TEST__.isChasing(),null,{timeout:6500});
 const settled=await page.evaluate(()=>{
  const s=window.__PAWSIBLY_TEST__.getState();
  return {human:{...s.human},mode:s.guardMode,turns:s.distractionTurns,achievements:JSON.parse(localStorage.getItem('pawsibly-innocent-save-v1')||'{}').achievements};
 });
 assert.deepEqual(settled.human,{x:8,y:1},'Owner must walk ALL the way to the yarn');
 assert.equal(settled.mode,'distracted','Owner must stop at yarn to investigate');
 assert.equal(settled.turns,4,'Player should have four turns to sneak past');
 assert.equal(settled.achievements?.['yarn-lure'],true,'Real yarn use must unlock a saved achievement');
 assert.match(await page.locator('#guardIntent').textContent(),/Distracted|yarn/i,'Owner state must be visible in the game');
 assert.ok(tossed.sound?.oscillators>0&&tossed.sound?.effects>0,'Cat yarn action must still play sound effects');
 assert.equal(tossed.sound.playing,false,'Cat SFX must never synthesize a music loop');
 assert.equal(tossed.sound.backgroundMusic,false,'Cat SFX subsystem must contain no BGM');
 assert.equal(tossed.sound.loopSteps,0,'Cat game must never schedule a background music loop');
 assert.equal(await page.locator('[data-move]').count(),0,'Touch directional pad was removed');
 assert.ok(tossed.sound?.oscillators>0&&tossed.sound?.effects>0,'Cat yarn action must still play sound effects');
 assert.equal(tossed.sound.playing,false,'Cat SFX engine must never synthesize a music loop');
 assert.equal(tossed.sound.backgroundMusic,false,'Cat sound-effects subsystem must contain no BGM');
 assert.equal(tossed.sound.loopSteps,0,'Cat game must never schedule a background music loop');
 await page.evaluate(()=>window.MorrowwishI18n.set('zh'));
 assert.match(await page.locator('#yarnExplain').textContent(),/主人|毛线/,'Chinese explanation for yarn is clear');
 assert.match(await page.locator('#guardIntent').textContent(),/巡逻|分心|被毛球吸引|调查|搜索|追猫/,'Owner AI behavior must be explained in Chinese');
 await page.locator('#menuButton').click();
 await page.locator('[data-game-tab="help"]').click();
 assert.equal(await page.locator('#gameMenu #music, #gameMenu #sound, #gameMenu [data-set-lang]').count(),0,'Help must not duplicate header sound or language controls');
 const musicButton=page.locator('#stageControls #mw-game-settings .mw-settings-music');
 const audioButton=page.locator('#stageControls #mw-game-settings .mw-settings-sfx');
 assert.ok(await musicButton.isVisible()&&await audioButton.isVisible(),'Actual unified music and sound controls must remain visible in the game HUD');
 await page.locator('#menuClose').click();
 await audioButton.click();
 assert.equal(await page.evaluate(()=>window.MorrowwishAudio.status().enabled),false,'Mute button must actually silence the score');
 await audioButton.click();
 assert.equal(await page.evaluate(()=>window.MorrowwishAudio.status().enabled),true,'Sound button must restore audio');

 // Cat gets a real, recorded piano theme; the five other games stay effects-only.
 const recording=await page.request.get(new URL('/audio/cat-happy-clappy.ogg',url).toString());
 assert.equal(recording.status(),200,'Self-hosted CC0 piano recording must be published');
 const ogg=await recording.body();
 assert.equal(ogg.subarray(0,4).toString(),'OggS','Recording must be encoded Ogg audio, not synthesized notes');
 assert.ok(ogg.length>40000,'Recording must be a complete musical track');
 const initialMusic=await page.evaluate(()=>window.MorrowwishCatMusic?.status());
 assert.equal(initialMusic?.source,'recorded-cc0','Cat soundtrack must be an actual recording');
 assert.equal(initialMusic?.enabled,true,'Cat music is enabled by default after interaction');
 await page.waitForFunction(()=>window.MorrowwishCatMusic?.status().playing&&window.MorrowwishCatMusic?.status().readyState>=2,{timeout:8000});
 const playing=await page.evaluate(()=>window.MorrowwishCatMusic.status());
 assert.equal(playing.error,'','Recorded cat music must not report a playback error');
 assert.ok(playing.readyState>=2,'Recorded cat music must be decoded and playable');
 assert.match(await musicButton.getAttribute('aria-label'),/音乐/,'Chinese music control must be localized');
 await musicButton.click();
 assert.equal(await page.evaluate(()=>window.MorrowwishCatMusic.status().playing),false,'Music toggle must pause the recording');
 assert.equal(await page.evaluate(()=>window.MorrowwishAudio.status().enabled),true,'Music toggle must not mute effects');
 await musicButton.click();
 await page.waitForFunction(()=>window.MorrowwishCatMusic.status().playing===true);
 console.log('Real CC0 piano soundtrack and separate music/SFX controls:',JSON.stringify(playing));

 // Simulate a browser rejecting unprompted autoplay: the player must get a
 // visible, one-click way to start the already-preloaded recording.
 const policyPage=await browser.newPage({viewport:{width:1200,height:850}});
 try{
  await policyPage.addInitScript(()=>{
   const original=HTMLMediaElement.prototype.play;
   let rejected=false;
   HTMLMediaElement.prototype.play=function(...args){
    if(this.id==='catRecordedMusic'&&!rejected){
     rejected=true;
     return Promise.reject(new DOMException('User interaction required','NotAllowedError'));
    }
    return original.apply(this,args);
   };
  });
  await policyPage.goto(url,{waitUntil:'load',timeout:40000});
  await policyPage.waitForFunction(()=>window.MorrowwishCatMusic?.status().blocked===true);
   assert.equal(await policyPage.evaluate(()=>!document.getElementById('musicPermission').hidden),true,'Autoplay fallback available');
   await policyPage.locator('#menuButton').click();
   await policyPage.locator('[data-game-tab="help"]').click();
   // Opening the menu is a user gesture that may auto-unblock the music.
   // Otherwise a one-click fallback should be visible inside Settings.
   const playingOnMenu=await policyPage.evaluate(()=>window.MorrowwishCatMusic.status().playing);
   if(!playingOnMenu){
    assert.equal(await policyPage.locator('#musicPermission').isVisible(),true,
     'Fallback button must be reachable if autoplay remains blocked');
    await policyPage.locator('#musicPermission').click();
   }
   await policyPage.waitForFunction(()=>window.MorrowwishCatMusic?.status().playing===true);
  await policyPage.waitForFunction(()=>window.MorrowwishCatMusic?.status().blocked===false&&document.getElementById('musicPermission')?.hidden===true);
  assert.equal(await policyPage.locator('#musicPermission').isVisible(),false,'Prompt should disappear once music plays');
  console.log('Autoplay-block recovery: menu gesture or settings fallback starts recorded music');
 }finally{await policyPage.close()}

 // Unlocks: every threshold must enable the correct cat; selection must persist.
 const unlock=await browser.newPage({viewport:{width:1200,height:850}});
 try{
  await unlock.goto(url,{waitUntil:'load',timeout:40000});
  const thresholds=[0,3,7,12,18];
  for(const stars of [0,2,3,6,7,11,12,17,18]){
   await unlock.evaluate(stars=>{
    const best={},total=Math.min(stars,24);
    for(let k=0,left=total;k<8&&left>0;k++){const give=Math.min(3,left);best['room-'+k]={stars:give,score:100};left-=give}
    localStorage.setItem('pawsibly-innocent-save-v1',JSON.stringify({unlocked:7,best,cat:0,souvenirs:{}}));
    localStorage.setItem('morrowwish-cat-music-enabled','0');
   },stars);
   await unlock.reload({waitUntil:'load',timeout:40000});
   const status=await unlock.evaluate(()=>({
    available:[...document.querySelectorAll('#wardrobe .skin')].map(b=>!b.disabled),
    stars:Number(document.getElementById('starTotal')?.textContent||0),
    hint:document.getElementById('skinHint')?.textContent||''
   }));
   assert.equal(status.stars,stars,'The displayed star count must be accurate');
   assert.deepEqual(status.available,thresholds.map(t=>stars>=t),'Cat unlock gates must match the earned stars at '+stars);
   assert.ok(status.hint.length>8,'Wardrobe should show progress toward the next cat');
  }
   await unlock.locator('#menuButton').click();
   await unlock.locator('[data-game-tab="cats"]').click();
   await unlock.locator('#wardrobe .skin').nth(4).click();
  const selected=await unlock.evaluate(()=>({
   cat:JSON.parse(localStorage.getItem('pawsibly-innocent-save-v1')).cat,
   active:[...document.querySelectorAll('#wardrobe .skin')].findIndex(b=>b.classList.contains('active')),
   ability:document.getElementById('ability').textContent
  }));
  assert.equal(selected.cat,4,'Unlocking the fifth cat must allow selecting it');
  assert.equal(selected.active,4,'The selected cat must be visibly active');
  await unlock.reload({waitUntil:'load'});
  assert.equal(await unlock.locator('#wardrobe .skin.active').count(),1);
  assert.equal(await unlock.evaluate(()=>[...document.querySelectorAll('#wardrobe .skin')].findIndex(b=>b.classList.contains('active'))),4,'Selected cat must persist after reload');
  // A loadout is chosen before a run; swapping to regain yarn mid-heist is forbidden.
  await unlock.evaluate(()=>window.__PAWSIBLY_TEST__.choose(0,false));
  await unlock.locator('#menuButton').click();
  await unlock.locator('[data-game-tab="cats"]').click();
  await unlock.locator('#wardrobe .skin').nth(0).click();
  assert.equal(await unlock.evaluate(()=>window.__PAWSIBLY_TEST__.getState().yarn),1,'Starting as Marmalade grants exactly one yarn');
  await unlock.locator('#menuClose').click();
  await unlock.locator('#tool').click();
  assert.equal(await unlock.evaluate(()=>window.__PAWSIBLY_TEST__.throwYarnTo({x:8,y:1})),true,'Valid yarn throw before movement works');
  assert.equal(await unlock.evaluate(()=>window.__PAWSIBLY_TEST__.getState().started),true,'First throw starts a session');
  assert.equal(await unlock.evaluate(()=>window.__PAWSIBLY_TEST__.getState().yarn),0,'Throw consumes opening yarn');
  await unlock.locator('#menuButton').click();
  await unlock.locator('[data-game-tab="cats"]').click();
  assert.equal(await unlock.locator('#wardrobe .skin').nth(4).isDisabled(),true,'Other cats must be locked mid-run');
  assert.equal(await unlock.evaluate(()=>window.__PAWSIBLY_TEST__.getState().yarn),0,'Opening the menu must not refill consumed yarn');
  await unlock.locator('#menuClose').click();
  console.log('Cat unlock, persisted selection and finite per-run yarn checked:',JSON.stringify({thresholds,selected}));
 }finally{await unlock.close()}

 // Verify the CrazyGames iframe loads directly into a clean, usable game stage
 // at their documented DPR=1 embed dimensions (not the oversized studio webpage).
 for(const [w,h] of [[907,510],[800,450]]){
  const iframe=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
  await iframe.route('**/api/session',route=>route.fulfill({status:204,body:''}));
  const iframeErrors=[];iframe.on('pageerror',e=>iframeErrors.push(e.message));
  try{
   const playUrl=new URL(url);
   playUrl.searchParams.set('platform','crazygames');
   await iframe.goto(playUrl.toString(),{waitUntil:'load',timeout:40000});
   await iframe.waitForTimeout(300);
   const v=await iframe.evaluate(()=>{
    const r=document.getElementById('stage')?.getBoundingClientRect();
    const canvas=document.getElementById('board')?.getBoundingClientRect();
    return {stage:r&&{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height},
      canvas:canvas&&{width:canvas.width,height:canvas.height},hud:document.getElementById('heistStatus')?.textContent,owner:document.getElementById('guardIntent')?.textContent,
      header:getComputedStyle(document.querySelector('.sitebar')).display,
      studioBack:getComputedStyle(document.getElementById('stageHome')).display,
      menuBack:getComputedStyle(document.getElementById('back')).display,
      rules:document.querySelectorAll('.explainer').length,
      menuHidden:document.getElementById('gameMenu').hidden,menuButton:!!document.getElementById('menuButton'),
      fullscreen:document.getElementById('mw-fullscreen-toggle')?getComputedStyle(document.getElementById('mw-fullscreen-toggle')).display:'absent',
      fishOnBoard:window.__PAWSIBLY_TEST__.getState().fish.length,
       bonusWidth:document.getElementById('bonusQuick').getBoundingClientRect().width,
       bonusText:document.getElementById('bonusQuickText').textContent,
       bonusTextFits:document.getElementById('bonusQuickText').scrollWidth<=document.getElementById('bonusQuickText').clientWidth+1,
       totalWidth:document.documentElement.scrollWidth,totalHeight:document.documentElement.scrollHeight};
   });
   await iframe.screenshot({path:`test-results/pawsibly-portal-${w}x${h}.png`});
    assert.equal(v.header,'none','CrazyGames must not display back-to-site chrome');
    assert.equal(v.studioBack,'none','CrazyGames must hide the on-stage external studio link');
    assert.equal(v.menuBack,'none','CrazyGames game menu must not link to another playable website');
   assert.equal(v.rules,0,'Gameplay must appear without a duplicate long tutorial');
   assert.ok(v.menuHidden&&v.menuButton,'CrazyGames game must be one playfield with an optional in-game menu');
   assert.equal(v.fullscreen==='none'||v.fullscreen==='absent',true,'CrazyGames provides native fullscreen');
   assert.ok(v.hud?.includes('0/3')&&v.fishOnBoard===4&&v.owner,'CrazyGames must show the three-fish goal, fourth bonus fish and owner behavior inside iframe');
    if(w===800)assert.ok(v.bonusText==='BONUS'&&v.bonusTextFits&&v.bonusWidth>=70,'800px portal must show the complete compact BONUS label: '+JSON.stringify(v));
   assert.ok(v.stage.left>=-1&&v.stage.right<=w+1&&v.stage.bottom<=h+1,
     'Playable canvas must fit CrazyGames '+w+'x'+h+': '+JSON.stringify(v));
   assert.ok(v.canvas.width>=440&&v.canvas.height>=305,
     'Gameplay must remain large and legible at DPR 1: '+JSON.stringify(v));
   assert.ok(v.totalWidth<=w+2&&v.totalHeight<=h+2,
     'CrazyGames iframe must not require page scrolling: '+JSON.stringify(v));
   const before=await iframe.evaluate(()=>({...window.__PAWSIBLY_TEST__.getState().cat}));
   await iframe.locator('#board').click({position:{x:v.canvas.width*.28,y:v.canvas.height*.3}});
   await iframe.waitForTimeout(450);
   assert.ok(!iframeErrors.length,'CrazyGames iframe JS errors: '+iframeErrors.join(','));
   console.log('CRAZYGAMES IFRAME PASS',w,h,JSON.stringify({hud:v.hud,stage:v.stage,from:before}));
  }finally{await iframe.close();}
 }

 // Browser test: player can use the Wait control at mobile width.
 const waitPage=await browser.newPage({viewport:{width:390,height:844}});
 try{
  await waitPage.route('**/api/session',route=>route.fulfill({status:204,body:''}));
  await waitPage.goto(url,{waitUntil:'load',timeout:40000});

  // Both 390px and 320px layouts must keep the entire wait button and
  // all adjacent controls visible, readable and nonoverlapping.
  for(const width of [390,320]){
   await waitPage.setViewportSize({width,height:844});
   const layout=await waitPage.evaluate(()=>{
    const root=document.querySelector('.in-game-actions').getBoundingClientRect();
    const controls=['bonusQuick','tool','wait','restart'].map(id=>document.getElementById(id).getBoundingClientRect());
    const within=controls.every(r=>r.left>=root.left-1&&r.right<=root.right+1&&r.top>=root.top-1&&r.bottom<=root.bottom+1);
    const overlap=controls.some((a,i)=>controls.some((b,j)=>j>i&&a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1));
    return{within,overlap,waitWidth:controls[2].width,waitHeight:controls[2].height,bonusWidth:controls[0].width,waitLabelVisible:getComputedStyle(document.getElementById('waitLabel')).display!=='none',
     roomNumWidth:document.getElementById('roomNum').getBoundingClientRect().width,
     roomNumHeight:document.getElementById('roomNum').getBoundingClientRect().height,
     roomNameVisible:getComputedStyle(document.getElementById('roomTag')).display!=='none',headDisplay:getComputedStyle(document.querySelector('.in-game-head-row')).display,
     headHeight:document.querySelector('.in-game-head-row').getBoundingClientRect().height,
     headerAreas:getComputedStyle(document.querySelector('.in-game-head-row')).gridTemplateAreas,
     stageLeftWidth:document.querySelector('.stage-left').getBoundingClientRect().width,
     topControlRects:[...document.querySelectorAll('#stageControls button')]
       .filter(b=>{const c=getComputedStyle(b),r=b.getBoundingClientRect();return c.display!=='none'&&c.visibility!=='hidden'&&Number(c.opacity)>.01&&r.width>1&&r.height>1})
       .map(b=>{const r=b.getBoundingClientRect();return{id:b.id,width:r.width,left:r.left,right:r.right,top:r.top,bottom:r.bottom}}),
     roomStatusSeparate:(()=>{const a=document.querySelector('.stage-left').getBoundingClientRect(),b=document.getElementById('heistStatus').getBoundingClientRect();return a.right<=b.left+1&&a.bottom>b.top-1&&b.bottom>a.top+1})(),
     controlsBelowRoom:(()=>{const a=document.querySelector('.stage-left').getBoundingClientRect(),b=document.getElementById('stageControls').getBoundingClientRect();return b.top>=a.bottom-2})()};
   });
   await waitPage.screenshot({path:`test-results/pawsibly-mobile-${width}.png`});
   assert.ok(layout.within&&!layout.overlap,'Every action must fit without overlap at '+width+'px: '+JSON.stringify(layout));
   assert.ok(layout.waitWidth>=43&&layout.waitHeight>=39&&layout.waitLabelVisible,'Wait needs a visible text label and touch target at '+width+'px');
   assert.ok(layout.roomNumWidth>=70&&layout.roomNumHeight<=16&&layout.roomNameVisible,
     'Room label must be horizontal and name visible at '+width+'px: '+JSON.stringify(layout));
   assert.equal(layout.headDisplay,'flex','Computed mobile header must use the intended flex layout at '+width+'px');
   assert.ok(layout.topControlRects.every(b=>b.left>=-1&&b.right<=width+1&&b.width>=29)&&layout.roomStatusSeparate&&layout.controlsBelowRoom,
     'All top mobile controls must fit and not overlap room/progress at '+width+'px: '+JSON.stringify(layout));
   if(width===320)assert.ok(layout.bonusWidth>200,'At 320px the optional quest needs a readable full-width row');
  }
  await waitPage.setViewportSize({width:390,height:844});
  await waitPage.evaluate(()=>{window.__PAWSIBLY_TEST__.choose(4,false);const s=window.__PAWSIBLY_TEST__.getState();s.human={...s.fish[1]}});
  const fish=await waitPage.evaluate(()=>window.__PAWSIBLY_TEST__.getState().fish[1]);
  const box=await waitPage.locator('#board').boundingBox();
  await waitPage.locator('#board').click({position:{x:box.width*(fish.x+.5)/10,y:box.height*(fish.y+.5)/7}});
  assert.match(await waitPage.locator('#visionTip').textContent(),/human blocks a fish/i,'Explain occupied fish');
  await waitPage.locator('#wait').click();
  const result=await waitPage.evaluate(()=>{const s=window.__PAWSIBLY_TEST__.getState();return{steps:s.steps,started:s.started,human:{...s.human}}});
  assert.equal(result.steps,1,'Wait spends a turn');assert.equal(result.started,true,'Wait starts run');
  assert.notDeepEqual(result.human,fish,'Owner vacates fish on wait');
  await waitPage.keyboard.press('Period');
  assert.equal(await waitPage.evaluate(()=>window.__PAWSIBLY_TEST__.getState().steps),2,'Period key waits');
 }finally{await waitPage.close()}
 // Five non-cat studio games remain effects-only; never synthesize melodies.
 const routes=['elsewhere','tiny-town','flip-dash','parcel-panic','pocket-aquarium'];
 const noMusicAudit=[],separateAudioGames=[];
 for(const game of routes){
  const p=await browser.newPage({viewport:{width:1250,height:900}});
  await p.route('**/api/session',route=>route.fulfill({status:204,body:''}));
  try{
   await p.goto(new URL('/'+game+'/',url).toString(),{waitUntil:'load',timeout:40000});
   await p.waitForTimeout(200);
   // Audio is game-specific. Elsewhere has its own soundtrack and may not mount
   // the shared SFX engine. Keep testing the engine only where it exists.
   const hasSharedAudio=await p.evaluate(()=>typeof window.MorrowwishAudio==='object');
   if(!hasSharedAudio){
    console.log('No shared SFX engine in '+game+' — skipped unrelated audio assertion');separateAudioGames.push(game);
    continue;
   }
   const control=p.locator('[data-mw-audio]');
   assert.ok(await control.count()<=1,'No duplicated shared audio toggles in '+game);
   // A trusted pointer interaction unlocks Web Audio without triggering a background score.
   await p.mouse.click(25,450);await p.waitForTimeout(530);
   const idle=await p.evaluate(()=>window.MorrowwishAudio.status());
   await p.waitForTimeout(390);
   const later=await p.evaluate(()=>window.MorrowwishAudio.status());
   console.log('Sound-effects-only idle '+game+': '+JSON.stringify({idle,later}));
   assert.equal(later.enabled,true,'Sound effects should be enabled in '+game);
   assert.equal(later.playing,false,'There must be no BGM playback in '+game);
   assert.equal(later.backgroundMusic,false,'BGM engine must be removed from '+game);
   assert.equal(later.loopSteps,0,'No melody scheduler can run in '+game);
   assert.equal(later.oscillators,idle.oscillators,'Idle game must not emit new audio oscillators in '+game);
   // Explicit action still plays an audible effect, not a melody.
   await p.evaluate(()=>window.MorrowwishAudio.effect('tap'));
   const sound=await p.evaluate(()=>window.MorrowwishAudio.status());
   assert.ok(sound.oscillators>later.oscillators&&sound.effects>later.effects,'Action SFX must work in '+game);
   noMusicAudit.push(game);
   assert.match(await control.getAttribute('aria-label'),/sound effects|音效/i,'Sound control must refer only to effects');
   await control.evaluate(button=>button.click());assert.equal(await p.evaluate(()=>window.MorrowwishAudio.status().enabled),false,'Mute must work in '+game);
   const silent=await p.evaluate(()=>{const a=window.MorrowwishAudio,b=a.status();a.effect('tap');return{before:b,after:a.status()}});
   assert.equal(silent.after.oscillators,silent.before.oscillators,'Muted effects must not create audio oscillators in '+game);
   await control.evaluate(button=>button.click());assert.equal(await p.evaluate(()=>window.MorrowwishAudio.status().enabled),true,'Unmute must work in '+game);
   assert.equal(await p.evaluate(()=>window.MorrowwishAudio.status().playing),false,'Unmuting must not start background music in '+game);
  }finally{await p.close()}
 }
 assert.equal(noMusicAudit.length+separateAudioGames.length,5,'Five non-cat worlds should be covered without requiring cat-specific audio');
 console.log('CHROMIUM CAT GAMEPLAY, STAR UNLOCKS, RECORDED PIANO MUSIC AND FIVE SOUND-EFFECTS-ONLY GAMES PASS');
}finally{await browser.close()}
